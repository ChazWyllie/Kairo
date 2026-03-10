// ── Types ──

export type BMRInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female";
};

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type MacroInput = {
  tdee: number;
  goal: "fat_loss" | "muscle" | "maintenance";
  weightKg: number;
};

export type MacroResult = {
  calorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
};

// ── Activity multipliers ──

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

// ── Calorie adjustments per goal ──

const goalCalorieAdjustment: Record<MacroInput["goal"], number> = {
  fat_loss: -500,
  muscle: 300,
  maintenance: 0,
};

// ── Protein per kg per goal ──

const proteinPerKg: Record<MacroInput["goal"], number> = {
  fat_loss: 2.0,
  muscle: 2.0,
  maintenance: 1.6,
};

// ── Functions ──

/**
 * Mifflin-St Jeor equation for Basal Metabolic Rate.
 */
export function calculateBMR(input: BMRInput): number {
  const { weightKg, heightCm, age, sex } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

/**
 * Total Daily Energy Expenditure = BMR × activity multiplier.
 */
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * activityMultipliers[activity]);
}

/**
 * Calculate macro targets based on TDEE, goal, and body weight.
 * Protein: goal-dependent g/kg. Fat: 0.8g/kg. Carbs: remainder.
 */
export function calculateMacros(input: MacroInput): MacroResult {
  const { tdee, goal, weightKg } = input;

  const calorieTarget = tdee + goalCalorieAdjustment[goal];
  const proteinGrams = Math.round(weightKg * proteinPerKg[goal]);
  const fatGrams = Math.round(weightKg * 0.8);

  // Remaining calories go to carbs: 1g protein = 4cal, 1g fat = 9cal, 1g carb = 4cal
  const proteinCals = proteinGrams * 4;
  const fatCals = fatGrams * 9;
  const carbCals = Math.max(0, calorieTarget - proteinCals - fatCals);
  const carbGrams = Math.round(carbCals / 4);

  return { calorieTarget, proteinGrams, fatGrams, carbGrams };
}
