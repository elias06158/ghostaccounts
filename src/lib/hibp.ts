/**
 * Have I Been Pwned (HIBP) service module.
 *
 * Wraps the HIBP v3 API with:
 *  - Full breach detail (data classes, breach date, count)
 *  - In-memory LRU-style cache (24 h TTL, max 500 entries)
 *  - Rate-limit and error propagation with typed errors
 *
 * API reference: https://haveibeenpwned.com/API/v3
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HibpBreach {
  /** Breach name as returned by HIBP (e.g. "LinkedIn") */
  name: string;
  /** ISO 8601 date the breach occurred (e.g. "2012-05-05") */
  date: string | null;
  /** Data classes exposed in the breach (e.g. ["Email addresses", "Passwords"]) */
  dataTypes: string[];
  /** Number of pwned accounts in this breach */
  pwnCount: number;
  /** Whether HIBP considers the breach verified */
  isVerified: boolean;
}

export interface HibpResult {
  email: string;
  breached: boolean;
  breaches: HibpBreach[];
  count: number;
  /** ISO timestamp of when the result was fetched/cached */
  checkedAt: string;
  /** True if the result came from cache */
  fromCache: boolean;
}

// Typed error codes so callers can branch without string-matching
export type HibpErrorCode =
  | "invalid_email"
  | "api_key_missing"
  | "rate_limited"
  | "api_error"
  | "network_error";

export class HibpError extends Error {
  constructor(
    public readonly code: HibpErrorCode,
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "HibpError";
  }
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim()) && email.length <= 254;
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

/** Cache entry stored in memory */
interface CacheEntry {
  result: HibpResult;
  expiresAt: number; // Unix ms
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_MAX_ENTRIES = 500;

// Module-level singleton — survives across requests in the same Node.js process
const cache = new Map<string, CacheEntry>();

function cacheGet(email: string): HibpResult | null {
  const entry = cache.get(email.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(email.toLowerCase());
    return null;
  }
  return { ...entry.result, fromCache: true };
}

function cacheSet(email: string, result: HibpResult): void {
  // Evict oldest entries when at capacity
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(email.toLowerCase(), {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ---------------------------------------------------------------------------
// HIBP raw API response types
// ---------------------------------------------------------------------------

interface HibpApiBreachItem {
  Name: string;
  BreachDate: string | null;
  DataClasses: string[];
  PwnCount: number;
  IsVerified: boolean;
}

// ---------------------------------------------------------------------------
// Core fetch logic
// ---------------------------------------------------------------------------

const HIBP_BASE_URL = "https://haveibeenpwned.com/api/v3";
const USER_AGENT = "GhostAccounts/1.0 (https://ghostaccounts.app)";

/**
 * Fetch breach data for an email from the HIBP API.
 * Does NOT use the cache — callers should use `checkEmail` instead.
 */
async function fetchFromHibp(
  email: string,
  apiKey: string
): Promise<HibpBreach[]> {
  const url = `${HIBP_BASE_URL}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "hibp-api-key": apiKey,
        "User-Agent": USER_AGENT,
      },
      // 10-second timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new HibpError("network_error", `HIBP request failed: ${message}`);
  }

  // 404 = no breaches found — not an error
  if (response.status === 404) {
    return [];
  }

  // 401 = missing or invalid API key
  if (response.status === 401) {
    throw new HibpError(
      "api_key_missing",
      "HIBP API key is missing or invalid. Set HIBP_API_KEY in your environment."
    );
  }

  // 429 = rate limited
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "2", 10);
    throw new HibpError(
      "rate_limited",
      `HIBP rate limit reached. Retry after ${retryAfter}s.`,
      retryAfter
    );
  }

  // Any other non-200 status
  if (!response.ok) {
    throw new HibpError(
      "api_error",
      `HIBP API returned status ${response.status}`
    );
  }

  const raw: HibpApiBreachItem[] = await response.json();

  // Map HIBP response to our clean schema
  return raw.map((item) => ({
    name: item.Name,
    date: item.BreachDate ?? null,
    dataTypes: item.DataClasses ?? [],
    pwnCount: item.PwnCount ?? 0,
    isVerified: item.IsVerified ?? false,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether an email address appears in known data breaches.
 *
 * - Validates the email format and throws `HibpError("invalid_email")` if invalid.
 * - Returns cached results within the 24-hour TTL.
 * - Throws typed `HibpError` on API/network failures so the caller can handle
 *   them specifically (rate limit, key missing, etc.).
 *
 * @example
 * ```ts
 * const result = await checkEmail("user@example.com");
 * console.log(result.breached, result.count);
 * ```
 */
export async function checkEmail(email: string): Promise<HibpResult> {
  const normalised = email.trim().toLowerCase();

  // 1. Validate format
  if (!isValidEmail(normalised)) {
    throw new HibpError("invalid_email", `"${email}" is not a valid email address.`);
  }

  // 2. Return cached result if available
  const cached = cacheGet(normalised);
  if (cached) return cached;

  // 3. Require API key
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    throw new HibpError(
      "api_key_missing",
      "HIBP_API_KEY environment variable is not set."
    );
  }

  // 4. Fetch from HIBP
  const breaches = await fetchFromHibp(normalised, apiKey);

  const result: HibpResult = {
    email: normalised,
    breached: breaches.length > 0,
    breaches,
    count: breaches.length,
    checkedAt: new Date().toISOString(),
    fromCache: false,
  };

  // 5. Cache the result
  cacheSet(normalised, result);

  return result;
}

/**
 * Batch-check multiple emails.
 * Respects HIBP rate limits with a 1.6-second delay between requests
 * (HIBP allows ~1 request/1.5s on the default plan).
 */
export async function checkEmails(
  emails: string[]
): Promise<Map<string, HibpResult | HibpError>> {
  const results = new Map<string, HibpResult | HibpError>();

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    try {
      const result = await checkEmail(email);
      results.set(email, result);
    } catch (err) {
      results.set(email, err instanceof HibpError ? err : new HibpError("api_error", String(err)));
    }

    // Rate-limit guard: wait between requests (skip after last one)
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1600));
    }
  }

  return results;
}

/**
 * Invalidate the cache for a specific email.
 * Useful when you want to force a fresh check.
 */
export function invalidateCache(email: string): void {
  cache.delete(email.trim().toLowerCase());
}

/** Returns cache statistics for monitoring/debugging. */
export function getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
  return { size: cache.size, maxSize: CACHE_MAX_ENTRIES, ttlMs: CACHE_TTL_MS };
}
