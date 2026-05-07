/**
 * GET /api/hibp?email=user@example.com
 *
 * Checks whether an email address appears in known data breaches
 * using the Have I Been Pwned (HIBP) v3 API.
 *
 * Response shape:
 *   200  { email, breached, breaches, count, checkedAt, fromCache }
 *   400  { error: "invalid_email", message }
 *   401  { error: "unauthorized" }
 *   429  { error: "rate_limited", message, retryAfterSeconds }
 *   500  { error: "api_key_missing" | "api_error" | "network_error", message }
 *
 * Requires:
 *   - Authenticated Supabase session (cookie)
 *   - HIBP_API_KEY env var
 */

import { createClient } from "@/lib/supabase/server";
import { checkEmail, HibpError, isValidEmail } from "@/lib/hibp";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // ── 1. Extract and basic-validate the email query param ──────────────────
  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get("email")?.trim() ?? "";

  if (!rawEmail) {
    return NextResponse.json(
      { error: "invalid_email", message: "Query parameter 'email' is required." },
      { status: 400 }
    );
  }

  if (!isValidEmail(rawEmail)) {
    return NextResponse.json(
      { error: "invalid_email", message: `"${rawEmail}" is not a valid email address.` },
      { status: 400 }
    );
  }

  // ── 2. Require authenticated session ────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ── 3. Call the HIBP service (handles caching, rate limits, errors) ─────
  try {
    const result = await checkEmail(rawEmail);

    // Persist breach data to the database for any newly discovered breaches
    if (result.breached && !result.fromCache) {
      await persistBreachAlerts(supabase, user.id, result.email, result.breaches);
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err) {
    if (err instanceof HibpError) {
      switch (err.code) {
        case "invalid_email":
          return NextResponse.json(
            { error: "invalid_email", message: err.message },
            { status: 400 }
          );
        case "api_key_missing":
          return NextResponse.json(
            { error: "api_key_missing", message: err.message },
            { status: 500 }
          );
        case "rate_limited":
          return NextResponse.json(
            {
              error: "rate_limited",
              message: err.message,
              retryAfterSeconds: err.retryAfterSeconds ?? 2,
            },
            {
              status: 429,
              headers: {
                "Retry-After": String(err.retryAfterSeconds ?? 2),
              },
            }
          );
        default:
          return NextResponse.json(
            { error: err.code, message: err.message },
            { status: 500 }
          );
      }
    }

    // Unexpected error
    return NextResponse.json(
      { error: "api_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: persist new breach alerts to Supabase
// ---------------------------------------------------------------------------

import type { HibpBreach } from "@/lib/hibp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function persistBreachAlerts(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  breaches: HibpBreach[]
): Promise<void> {
  if (breaches.length === 0) return;

  // Use upsert to avoid duplicates — breach_name per user is the natural key
  const rows = breaches.map((breach) => ({
    user_id: userId,
    service_name: breach.name,
    breach_name: breach.name,
    breach_date: breach.date,
    data_types: breach.dataTypes,
    is_read: false,
  }));

  await supabase
    .from("breach_alerts")
    .upsert(rows, { onConflict: "user_id,breach_name", ignoreDuplicates: true });

  // Also update the breach_status on any matching scan_result row
  const breachDomains = breaches.map((b) => b.name.toLowerCase());
  await supabase
    .from("scan_results")
    .update({
      breach_status: "breached",
      breach_count: breaches.length,
      breach_last_checked: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("service_name", breachDomains);
}

