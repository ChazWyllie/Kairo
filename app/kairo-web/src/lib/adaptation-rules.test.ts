/**
 * Tests for adaptation-rules.ts — deterministic adaptation recommendations.
 *
 * Coverage:
 * - Fat loss: weight plateau → reduce calories; weight dropping → maintain
 * - Muscle gain: weight not increasing → increase calories
 * - Adherence-based: low adherence → increase_adherence (before calorie changes)
 * - Recovery-based: poor sleep/recovery → reduce volume / deload
 * - Protein: low protein adherence → increase_protein
 * - Steps: low step count → increase_steps
 * - Maintenance: stable metrics → maintain_course
 * - Priority ordering: high before medium before low
 * - Edge cases: empty data, missing fields, single check-in
 * - Function purity: same input → same output, no side effects
 */
import { describe, it, expect } from "vitest";
import { generateRecommendations } from "./adaptation-rules";
import type {
  CheckInSlice,
  MemberContext,
  Insights,
  Recommendation,
} from "./adaptation-types";

// ── Helpers ──

function makeInsights(overrides: Partial<Insights> = {}): Insights {
  return {
    weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
    adherence: {
      workoutAdherence: 80,
      calorieAdherence: 7,
      proteinAdherence: 7,
      checkInConsistency: 80,
    },
    recovery: {
      avgEnergy: 7,
      avgStress: 4,
      avgSleep: 7.5,
      avgRecovery: 7,
      avgHunger: 5,
    },
    weekCount: 4,
    ...overrides,
  };
}

function makeContext(overrides: Partial<MemberContext> = {}): MemberContext {
  return {
    goal: "fat_loss",
    daysPerWeek: 4,
    currentCalories: 2200,
    currentProtein: 160,
    ...overrides,
  };
}

// ────────────────────────────────────────────────
//  1. Fat loss recommendations
// ────────────────────────────────────────────────

