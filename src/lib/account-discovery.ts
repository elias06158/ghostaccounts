import { lookupService } from "@/lib/services-db";

export type DetectionConfidence = "high" | "medium" | "low";
export type DetectionSource = "gmail" | "imap" | "mixed" | "demo";

export interface DiscoveryMessageMetadata {
  fromHeader: string;
  subject?: string | null;
  snippet?: string | null;
  dateHeader?: string | null;
  replyToHeader?: string | null;
  listIdHeader?: string | null;
  source: "gmail" | "imap";
}

export interface FoundService {
  name: string;
  domain: string;
  firstSeenDate: string | null;  // earliest email date from this service
  lastEmailDate: string | null;  // most recent email date from this service
  evidenceCount: number;
  evidenceTypes: string[];
  senderDomains: string[];
  detectionConfidence: DetectionConfidence;
  detectionSource: DetectionSource;
}

const TECHNICAL_SUBDOMAIN_PREFIX =
  /^(mail|email|mailer|noreply|no-reply|notifications?|notify|reply|bounce|bounces|mg|em\d*|info|hello|support|news|newsletter|updates|service|alert|alerts|account|accounts|security|team|do-not-reply|donotreply|post|fax|contact|customers?|cc|sicher|secure|login|auth|id)\./i;

const GENERIC_MAILBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "live.de",
  "yahoo.com",
  "yahoo.de",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "t-online.de",
  "freenet.de",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

const GENERIC_EMAIL_SENDER_DOMAINS = new Set([
  "sendgrid.net",
  "amazonses.com",
  "mailgun.org",
  "mailchimpapp.net",
  "mandrillapp.com",
  "sparkpostmail.com",
  "hubspotemail.net",
  "mailjet.com",
  "brevo.com",
  "sendinblue.com",
  "customeriomail.com",
  "klaviyomail.com",
  "cmail19.com",
  "constantcontact.com",
  "emltrk.com",
  "e.stripe.com",
  "email.stripe.com",
  "click.stripe.com",
  "mail.beehiiv.com",
  "substack.com",
  "buttondown.email",
  "convertkit.com",
  "drip.com",
  "activecampaign.com",
  "link.com",
  "lnk.to",
  "bit.ly",
  "t.co",
  "clicks.mlsend.com",
]);

/**
 * STRONG_SIGNAL_GROUPS: Only signals that DEFINITIVELY prove an account exists.
 * "welcome" / "willkommen" are intentionally excluded — they appear constantly
 * in marketing emails and cause false positives.
 */
const STRONG_SIGNAL_GROUPS: Array<{ type: string; weight: number; terms: string[] }> = [
  {
    // Evidence that the user created an account and verified their identity
    type: "registration",
    weight: 6,
    terms: [
      // Email verification (sent only at account creation)
      "verify your email",
      "verify your e-mail",
      "confirm your email",
      "confirm your e-mail",
      "e-mail bestätigen",
      "email bestätigen",
      "bestätige deine e-mail",
      "bestätige deine email",
      "e-mail-adresse bestätigen",
      // Account activation
      "activate your account",
      "konto aktivieren",
      "aktiviere dein konto",
      "account aktivieren",
      // Explicit account creation success
      "account created",
      "account has been created",
      "konto erstellt",
      "konto wurde erstellt",
      "registration successful",
      "registrierung erfolgreich",
      "successfully registered",
      "erfolgreich registriert",
      // Signup completion (user-initiated flow)
      "thank you for signing up",
      "danke für deine registrierung",
      "complete your signup",
      "complete your registration",
      "finish setting up your account",
      "set your password",
      "create your password",
      "lege dein passwort fest",
      "passwort festlegen",
      // Account is ready
      "your account is ready",
      "dein konto ist bereit",
    ],
  },
  {
    // Signals sent exclusively to authenticated account holders
    type: "security_alert",
    weight: 6,
    terms: [
      // Password reset (only triggered by account holder)
      "reset your password",
      "password reset",
      "passwort zurücksetzen",
      "passwort reset",
      "password has been reset",
      "dein passwort wurde",
      "forgot your password",
      "passwort vergessen",
      // OTP / 2FA codes (only sent to active account holders)
      "sign-in code",
      "login code",
      "verification code",
      "sicherheitscode",
      "bestätigungscode",
      "einmalcode",
      "one-time code",
      "one-time password",
      "einmalkennwort",
      "otp:",
      "two-factor",
      "2-faktor",
      "zweistufige",
      "magic link",
      "passkey",
      // Active session security events
      "new sign-in to your",
      "new login to your",
      "neue anmeldung bei",
      "neues gerät",
      "unbekanntes gerät",
      "suspicious activity on your",
      "unusual sign-in",
    ],
  },
  {
    // Proof of a financial transaction (only possible if account exists)
    type: "invoice",
    weight: 5,
    terms: [
      // Receipts / invoices with possessive = personal account
      "your receipt",
      "your invoice",
      "deine rechnung",
      "ihre rechnung",
      "dein beleg",
      // Order confirmation (possessive)
      "order confirmation",
      "bestellbestätigung",
      "purchase confirmation",
      "your order #",
      "your order number",
      "deine bestellung #",
      "bestellnummer:",
      // Payment success
      "payment successful",
      "payment confirmed",
      "zahlung erfolgreich",
      "zahlung bestätigt",
      "payment received",
      "transaktion erfolgreich",
      // Subscription billing (proves active paid account)
      "subscription confirmed",
      "subscription started",
      "abonnement bestätigt",
      "abonnement gestartet",
      "abo gestartet",
      "your subscription to",
      "dein abonnement für",
    ],
  },
];

