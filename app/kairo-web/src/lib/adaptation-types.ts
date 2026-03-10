/**
 * Types for the adaptation engine.
 *
 * Pure type definitions — no runtime dependencies.
 * Used by adaptation-rules.ts and insights.ts.
 */

// ── Check-in data slice (what adaptation engine needs) ──

export interface CheckInSlice {
  date: string; // ISO date string
  workout: boolean;
  meals: number; // 0-3
  water: boolean;
  steps: boolean;
  avgWeight: number | null;
  waist: number | null;
  workoutsCompleted: number | null;
  stepsAverage: number | null;
  calorieAdherence: number | null; // 1-10
  proteinAdherence: number | null; // 1-10
  sleepAverage: number | null;
  energyScore: number | null; // 1-10
  hungerScore: number | null; // 1-10
  stressScore: number | null; // 1-10
  recoveryScore: number | null; // 1-10
}

// ── Member context for adaptation decisions ──

export interface MemberContext {
  goal: "fat_loss" | "muscle" | "maintenance";
  daysPerWeek: number; // 1-7
  currentCalories: number | null;
  currentProtein: number | null;
}

// ── Adaptation recommendations ──

export type RecommendationAction =
  | "reduce_calories"
  | "increase_calories"
  | "increase_protein"
  | "increase_steps"
  | "reduce_volume"
  | "deload"
  | "increase_volume"
  | "improve_sleep"
  | "increase_adherence"
  | "maintain_course";

export type RecommendationPriority = "high" | "medium" | "low";

export interface Recommendation {
  action: RecommendationAction;
  priority: RecommendationPriority;
  reason: string;
}

// ── Trend insights from check-in history ──

export interface WeightTrend {
  direction: "losing" | "gaining" | "stable" | "insufficient_data";
  weeklyChangeKg: number | null;
  dataPoints: number;
}

export interface AdherenceSummary {
  workoutAdherence: number; // 0-100 percentage
  calorieAdherence: number; // 1-10 average
  proteinAdherence: number; // 1-10 average
  checkInConsistency: number; // 0-100 percentage
}

export interface RecoverySummary {
  avgEnergy: number | null; // 1-10
  avgStress: number | null; // 1-10
  avgSleep: number | null; // hours
  avgRecovery: number | null; // 1-10
  avgHunger: number | null; // 1-10
}

export interface Insights {
  weight: WeightTrend;
  adherence: AdherenceSummary;
  recovery: RecoverySummary;
  weekCount: number; // how many weeks of data analyzed
}

// ── Combined adaptation result ──

export type AdaptationResult =
  | { ok: true; recommendations: Recommendation[]; insights: Insights }
  | { ok: false; code: "INSUFFICIENT_DATA"; message: string };
