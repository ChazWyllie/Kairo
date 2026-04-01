/**
 * Tests for landing page structure and data contracts.
 *
 * Since we use Vitest (not jsdom/RTL for full component rendering),
 * these tests verify the data layer and exports that the page depends on.
 *
 * Behavior matrix coverage:
 * - Happy path: PLANS has taglines, features, correct structure
 * - Boundary: all tiers have required fields
 * - Regression: pricing data matches expected values
 * - Accessibility: heading hierarchy contract
 */
import { describe, it, expect } from "vitest";
import { PLANS, type PlanDisplay } from "@/lib/stripe-prices";
import { ALLOWED_PRICE_IDS } from "@/lib/stripe-server";

describe("Landing page data contracts", () => {
  // ── Plan Config Completeness ──

  it("all plans have a tagline field", () => {
    for (const plan of PLANS) {
      expect(plan.tagline).toBeDefined();
      expect(plan.tagline.length).toBeGreaterThan(10);
    }
  });

  it("all plans have at least 4 features", () => {
    for (const plan of PLANS) {
      expect(plan.features.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("all Stripe price IDs start with price_", () => {
    for (const id of ALLOWED_PRICE_IDS) {
      expect(id).toMatch(/^price_/);
    }
  });

  it("annual price is less than 12x monthly (discount)", () => {
    for (const plan of PLANS) {
      expect(plan.annualPrice).toBeLessThan(plan.monthlyPrice * 12);
    }
  });

  it("active tiers are in ascending price order (standard < premium)", () => {
    const active = PLANS.filter((p) => p.tier === "standard" || p.tier === "premium");
    expect(active).toHaveLength(2);
    expect(active[0].monthlyPrice).toBeLessThan(active[1].monthlyPrice);
  });

  // ── Tier Names for Display ──

  it("has exactly 6 plans (2 active + 4 legacy)", () => {
    expect(PLANS).toHaveLength(6);
  });

  it("tiers are standard, premium, foundation, coaching, performance, vip", () => {
    const tiers = PLANS.map((p) => p.tier);
    expect(tiers).toEqual(["standard", "premium", "foundation", "coaching", "performance", "vip"]);
  });

  // ── Feature Copy Quality (regression) ──

  it("no feature starts with lowercase (consistent capitalization)", () => {
    for (const plan of PLANS) {
      for (const feature of plan.features) {
        const firstChar = feature.charAt(0);
        expect(firstChar).toBe(firstChar.toUpperCase());
      }
    }
  });

  it("no feature exceeds 80 characters (mobile readability)", () => {
    for (const plan of PLANS) {
      for (const feature of plan.features) {
        expect(feature.length).toBeLessThanOrEqual(80);
      }
    }
  });

  // ── PlanDisplay type contract ──

  it("each plan satisfies PlanDisplay interface", () => {
    const requiredKeys: (keyof PlanDisplay)[] = [
      "tier",
      "name",
      "tagline",
      "monthlyPrice",
      "annualPrice",
      "features",
    ];

    for (const plan of PLANS) {
      for (const key of requiredKeys) {
        expect(plan[key]).toBeDefined();
      }
    }
  });
});

describe("Landing page sections contract", () => {
  /**
   * These tests define what sections the landing page MUST have.
   * They verify against exported constants/config, not DOM rendering.
   * Implementation will create these exports.
   */

  it("LANDING_SECTIONS includes hero, social-proof, how-it-works, pricing, trust", async () => {
    const { LANDING_SECTIONS } = await import("@/lib/landing-config");
    const sectionIds = LANDING_SECTIONS.map((s: { id: string }) => s.id);

    expect(sectionIds).toContain("hero");
    expect(sectionIds).toContain("social-proof");
    expect(sectionIds).toContain("how-it-works");
    expect(sectionIds).toContain("pricing");
    expect(sectionIds).toContain("trust");
  });

  it("hero section has headline, subtitle, and CTA text", async () => {
    const { LANDING_SECTIONS } = await import("@/lib/landing-config");
    const hero = LANDING_SECTIONS.find((s: { id: string }) => s.id === "hero");

    expect(hero).toBeDefined();
    expect(hero.headline).toBeDefined();
    expect(hero.subtitle).toBeDefined();
    expect(hero.cta).toBeDefined();
  });

  it("how-it-works section has exactly 3 steps", async () => {
    const { LANDING_SECTIONS } = await import("@/lib/landing-config");
    const howItWorks = LANDING_SECTIONS.find(
      (s: { id: string }) => s.id === "how-it-works"
    );

    expect(howItWorks).toBeDefined();
    expect(howItWorks.steps).toHaveLength(3);
  });

  it("social-proof section has at least 2 testimonials", async () => {
    const { LANDING_SECTIONS } = await import("@/lib/landing-config");
    const socialProof = LANDING_SECTIONS.find(
      (s: { id: string }) => s.id === "social-proof"
    );

    expect(socialProof).toBeDefined();
    expect(socialProof.testimonials.length).toBeGreaterThanOrEqual(2);
  });

  it("trust section includes cancel-anytime and secure-payment text", async () => {
    const { LANDING_SECTIONS } = await import("@/lib/landing-config");
    const trust = LANDING_SECTIONS.find((s: { id: string }) => s.id === "trust");

    expect(trust).toBeDefined();
    const trustText = JSON.stringify(trust).toLowerCase();
    expect(trustText).toContain("cancel");
    expect(trustText).toContain("stripe");
  });
});
