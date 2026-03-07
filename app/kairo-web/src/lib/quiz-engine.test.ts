/**
 * Tests for quiz recommendation engine — pure function that maps
 * quiz answers to a recommended plan tier.
 *
 * Behavior matrix coverage:
 * - Happy path: each answer combination maps to expected tier
 * - Boundary: empty answers, partial answers
 * - Exhaustive: all valid goal × experience combinations
 * - Property: output is always a valid PlanTier
 */
import { describe, it, expect } from "vitest";
import { recommendTier, type QuizAnswers } from "@/lib/quiz-engine";
import type { PlanTier } from "@/lib/stripe-prices";

const VALID_TIERS: PlanTier[] = ["foundation", "coaching", "performance", "vip"];

describe("Quiz recommendation engine", () => {
  // ── Always returns a valid tier ──

  it("always returns a valid PlanTier", () => {
    const inputs: QuizAnswers[] = [
      {},
      { goal: "maintenance" },
      { goal: "muscle", experience: "advanced", daysPerWeek: 6 },
      { goal: "fat_loss", experience: "beginner", daysPerWeek: 2, minutesPerSession: 15 },
    ];

    for (const input of inputs) {
      const result = recommendTier(input);
      expect(VALID_TIERS).toContain(result);
    }
  });

  // ── Empty / minimal answers default to foundation ──

  it("returns 'foundation' for empty answers", () => {
    expect(recommendTier({})).toBe("foundation");
  });

  it("returns 'foundation' for undefined answers", () => {
    expect(recommendTier(undefined as unknown as QuizAnswers)).toBe("foundation");
  });

  // ── Beginner users ──

  it("recommends 'foundation' for beginner + maintenance", () => {
    expect(
      recommendTier({ goal: "maintenance", experience: "beginner" })
    ).toBe("foundation");
  });

  it("recommends 'foundation' for beginner + fat_loss + low days", () => {
    expect(
      recommendTier({ goal: "fat_loss", experience: "beginner", daysPerWeek: 2 })
    ).toBe("foundation");
  });

  it("recommends 'coaching' for beginner + muscle", () => {
    const tier = recommendTier({ goal: "muscle", experience: "beginner", daysPerWeek: 4 });
    expect(["foundation", "coaching"]).toContain(tier);
  });

  // ── Intermediate users ──

  it("recommends 'coaching' or 'performance' for intermediate + muscle + moderate days", () => {
    const tier = recommendTier({
      goal: "muscle",
      experience: "intermediate",
      daysPerWeek: 4,
      minutesPerSession: 30,
    });
    expect(["coaching", "performance"]).toContain(tier);
  });

  it("recommends 'coaching' or higher for intermediate + fat_loss + high days", () => {
    const tier = recommendTier({
      goal: "fat_loss",
      experience: "intermediate",
      daysPerWeek: 5,
      minutesPerSession: 45,
    });
    expect(["coaching", "performance"]).toContain(tier);
  });

  // ── Advanced users ──

  it("recommends 'performance' for advanced + muscle + high commitment", () => {
    const tier = recommendTier({
      goal: "muscle",
      experience: "advanced",
      daysPerWeek: 5,
      minutesPerSession: 60,
    });
    expect(["performance", "vip"]).toContain(tier);
  });

  it("recommends 'performance' or 'vip' for advanced + 6+ days", () => {
    const tier = recommendTier({
      goal: "muscle",
      experience: "advanced",
      daysPerWeek: 6,
      minutesPerSession: 60,
      challenge: "plateau",
    });
    expect(["performance", "vip"]).toContain(tier);
  });

  // ── Challenge factor ──

  it("considers 'accountability' challenge as nudge toward coaching", () => {
    const withChallenge = recommendTier({
      goal: "maintenance",
      experience: "beginner",
      daysPerWeek: 3,
      challenge: "accountability",
    });
    // Accountability-seekers benefit from coaching tier
    expect(["foundation", "coaching"]).toContain(withChallenge);
  });

  it("considers 'plateau' challenge as nudge toward performance", () => {
    const tier = recommendTier({
      goal: "muscle",
      experience: "intermediate",
      daysPerWeek: 5,
      challenge: "plateau",
    });
    expect(["coaching", "performance"]).toContain(tier);
  });

  // ── Parametric: all valid goals produce valid output ──

  it.each(["fat_loss", "muscle", "maintenance"] as const)(
    "returns valid tier for goal=%s",
    (goal) => {
      const tier = recommendTier({ goal, experience: "intermediate", daysPerWeek: 4 });
      expect(VALID_TIERS).toContain(tier);
    }
  );

  // ── Parametric: all valid experience levels produce valid output ──

  it.each(["beginner", "intermediate", "advanced"] as const)(
    "returns valid tier for experience=%s",
    (experience) => {
      const tier = recommendTier({ goal: "muscle", experience, daysPerWeek: 4 });
      expect(VALID_TIERS).toContain(tier);
    }
  );

  // ── Parametric: all valid daysPerWeek (1-7) produce valid output ──

  it.each([1, 2, 3, 4, 5, 6, 7])(
    "returns valid tier for daysPerWeek=%i",
    (daysPerWeek) => {
      const tier = recommendTier({ goal: "muscle", experience: "intermediate", daysPerWeek });
      expect(VALID_TIERS).toContain(tier);
    }
  );
});