/**
 * Hard veto: if ANY of these terms appear in subject or snippet,
 * reject the email immediately regardless of any other signals.
 * These indicate marketing/promotional/newsletter content that does NOT
 * prove account ownership.
 */
const HARD_VETO_TERMS = [
  // Explicit promotional signals
  "% off",
  "% rabatt",
  "% discount",
  "bis zu ",
  "save up to",
  "spar jetzt",
  "jetzt sparen",
  "sale ends",
  "limited time",
  "begrenzte zeit",
  "flash sale",
  "black friday",
  "cyber monday",
  "prime day",
  // Newsletter / digest signals
  "weekly digest",
  "wöchentlicher",
  "monatlicher newsletter",
  "our newsletter",
  "unser newsletter",
  "subscribe to our",
  "abonniere unseren",
  // Recommendation / non-personal
  "you might like",
  "das könnte dir gefallen",
  "recommended for you",
  "empfohlen für dich",
  "trending now",
  "people are buying",
  "popular right now",
  // Winback / generic outreach (not account confirmation)
  "we miss you",
  "wir vermissen dich",
  "come back",
  "it's been a while",
  "long time no see",
  // Offers and promotions
  "top angebote",
  "deals für dich",
  "angebote für dich",
];

const GENERIC_DISPLAY_NAME = /^(team|support|notifications?|noreply|no-reply|info|hello|customer service|updates?)$/i;

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function normalizeDomain(rawDomain: string): string {
  let domain = rawDomain.trim().toLowerCase().replace(/[>),;]+$/g, "");
  domain = domain.replace(/^\.+|\.+$/g, "");
  while (TECHNICAL_SUBDOMAIN_PREFIX.test(domain)) {
    domain = domain.replace(TECHNICAL_SUBDOMAIN_PREFIX, "");
  }
  return domain;
}

