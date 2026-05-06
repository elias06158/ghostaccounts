export interface ServiceInfo {
  name: string;
  domain: string;
  deletionUrl?: string;
  difficulty: "easy" | "medium" | "hard";
  keywords: string[];
}

/** Curated database of services with deletion URLs and difficulty ratings. */
export const SERVICES_DB: ServiceInfo[] = [
  {
    name: "Google",
    domain: "google.com",
    deletionUrl: "https://myaccount.google.com/deleteaccount",
    difficulty: "medium",
    keywords: ["google", "gmail", "youtube"],
  },
  {
    name: "Facebook",
    domain: "facebook.com",
    deletionUrl: "https://www.facebook.com/help/delete_account",
    difficulty: "medium",
    keywords: ["facebook"],
  },
  {
    name: "Instagram",
    domain: "instagram.com",
    deletionUrl: "https://www.instagram.com/accounts/remove/request/permanent/",
    difficulty: "easy",
    keywords: ["instagram"],
  },
  {
    name: "Twitter / X",
    domain: "twitter.com",
    deletionUrl: "https://twitter.com/settings/deactivate",
    difficulty: "easy",
    keywords: ["twitter", "x.com"],
  },
  {
    name: "LinkedIn",
    domain: "linkedin.com",
    deletionUrl: "https://www.linkedin.com/help/linkedin/answer/63",
    difficulty: "medium",
    keywords: ["linkedin"],
  },
  {
    name: "Spotify",
    domain: "spotify.com",
    deletionUrl: "https://www.spotify.com/account/close/",
    difficulty: "easy",
    keywords: ["spotify"],
  },
  {
    name: "Netflix",
    domain: "netflix.com",
    deletionUrl: "https://www.netflix.com/CancelPlan",
    difficulty: "easy",
    keywords: ["netflix"],
  },
  {
    name: "Amazon",
    domain: "amazon.com",
    deletionUrl: "https://www.amazon.com/privacy/data-deletion",
    difficulty: "hard",
    keywords: ["amazon", "amazon.de"],
  },
  {
    name: "Apple",
    domain: "apple.com",
    deletionUrl: "https://privacy.apple.com",
    difficulty: "medium",
    keywords: ["apple", "icloud"],
  },
  {
    name: "Microsoft",
    domain: "microsoft.com",
    deletionUrl: "https://account.live.com/closeaccount.aspx",
    difficulty: "medium",
    keywords: ["microsoft", "outlook", "hotmail", "live.com"],
  },
  {
    name: "PayPal",
    domain: "paypal.com",
    deletionUrl: "https://www.paypal.com/myaccount/privacy/delete",
    difficulty: "medium",
    keywords: ["paypal"],
  },
  {
    name: "eBay",
    domain: "ebay.com",
    deletionUrl: "https://www.ebay.de/help/account/managing-account/closing-ebay-account",
    difficulty: "medium",
    keywords: ["ebay"],
  },
  {
    name: "Dropbox",
    domain: "dropbox.com",
    deletionUrl: "https://www.dropbox.com/account/delete",
    difficulty: "easy",
    keywords: ["dropbox"],
  },
  {
    name: "GitHub",
    domain: "github.com",
    deletionUrl: "https://github.com/settings/admin",
    difficulty: "medium",
    keywords: ["github"],
  },
  {
    name: "Reddit",
    domain: "reddit.com",
    deletionUrl: "https://www.reddit.com/settings/account",
    difficulty: "medium",
    keywords: ["reddit"],
  },
  {
    name: "Pinterest",
    domain: "pinterest.com",
    deletionUrl: "https://www.pinterest.com/settings/privacy/",
    difficulty: "easy",
    keywords: ["pinterest"],
  },
  {
    name: "TikTok",
    domain: "tiktok.com",
    deletionUrl: "https://support.tiktok.com/en/account-and-privacy/deleting-an-account",
    difficulty: "medium",
    keywords: ["tiktok"],
  },
  {
    name: "Snapchat",
    domain: "snapchat.com",
    deletionUrl: "https://accounts.snapchat.com/accounts/delete_account",
    difficulty: "easy",
    keywords: ["snapchat"],
  },
  {
    name: "Twitch",
    domain: "twitch.tv",
    deletionUrl: "https://www.twitch.tv/settings/account",
    difficulty: "easy",
    keywords: ["twitch"],
  },
  {
    name: "Airbnb",
    domain: "airbnb.com",
    deletionUrl: "https://www.airbnb.de/help/article/3318",
    difficulty: "medium",
    keywords: ["airbnb"],
  },
  {
    name: "Booking.com",
    domain: "booking.com",
    deletionUrl: "https://www.booking.com/content/privacy.de.html",
    difficulty: "hard",
    keywords: ["booking.com", "booking"],
  },
  {
    name: "Uber",
    domain: "uber.com",
    deletionUrl: "https://help.uber.com/riders/article/how-do-i-delete-my-account",
    difficulty: "easy",
    keywords: ["uber"],
  },
  {
    name: "Discord",
    domain: "discord.com",
    deletionUrl: "https://discord.com/settings/account",
    difficulty: "easy",
    keywords: ["discord"],
  },
  {
    name: "Slack",
    domain: "slack.com",
    deletionUrl: "https://slack.com/help/articles/203953436",
    difficulty: "medium",
    keywords: ["slack"],
  },
  {
    name: "Zoom",
    domain: "zoom.us",
    deletionUrl: "https://support.zoom.us/hc/en-us/articles/201363243",
    difficulty: "easy",
    keywords: ["zoom"],
  },
  {
    name: "Adobe",
    domain: "adobe.com",
    deletionUrl: "https://helpx.adobe.com/manage-account/using/delete-your-account.html",
    difficulty: "medium",
    keywords: ["adobe"],
  },
  {
    name: "Zalando",
    domain: "zalando.de",
    deletionUrl: "https://www.zalando.de/help/",
    difficulty: "medium",
    keywords: ["zalando"],
  },
  {
    name: "OTTO",
    domain: "otto.de",
    deletionUrl: "https://www.otto.de/hilfe/konto/",
    difficulty: "medium",
    keywords: ["otto.de", "otto"],
  },
  {
    name: "XING",
    domain: "xing.com",
    deletionUrl: "https://www.xing.com/settings/privacy/delete_account",
    difficulty: "easy",
    keywords: ["xing"],
  },
  {
    name: "Notion",
    domain: "notion.so",
    deletionUrl: "https://www.notion.so/help/delete-your-account",
    difficulty: "easy",
    keywords: ["notion"],
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
