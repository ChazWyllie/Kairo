import { describe, it, expect } from "vitest";
import { exercises, getExercisesByEquipment, getExercisesByMuscleGroup } from "./exercise-catalog";
import type { EquipmentLevel, Exercise } from "../lib/plan-types";

// ────────────────────────────────────────────────
//  1. Catalog structure validation
// ────────────────────────────────────────────────

describe("exercise-catalog — structure", () => {
  it("exports a non-empty exercises array", () => {
    expect(Array.isArray(exercises)).toBe(true);
    expect(exercises.length).toBeGreaterThan(0);
  });

  it("every exercise has required fields", () => {
    for (const ex of exercises) {
      expect(ex).toHaveProperty("id");
      expect(ex).toHaveProperty("name");
      expect(ex).toHaveProperty("muscleGroup");
      expect(ex).toHaveProperty("equipmentRequired");
      expect(ex).toHaveProperty("sets");
      expect(ex).toHaveProperty("reps");
      expect(ex).toHaveProperty("restSeconds");
      expect(ex).toHaveProperty("durationMinutes");
      expect(ex).toHaveProperty("isCompound");
    }
  });

  it("every exercise has a unique id", () => {
    const ids = exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every exercise has positive sets and restSeconds", () => {
    for (const ex of exercises) {
      expect(ex.sets).toBeGreaterThan(0);
      expect(ex.restSeconds).toBeGreaterThanOrEqual(0);
      expect(ex.durationMinutes).toBeGreaterThan(0);
    }
  });

  it("exercises cover all equipment levels", () => {
    const levels = new Set(exercises.map((e) => e.equipmentRequired));
    expect(levels).toContain("none");
    expect(levels).toContain("dumbbells");
    expect(levels).toContain("full_gym");
  });

  it("has at least 5 bodyweight (none) exercises", () => {
    const bodyweight = exercises.filter((e) => e.equipmentRequired === "none");
    expect(bodyweight.length).toBeGreaterThanOrEqual(5);
  });

  it("noJumpingAlternative references a valid exercise id when present", () => {
    const ids = new Set(exercises.map((e) => e.id));
    for (const ex of exercises) {
      if (ex.noJumpingAlternative) {
        expect(ids).toContain(ex.noJumpingAlternative);
      }
    }
  });
});

// ────────────────────────────────────────────────
//  2. Filtering functions
// ────────────────────────────────────────────────

describe("getExercisesByEquipment", () => {
  it("returns only exercises available with 'none' equipment", () => {
    const result = getExercisesByEquipment("none");
    for (const ex of result) {
      expect(ex.equipmentRequired).toBe("none");
    }
  });

  it("returns exercises available with 'dumbbells' (includes none + dumbbells)", () => {
    const result = getExercisesByEquipment("dumbbells");
    for (const ex of result) {
      expect(["none", "dumbbells"]).toContain(ex.equipmentRequired);
    }
  });

  it("returns exercises for 'hotel' (includes none + hotel)", () => {
    const result = getExercisesByEquipment("hotel");
    for (const ex of result) {
      expect(["none", "hotel"]).toContain(ex.equipmentRequired);
    }
  });

  it("returns all exercises for 'full_gym'", () => {
    const result = getExercisesByEquipment("full_gym");
    expect(result.length).toBe(exercises.length);
  });

  it("returns a subset for more restrictive equipment", () => {
    const none = getExercisesByEquipment("none");
    const full = getExercisesByEquipment("full_gym");
    expect(none.length).toBeLessThanOrEqual(full.length);
  });
});

describe("getExercisesByMuscleGroup", () => {
  it("returns exercises filtered by muscle group", () => {
    const result = getExercisesByMuscleGroup("chest");
    expect(result.length).toBeGreaterThan(0);
    for (const ex of result) {
      expect(ex.muscleGroup).toBe("chest");
    }
  });

  it("returns empty array for non-existent muscle group", () => {
    const result = getExercisesByMuscleGroup("wings" as Exercise["muscleGroup"]);
    expect(result).toEqual([]);
  });
});