function extractEmailDomains(value: string | null | undefined): string[] {
  if (!value) return [];
  const matches = value.match(/[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi) ?? [];
  return uniq(
    matches
      .map((match) => match.split("@")[1] ?? "")
      .map(normalizeDomain)
  );
}

function extractListIdDomain(value: string | null | undefined): string[] {
  if (!value) return [];
  const match = value.match(/<?([A-Z0-9.-]+\.[A-Z]{2,})>?/i);
  return match ? [normalizeDomain(match[1])] : [];
}

function cleanDisplayName(fromHeader: string): string | null {
  const nameMatch = fromHeader.match(/^"?([^"<@]+?)"?\s*</);
  if (!nameMatch) return null;
  const cleaned = nameMatch[1]
    .replace(/\b(no[- ]?reply|noreply|support|team|notifications?|info|hello|hi)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || GENERIC_DISPLAY_NAME.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function humanizeDomain(domain: string): string {
  const mainPart = domain.split(".")[0] ?? domain;
  return mainPart
    .split(/[-_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isGenericMailboxDomain(domain: string): boolean {
  return GENERIC_MAILBOX_DOMAINS.has(domain);
}

function isGenericSenderDomain(domain: string): boolean {
  return GENERIC_EMAIL_SENDER_DOMAINS.has(domain) || isGenericMailboxDomain(domain);
}

function getCandidateDomains(message: DiscoveryMessageMetadata): string[] {
  const fromDomains = extractEmailDomains(message.fromHeader);
  const replyToDomains = extractEmailDomains(message.replyToHeader);
  const listIdDomains = extractListIdDomain(message.listIdHeader);

  const preferred = [...replyToDomains, ...listIdDomains, ...fromDomains];
  return uniq(preferred).filter((domain) => domain.includes("."));
}

function getSignalScore(
  message: DiscoveryMessageMetadata,
  domain: string,
  displayName: string | null
): { score: number; evidenceTypes: Set<string> } {
  const text = [message.subject, message.snippet]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  const evidenceTypes = new Set<string>();
  let score = 0; // No free base score — every point must be earned

  // Only strong signals count toward the minimum threshold
  for (const group of STRONG_SIGNAL_GROUPS) {
    if (containsAny(text, group.terms)) {
      score += group.weight;
      evidenceTypes.add(group.type);
    }
  }

  // Structural headers add a small confidence boost (not enough alone)
  if (message.replyToHeader) score += 1;
  if (message.listIdHeader) score += 1;

  // Known service match adds confidence (not enough alone to create account)
  if (lookupService(domain) || (displayName && lookupService(displayName))) {
    score += 1;
  }

  return { score, evidenceTypes };
}

function chooseDomain(message: DiscoveryMessageMetadata, displayName: string | null, domains: string[]): string | null {
  const mappedByName = displayName ? lookupService(displayName) : null;
  const mappedByDomain = domains.map((domain) => lookupService(domain)).find(Boolean) ?? null;
  if (mappedByDomain) return mappedByDomain.domain;
  if (mappedByName) return mappedByName.domain;

  const nonGeneric = domains.find((domain) => !isGenericSenderDomain(domain));
  if (nonGeneric) return nonGeneric;

  const fromDomains = extractEmailDomains(message.fromHeader);
  const genericFromDomain = fromDomains.find((domain) => !isGenericSenderDomain(domain));
  return genericFromDomain ?? null;
}

export function discoverServiceFromMessage(message: DiscoveryMessageMetadata): FoundService | null {
  const displayName = cleanDisplayName(message.fromHeader);
  const domains = getCandidateDomains(message);
  const domain = chooseDomain(message, displayName, domains);

  if (!domain || isGenericMailboxDomain(domain)) {
    return null;
  }

  // Hard veto: reject marketing/promotional emails immediately, before any scoring
  const subjectSnippet = [message.subject, message.snippet]
    .filter((v): v is string => Boolean(v))
    .join(" ")
    .toLowerCase();

  if (containsAny(subjectSnippet, HARD_VETO_TERMS)) {
    return null;
  }

  const { score, evidenceTypes } = getSignalScore(message, domain, displayName);

  // Must have at least one definitive signal type
  const strongTypes = ["registration", "security_alert", "invoice"];
  const hasStrongSignal = strongTypes.some((type) => evidenceTypes.has(type));

  if (!hasStrongSignal) return null;
  if (score < 5) return null;

  const mapped = lookupService(domain) ?? (displayName ? lookupService(displayName) : null);
  const confidence: DetectionConfidence = score >= 10 ? "high" : score >= 6 ? "medium" : "low";

  // Only output user-meaningful evidence types
  const displayEvidenceTypes = Array.from(evidenceTypes)
    .filter((type) => strongTypes.includes(type))
    .sort();

  const emailDate = message.dateHeader ?? null;

  return {
    name: mapped?.name ?? displayName ?? humanizeDomain(domain),
    domain: mapped?.domain ?? domain,
    firstSeenDate: emailDate,
    lastEmailDate: emailDate,
    evidenceCount: 1,
    evidenceTypes: displayEvidenceTypes,
    senderDomains: uniq(domains),
    detectionConfidence: confidence,
    detectionSource: message.source,
  };
}

export function mergeFoundService(servicesMap: Map<string, FoundService>, found: FoundService): void {
  const existing = servicesMap.get(found.domain);
  if (!existing) {
    servicesMap.set(found.domain, found);
    return;
  }

  const existingLastMs = existing.lastEmailDate ? new Date(existing.lastEmailDate).getTime() : 0;
  const foundLastMs = found.lastEmailDate ? new Date(found.lastEmailDate).getTime() : 0;
  const existingFirstMs = existing.firstSeenDate ? new Date(existing.firstSeenDate).getTime() : Infinity;
  const foundFirstMs = found.firstSeenDate ? new Date(found.firstSeenDate).getTime() : Infinity;

  const detectionSource: DetectionSource =
    existing.detectionSource === found.detectionSource
      ? existing.detectionSource
      : existing.detectionSource === "demo" || found.detectionSource === "demo"
      ? found.detectionSource === "demo" ? existing.detectionSource : found.detectionSource
      : "mixed";

  const confidenceRank: Record<DetectionConfidence, number> = { low: 0, medium: 1, high: 2 };

  servicesMap.set(found.domain, {
    ...existing,
    name: existing.name.length >= found.name.length ? existing.name : found.name,
    // Track both the earliest (firstSeenDate) and latest (lastEmailDate) emails
    firstSeenDate: foundFirstMs < existingFirstMs ? found.firstSeenDate : existing.firstSeenDate,
    lastEmailDate: foundLastMs > existingLastMs ? found.lastEmailDate : existing.lastEmailDate,
    evidenceCount: existing.evidenceCount + found.evidenceCount,
    evidenceTypes: uniq([...existing.evidenceTypes, ...found.evidenceTypes]).sort(),
    senderDomains: uniq([...existing.senderDomains, ...found.senderDomains]).sort(),
    detectionConfidence:
      confidenceRank[found.detectionConfidence] > confidenceRank[existing.detectionConfidence]
        ? found.detectionConfidence
        : existing.detectionConfidence,
    detectionSource,
  });
}