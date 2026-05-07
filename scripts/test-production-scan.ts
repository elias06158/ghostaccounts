/**
 * Production-grade test of the account discovery logic.
 * Uses the real discoverServiceFromMessage against the Gmail inbox.
 * Run with: npx tsx scripts/test-production-scan.ts
 */
import { discoverServiceFromMessage, mergeFoundService } from "../src/lib/account-discovery";
import type { FoundService } from "../src/lib/account-discovery";
import { ImapFlow } from "imapflow";

const TEST_EMAIL = "u5858100143@gmail.com";
const TEST_PASSWORD = "mwba xndc pcph nbrw";

async function main() {
  console.log("=== Production Account Discovery Test ===\n");
  console.log(`Scanning: ${TEST_EMAIL}\n`);

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: TEST_EMAIL, pass: TEST_PASSWORD },
    logger: false,
    socketTimeout: 30000,
    greetingTimeout: 15000,
  });

  const services = new Map<string, FoundService>();

  await client.connect();
  console.log("Connected to Gmail IMAP\n");

  const lock = await client.getMailboxLock("INBOX");
  try {
    const count = (client.mailbox && client.mailbox.exists) ? client.mailbox.exists : 0;
    console.log(`Total messages: ${count}`);
    const start = Math.max(count - 2000 + 1, 1);

    let processed = 0;
    for await (const msg of client.fetch(`${start}:*`, { envelope: true })) {
      processed++;
      const from = msg.envelope?.from?.[0];
      if (!from) continue;

      const emailAddr = from.address ?? "";
      const fromStr = from.name ? `${from.name} <${emailAddr}>` : `<${emailAddr}>`;
      const replyTo = msg.envelope?.replyTo?.[0];
      const replyToHeader = replyTo
        ? replyTo.name
          ? `${replyTo.name} <${replyTo.address ?? ""}>`
          : `<${replyTo.address ?? ""}>`
        : null;

      const found = discoverServiceFromMessage({
        fromHeader: fromStr,
        subject: msg.envelope?.subject ?? null,
        dateHeader: msg.envelope?.date?.toISOString() ?? null,
        replyToHeader,
        source: "imap",
      });

      if (found) {
        mergeFoundService(services, found);
      }
    }
    console.log(`Processed: ${processed} messages\n`);
  } finally {
    lock.release();
  }

  await client.logout();

  // Print results
  const results = Array.from(services.values()).sort(
    (a, b) => b.evidenceCount - a.evidenceCount
  );

  console.log(`\n=== RESULTS: ${results.length} verified accounts found ===\n`);

  for (const s of results) {
    const conf =
      s.detectionConfidence === "high"
        ? "HIGH"
        : s.detectionConfidence === "medium"
        ? "MED "
        : "LOW ";
    console.log(
      `[${conf}] ${s.name.padEnd(25)} ${s.domain.padEnd(22)} ${s.evidenceCount} signal(s) [${s.evidenceTypes.join(", ")}]`
    );
    console.log(`        Source: ${s.detectionSource} | Senders: ${s.senderDomains.join(", ")}`);
    if (s.firstSeenDate) console.log(`        First: ${s.firstSeenDate} | Last: ${s.lastEmailDate}`);
    console.log();
  }

  if (results.length === 0) {
    console.log("No accounts with strong signals found.");
    console.log("This is expected if the inbox has mostly OAuth sign-ins without email confirmation flows.");
  }

  console.log("=== Test complete ===");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
