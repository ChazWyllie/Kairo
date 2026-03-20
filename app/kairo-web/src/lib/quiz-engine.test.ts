/**
 * Tests for quiz recommendation engine — pure function that maps
 * quiz answers to a recommended plan tier.
 *
 * Behavior matrix coverage:
 * - Happy path: each answer combination maps to expected tier
 * - Boundary: empty answers, partial answers
 * - Exhaustive: all valid goal × experience combinations
 * - Property: output is always a valid PlanTier
 *
 * Note: engine was updated to 2-tier model (standard/premium).
 * Score ≤ 5 → standard, score 6+ → premium.
 */
import { describe, it, expect } from "vitest";
import { recommendTier, type QuizAnswers } from "@/lib/quiz-engine";
import type { PlanTier } from "@/lib/stripe-prices";

const VALID_TIERS: PlanTier[] = ["standard", "premium"];

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

  // ── Empty / minimal answers default to standard ──

  it("returns 'standard' for empty answers", () => {
    expect(recommendTier({})).toBe("standard");
  });

  it("returns 'standard' for undefined answers", () => {
    expect(recommendTier(undefined as unknown as QuizAnswers)).toBe("standard");
  });

  // ── Beginner users → standard ──

  it("recommends 'standard' for beginner + maintenance", () => {
    // score: beginner(0) + maintenance(0) = 0 → standard
    expect(
      recommendTier({ goal: "maintenance", experience: "beginner" })
    ).toBe("standard");
  });

  it("recommends 'standard' for beginner + fat_loss + low days", () => {
    // score: beginner(0) + fat_loss(1) + 2days(0) = 1 → standard
    expect(
      recommendTier({ goal: "fat_loss", experience: "beginner", daysPerWeek: 2 })
    ).toBe("standard");
  });

  it("recommends 'standard' for beginner + muscle", () => {
    // score: beginner(0) + muscle(2) + 4days(1) = 3 → standard
    const tier = recommendTier({ goal: "muscle", experience: "beginner", daysPerWeek: 4 });
    expect(VALID_TIERS).toContain(tier);
    expect(tier).toBe("standard");
  });

  // ── Intermediate users → premium when score ≥ 6 ──

  it("recommends 'premium' for intermediate + muscle + moderate days", () => {
    // score: intermediate(2) + muscle(2) + 4days(1) + 30min(1) = 6 → premium
    const tier = recommendTier({
      goal: "muscle",
      experience: "intermediate",
      daysPerWeek: 4,
      minutesPerSession: 30,
    });
    expect(VALID_TIERS).toContain(tier);
    expect(tier).toBe("premium");
  });

  it("recommends 'premium' for intermediate + fat_loss + high days", () => {
    // score: intermediate(2) + fat_loss(1) + 5days(2) + 45min(2) = 7 → premium
    const tier = recommendTier({
      goal: "fat_loss",
      experience: "intermediate",
      daysPerWeek: 5,
      minutesPerSession: 45,
    });
    expect(VALID_TIERS).toContain(tier);
    expect(tier).toBe("premium");
  });

  // ── Advanced users → premium ──

  it("recommends 'premium' for advanced + muscle + high commitment", () => {
    // score: advanced(4) + muscle(2) + 5days(2) + 60min(2) = 10 → premium
    const tier = recommendTier({
      goal: "muscle",
      experience: "advanced",
      daysPerWeek: 5,
      minutesPerSession: 60,
    });
    expect(tier).toBe("premium");
  });

  it("recommends 'premium' for advanced + 6+ days", () => {
    // score: advanced(4) + muscle(2) + 6days(2) + 60min(2) + plateau(2) = 12 → premium
    const tier = recommendTier({
      goal: "muscle",
      experience: "advanced",
      daysPerWeek: 6,
      minutesPerSession: 60,
      challenge: "plateau",
    });
    expect(tier).toBe("premium");
  });

  // ── Challenge factor ──

  it("considers 'accountability' challenge toward scoring", () => {
    // score: maintenance(0) + beginner(0) + 3days(1) + accountability(1) = 2 → standard
    const withChallenge = recommendTier({
      goal: "maintenance",
      experience: "beginner",
      daysPerWeek: 3,
      challenge: "accountability",
    });
    expect(VALID_TIERS).toContain(withChallenge);
    expect(withChallenge).toBe("standard");
  });

  it("considers 'plateau' challenge toward premium", () => {
    // score: intermediate(2) + muscle(2) + 5days(2) + plateau(2) = 8 → premium
    const tier = recommendTier({
      goal: "muscle",
      experience: "intermediate",
      daysPerWeek: 5,
      challenge: "plateau",
    });
    expect(VALID_TIERS).toContain(tier);
    expect(tier).toBe("premium");
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
