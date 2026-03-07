/**
 * Tests for nurture email templates — pure data, no side effects.
 *
 * Coverage:
 * - Happy path: each step returns personalized email content
 * - Boundary: invalid steps return null
 * - Personalization: goal and tier affect content
 * - Unsubscribe links present in every email
 */
import { describe, it, expect } from "vitest";
import {
  getNurtureEmail,
  NURTURE_TOTAL_STEPS,
  NURTURE_DELAY_HOURS,
  type NurtureContext,
} from "@/lib/nurture-emails";

const baseCtx: NurtureContext = {
  email: "test@example.com",
  recommendedTier: "coaching",
  goal: "fat_loss",
  appUrl: "https://kairo.app",
};

describe("getNurtureEmail", () => {
  // ── Valid steps produce emails ──
  it.each([1, 2, 3, 4])("returns an email for step %i", (step) => {
    const result = getNurtureEmail(step, baseCtx);
    expect(result).not.toBeNull();
    expect(result!.subject).toBeTruthy();
    expect(result!.html).toBeTruthy();
  });

  // ── Invalid steps return null ──
  it.each([0, 5, -1, 100])("returns null for invalid step %i", (step) => {
    expect(getNurtureEmail(step, baseCtx)).toBeNull();
  });

  // ── Personalization: tier name appears ──
  it("includes the tier name in step 1 email", () => {
    const result = getNurtureEmail(1, baseCtx);
    expect(result!.html).toContain("Coaching");
  });

  it("falls back to Foundation when tier is null", () => {
    const ctx = { ...baseCtx, recommendedTier: null };
    const result = getNurtureEmail(1, ctx);
    expect(result!.html).toContain("Foundation");
  });

  // ── Personalization: goal affects content ──
  it("includes fat_loss-specific tip in step 1", () => {
    const result = getNurtureEmail(1, { ...baseCtx, goal: "fat_loss" });
    expect(result!.html).toContain("protein");
  });

  it("includes muscle-specific tip in step 1", () => {
    const result = getNurtureEmail(1, { ...baseCtx, goal: "muscle" });
    expect(result!.html).toContain("progressive overload");
  });

  it("uses default tip when goal is null", () => {
    const result = getNurtureEmail(1, { ...baseCtx, goal: null });
    expect(result!.html).toContain("calendar");
  });

  // ── Unsubscribe link in every email ──
  it.each([1, 2, 3, 4])(
    "includes unsubscribe link in step %i",
    (step) => {
      const result = getNurtureEmail(step, baseCtx);
      expect(result!.html).toContain("Unsubscribe");
      expect(result!.html).toContain("/api/nurture/unsubscribe");
      expect(result!.html).toContain(
        encodeURIComponent("test@example.com")
      );
    }
  );

  // ── Result URL includes tier ──
  it("includes result page link with tier query param", () => {
    const result = getNurtureEmail(1, baseCtx);
    expect(result!.html).toContain("/quiz/result?tier=coaching");
  });

  it("omits tier query param when tier is null", () => {
    const result = getNurtureEmail(1, { ...baseCtx, recommendedTier: null });
    expect(result!.html).toContain("/quiz/result");
    expect(result!.html).not.toContain("?tier=null");
  });

  // ── Step 4 is the final email ──
  it("step 4 mentions it is the last email", () => {
    const result = getNurtureEmail(4, baseCtx);
    expect(result!.html).toContain("last email");
  });
});

describe("NURTURE_TOTAL_STEPS", () => {
  it("equals 4", () => {
    expect(NURTURE_TOTAL_STEPS).toBe(4);
  });
});

describe("NURTURE_DELAY_HOURS", () => {
  it("step 1 delay is 24 hours", () => {
    expect(NURTURE_DELAY_HOURS[1]).toBe(24);
  });

  it("step 2 delay is 48 hours", () => {
    expect(NURTURE_DELAY_HOURS[2]).toBe(48);
  });

  it("step 3 delay is 48 hours", () => {
    expect(NURTURE_DELAY_HOURS[3]).toBe(48);
  });

  it("step 4 delay is 48 hours", () => {
    expect(NURTURE_DELAY_HOURS[4]).toBe(48);
  });
});
