/**
 * insights.ts — Pure computation functions for check-in trend analysis.
 *
 * No database or external dependencies — operates on CheckInSlice arrays.
 */
import type {
  CheckInSlice,
  WeightTrend,
  AdherenceSummary,
  RecoverySummary,
} from "./adaptation-types";

/** Stability threshold: weekly change within ±0.2 kg is "stable". */
const STABLE_THRESHOLD_KG = 0.2;

/**
 * Compute weight trend from check-in slices.
 * Requires at least 2 non-null weight readings to determine direction.
 */
export function computeWeightTrend(slices: CheckInSlice[]): WeightTrend {
  const weighted = slices
    .filter((s) => s.avgWeight !== null)
    .map((s) => ({ date: s.date, weight: s.avgWeight as number }));

  if (weighted.length < 2) {
    return {
      direction: "insufficient_data",
      weeklyChangeKg: null,
      dataPoints: weighted.length,
    };
  }

  // Sort by date ascending
  weighted.sort((a, b) => a.date.localeCompare(b.date));

  const first = weighted[0];
  const last = weighted[weighted.length - 1];
  const totalChange = last.weight - first.weight;

  // Days between first and last
  const daysDiff =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) /
    (1000 * 60 * 60 * 24);
  const weeks = Math.max(daysDiff / 7, 1); // At least 1 week to avoid division by zero
  const weeklyChange = totalChange / weeks;

  let direction: WeightTrend["direction"];
  if (Math.abs(weeklyChange) <= STABLE_THRESHOLD_KG) {
    direction = "stable";
  } else if (weeklyChange < 0) {
    direction = "losing";
  } else {
    direction = "gaining";
  }

  return {
    direction,
    weeklyChangeKg: Math.round(weeklyChange * 100) / 100,
    dataPoints: weighted.length,
  };
}

/**
 * Compute adherence summary from check-in slices.
 * @param daysPerWeek - expected training days per week for consistency calc
 */
export function computeAdherence(
  slices: CheckInSlice[],
  daysPerWeek: number,
): AdherenceSummary {
  if (slices.length === 0) {
    return {
      workoutAdherence: 0,
      calorieAdherence: 0,
      proteinAdherence: 0,
      checkInConsistency: 0,
    };
  }

  // Workout adherence: % of check-ins where workout === true, relative to expected
  const workoutDays = slices.filter((s) => s.workout).length;
  const workoutAdherence = Math.min(
    Math.round((workoutDays / daysPerWeek) * 100),
    100,
  );

  // Calorie adherence: average of non-null calorieAdherence scores
  const calorieScores = slices
    .map((s) => s.calorieAdherence)
    .filter((v): v is number => v !== null);
  const calorieAdherence =
    calorieScores.length > 0
      ? Math.round(
          (calorieScores.reduce((a, b) => a + b, 0) / calorieScores.length) *
            100,
        ) / 100
      : 0;

  // Protein adherence: average of non-null proteinAdherence scores
  const proteinScores = slices
    .map((s) => s.proteinAdherence)
    .filter((v): v is number => v !== null);
  const proteinAdherence =
    proteinScores.length > 0
      ? Math.round(
          (proteinScores.reduce((a, b) => a + b, 0) / proteinScores.length) *
            100,
        ) / 100
      : 0;

  // Check-in consistency: actual check-ins / expected (daysPerWeek)
  const checkInConsistency = Math.min(
    Math.round((slices.length / daysPerWeek) * 100),
    100,
  );

  return {
    workoutAdherence,
    calorieAdherence,
    proteinAdherence,
    checkInConsistency,
  };
}

/**
 * Compute recovery summary — averages of subjective scores.
 * Null values are excluded from the average. If all values are null, returns null.
 */
export function computeRecovery(slices: CheckInSlice[]): RecoverySummary {
  function avg(values: (number | null)[]): number | null {
    const valid = values.filter((v): v is number => v !== null);
    if (valid.length === 0) return null;
    return (
      Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100
    );
  }

  return {
    avgEnergy: avg(slices.map((s) => s.energyScore)),
    avgStress: avg(slices.map((s) => s.stressScore)),
    avgSleep: avg(slices.map((s) => s.sleepAverage)),
    avgRecovery: avg(slices.map((s) => s.recoveryScore)),
    avgHunger: avg(slices.map((s) => s.hungerScore)),
  };
}
