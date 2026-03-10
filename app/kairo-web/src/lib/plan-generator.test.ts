import { describe, it, expect } from "vitest";
import { generatePlan } from "./plan-generator";
import type { NormalizedConstraints } from "./constraints";
import type { DailyPlan } from "./plan-types";

// ── Helpers ──

function makeConstraints(
  overrides: Partial<NormalizedConstraints> = {}
): NormalizedConstraints {
  return {
    timeAvailable: 30,
    equipment: "full_gym",
    context: { travelMode: false, highStress: false, lowSleep: false },
    preferences: { goal: "fat_loss", experience: "intermediate" },
    optional: { injuryLimitation: null, noJumping: false },
    ...overrides,
  };
}

// ────────────────────────────────────────────────
//  1. Core plan generation
// ────────────────────────────────────────────────

describe("generatePlan — core", () => {
  it("returns a valid DailyPlan shape", () => {
    const plan = generatePlan(makeConstraints());
    expect(plan).toHaveProperty("date");
    expect(plan).toHaveProperty("mode");
    expect(plan).toHaveProperty("workouts");
    expect(plan).toHaveProperty("nutrition");
    expect(plan).toHaveProperty("constraints");
  });

  it("returns at least 2 workout alternatives", () => {
    const plan = generatePlan(makeConstraints());
    expect(plan.workouts.length).toBeGreaterThanOrEqual(2);
  });

  it("each workout has required fields", () => {
    const plan = generatePlan(makeConstraints());
    for (const w of plan.workouts) {
      expect(w).toHaveProperty("id");
      expect(w).toHaveProperty("name");
      expect(w).toHaveProperty("duration");
      expect(w).toHaveProperty("equipment");
      expect(w).toHaveProperty("mode");
      expect(w).toHaveProperty("description");
      expect(w).toHaveProperty("exercises");
      expect(w.exercises.length).toBeGreaterThan(0);
    }
  });

  it("includes nutrition plan with proteinGoal", () => {
    const plan = generatePlan(makeConstraints());
    expect(plan.nutrition.proteinGoal).toBeGreaterThan(0);
    expect(plan.nutrition.calorieEstimate).toBeGreaterThan(0);
    expect(plan.nutrition.waterGoalLiters).toBeGreaterThan(0);
  });

  it("includes the original constraints in the output", () => {
    const constraints = makeConstraints();
    const plan = generatePlan(constraints);
    expect(plan.constraints).toEqual(constraints);
  });
});

// ────────────────────────────────────────────────
//  2. Equipment constraints
// ────────────────────────────────────────────────

describe("generatePlan — equipment constraints", () => {
  it("workout with 'none' equipment has no gym exercises", () => {
    const plan = generatePlan(
      makeConstraints({ equipment: "none" })
    );
    for (const w of plan.workouts) {
      expect(w.equipment).toBe("none");
    }
  });

  it("workout with 'dumbbells' uses only none/dumbbells exercises", () => {
    const plan = generatePlan(
      makeConstraints({ equipment: "dumbbells" })
    );
    for (const w of plan.workouts) {
      expect(["none", "dumbbells"]).toContain(w.equipment);
    }
  });
});

// ────────────────────────────────────────────────
//  3. Time constraints
// ────────────────────────────────────────────────

describe("generatePlan — time constraints", () => {
  it("workout duration does not exceed timeAvailable", () => {
    const plan = generatePlan(makeConstraints({ timeAvailable: 15 }));
    for (const w of plan.workouts) {
      expect(w.duration).toBeLessThanOrEqual(15);
    }
  });

  it("30-min time slot produces workouts ≤ 30 min", () => {
    const plan = generatePlan(makeConstraints({ timeAvailable: 30 }));
    for (const w of plan.workouts) {
      expect(w.duration).toBeLessThanOrEqual(30);
    }
  });

  it("60-min time slot produces longer workouts than 15-min slot", () => {
    const short = generatePlan(makeConstraints({ timeAvailable: 15 }));
    const long = generatePlan(makeConstraints({ timeAvailable: 60 }));
    const avgShort =
      short.workouts.reduce((s, w) => s + w.duration, 0) / short.workouts.length;
    const avgLong =
      long.workouts.reduce((s, w) => s + w.duration, 0) / long.workouts.length;
    expect(avgLong).toBeGreaterThan(avgShort);
  });
});

// ────────────────────────────────────────────────
//  4. Context-based mode detection
// ────────────────────────────────────────────────

