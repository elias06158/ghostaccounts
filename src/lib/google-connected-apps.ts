/**
 * Google Connected Apps Scanner
 * 
 * Uses the Gmail access token to discover third-party services 
 * connected to the user's Google account by analyzing:
 * 1. Google security notification emails about new sign-ins via Google
 * 2. Gmail API labels that indicate connected services
 * 3. Emails containing "You granted access" or "connected to your Google Account"
 */

import type { FoundService } from "@/lib/account-discovery";

const GOOGLE_CONNECTED_SIGNALS = [
  "signed in with google",
  "mit google angemeldet",
  "google sign-in",
  "google-anmeldung",
  "you granted access",
  "zugriff gewährt",
  "connected to your google account",
  "mit deinem google-konto verbunden",
  "third-party access",
  "drittanbieter-zugriff",
  "has access to your google account",
  "hat zugriff auf dein google-konto",
  "new sign-in from",
  "neue anmeldung von",
  "signed in to",
  "anmeldung bei",
];

interface GoogleConnectedApp {
  name: string;
  domain: string;
  detectedVia: "security_email" | "oauth_grant";
}

/**
 * Scan Gmail for security emails that indicate third-party apps
 * connected via "Sign in with Google".
 */
export async function scanGoogleConnectedApps(
  accessToken: string,
  onProgress: (found: number) => void
): Promise<FoundService[]> {
  const connectedApps: GoogleConnectedApp[] = [];

  // Search for Google security emails about third-party app access
  const queries = [
    "from:no-reply@accounts.google.com subject:(Drittanbieter OR third-party OR Zugriff OR access OR anmeldung OR sign-in)",
    "from:no-reply@accounts.google.com subject:(neue Anmeldung OR new sign-in)",
    "subject:(signed in with Google OR mit Google angemeldet)",
    "subject:(You granted OR Zugriff gewährt)",
  ];

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        maxResults: "100",
        q: query,
      });

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!listRes.ok) continue;
      const listData = await listRes.json();
      const messages: { id: string }[] = listData.messages ?? [];

      // Process messages in batches
      for (let i = 0; i < Math.min(messages.length, 50); i += 10) {
        const batch = messages.slice(i, i + 10);
        await Promise.all(
          batch.map(async (msg) => {
            try {
              const msgRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (!msgRes.ok) return;
              const msgData = await msgRes.json();
              const headers: { name: string; value: string }[] =
                msgData.payload?.headers ?? [];

              const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
              const snippet = typeof msgData.snippet === "string" ? msgData.snippet : "";

              // Extract app names from subject/snippet
              const app = extractConnectedAppFromEmail(subject, snippet);
              if (app && !connectedApps.some((a) => a.domain === app.domain)) {
                connectedApps.push(app);
                onProgress(connectedApps.length);
              }
            } catch {
              // Skip failed messages
            }
          })
        );
      }
    } catch {
      // Skip failed queries
    }
  }

  // Convert to FoundService format
  return connectedApps.map((app) => ({
    name: app.name,
    domain: app.domain,
    firstSeenDate: null,
    lastEmailDate: new Date().toISOString(),
    evidenceCount: 1,
    evidenceTypes: ["google_connected_app"],
    senderDomains: [app.domain],
    detectionConfidence: "high" as const,
    detectionSource: "gmail" as const,
  }));
}

