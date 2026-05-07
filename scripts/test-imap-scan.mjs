/**
 * End-to-end test for the IMAP scan workflow.
 * Tests the core IMAP scanning logic directly.
 * Run with: node scripts/test-imap-scan.mjs
 */
import { ImapFlow } from "imapflow";

const TEST_EMAIL = "u5858100143@gmail.com";
const TEST_PASSWORD = "mwba xndc pcph nbrw";
const MAX_MESSAGES = 2000;

// Inline the discovery logic for direct testing
const STRONG_SIGNAL_TERMS = [
  "verify your email", "confirm your email", "e-mail bestätigen",
  "activate your account", "konto aktivieren",
  "account created", "registration successful",
  "thank you for signing up", "complete your registration",
  "reset your password", "password reset", "passwort zurücksetzen",
  "sign-in code", "login code", "verification code",
  "new sign-in to your", "neue anmeldung bei",
  "your receipt", "your invoice", "order confirmation",
  "payment successful", "subscription confirmed",
];

const HARD_VETO_TERMS = [
  "% off", "% rabatt", "sale ends", "limited time",
  "weekly digest", "our newsletter", "subscribe to our",
  "you might like", "recommended for you", "trending now",
  "we miss you", "come back", "top angebote",
];

const GENERIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com",
  "yahoo.com", "icloud.com", "gmx.de", "web.de",
]);

const ESP_DOMAINS = new Set([
  "sendgrid.net", "amazonses.com", "mailgun.org",
  "mailchimpapp.net", "mandrillapp.com",
]);

function extractDomain(fromHeader) {
  const match = fromHeader.match(/@([A-Z0-9.-]+\.[A-Z]{2,})/i);
  if (!match) return null;
  let domain = match[1].toLowerCase();
  // Strip technical subdomains
  domain = domain.replace(/^(mail|email|noreply|no-reply|notifications?|notify|bounce|mg|em\d*|info|support|news|team)\./i, "");
  return domain;
}

function isStrongSignal(subject) {
  if (!subject) return false;
  const lower = subject.toLowerCase();
  if (HARD_VETO_TERMS.some(t => lower.includes(t))) return false;
  return STRONG_SIGNAL_TERMS.some(t => lower.includes(t));
}

async function main() {
  console.log("=== GhostAccounts IMAP Scan — Direct Test ===\n");
  console.log(`📧 Scanning: ${TEST_EMAIL}`);
  console.log(`🔗 Server: imap.gmail.com:993\n`);
  
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: TEST_EMAIL, pass: TEST_PASSWORD },
    logger: false,
    socketTimeout: 30000,
    greetingTimeout: 15000,
  });

  const servicesMap = new Map();
  
  try {
    await client.connect();
    console.log("✅ Connected to Gmail IMAP\n");
    
    const lock = await client.getMailboxLock("INBOX");
    try {
      const messageCount = client.mailbox ? client.mailbox.exists : 0;
      console.log(`📬 Total messages in INBOX: ${messageCount}`);
      
      if (messageCount === 0) {
        console.log("⚠️  No messages found. Is the inbox empty?");
        return;
      }
      
      const start = Math.max(messageCount - MAX_MESSAGES + 1, 1);
      const range = `${start}:*`;
      console.log(`📖 Scanning messages ${start} to ${messageCount}...\n`);
      
      let processed = 0;
      let skipped = 0;
      
      for await (const msg of client.fetch(range, { envelope: true })) {
        processed++;
        const from = msg.envelope?.from?.[0];
        if (!from) continue;
        
        const emailAddr = from.address ?? "";
        const fromStr = from.name ? `${from.name} <${emailAddr}>` : `<${emailAddr}>`;
        const subject = msg.envelope?.subject ?? "";
        const date = msg.envelope?.date ? msg.envelope.date.toISOString() : null;
        
        const domain = extractDomain(emailAddr);
        if (!domain || GENERIC_DOMAINS.has(domain) || ESP_DOMAINS.has(domain)) {
          skipped++;
          continue;
        }
        
        const hasStrongSignal = isStrongSignal(subject);
        
        if (hasStrongSignal || !servicesMap.has(domain)) {
          const existing = servicesMap.get(domain);
          if (!existing) {
            servicesMap.set(domain, {
              name: from.name || domain.split(".")[0],
              domain,
              evidenceCount: 1,
              lastEmail: date,
              firstEmail: date,
              hasStrongSignal,
              subjects: [subject?.substring(0, 80)],
            });
          } else {
            existing.evidenceCount++;
            if (hasStrongSignal) existing.hasStrongSignal = true;
            if (date && (!existing.lastEmail || date > existing.lastEmail)) existing.lastEmail = date;
            if (date && (!existing.firstEmail || date < existing.firstEmail)) existing.firstEmail = date;
            if (existing.subjects.length < 3 && subject) existing.subjects.push(subject.substring(0, 80));
          }
        }
      }
      
      console.log(`📊 Processed: ${processed} messages, Skipped: ${skipped} generic/ESP\n`);
      
    } finally {
      lock.release();
    }
    
    await client.logout();
    
  } catch (err) {
    console.error("❌ IMAP Error:", err.message);
    if (err.message.includes("Authentication")) {
      console.error("   → Check if the App Password is still valid");
    }
    process.exit(1);
  }
  
  // Print results
  const services = Array.from(servicesMap.values())
    .sort((a, b) => b.evidenceCount - a.evidenceCount);
  
  console.log(`\n=== RESULTS: ${services.length} services found ===\n`);
  
  const highConfidence = services.filter(s => s.hasStrongSignal);
  const others = services.filter(s => !s.hasStrongSignal);
  
  console.log(`🟢 HIGH CONFIDENCE (${highConfidence.length}):`);
  for (const svc of highConfidence) {
    console.log(`   ${svc.name.padEnd(30)} ${svc.domain.padEnd(25)} ${svc.evidenceCount} emails`);
    for (const sub of svc.subjects.slice(0, 2)) {
      console.log(`      └─ "${sub}"`);
    }
  }
  
  console.log(`\n🟡 OTHER DETECTED (${others.length}):`);
  for (const svc of others.slice(0, 30)) {
    console.log(`   ${svc.name.padEnd(30)} ${svc.domain.padEnd(25)} ${svc.evidenceCount} emails`);
  }
  
  if (others.length > 30) {
    console.log(`   ... and ${others.length - 30} more`);
  }
  
  console.log("\n=== Test complete ===");
}

main().catch(console.error);