describe("generatePlan — mode detection", () => {
  it("sets mode to 'travel' when travelMode is true", () => {
    const plan = generatePlan(
      makeConstraints({ context: { travelMode: true, highStress: false, lowSleep: false } })
    );
    expect(plan.mode).toBe("travel");
  });

  it("sets mode to 'recovery' when lowSleep is true", () => {
    const plan = generatePlan(
      makeConstraints({ context: { travelMode: false, highStress: false, lowSleep: true } })
    );
    expect(plan.mode).toBe("recovery");
  });

  it("sets mode to 'recovery' when highStress is true", () => {
    const plan = generatePlan(
      makeConstraints({ context: { travelMode: false, highStress: true, lowSleep: false } })
    );
    expect(plan.mode).toBe("recovery");
  });

  it("sets mode to 'normal' with no context triggers", () => {
    const plan = generatePlan(makeConstraints());
    expect(plan.mode).toBe("normal");
  });

  it("travel mode takes priority over recovery triggers", () => {
    const plan = generatePlan(
      makeConstraints({
        context: { travelMode: true, highStress: true, lowSleep: true },
      })
    );
    expect(plan.mode).toBe("travel");
  });
});

// ────────────────────────────────────────────────
//  5. Goal-based adjustments
// ────────────────────────────────────────────────

describe("generatePlan — goal adjustments", () => {
  it("fat_loss sets higher protein target", () => {
    const fatLoss = generatePlan(
      makeConstraints({ preferences: { goal: "fat_loss", experience: "intermediate" } })
    );
    const maintain = generatePlan(
      makeConstraints({
        preferences: { goal: "maintenance", experience: "intermediate" },
      })
    );
    expect(fatLoss.nutrition.proteinGoal).toBeGreaterThanOrEqual(
      maintain.nutrition.proteinGoal
    );
  });

  it("muscle goal sets higher calorie estimate", () => {
    const muscle = generatePlan(
      makeConstraints({ preferences: { goal: "muscle", experience: "intermediate" } })
    );
    const maintain = generatePlan(
      makeConstraints({
        preferences: { goal: "maintenance", experience: "intermediate" },
      })
    );
    expect(muscle.nutrition.calorieEstimate).toBeGreaterThan(
      maintain.nutrition.calorieEstimate
    );
  });
});

// ────────────────────────────────────────────────
//  6. Experience-based adjustments
// ────────────────────────────────────────────────

describe("generatePlan — experience", () => {
  it("beginner gets fewer total exercises than intermediate", () => {
    const beginner = generatePlan(
      makeConstraints({
        preferences: { goal: "fat_loss", experience: "beginner" },
        timeAvailable: 45,
      })
    );
    const intermediate = generatePlan(
      makeConstraints({
        preferences: { goal: "fat_loss", experience: "intermediate" },
        timeAvailable: 45,
      })
    );
    const beginnerTotal = beginner.workouts[0].exercises.length;
    const intermediateTotal = intermediate.workouts[0].exercises.length;
    expect(beginnerTotal).toBeLessThanOrEqual(intermediateTotal);
  });
});

// ────────────────────────────────────────────────
//  7. Optional constraints
// ────────────────────────────────────────────────

describe("generatePlan — optional constraints", () => {
  it("noJumping excludes jumping exercises", () => {
    const plan = generatePlan(
      makeConstraints({
        optional: { injuryLimitation: null, noJumping: true },
      })
    );
    for (const w of plan.workouts) {
      for (const ex of w.exercises) {
        expect(ex.name.toLowerCase()).not.toContain("jump");
      }
    }
  });
});

// ────────────────────────────────────────────────
//  8. Determinism and performance
// ────────────────────────────────────────────────

describe("generatePlan — determinism & performance", () => {
  it("produces the same output for the same input", () => {
    const constraints = makeConstraints();
    const plan1 = generatePlan(constraints);
    const plan2 = generatePlan(constraints);
    // Plans should be structurally identical except possibly date
    expect(plan1.workouts).toEqual(plan2.workouts);
    expect(plan1.nutrition).toEqual(plan2.nutrition);
    expect(plan1.mode).toBe(plan2.mode);
  });

  it("generates a plan in under 100ms", () => {
    const start = performance.now();
    generatePlan(makeConstraints());
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

// ────────────────────────────────────────────────
//  9. Edge cases
// ────────────────────────────────────────────────

describe("generatePlan — edge cases", () => {
  it("handles 15-min full_gym without error", () => {
    const plan = generatePlan(
      makeConstraints({ timeAvailable: 15, equipment: "full_gym" })
    );
    expect(plan.workouts.length).toBeGreaterThanOrEqual(2);
  });

  it("handles 60-min none equipment without error", () => {
    const plan = generatePlan(
      makeConstraints({ timeAvailable: 60, equipment: "none" })
    );
    expect(plan.workouts.length).toBeGreaterThanOrEqual(2);
  });

  it("handles all context toggles active simultaneously", () => {
    const plan = generatePlan(
      makeConstraints({
        context: { travelMode: true, highStress: true, lowSleep: true },
      })
    );
    expect(plan.workouts.length).toBeGreaterThanOrEqual(2);
  });

  it("handles injury + noJumping combined", () => {
    const plan = generatePlan(
      makeConstraints({
        optional: { injuryLimitation: "bad knee", noJumping: true },
        equipment: "none",
      })
    );
    expect(plan.workouts.length).toBeGreaterThanOrEqual(2);
    for (const w of plan.workouts) {
      for (const ex of w.exercises) {
        expect(ex.name.toLowerCase()).not.toContain("jump");
      }
    }
  });
});
