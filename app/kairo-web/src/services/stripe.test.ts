/**
 * Tests for services/stripe.ts
 *
 * Covers: getStripe lazy singleton — returns a Stripe instance and
 * memoizes it across repeated calls.
 *
 * Uses vi.importActual to bypass the global mock in setup.ts so the
 * real implementation is exercised.
 */
import { describe, it, expect, beforeEach } from "vitest";

describe("getStripe", () => {
  beforeEach(() => {
    // Clear the cached singleton on globalThis between tests
    const g = globalThis as Record<string, unknown>;
    delete g.stripe;
  });

  it("returns a Stripe-like instance", async () => {
    const { getStripe } =
      await vi.importActual<typeof import("@/services/stripe")>(
        "@/services/stripe"
      );

    const stripe = getStripe();
    expect(stripe).toBeDefined();
    // A Stripe instance exposes these namespaces
    expect(stripe.checkout).toBeDefined();
    expect(stripe.webhooks).toBeDefined();
  });

  it("returns the same instance on repeated calls (memoized)", async () => {
    const { getStripe } =
      await vi.importActual<typeof import("@/services/stripe")>(
        "@/services/stripe"
      );

    const a = getStripe();
    const b = getStripe();
    expect(a).toBe(b);
  });
});
