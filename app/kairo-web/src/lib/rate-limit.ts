/**
 * In-memory sliding-window rate limiter.
 *
 * Pure lib/ utility — no framework deps.
 * Tracks request timestamps per key (IP).
 * Returns { allowed, retryAfter } for each check.
 *
 * Limitations:
 * - In-memory only — resets on cold start / redeploy
 * - Fine for Vercel serverless MVP; upgrade to Redis/Upstash at scale
 */

interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds until the client can retry (0 if allowed) */
  retryAfter: number;
}

interface RateLimiter {
  check: (key: string) => RateLimitResult;
}

const store = new Map<string, number[]>();

/**
 * Creates a rate limiter with the given config.
 * Each call creates a fresh limiter (useful for testing).
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const localStore = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get existing timestamps, filter to current window
      const timestamps = (localStore.get(key) ?? []).filter(
        (t) => t > windowStart
      );

      if (timestamps.length >= config.maxRequests) {
        // Denied — calculate retry-after from oldest timestamp in window
        const oldestInWindow = timestamps[0]!;
        const resetAt = oldestInWindow + config.windowMs;
        const retryAfter = Math.ceil((resetAt - now) / 1000);

        return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
      }

      // Allowed — record this request
      timestamps.push(now);
      localStore.set(key, timestamps);

      return { allowed: true, retryAfter: 0 };
    },
  };
}

/**
 * Shared checkout rate limiter instance.
 * 5 requests per 60 seconds per IP — prevents checkout session spam.
 */
export const checkoutLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

/**
 * Shared quiz rate limiter instance.
 * 10 requests per 60 seconds per IP — more generous than checkout
 * since quiz retakes are legitimate.
 */
export const quizLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});
