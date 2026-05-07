import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { discoverServiceFromMessage, mergeFoundService, type FoundService } from "@/lib/account-discovery";
import { createClient } from "@/lib/supabase/server";

interface ImapConfig {
  host: string;
  port: number;
}

const MAX_IMAP_MESSAGES = 2000;

/** Detect IMAP server settings from email domain. */
function detectImap(email: string): ImapConfig {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const map: Record<string, ImapConfig> = {
    "gmail.com":         { host: "imap.gmail.com",             port: 993 },
    "googlemail.com":    { host: "imap.gmail.com",             port: 993 },
    "outlook.com":       { host: "outlook.office365.com",      port: 993 },
    "hotmail.com":       { host: "outlook.office365.com",      port: 993 },
    "live.com":          { host: "outlook.office365.com",      port: 993 },
    "live.de":           { host: "outlook.office365.com",      port: 993 },
    "msn.com":           { host: "outlook.office365.com",      port: 993 },
    "yahoo.com":         { host: "imap.mail.yahoo.com",        port: 993 },
    "yahoo.de":          { host: "imap.mail.yahoo.com",        port: 993 },
    "ymail.com":         { host: "imap.mail.yahoo.com",        port: 993 },
    "icloud.com":        { host: "imap.mail.me.com",           port: 993 },
    "me.com":            { host: "imap.mail.me.com",           port: 993 },
    "mac.com":           { host: "imap.mail.me.com",           port: 993 },
    "gmx.de":            { host: "imap.gmx.net",               port: 993 },
    "gmx.net":           { host: "imap.gmx.net",               port: 993 },
    "gmx.at":            { host: "imap.gmx.net",               port: 993 },
    "gmx.ch":            { host: "imap.gmx.net",               port: 993 },
    "web.de":            { host: "imap.web.de",                port: 993 },
    "t-online.de":       { host: "secureimap.t-online.de",     port: 993 },
    "freenet.de":        { host: "mx.freenet.de",              port: 993 },
    "posteo.de":         { host: "posteo.de",                  port: 993 },
    "tutanota.com":      { host: "mail.tutanota.com",          port: 993 },
    "protonmail.com":    { host: "127.0.0.1",                  port: 1143 }, // ProtonMail Bridge only
    "proton.me":         { host: "127.0.0.1",                  port: 1143 },
  };
  return map[domain] ?? { host: `imap.${domain}`, port: 993 };
}

export async function POST(req: NextRequest) {
  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; password?: string; host?: string; port?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, host: customHost, port: customPort } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const imapConfig = customHost
    ? { host: customHost, port: customPort ?? 993 }
    : detectImap(email);

  const client = new ImapFlow({
    host: imapConfig.host,
    port: imapConfig.port,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    // 15 second connection timeout
    socketTimeout: 15000,
    greetingTimeout: 10000,
  });

  const services = new Map<string, FoundService>();

  try {
    await client.connect();

    const lock = await client.getMailboxLock("INBOX");
    try {
      const messageCount = client.mailbox ? client.mailbox.exists : 0;
      if (messageCount > 0) {
        const start = Math.max(messageCount - MAX_IMAP_MESSAGES + 1, 1);
        const range = `${start}:*`;

        for await (const msg of client.fetch(range, { envelope: true })) {
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
            dateHeader: msg.envelope?.date ? msg.envelope.date.toISOString() : null,
            replyToHeader,
            source: "imap",
          });
          if (found) {
            mergeFoundService(services, found);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    // Translate common IMAP errors to user-friendly messages
    if (message.includes("Invalid credentials") || message.includes("Authentication failed") || message.includes("AUTHENTICATIONFAILED")) {
      return NextResponse.json({ error: "wrong_credentials" }, { status: 401 });
    }
    if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND") || message.includes("connect")) {
      return NextResponse.json({ error: "connection_failed" }, { status: 502 });
    }
    return NextResponse.json({ error: "imap_error", detail: message }, { status: 500 });
  }

  return NextResponse.json({ services: Array.from(services.values()) });
}
