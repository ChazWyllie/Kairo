/**
 * Tests for rate limiter — in-memory sliding window, IP-keyed.
 *
 * Coverage: allow within limit, deny over limit, window reset,
 * independent IP tracking, retry-after calculation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Unmock rate-limit so we test the real implementation
vi.unmock("@/lib/rate-limit");

import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // ── Happy Path ──

  it("allows requests within the limit", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    expect(limiter.check("1.2.3.4").allowed).toBe(true);
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
  });

  it("denies requests over the limit", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check("1.2.3.4"); // 1
    limiter.check("1.2.3.4"); // 2
    const result = limiter.check("1.2.3.4"); // 3 — denied

    expect(result.allowed).toBe(false);
  });

  it("returns retryAfter in seconds when denied", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    limiter.check("1.2.3.4"); // 1 — allowed
    const result = limiter.check("1.2.3.4"); // 2 — denied

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });

  it("returns retryAfter = 0 when allowed", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

    const result = limiter.check("1.2.3.4");

    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  // ── Window Reset ──

  it("resets after window expires", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 10_000 });

    limiter.check("1.2.3.4"); // 1 — allowed
    expect(limiter.check("1.2.3.4").allowed).toBe(false); // denied

    vi.advanceTimersByTime(10_001);

    expect(limiter.check("1.2.3.4").allowed).toBe(true); // reset — allowed
  });

  // ── IP Isolation ──

  it("tracks IPs independently", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    limiter.check("1.1.1.1"); // allowed
    expect(limiter.check("1.1.1.1").allowed).toBe(false); // denied

    expect(limiter.check("2.2.2.2").allowed).toBe(true); // different IP — allowed
  });

  // ── Edge Cases ──

  it("handles empty IP gracefully", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    expect(limiter.check("").allowed).toBe(true);
    expect(limiter.check("").allowed).toBe(true);
    expect(limiter.check("").allowed).toBe(false);
  });
});
