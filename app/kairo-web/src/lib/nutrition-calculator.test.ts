import { describe, it, expect } from "vitest";
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
} from "./nutrition-calculator";

// ────────────────────────────────────────────────
//  1. BMR Calculation (Mifflin-St Jeor)
// ────────────────────────────────────────────────

describe("calculateBMR", () => {
  it("calculates BMR for a typical male", () => {
    // Male, 80kg, 178cm, 30 years
    const bmr = calculateBMR({ weightKg: 80, heightCm: 178, age: 30, sex: "male" });
    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2000);
  });

  it("calculates BMR for a typical female", () => {
    // Female, 65kg, 165cm, 28 years
    const bmr = calculateBMR({ weightKg: 65, heightCm: 165, age: 28, sex: "female" });
    expect(bmr).toBeGreaterThan(1200);
    expect(bmr).toBeLessThan(1600);
  });

  it("returns higher BMR for heavier person", () => {
    const light = calculateBMR({ weightKg: 60, heightCm: 170, age: 25, sex: "male" });
    const heavy = calculateBMR({ weightKg: 100, heightCm: 170, age: 25, sex: "male" });
    expect(heavy).toBeGreaterThan(light);
  });

  it("returns lower BMR for older person", () => {
    const young = calculateBMR({ weightKg: 80, heightCm: 178, age: 20, sex: "male" });
    const older = calculateBMR({ weightKg: 80, heightCm: 178, age: 50, sex: "male" });
    expect(young).toBeGreaterThan(older);
  });

  it("returns a rounded integer", () => {
    const bmr = calculateBMR({ weightKg: 75, heightCm: 175, age: 30, sex: "male" });
    expect(Number.isInteger(bmr)).toBe(true);
  });
});

// ────────────────────────────────────────────────
//  2. TDEE Calculation
// ────────────────────────────────────────────────

describe("calculateTDEE", () => {
  it("moderate activity multiplies BMR by ~1.55", () => {
    const bmr = 1800;
    const tdee = calculateTDEE(bmr, "moderate");
    expect(tdee).toBeCloseTo(1800 * 1.55, -1);
  });

  it("sedentary uses lower multiplier than active", () => {
    const bmr = 1800;
    const sedentary = calculateTDEE(bmr, "sedentary");
    const active = calculateTDEE(bmr, "active");
    expect(sedentary).toBeLessThan(active);
  });

  it("returns a rounded integer", () => {
    const tdee = calculateTDEE(1800, "moderate");
    expect(Number.isInteger(tdee)).toBe(true);
  });

  it.each(["sedentary", "light", "moderate", "active"] as const)(
    "accepts activity level: %s",
    (level) => {
      const tdee = calculateTDEE(1800, level);
      expect(tdee).toBeGreaterThan(0);
    }
  );
});

// ────────────────────────────────────────────────
//  3. Macro Calculation
// ────────────────────────────────────────────────

describe("calculateMacros", () => {
  it("fat_loss creates a caloric deficit", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "fat_loss", weightKg: 80 });
    expect(macros.calorieTarget).toBeLessThan(2500);
  });

  it("muscle creates a caloric surplus", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "muscle", weightKg: 80 });
    expect(macros.calorieTarget).toBeGreaterThan(2500);
  });

  it("maintenance keeps calories at TDEE", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "maintenance", weightKg: 80 });
    expect(macros.calorieTarget).toBe(2500);
  });

  it("protein is at least 1.6g per kg bodyweight for fat_loss", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "fat_loss", weightKg: 80 });
    expect(macros.proteinGrams).toBeGreaterThanOrEqual(80 * 1.6);
  });

  it("protein is at least 1.8g per kg bodyweight for muscle", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "muscle", weightKg: 80 });
    expect(macros.proteinGrams).toBeGreaterThanOrEqual(80 * 1.8);
  });

  it("returns all macro fields", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "fat_loss", weightKg: 80 });
    expect(macros).toHaveProperty("calorieTarget");
    expect(macros).toHaveProperty("proteinGrams");
    expect(macros).toHaveProperty("fatGrams");
    expect(macros).toHaveProperty("carbGrams");
  });

  it("macros sum to approximately the calorie target", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "fat_loss", weightKg: 80 });
    const totalCals =
      macros.proteinGrams * 4 + macros.carbGrams * 4 + macros.fatGrams * 9;
    // Allow ±50 cal rounding tolerance
    expect(Math.abs(totalCals - macros.calorieTarget)).toBeLessThan(50);
  });

  it("fat grams are at least 0.7g per kg bodyweight", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "fat_loss", weightKg: 80 });
    expect(macros.fatGrams).toBeGreaterThanOrEqual(Math.floor(80 * 0.7));
  });

  it("returns rounded integers for all values", () => {
    const macros = calculateMacros({ tdee: 2500, goal: "muscle", weightKg: 75 });
    expect(Number.isInteger(macros.calorieTarget)).toBe(true);
    expect(Number.isInteger(macros.proteinGrams)).toBe(true);
    expect(Number.isInteger(macros.fatGrams)).toBe(true);
    expect(Number.isInteger(macros.carbGrams)).toBe(true);
  });
});
