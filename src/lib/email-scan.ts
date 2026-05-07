/**
 * Client-side Gmail scan using PKCE OAuth flow.
 * The Google access token is used only in the browser.
 * Only derived service metadata is persisted.
 */

import {
  type FoundService,
  discoverServiceFromMessage,
  mergeFoundService,
} from "@/lib/account-discovery";

const GMAIL_LIST_PAGE_SIZE = 500;
const GMAIL_METADATA_BATCH_SIZE = 20;
const MAX_GMAIL_MESSAGES = 1500;

/** Scan Gmail inbox using the provided access token. */
export async function scanGmail(
  accessToken: string,
  onProgress: (found: number) => void
): Promise<FoundService[]> {
  const messages: { id: string }[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      maxResults: String(GMAIL_LIST_PAGE_SIZE),
      q: "-label:spam -label:trash",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listRes.ok) throw new Error("Gmail API error");
    const listData = await listRes.json();
    messages.push(...((listData.messages as { id: string }[] | undefined) ?? []));
    pageToken = listData.nextPageToken ?? undefined;
  } while (pageToken && messages.length < MAX_GMAIL_MESSAGES);

  const servicesMap = new Map<string, FoundService>();

  for (let i = 0; i < messages.length; i += GMAIL_METADATA_BATCH_SIZE) {
    const batch = messages.slice(i, i + GMAIL_METADATA_BATCH_SIZE);
    await Promise.all(
      batch.map(async (msg) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=Subject&metadataHeaders=Reply-To&metadataHeaders=List-Id`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgRes.ok) return;
        const msgData = await msgRes.json();
        const headers: { name: string; value: string }[] =
          msgData.payload?.headers ?? [];

        const fromHeader = headers.find((h) => h.name === "From")?.value ?? "";
        const subjectHeader = headers.find((h) => h.name === "Subject")?.value ?? null;
        const replyToHeader = headers.find((h) => h.name === "Reply-To")?.value ?? null;
        const listIdHeader = headers.find((h) => h.name === "List-Id")?.value ?? null;
        const dateHeader = headers.find((h) => h.name === "Date")?.value ?? null;
        const found = discoverServiceFromMessage({
          fromHeader,
          subject: subjectHeader,
          snippet: typeof msgData.snippet === "string" ? msgData.snippet : null,
          dateHeader,
          replyToHeader,
          listIdHeader,
          source: "gmail",
        });
        if (found) {
          mergeFoundService(servicesMap, found);
        }
      })
    );
    onProgress(servicesMap.size);
  }

  return Array.from(servicesMap.values());
}

export type { FoundService } from "@/lib/account-discovery";

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
      firstSeenDate: date.toISOString(),
      lastEmailDate: date.toISOString(),
      evidenceCount: 1,
      evidenceTypes: ["demo"],
      senderDomains: [domain],
      detectionConfidence: "medium" as const,
      detectionSource: "demo" as const,
    };
  });
}
