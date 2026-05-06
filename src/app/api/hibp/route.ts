import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ breached: false, message: "HIBP not configured" });
  }

  // Validate requester is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`,
      {
        headers: {
          "hibp-api-key": apiKey,
          "User-Agent": "GhostAccounts/1.0",
        },
      }
    );

    if (res.status === 404) {
      return NextResponse.json({ breached: false, breaches: [] });
    }
    if (res.status === 200) {
      const breaches = await res.json();
      return NextResponse.json({ breached: true, breaches });
    }
    return NextResponse.json({ breached: false, error: "HIBP error" });
  } catch {
    return NextResponse.json({ breached: false, error: "Request failed" });
  }
}