/** Known apps that connect via Google OAuth */
const KNOWN_GOOGLE_CONNECTED_APPS: Record<string, { name: string; domain: string }> = {
  atlassian: { name: "Atlassian", domain: "atlassian.com" },
  jira: { name: "Atlassian", domain: "atlassian.com" },
  confluence: { name: "Atlassian", domain: "atlassian.com" },
  bitbucket: { name: "Atlassian", domain: "atlassian.com" },
  claude: { name: "Claude (Anthropic)", domain: "anthropic.com" },
  anthropic: { name: "Claude (Anthropic)", domain: "anthropic.com" },
  docker: { name: "Docker", domain: "docker.com" },
  gamma: { name: "Gamma", domain: "gamma.app" },
  gemini: { name: "Gemini", domain: "gemini.google.com" },
  github: { name: "GitHub", domain: "github.com" },
  "google ai studio": { name: "Google AI Studio", domain: "aistudio.google.com" },
  "google antigravity": { name: "Google Antigravity", domain: "google.com" },
  "google appsheet": { name: "Google AppSheet", domain: "appsheet.com" },
  appsheet: { name: "Google AppSheet", domain: "appsheet.com" },
  heygen: { name: "HeyGen", domain: "heygen.com" },
  canva: { name: "Canva", domain: "canva.com" },
  figma: { name: "Figma", domain: "figma.com" },
  notion: { name: "Notion", domain: "notion.so" },
  slack: { name: "Slack", domain: "slack.com" },
  discord: { name: "Discord", domain: "discord.com" },
  spotify: { name: "Spotify", domain: "spotify.com" },
  chatgpt: { name: "ChatGPT (OpenAI)", domain: "openai.com" },
  openai: { name: "ChatGPT (OpenAI)", domain: "openai.com" },
  vercel: { name: "Vercel", domain: "vercel.com" },
  netlify: { name: "Netlify", domain: "netlify.com" },
  linear: { name: "Linear", domain: "linear.app" },
  miro: { name: "Miro", domain: "miro.com" },
  trello: { name: "Trello", domain: "trello.com" },
  zoom: { name: "Zoom", domain: "zoom.us" },
  grammarly: { name: "Grammarly", domain: "grammarly.com" },
  stripe: { name: "Stripe", domain: "stripe.com" },
  shopify: { name: "Shopify", domain: "shopify.com" },
  adobe: { name: "Adobe", domain: "adobe.com" },
  dropbox: { name: "Dropbox", domain: "dropbox.com" },
  linkedin: { name: "LinkedIn", domain: "linkedin.com" },
  twitter: { name: "Twitter / X", domain: "twitter.com" },
  "x.com": { name: "Twitter / X", domain: "twitter.com" },
  pinterest: { name: "Pinterest", domain: "pinterest.com" },
  reddit: { name: "Reddit", domain: "reddit.com" },
  twitch: { name: "Twitch", domain: "twitch.tv" },
  uber: { name: "Uber", domain: "uber.com" },
  airbnb: { name: "Airbnb", domain: "airbnb.com" },
  "booking.com": { name: "Booking.com", domain: "booking.com" },
};

function extractConnectedAppFromEmail(
  subject: string,
  snippet: string
): GoogleConnectedApp | null {
  const combined = `${subject} ${snippet}`.toLowerCase();

  // Check if this is a Google security/access email
  const isRelevant = GOOGLE_CONNECTED_SIGNALS.some((signal) =>
    combined.includes(signal)
  );
  if (!isRelevant) return null;

  // Try to match known apps
  for (const [key, app] of Object.entries(KNOWN_GOOGLE_CONNECTED_APPS)) {
    if (combined.includes(key)) {
      return { ...app, detectedVia: "oauth_grant" };
    }
  }

  // Try to extract app name from patterns like "App Name has access" or "signed in to App Name"
  const patterns = [
    /(?:signed in to|anmeldung bei|angemeldet bei)\s+([A-Z][A-Za-z0-9 .]+)/i,
    /([A-Z][A-Za-z0-9 .]+)\s+(?:has access|hat zugriff)/i,
    /(?:granted|gewährt)\s+(?:access to|zugriff auf)\s+([A-Z][A-Za-z0-9 .]+)/i,
    /(?:drittanbieter|third-party)[^:]*:\s*([A-Z][A-Za-z0-9 .]+)/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match?.[1]) {
      const appName = match[1].trim();
      if (appName.length > 2 && appName.length < 50) {
        return {
          name: appName,
          domain: appName.toLowerCase().replace(/\s+/g, "") + ".com",
          detectedVia: "security_email",
        };
      }
    }
  }

  return null;
}
