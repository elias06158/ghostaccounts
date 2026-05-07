#!/usr/bin/env node
/**
 * GhostAccounts Integration Test
 * Tests: auth signup, profile trigger, scan_results upsert, breach_alerts, RLS, cleanup
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const TEST_EMAIL = `test_${Date.now()}@ghostaccounts.test`;
const TEST_PASSWORD = "TestPass123!";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY);

let testUserId = null;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
}
function fail(msg, err) {
  console.error(`  ❌ ${msg}`);
  if (err) console.error("    ", err?.message ?? err);
  process.exit(1);
}

async function run() {
  console.log("\n🧪 GhostAccounts Integration Tests\n");
  console.log(`📧 Test email: ${TEST_EMAIL}\n`);

  // ── 1. Create test user via admin ───────────────────────────────────────────
  console.log("1. Auth: Create user via admin API");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created?.user) fail("Failed to create user", createErr);
  testUserId = created.user.id;
  pass(`Created user ${testUserId}`);

  // ── 2. Profile auto-created by trigger ──────────────────────────────────────
  console.log("\n2. DB: Profile trigger");
  // Wait for trigger to run
  await new Promise((r) => setTimeout(r, 500));
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("*")
    .eq("id", testUserId)
    .single();
  if (profErr || !profile) fail("Profile not created by trigger", profErr);
  pass(`Profile created: plan=${profile.plan}, email=${profile.email}`);

  // ── 3. Sign in as test user (RLS test) ──────────────────────────────────────
  console.log("\n3. Auth: Sign in as test user");
  const { data: session, error: signInErr } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signInErr || !session?.user) fail("Sign in failed", signInErr);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
  });
  pass(`Signed in as ${session.user.email}`);

  // ── 4. Insert scan_result ────────────────────────────────────────────────────
  console.log("\n4. DB: Insert scan_result");
  const { error: insertErr } = await userClient.from("scan_results").insert({
    user_id: testUserId,
    service_name: "Spotify",
    service_domain: "spotify.com",
    evidence_count: 2,
    evidence_types: ["registration", "sender-domain"],
    sender_domains: ["spotify.com"],
    detection_confidence: "high",
    detection_source: "gmail",
    breach_status: "safe",
    deletion_status: "active",
  });
  if (insertErr) fail("Insert scan_result failed", insertErr);
  pass("Inserted scan_result for spotify.com");

  // ── 5. Read scan_result back ─────────────────────────────────────────────────
  console.log("\n5. DB: Read scan_result (RLS select)");
  const { data: results, error: readErr } = await userClient
    .from("scan_results")
    .select("*")
    .eq("user_id", testUserId);
  if (readErr || !results || results.length === 0) fail("Read scan_results failed", readErr);
  if (results[0].service_name !== "Spotify") fail("Data mismatch");
  if (results[0].evidence_count !== 2) fail(`Expected evidence_count=2, got ${results[0].evidence_count}`);
  if (results[0].detection_confidence !== "high") fail(`Expected detection_confidence=high, got ${results[0].detection_confidence}`);
  pass(`Read ${results.length} scan_result(s), service_name="${results[0].service_name}"`);

  // ── 6. Upsert (on conflict update) ───────────────────────────────────────────
  console.log("\n6. DB: Upsert scan_result (conflict on user_id+service_domain)");
  const { error: upsertErr } = await userClient.from("scan_results").upsert(
    {
      user_id: testUserId,
      service_name: "Spotify",
      service_domain: "spotify.com",
      evidence_count: 3,
      evidence_types: ["registration", "billing", "sender-domain"],
      sender_domains: ["spotify.com", "notifications.spotify.com"],
      detection_confidence: "high",
      detection_source: "mixed",
      deletion_status: "deleted",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,service_domain", ignoreDuplicates: false }
  );
  if (upsertErr) fail("Upsert failed", upsertErr);
  const { data: upserted } = await userClient
    .from("scan_results")
    .select("deletion_status,evidence_count,detection_source")
    .eq("user_id", testUserId)
    .single();
  if (upserted?.deletion_status !== "deleted") fail(`Expected deletion_status=deleted, got ${upserted?.deletion_status}`);
  if (upserted?.evidence_count !== 3) fail(`Expected evidence_count=3, got ${upserted?.evidence_count}`);
  if (upserted?.detection_source !== "mixed") fail(`Expected detection_source=mixed, got ${upserted?.detection_source}`);
  pass("Upsert succeeded, deletion_status updated to 'deleted'");

  // ── 7. Insert breach_alert ───────────────────────────────────────────────────
  console.log("\n7. DB: Insert breach_alert");
  const { error: alertErr } = await admin.from("breach_alerts").insert({
    user_id: testUserId,
    service_name: "Spotify",
    breach_name: "SpotifyTest2024",
    breach_date: "2024-03-01",
    data_types: ["Email", "Password"],
  });
  if (alertErr) fail("Insert breach_alert failed", alertErr);
  const { data: alerts } = await userClient.from("breach_alerts").select("*").eq("user_id", testUserId);
  if (!alerts || alerts.length === 0) fail("No breach alerts found via RLS");
  pass(`Breach alert created and readable: "${alerts[0].breach_name}"`);

  // ── 8. RLS: Other user cannot read data ──────────────────────────────────────
  console.log("\n8. Security: RLS isolation test");
  // Use a FRESH unauthenticated client (not the one that signed in above)
  const freshAnon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonRead = await freshAnon.from("scan_results").select("*");
  if (anonRead.data && anonRead.data.length > 0) fail("RLS BREACH: unauthenticated client can read scan_results!");
  pass("Unauthenticated client cannot read scan_results (RLS working)");

  // ── 9. Update profile ────────────────────────────────────────────────────────
  console.log("\n9. DB: Update profile");
  const { error: updErr } = await userClient
    .from("profiles")
    .update({ full_name: "Test User", notify_breach: true })
    .eq("id", testUserId);
  if (updErr) fail("Profile update failed", updErr);
  const { data: updatedProfile } = await userClient.from("profiles").select("full_name").eq("id", testUserId).single();
  if (updatedProfile?.full_name !== "Test User") fail("Profile update not persisted");
  pass("Profile updated: full_name='Test User'");

  // ── 10. CLEANUP ──────────────────────────────────────────────────────────────
  console.log("\n10. Cleanup: Deleting test user");
  await admin.from("scan_results").delete().eq("user_id", testUserId);
  await admin.from("breach_alerts").delete().eq("user_id", testUserId);
  await admin.from("profiles").delete().eq("id", testUserId);
  const { error: delErr } = await admin.auth.admin.deleteUser(testUserId);
  if (delErr) fail("Cleanup failed", delErr);
  pass("Test user and all data deleted");

  // ── RESULT ───────────────────────────────────────────────────────────────────
  console.log("\n────────────────────────────────────────────────");
  console.log("🎉 All integration tests passed!");
  console.log("────────────────────────────────────────────────\n");
}

run().catch((err) => {
  console.error("\n💥 Unexpected error:", err);
  process.exit(1);
});
