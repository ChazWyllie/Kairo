/**
 * Tests for lib/stripe-server.ts
 *
 * Covers: getStripePriceId (happy path + unconfigured tiers),
 * getPlanFromPriceId (known + unknown price IDs), ALLOWED_PRICE_IDS set.
 */
import { describe, it, expect } from "vitest";
import "@/test/setup";

import {
  getStripePriceId,
  getPlanFromPriceId,
  ALLOWED_PRICE_IDS,
} from "@/lib/stripe-server";

// These values must match setup.ts env mock
const STANDARD_MONTHLY_ID = "price_test_standard_m";
const STANDARD_ANNUAL_ID = "price_test_standard_a";
const PREMIUM_MONTHLY_ID = "price_test_premium_m";
const PREMIUM_ANNUAL_ID = "price_test_premium_a";

// ── getStripePriceId ──

describe("getStripePriceId", () => {
  it("returns the correct price ID for standard/monthly", () => {
    expect(getStripePriceId("standard", "monthly")).toBe(STANDARD_MONTHLY_ID);
  });

  it("returns the correct price ID for standard/annual", () => {
    expect(getStripePriceId("standard", "annual")).toBe(STANDARD_ANNUAL_ID);
  });

  it("returns the correct price ID for premium/monthly", () => {
    expect(getStripePriceId("premium", "monthly")).toBe(PREMIUM_MONTHLY_ID);
  });

  it("returns the correct price ID for premium/annual", () => {
    expect(getStripePriceId("premium", "annual")).toBe(PREMIUM_ANNUAL_ID);
  });

  it("throws when price ID is not configured (legacy foundation tier)", () => {
    expect(() => getStripePriceId("foundation", "monthly")).toThrow(
      "Stripe price ID not configured for foundation/monthly"
    );
  });
});

// ── getPlanFromPriceId ──

describe("getPlanFromPriceId", () => {
  it("returns the standard plan for standard/monthly price ID", () => {
    const result = getPlanFromPriceId(STANDARD_MONTHLY_ID);
    expect(result).not.toBeNull();
    expect(result?.tier).toBe("standard");
    expect(result?.interval).toBe("monthly");
  });

  it("returns the premium plan for premium/annual price ID", () => {
    const result = getPlanFromPriceId(PREMIUM_ANNUAL_ID);
    expect(result).not.toBeNull();
    expect(result?.tier).toBe("premium");
    expect(result?.interval).toBe("annual");
  });

  it("returns null for an unknown price ID", () => {
    expect(getPlanFromPriceId("price_unknown_xyz")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getPlanFromPriceId("")).toBeNull();
  });
});

// ── ALLOWED_PRICE_IDS ──

describe("ALLOWED_PRICE_IDS", () => {
  it("contains standard monthly price ID", () => {
    expect(ALLOWED_PRICE_IDS.has(STANDARD_MONTHLY_ID)).toBe(true);
  });

  it("contains standard annual price ID", () => {
    expect(ALLOWED_PRICE_IDS.has(STANDARD_ANNUAL_ID)).toBe(true);
  });

  it("contains premium monthly price ID", () => {
    expect(ALLOWED_PRICE_IDS.has(PREMIUM_MONTHLY_ID)).toBe(true);
  });

  it("contains premium annual price ID", () => {
    expect(ALLOWED_PRICE_IDS.has(PREMIUM_ANNUAL_ID)).toBe(true);
  });

  it("does not contain unknown IDs", () => {
    expect(ALLOWED_PRICE_IDS.has("price_unknown")).toBe(false);
  });
});