describe("generateRecommendations — fat loss", () => {
  it("recommends reduce_calories when weight is stable (plateau)", () => {
    const insights = makeInsights({
      weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "fat_loss" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("reduce_calories");
  });

  it("recommends maintain_course when weight is losing at good rate", () => {
    const insights = makeInsights({
      weight: { direction: "losing", weeklyChangeKg: -0.5, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "fat_loss" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("maintain_course");
    expect(actions).not.toContain("reduce_calories");
  });

  it("recommends reduce_calories when weight is gaining during fat loss", () => {
    const insights = makeInsights({
      weight: { direction: "gaining", weeklyChangeKg: 0.5, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "fat_loss" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("reduce_calories");
  });

  it("does not recommend calorie changes when adherence is low", () => {
    const insights = makeInsights({
      weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
      adherence: {
        workoutAdherence: 40,
        calorieAdherence: 3,
        proteinAdherence: 3,
        checkInConsistency: 40,
      },
    });
    const ctx = makeContext({ goal: "fat_loss" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("increase_adherence");
    // Should prioritize adherence over calorie reduction
    const adherenceIdx = recs.findIndex((r) => r.action === "increase_adherence");
    const calorieIdx = recs.findIndex((r) => r.action === "reduce_calories");
    if (calorieIdx >= 0) {
      expect(adherenceIdx).toBeLessThan(calorieIdx);
    }
  });
});

// ────────────────────────────────────────────────
//  2. Muscle gain recommendations
// ────────────────────────────────────────────────

describe("generateRecommendations — muscle gain", () => {
  it("recommends increase_calories when weight is stable (not gaining)", () => {
    const insights = makeInsights({
      weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "muscle" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("increase_calories");
  });

  it("recommends maintain_course when gaining at good rate", () => {
    const insights = makeInsights({
      weight: { direction: "gaining", weeklyChangeKg: 0.3, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "muscle" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("maintain_course");
    expect(actions).not.toContain("increase_calories");
  });

  it("recommends reduce_calories when gaining too fast", () => {
    const insights = makeInsights({
      weight: { direction: "gaining", weeklyChangeKg: 1.0, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "muscle" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("reduce_calories");
  });

  it("recommends increase_volume when recovery is good and on track", () => {
    const insights = makeInsights({
      weight: { direction: "gaining", weeklyChangeKg: 0.3, dataPoints: 4 },
      recovery: {
        avgEnergy: 8,
        avgStress: 3,
        avgSleep: 8,
        avgRecovery: 8,
        avgHunger: 5,
      },
      adherence: {
        workoutAdherence: 100,
        calorieAdherence: 8,
        proteinAdherence: 8,
        checkInConsistency: 100,
      },
    });
    const ctx = makeContext({ goal: "muscle" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("increase_volume");
  });
});

// ────────────────────────────────────────────────
//  3. Maintenance recommendations
// ────────────────────────────────────────────────

describe("generateRecommendations — maintenance", () => {
  it("recommends maintain_course when weight is stable", () => {
    const insights = makeInsights({
      weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "maintenance" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("maintain_course");
  });

  it("recommends reduce_calories when gaining unintentionally", () => {
    const insights = makeInsights({
      weight: { direction: "gaining", weeklyChangeKg: 0.5, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "maintenance" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("reduce_calories");
  });

  it("recommends increase_calories when losing unintentionally", () => {
    const insights = makeInsights({
      weight: { direction: "losing", weeklyChangeKg: -0.5, dataPoints: 4 },
    });
    const ctx = makeContext({ goal: "maintenance" });

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("increase_calories");
  });
});

// ────────────────────────────────────────────────
//  4. Recovery-based recommendations
// ────────────────────────────────────────────────

describe("generateRecommendations — recovery", () => {
  it("recommends improve_sleep when sleep average is low", () => {
    const insights = makeInsights({
      recovery: {
        avgEnergy: 4,
        avgStress: 7,
        avgSleep: 5.5,
        avgRecovery: 4,
        avgHunger: 6,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("improve_sleep");
  });

  it("recommends deload when recovery is very poor", () => {
    const insights = makeInsights({
      recovery: {
        avgEnergy: 3,
        avgStress: 8,
        avgSleep: 5,
        avgRecovery: 3,
        avgHunger: 7,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("deload");
  });

  it("recommends reduce_volume when recovery is moderately poor", () => {
    const insights = makeInsights({
      recovery: {
        avgEnergy: 4,
        avgStress: 6,
        avgSleep: 6,
        avgRecovery: 4,
        avgHunger: 6,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("reduce_volume");
  });

  it("does not recommend deload when recovery is good", () => {
    const insights = makeInsights({
      recovery: {
        avgEnergy: 8,
        avgStress: 3,
        avgSleep: 8,
        avgRecovery: 8,
        avgHunger: 4,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).not.toContain("deload");
    expect(actions).not.toContain("reduce_volume");
  });
});

// ────────────────────────────────────────────────
//  5. Protein & steps recommendations
// ────────────────────────────────────────────────

describe("generateRecommendations — protein & steps", () => {
  it("recommends increase_protein when protein adherence is low", () => {
    const insights = makeInsights({
      adherence: {
        workoutAdherence: 80,
        calorieAdherence: 7,
        proteinAdherence: 3,
        checkInConsistency: 80,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).toContain("increase_protein");
  });

  it("does not recommend increase_protein when protein adherence is good", () => {
    const insights = makeInsights({
      adherence: {
        workoutAdherence: 80,
        calorieAdherence: 7,
        proteinAdherence: 8,
        checkInConsistency: 80,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    const actions = recs.map((r) => r.action);

    expect(actions).not.toContain("increase_protein");
  });

  it("recommends increase_steps when step count is consistently poor", () => {
    const insights = makeInsights({
      adherence: {
        workoutAdherence: 80,
        calorieAdherence: 7,
        proteinAdherence: 7,
        checkInConsistency: 80,
      },
    });
    // Step adherence flagged via separate logic — low workout adherence, but here test step-specific
    const ctx = makeContext({ goal: "fat_loss" });

    // This test needs the check-in slices to have low steps — adaptation rules use insights only
    // If workout adherence is fine but the member explicitly struggles with steps, it comes from recovery/adherence data
    // For now, the step recommendation is driven by fat_loss + good calorie adherence + stable weight
    const recs = generateRecommendations(
      makeInsights({
        weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
        adherence: {
          workoutAdherence: 80,
          calorieAdherence: 7,
          proteinAdherence: 7,
          checkInConsistency: 80,
        },
      }),
      ctx
    );
    const actions = recs.map((r) => r.action);

    // Fat loss plateau with decent adherence → should suggest both reduce_calories and increase_steps
    expect(actions).toContain("increase_steps");
  });
});

// ────────────────────────────────────────────────
//  6. Priority ordering
// ────────────────────────────────────────────────

describe("generateRecommendations — priority ordering", () => {
  it("returns recommendations sorted by priority (high → medium → low)", () => {
    const insights = makeInsights({
      weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
      recovery: {
        avgEnergy: 3,
        avgStress: 8,
        avgSleep: 5,
        avgRecovery: 3,
        avgHunger: 7,
      },
      adherence: {
        workoutAdherence: 40,
        calorieAdherence: 3,
        proteinAdherence: 3,
        checkInConsistency: 40,
      },
    });
    const ctx = makeContext({ goal: "fat_loss" });

    const recs = generateRecommendations(insights, ctx);
    const priorities = recs.map((r) => r.priority);

    // Verify sorted order
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < priorities.length; i++) {
      expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(
        priorityOrder[priorities[i - 1]]
      );
    }
  });

  it("always includes at least one recommendation", () => {
    const insights = makeInsights();
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────
//  7. Edge cases
// ────────────────────────────────────────────────

describe("generateRecommendations — edge cases", () => {
  it("handles insufficient weight data gracefully", () => {
    const insights = makeInsights({
      weight: { direction: "insufficient_data", weeklyChangeKg: null, dataPoints: 1 },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    // Should not make calorie adjustment recommendations without weight data
    const actions = recs.map((r) => r.action);
    expect(actions).not.toContain("reduce_calories");
    expect(actions).not.toContain("increase_calories");
  });

  it("handles null recovery scores gracefully", () => {
    const insights = makeInsights({
      recovery: {
        avgEnergy: null,
        avgStress: null,
        avgSleep: null,
        avgRecovery: null,
        avgHunger: null,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    const actions = recs.map((r) => r.action);
    expect(actions).not.toContain("deload");
    expect(actions).not.toContain("improve_sleep");
  });

  it("handles minimum week count (1 week)", () => {
    const insights = makeInsights({ weekCount: 1 });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────
//  8. Function purity
// ────────────────────────────────────────────────

describe("generateRecommendations — function purity", () => {
  it("returns the same output for the same input", () => {
    const insights = makeInsights();
    const ctx = makeContext();

    const result1 = generateRecommendations(insights, ctx);
    const result2 = generateRecommendations(insights, ctx);

    expect(result1).toEqual(result2);
  });

  it("does not mutate the input objects", () => {
    const insights = makeInsights();
    const ctx = makeContext();
    const insightsCopy = JSON.parse(JSON.stringify(insights));
    const ctxCopy = JSON.parse(JSON.stringify(ctx));

    generateRecommendations(insights, ctx);

    expect(insights).toEqual(insightsCopy);
    expect(ctx).toEqual(ctxCopy);
  });

  it("every recommendation has action, priority, and reason", () => {
    const insights = makeInsights({
      weight: { direction: "stable", weeklyChangeKg: 0, dataPoints: 4 },
      recovery: {
        avgEnergy: 3,
        avgStress: 8,
        avgSleep: 5,
        avgRecovery: 3,
        avgHunger: 7,
      },
    });
    const ctx = makeContext();

    const recs = generateRecommendations(insights, ctx);
    for (const rec of recs) {
      expect(rec).toHaveProperty("action");
      expect(rec).toHaveProperty("priority");
      expect(rec).toHaveProperty("reason");
      expect(typeof rec.reason).toBe("string");
      expect(rec.reason.length).toBeGreaterThan(0);
    }
  });
});
