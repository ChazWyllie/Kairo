import type { NormalizedConstraints } from "./constraints";
import type {
  DailyPlan,
  PlanMode,
  Workout,
  WorkoutExercise,
  NutritionPlan,
  MealSuggestion,
  Exercise,
  EquipmentLevel,
} from "./plan-types";
import { getExercisesByEquipment } from "../data/exercise-catalog";
import { calculateMacros } from "./nutrition-calculator";

// ── Default assumptions (used when member profile isn't available) ──

const DEFAULT_WEIGHT_KG = 80;
const DEFAULT_TDEE = 2500;

// ── Mode detection ──

function detectMode(context: NormalizedConstraints["context"]): PlanMode {
  if (context.travelMode) return "travel";
  if (context.highStress || context.lowSleep) return "recovery";
  return "normal";
}

// ── Exercise selection ──

function selectExercises(
  available: Exercise[],
  constraints: NormalizedConstraints,
  maxDuration: number
): WorkoutExercise[] {
  const { noJumping } = constraints.optional;
  const isRecovery =
    constraints.context.highStress || constraints.context.lowSleep;
  const isBeginner = constraints.preferences.experience === "beginner";

  // Filter based on optional constraints
  let filtered = available;
  if (noJumping) {
    filtered = filtered.map((ex) => {
      if (ex.noJumpingAlternative) {
        const alt = available.find((a) => a.id === ex.noJumpingAlternative);
        return alt ?? ex;
      }
      return ex;
    });
    filtered = filtered.filter(
      (ex) => !ex.name.toLowerCase().includes("jump")
    );
  }

  // Prioritize compound movements
  const compounds = filtered.filter((ex) => ex.isCompound);
  const isolations = filtered.filter((ex) => !ex.isCompound);
  const ordered = [...compounds, ...isolations];

  // Select exercises that fit within the time budget
  const selected: WorkoutExercise[] = [];
  let totalDuration = 0;
  const maxExercises = isBeginner ? 4 : 6;
  const volumeMultiplier = isRecovery ? 0.7 : 1.0;

  for (const ex of ordered) {
    if (totalDuration + ex.durationMinutes > maxDuration) continue;
    if (selected.length >= maxExercises) break;

    const sets = Math.max(
      1,
      Math.round(ex.sets * volumeMultiplier * (isBeginner ? 0.75 : 1))
    );

    selected.push({
      name: ex.name,
      sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
    });
    totalDuration += ex.durationMinutes;
  }

  return selected;
}

// ── Workout building ──

function buildWorkout(
  id: string,
  name: string,
  description: string,
  equipment: EquipmentLevel,
  mode: PlanMode,
  exercises: WorkoutExercise[],
  maxDuration: number
): Workout {
  // Estimate actual duration from exercises
  const estimatedDuration = Math.min(
    maxDuration,
    exercises.reduce((sum, ex) => {
      const sets = ex.sets;
      const repsDuration =
        typeof ex.reps === "number" ? sets * 0.5 : sets * 0.75;
      const restDuration = (sets * ex.restSeconds) / 60;
      return sum + repsDuration + restDuration;
    }, 0)
  );
  const duration = Math.max(1, Math.round(estimatedDuration));

  return {
    id,
    name,
    duration: Math.min(duration, maxDuration),
    equipment,
    mode,
    description,
    exercises,
  };
}

// ── Nutrition plan ──

function buildNutrition(constraints: NormalizedConstraints): NutritionPlan {
  const macros = calculateMacros({
    tdee: DEFAULT_TDEE,
    goal: constraints.preferences.goal,
    weightKg: DEFAULT_WEIGHT_KG,
  });

  const mealsPerDay = 3;
  const proteinPerMeal = Math.round(macros.proteinGrams / mealsPerDay);

  const suggestions: MealSuggestion[] = [
    { name: "Eggs & toast", protein: proteinPerMeal, time: "breakfast" },
    { name: "Chicken & rice", protein: proteinPerMeal, time: "lunch" },
    { name: "Salmon & vegetables", protein: proteinPerMeal, time: "dinner" },
  ];

  return {
    proteinGoal: macros.proteinGrams,
    calorieEstimate: macros.calorieTarget,
    mealsPerDay,
    waterGoalLiters: 3.0,
    mealSuggestions: suggestions,
  };
}

// ── Main entry point ──

export function generatePlan(constraints: NormalizedConstraints): DailyPlan {
  const mode = detectMode(constraints.context);
  const available = getExercisesByEquipment(constraints.equipment);
  const maxDuration = constraints.timeAvailable;

  // Build primary workout (compound-focused)
  const primaryExercises = selectExercises(available, constraints, maxDuration);

  // Build alternative workout (different exercise selection — reverse order)
  const altAvailable = [...available].reverse();
  const altExercises = selectExercises(
    altAvailable,
    constraints,
    maxDuration
  );

  const equipmentLabel = constraints.equipment;

  const primary = buildWorkout(
    "wo_primary",
    `${maxDuration}-min ${mode === "travel" ? "Travel" : mode === "recovery" ? "Recovery" : "Standard"} Workout`,
    `${mode === "recovery" ? "Low-intensity" : "Full-body"} ${equipmentLabel === "none" ? "bodyweight" : equipmentLabel} workout`,
    equipmentLabel,
    mode,
    primaryExercises,
    maxDuration
  );

  const alternative = buildWorkout(
    "wo_alternative",
    `${maxDuration}-min Alternative Workout`,
    `Alternative ${equipmentLabel === "none" ? "bodyweight" : equipmentLabel} workout`,
    equipmentLabel,
    mode,
    altExercises,
    maxDuration
  );

  return {
    date: new Date().toISOString().split("T")[0],
    mode,
    workouts: [primary, alternative],
    nutrition: buildNutrition(constraints),
    constraints,
  };
}
