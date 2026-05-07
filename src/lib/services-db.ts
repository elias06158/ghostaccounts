export type ServiceCategory =
  | "social"
  | "shopping"
  | "work"
  | "finance"
  | "streaming"
  | "gaming"
  | "travel"
  | "tools"
  | "ai"
  | "other";

export const CATEGORY_ICONS_MAP: Record<ServiceCategory, string> = {
  social: "👥",
  shopping: "🛍️",
  work: "💼",
  finance: "💳",
  streaming: "🎵",
  gaming: "🎮",
  travel: "✈️",
  tools: "🔧",
  ai: "🤖",
  other: "📦",
};

export interface ServiceInfo {
  name: string;
  domain: string;
  deletionUrl?: string;
  difficulty: "easy" | "medium" | "hard";
  keywords: string[];
  category: ServiceCategory;
}

interface DeletionGuide {
  prerequisites?: string[];
  steps: string[];
  backupHint?: string;
}

/** Curated database of services with deletion URLs and difficulty ratings. */
export const SERVICES_DB: ServiceInfo[] = [
  // — Social —
  {
    name: "Facebook",
    domain: "facebook.com",
    deletionUrl: "https://www.facebook.com/help/delete_account",
    difficulty: "medium",
    keywords: ["facebook"],
    category: "social",
  },
  {
    name: "Instagram",
    domain: "instagram.com",
    deletionUrl: "https://www.instagram.com/accounts/remove/request/permanent/",
    difficulty: "easy",
    keywords: ["instagram"],
    category: "social",
  },
  {
    name: "Twitter / X",
    domain: "twitter.com",
    deletionUrl: "https://twitter.com/settings/deactivate",
    difficulty: "easy",
    keywords: ["twitter", "x.com"],
    category: "social",
  },
  {
    name: "LinkedIn",
    domain: "linkedin.com",
    deletionUrl: "https://www.linkedin.com/help/linkedin/answer/63",
    difficulty: "medium",
    keywords: ["linkedin"],
    category: "social",
  },
  {
    name: "Reddit",
    domain: "reddit.com",
    deletionUrl: "https://www.reddit.com/settings/account",
    difficulty: "medium",
    keywords: ["reddit"],
    category: "social",
  },
  {
    name: "Pinterest",
    domain: "pinterest.com",
    deletionUrl: "https://www.pinterest.com/settings/privacy/",
    difficulty: "easy",
    keywords: ["pinterest"],
    category: "social",
  },
  {
    name: "TikTok",
    domain: "tiktok.com",
    deletionUrl: "https://support.tiktok.com/en/account-and-privacy/deleting-an-account",
    difficulty: "medium",
    keywords: ["tiktok"],
    category: "social",
  },
  {
    name: "Snapchat",
    domain: "snapchat.com",
    deletionUrl: "https://accounts.snapchat.com/accounts/delete_account",
    difficulty: "easy",
    keywords: ["snapchat"],
    category: "social",
  },
  {
    name: "XING",
    domain: "xing.com",
    deletionUrl: "https://www.xing.com/settings/privacy/delete_account",
    difficulty: "easy",
    keywords: ["xing"],
    category: "social",
  },
  // — Streaming —
  {
    name: "Spotify",
    domain: "spotify.com",
    deletionUrl: "https://www.spotify.com/account/close/",
    difficulty: "easy",
    keywords: ["spotify"],
    category: "streaming",
  },
  {
    name: "Netflix",
    domain: "netflix.com",
    deletionUrl: "https://www.netflix.com/CancelPlan",
    difficulty: "easy",
    keywords: ["netflix"],
    category: "streaming",
  },
  {
    name: "Twitch",
    domain: "twitch.tv",
    deletionUrl: "https://www.twitch.tv/settings/account",
    difficulty: "easy",
    keywords: ["twitch"],
    category: "streaming",
  },
  // — Shopping —
  {
    name: "Amazon",
    domain: "amazon.com",
    deletionUrl: "https://www.amazon.com/privacy/data-deletion",
    difficulty: "hard",
    keywords: ["amazon", "amazon.de"],
    category: "shopping",
  },
  {
    name: "eBay",
    domain: "ebay.com",
    deletionUrl: "https://www.ebay.de/help/account/managing-account/closing-ebay-account",
    difficulty: "medium",
    keywords: ["ebay"],
    category: "shopping",
  },
  {
    name: "Zalando",
    domain: "zalando.de",
    deletionUrl: "https://www.zalando.de/help/",
    difficulty: "medium",
    keywords: ["zalando"],
    category: "shopping",
  },
  {
    name: "OTTO",
    domain: "otto.de",
    deletionUrl: "https://www.otto.de/hilfe/konto/",
    difficulty: "medium",
    keywords: ["otto.de", "otto"],
    category: "shopping",
  },
  {
    name: "Shopify",
    domain: "shopify.com",
    deletionUrl: "https://help.shopify.com/en/manual/your-account/close-account",
    difficulty: "medium",
    keywords: ["shopify"],
    category: "shopping",
  },
  // — Finance —
  {
    name: "PayPal",
    domain: "paypal.com",
    deletionUrl: "https://www.paypal.com/myaccount/privacy/delete",
    difficulty: "medium",
    keywords: ["paypal"],
    category: "finance",
  },
  {
    name: "Stripe",
    domain: "stripe.com",
    deletionUrl: "https://dashboard.stripe.com/settings/account",
    difficulty: "medium",
    keywords: ["stripe"],
    category: "finance",
  },
  // — Travel —
  {
    name: "Airbnb",
    domain: "airbnb.com",
    deletionUrl: "https://www.airbnb.de/help/article/3318",
    difficulty: "medium",
    keywords: ["airbnb"],
    category: "travel",
  },
  {
    name: "Booking.com",
    domain: "booking.com",
    deletionUrl: "https://www.booking.com/content/privacy.de.html",
    difficulty: "hard",
    keywords: ["booking.com", "booking"],
    category: "travel",
  },
  {
    name: "Uber",
    domain: "uber.com",
    deletionUrl: "https://help.uber.com/riders/article/how-do-i-delete-my-account",
    difficulty: "easy",
    keywords: ["uber"],
    category: "travel",
  },
  // — Work / Productivity —
  {
    name: "Google",
    domain: "google.com",
    deletionUrl: "https://myaccount.google.com/deleteaccount",
    difficulty: "medium",
    keywords: ["google", "gmail", "youtube"],
    category: "tools",
  },
  {
    name: "Microsoft",
    domain: "microsoft.com",
    deletionUrl: "https://account.live.com/closeaccount.aspx",
    difficulty: "medium",
    keywords: ["microsoft", "outlook", "hotmail", "live.com"],
    category: "work",
  },
  {
    name: "Apple",
    domain: "apple.com",
    deletionUrl: "https://privacy.apple.com",
    difficulty: "medium",
    keywords: ["apple", "icloud"],
    category: "tools",
  },
  {
    name: "Dropbox",
    domain: "dropbox.com",
    deletionUrl: "https://www.dropbox.com/account/delete",
    difficulty: "easy",
    keywords: ["dropbox"],
    category: "work",
  },
  {
    name: "GitHub",
    domain: "github.com",
    deletionUrl: "https://github.com/settings/admin",
    difficulty: "medium",
    keywords: ["github"],
    category: "work",
  },
  {
    name: "Discord",
    domain: "discord.com",
    deletionUrl: "https://discord.com/settings/account",
    difficulty: "easy",
    keywords: ["discord"],
    category: "work",
  },
  {
    name: "Slack",
    domain: "slack.com",
    deletionUrl: "https://slack.com/help/articles/203953436",
    difficulty: "medium",
    keywords: ["slack"],
    category: "work",
  },
  {
    name: "Zoom",
    domain: "zoom.us",
    deletionUrl: "https://support.zoom.us/hc/en-us/articles/201363243",
    difficulty: "easy",
    keywords: ["zoom"],
    category: "work",
  },
  {
    name: "Notion",
    domain: "notion.so",
    deletionUrl: "https://www.notion.so/help/delete-your-account",
    difficulty: "easy",
    keywords: ["notion"],
    category: "work",
  },
  {
    name: "Atlassian",
    domain: "atlassian.com",
    deletionUrl: "https://id.atlassian.com/manage-profile/account/delete",
    difficulty: "medium",
    keywords: ["atlassian", "jira", "confluence", "bitbucket", "trello"],
    category: "work",
  },
  {
    name: "Trello",
    domain: "trello.com",
    deletionUrl: "https://trello.com/your/account",
    difficulty: "easy",
    keywords: ["trello"],
    category: "work",
  },
  {
    name: "Linear",
    domain: "linear.app",
    deletionUrl: "https://linear.app/settings/account",
    difficulty: "easy",
    keywords: ["linear"],
    category: "work",
  },
  {
    name: "Miro",
    domain: "miro.com",
    deletionUrl: "https://miro.com/app/settings/profile/",
    difficulty: "easy",
    keywords: ["miro"],
    category: "work",
  },
  {
    name: "Notion Calendar (Cron)",
    domain: "cron.com",
    deletionUrl: "https://cron.com/settings",
    difficulty: "easy",
    keywords: ["cron", "notion calendar"],
    category: "work",
  },
  // — Tools / Design —
  {
    name: "Adobe",
    domain: "adobe.com",
    deletionUrl: "https://helpx.adobe.com/manage-account/using/delete-your-account.html",
    difficulty: "medium",
    keywords: ["adobe"],
    category: "tools",
  },
  {
    name: "Canva",
    domain: "canva.com",
    deletionUrl: "https://www.canva.com/settings/account",
    difficulty: "easy",
    keywords: ["canva"],
    category: "tools",
  },
  {
    name: "Figma",
    domain: "figma.com",
    deletionUrl: "https://www.figma.com/settings",
    difficulty: "easy",
    keywords: ["figma"],
    category: "tools",
  },
  {
    name: "Grammarly",
    domain: "grammarly.com",
    deletionUrl: "https://account.grammarly.com/deleteAccount",
    difficulty: "easy",
    keywords: ["grammarly"],
    category: "tools",
  },
  {
    name: "Vercel",
    domain: "vercel.com",
    deletionUrl: "https://vercel.com/account",
    difficulty: "easy",
    keywords: ["vercel"],
    category: "tools",
  },
  {
    name: "Netlify",
    domain: "netlify.com",
    deletionUrl: "https://app.netlify.com/user/settings",
    difficulty: "easy",
    keywords: ["netlify"],
    category: "tools",
  },
  {
    name: "Docker",
    domain: "docker.com",
    deletionUrl: "https://hub.docker.com/settings/general",
    difficulty: "easy",
    keywords: ["docker"],
    category: "tools",
  },
  {
    name: "Gamma",
    domain: "gamma.app",
    deletionUrl: "https://gamma.app/settings",
    difficulty: "easy",
    keywords: ["gamma"],
    category: "tools",
  },
  // — AI —
  {
    name: "ChatGPT (OpenAI)",
    domain: "openai.com",
    deletionUrl: "https://help.openai.com/en/articles/6378407-how-do-i-delete-my-account",
    difficulty: "medium",
    keywords: ["openai", "chatgpt"],
    category: "ai",
  },
  {
    name: "Claude (Anthropic)",
    domain: "anthropic.com",
    deletionUrl: "https://support.anthropic.com/en/articles/8968737-how-do-i-delete-my-account",
    difficulty: "easy",
    keywords: ["anthropic", "claude"],
    category: "ai",
  },
  {
    name: "Google AI Studio",
    domain: "aistudio.google.com",
    deletionUrl: "https://myaccount.google.com/deleteaccount",
    difficulty: "medium",
    keywords: ["google ai studio", "aistudio"],
    category: "ai",
  },
  {
    name: "HeyGen",
    domain: "heygen.com",
    deletionUrl: "https://app.heygen.com/settings",
    difficulty: "easy",
    keywords: ["heygen"],
    category: "ai",
  },
];

