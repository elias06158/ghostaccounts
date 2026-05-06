/**
 * Client-side Gmail scan using PKCE OAuth flow.
 * The Google access token is used ONLY in the browser.
 * Only service names (not email content) are sent to the server.
 */

export interface FoundService {
  name: string;
  domain: string;
  lastEmailDate: string | null;
}

/** Keywords used to identify registration / welcome emails. */
const REGISTRATION_KEYWORDS = [
  "welcome",
  "willkommen",
  "confirm your email",
  "verify your email",
  "bestätige deine",
  "activate your account",
  "konto bestätigen",
  "account created",
  "konto erstellt",
  "you're registered",
  "registration successful",
  "erfolgreich registriert",
  "thank you for signing up",
  "danke für deine registrierung",
  "get started",
  "loslegen",
];

/** Extract company/service domain from a From header. */
function extractDomain(from: string): string {
  const match = from.match(/@([^>.\s]+\.[^>.\s]+)/);
  if (match) {
    // Strip "mail.", "noreply.", "em.", etc.
    return match[1].replace(/^(mail|email|noreply|no-reply|mailer|em|em2|em3)\./i, "");
  }
  return "";
}

/** Extract service name from From header or domain. */
function extractName(from: string, domain: string): string {
  const nameMatch = from.match(/^"?([^"<@]+?)"?\s*</);
  if (nameMatch) {
    const raw = nameMatch[1].trim();
    // Remove common noise like "Team", "Support", "Notifications", etc.
    const cleaned = raw
      .replace(/\b(team|support|notifications?|noreply|no-reply|info|hello|hi)\b/gi, "")
      .trim();
    if (cleaned.length > 1) return cleaned;
  }
  // Fallback: capitalise the main domain part
  const domainPart = domain.split(".")[0];
  return domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
}

/** Scan Gmail inbox using the provided access token. */
export async function scanGmail(
  accessToken: string,
  onProgress: (found: number) => void
): Promise<FoundService[]> {
  const query = REGISTRATION_KEYWORDS.map((kw) => `subject:"${kw}"`).join(" OR ");

  // Fetch message IDs matching the query
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=200`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) throw new Error("Gmail API error");
  const listData = await listRes.json();
  const messages: { id: string }[] = listData.messages ?? [];

  const servicesMap = new Map<string, FoundService>();

  // Process in batches of 10
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    await Promise.all(
      batch.map(async (msg) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgRes.ok) return;
        const msgData = await msgRes.json();
        const headers: { name: string; value: string }[] =
          msgData.payload?.headers ?? [];

        const fromHeader = headers.find((h) => h.name === "From")?.value ?? "";
        const dateHeader = headers.find((h) => h.name === "Date")?.value ?? null;
        const domain = extractDomain(fromHeader);
        if (!domain) return;
        const name = extractName(fromHeader, domain);
        if (!servicesMap.has(domain)) {
          servicesMap.set(domain, { name, domain, lastEmailDate: dateHeader });
        }
      })
    );
    onProgress(servicesMap.size);
  }

  return Array.from(servicesMap.values());
}

/** Generate PKCE code verifier + challenge. */
export async function generatePKCE() {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
}

/** Build Gmail OAuth URL with PKCE. */
export function buildGmailOAuthUrl(
  clientId: string,
  redirectUri: string,
  challenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchange PKCE code for an access token (public client — no client_secret). */
export async function exchangeGmailCode(
  code: string,
  verifier: string,
  clientId: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token exchange failed");
  return data.access_token;
}

/** Demo scan — returns 30 realistic sample services. */
export function getDemoServices(): FoundService[] {
  const demos = [
    "google.com", "facebook.com", "instagram.com", "twitter.com", "linkedin.com",
    "spotify.com", "netflix.com", "amazon.de", "apple.com", "paypal.com",
    "ebay.de", "dropbox.com", "github.com", "reddit.com", "pinterest.com",
    "tiktok.com", "snapchat.com", "discord.com", "slack.com", "zoom.us",
    "adobe.com", "zalando.de", "otto.de", "xing.com", "notion.so",
    "airbnb.com", "booking.com", "uber.com", "twitch.tv", "canva.com",
  ];

  const names: Record<string, string> = {
    "google.com": "Google",
    "facebook.com": "Facebook",
    "instagram.com": "Instagram",
    "twitter.com": "Twitter / X",
    "linkedin.com": "LinkedIn",
    "spotify.com": "Spotify",
    "netflix.com": "Netflix",
    "amazon.de": "Amazon",
    "apple.com": "Apple",
    "paypal.com": "PayPal",
    "ebay.de": "eBay",
    "dropbox.com": "Dropbox",
    "github.com": "GitHub",
    "reddit.com": "Reddit",
    "pinterest.com": "Pinterest",
    "tiktok.com": "TikTok",
    "snapchat.com": "Snapchat",
    "discord.com": "Discord",
    "slack.com": "Slack",
    "zoom.us": "Zoom",
    "adobe.com": "Adobe",
    "zalando.de": "Zalando",
    "otto.de": "OTTO",
    "xing.com": "XING",
    "notion.so": "Notion",
    "airbnb.com": "Airbnb",
    "booking.com": "Booking.com",
    "uber.com": "Uber",
    "twitch.tv": "Twitch",
    "canva.com": "Canva",
  };

  // Random dates in the last 8 years
  return demos.map((domain) => {
    const years = Math.random() * 8;
    const date = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);
    return {
      name: names[domain] ?? domain,
      domain,
      lastEmailDate: date.toISOString(),
    };
  });
}
