import type { NormalizedConstraints } from "./constraints";

// ── Exercise Catalog Types ──

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "core"
  | "full_body"
  | "cardio";

export type EquipmentLevel = "none" | "hotel" | "dumbbells" | "full_gym";

export type ExperienceLevel = "beginner" | "intermediate";

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipmentRequired: EquipmentLevel;
  sets: number;
  reps: number | string; // number or "30s", "45s" for timed exercises
  restSeconds: number;
  durationMinutes: number; // estimated time per exercise
  isCompound: boolean;
  noJumpingAlternative?: string; // id of alternative exercise
};

// ── Plan Output Types ──

export type PlanMode = "travel" | "normal" | "recovery";

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: number | string;
  restSeconds: number;
};

export type Workout = {
  id: string;
  name: string;
  duration: number;
  equipment: EquipmentLevel;
  mode: PlanMode;
  description: string;
  exercises: WorkoutExercise[];
};

export type MealSuggestion = {
  name: string;
  protein: number;
  time: "breakfast" | "lunch" | "dinner" | "snack";
};

export type NutritionPlan = {
  proteinGoal: number;
  calorieEstimate: number;
  mealsPerDay: number;
  waterGoalLiters: number;
  mealSuggestions: MealSuggestion[];
};

export type DailyPlan = {
  date: string; // ISO date string
  mode: PlanMode;
  workouts: Workout[];
  nutrition: NutritionPlan;
  constraints: NormalizedConstraints;
};