/** Match a domain/sender string against the curated services DB. */
export function lookupService(domainOrName: string): ServiceInfo | null {
  const lower = domainOrName.toLowerCase();
  return (
    SERVICES_DB.find(
      (s) =>
        lower.includes(s.domain) ||
        s.keywords.some((kw) => lower.includes(kw))
    ) ?? null
  );
}

/** Deduce a human-readable service name from an email From header. */
export function extractServiceName(fromHeader: string): string {
  // "Spotify <no-reply@spotify.com>" → "Spotify"
  const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) return nameMatch[1].trim();
  // "no-reply@spotify.com" → "Spotify"
  const domainMatch = fromHeader.match(/@([^>.\s]+)/);
  if (domainMatch) {
    return domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
  }
  return fromHeader.trim();
}

export function getDeletionGuide(domainOrName: string, locale: "de" | "en"): DeletionGuide {
  const lower = domainOrName.toLowerCase();
  const isGerman = locale === "de";

  const generic: DeletionGuide = {
    prerequisites: isGerman
      ? ["Vergewissere dich, dass du Zugriff auf die Login-E-Mail hast.", "Prüfe aktive Abos vor dem Löschen."]
      : ["Make sure you still have access to the login email.", "Check active subscriptions before deletion."],
    steps: isGerman
      ? [
          "Öffne die Konto-Einstellungen des Dienstes.",
          "Suche nach 'Konto löschen' oder 'Konto deaktivieren'.",
          "Bestätige die Löschung per Passwort/2FA.",
          "Markiere den Status in GhostAccounts als gelöscht.",
        ]
      : [
          "Open the service account settings.",
          "Find 'Delete account' or 'Deactivate account'.",
          "Confirm the deletion with password/2FA.",
          "Mark the account as deleted in GhostAccounts.",
        ],
    backupHint: isGerman
      ? "Falls verfügbar: Exportiere deine Daten vor der Löschung."
      : "If available, export your data before deleting the account.",
  };

  const guideMap: Record<string, DeletionGuide> = {
    "google.com": {
      prerequisites: isGerman
        ? ["Google Takeout optional vorbereiten."]
        : ["Prepare Google Takeout export if needed."],
      steps: isGerman
        ? [
            "Gehe zu myaccount.google.com.",
            "Navigiere zu 'Daten & Datenschutz'.",
            "Wähle 'Google-Konto löschen'.",
            "Bestätige mit Passwort und Sicherheitsprüfung.",
          ]
        : [
            "Go to myaccount.google.com.",
            "Navigate to 'Data & Privacy'.",
            "Select 'Delete your Google Account'.",
            "Confirm with password and security checks.",
          ],
      backupHint: isGerman ? "Empfohlen: Daten via Takeout exportieren." : "Recommended: export data through Takeout.",
    },
    "microsoft.com": {
      steps: isGerman
        ? [
            "Öffne account.live.com/closeaccount.aspx.",
            "Prüfe die Checkliste zu Guthaben und Abos.",
            "Bestätige die Schließung.",
            "Warte die Sperrfrist ab (Reaktivierung möglich).",
          ]
        : [
            "Open account.live.com/closeaccount.aspx.",
            "Review the checklist for balances and subscriptions.",
            "Confirm account closure.",
            "Wait for the waiting period (reactivation possible).",
          ],
    },
    "facebook.com": {
      steps: isGerman
        ? [
            "Öffne Einstellungen & Privatsphäre.",
            "Gehe zu Kontoinhaber und Einstellungen.",
            "Wähle 'Deaktivierung oder Löschung'.",
            "Bestätige die dauerhafte Löschung.",
          ]
        : [
            "Open Settings & Privacy.",
            "Go to Accounts Center settings.",
            "Choose 'Deactivation or deletion'.",
            "Confirm permanent deletion.",
          ],
    },
    "instagram.com": {
      steps: isGerman
        ? [
            "Öffne das Account-Center in den Einstellungen.",
            "Wähle 'Persönliche Daten' > 'Kontoinhaberschaft'.",
            "Starte den Löschprozess.",
            "Bestätige mit Passwort.",
          ]
        : [
            "Open the Accounts Center in settings.",
            "Choose 'Personal details' > 'Account ownership'.",
            "Start the deletion process.",
            "Confirm with your password.",
          ],
    },
    "linkedin.com": {
      steps: isGerman
        ? [
            "Öffne Einstellungen & Datenschutz.",
            "Gehe zu Kontoverwaltung.",
            "Wähle 'Konto schließen'.",
            "Grund wählen und Passwort bestätigen.",
          ]
        : [
            "Open Settings & Privacy.",
            "Go to Account management.",
            "Select 'Close account'.",
            "Choose reason and confirm password.",
          ],
    },
  };

  for (const [key, guide] of Object.entries(guideMap)) {
    if (lower.includes(key) || lower.includes(key.replace(".com", ""))) {
      return {
        prerequisites: guide.prerequisites ?? generic.prerequisites,
        steps: guide.steps,
        backupHint: guide.backupHint ?? generic.backupHint,
      };
    }
  }

  return generic;
}
