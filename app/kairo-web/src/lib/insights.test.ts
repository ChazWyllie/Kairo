/**
 * Tests for insights.ts — pure computation functions.
 *
 * Coverage:
 * - computeWeightTrend: losing / gaining / stable / insufficient_data
 * - computeAdherence: workout%, calorie avg, protein avg, consistency
 * - computeRecovery: avg scores with null handling
 * - Edge cases: empty arrays, all-null fields, single data point
 */
import { describe, it, expect } from "vitest";
import {
  computeWeightTrend,
  computeAdherence,
  computeRecovery,
} from "./insights";
import type { CheckInSlice } from "./adaptation-types";

// ── Helpers ──

function makeCheckIn(overrides: Partial<CheckInSlice> = {}): CheckInSlice {
  return {
    date: "2025-01-15",
    workout: true,
    meals: 3,
    water: true,
    steps: true,
    avgWeight: 85,
    waist: null,
    workoutsCompleted: 4,
    stepsAverage: 8000,
    calorieAdherence: 7,
    proteinAdherence: 7,
    sleepAverage: 7.5,
    energyScore: 7,
    hungerScore: 5,
    stressScore: 4,
    recoveryScore: 7,
    ...overrides,
  };
}

// ────────────────────────────────────────────────
//  computeWeightTrend
// ────────────────────────────────────────────────

describe("computeWeightTrend", () => {
  it("returns losing when weight decreases over time", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-01", avgWeight: 90 }),
      makeCheckIn({ date: "2025-01-08", avgWeight: 89 }),
      makeCheckIn({ date: "2025-01-15", avgWeight: 88 }),
    ];

    const trend = computeWeightTrend(slices);

    expect(trend.direction).toBe("losing");
    expect(trend.weeklyChangeKg).toBeLessThan(0);
    expect(trend.dataPoints).toBe(3);
  });

  it("returns gaining when weight increases over time", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-01", avgWeight: 80 }),
      makeCheckIn({ date: "2025-01-08", avgWeight: 81 }),
      makeCheckIn({ date: "2025-01-15", avgWeight: 82 }),
    ];

    const trend = computeWeightTrend(slices);

    expect(trend.direction).toBe("gaining");
    expect(trend.weeklyChangeKg).toBeGreaterThan(0);
    expect(trend.dataPoints).toBe(3);
  });

  it("returns stable when weight stays within threshold", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-01", avgWeight: 85 }),
      makeCheckIn({ date: "2025-01-08", avgWeight: 85.1 }),
      makeCheckIn({ date: "2025-01-15", avgWeight: 84.9 }),
    ];

    const trend = computeWeightTrend(slices);

    expect(trend.direction).toBe("stable");
    expect(trend.dataPoints).toBe(3);
  });

  it("returns insufficient_data with fewer than 2 weight readings", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-01", avgWeight: 85 }),
    ];

    const trend = computeWeightTrend(slices);

    expect(trend.direction).toBe("insufficient_data");
    expect(trend.weeklyChangeKg).toBeNull();
  });

  it("returns insufficient_data when all weights are null", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-01", avgWeight: null }),
      makeCheckIn({ date: "2025-01-08", avgWeight: null }),
      makeCheckIn({ date: "2025-01-15", avgWeight: null }),
    ];

    const trend = computeWeightTrend(slices);

    expect(trend.direction).toBe("insufficient_data");
    expect(trend.weeklyChangeKg).toBeNull();
    expect(trend.dataPoints).toBe(0);
  });

  it("ignores null weight entries but uses available ones", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-01", avgWeight: 90 }),
      makeCheckIn({ date: "2025-01-08", avgWeight: null }),
      makeCheckIn({ date: "2025-01-15", avgWeight: 88 }),
    ];

    const trend = computeWeightTrend(slices);

    expect(trend.direction).toBe("losing");
    expect(trend.dataPoints).toBe(2);
  });

  it("handles empty array", () => {
    const trend = computeWeightTrend([]);

    expect(trend.direction).toBe("insufficient_data");
    expect(trend.weeklyChangeKg).toBeNull();
    expect(trend.dataPoints).toBe(0);
  });
});

// ────────────────────────────────────────────────
//  computeAdherence
// ────────────────────────────────────────────────

describe("computeAdherence", () => {
  it("computes workout adherence as percentage of workout days", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ workout: true }),
      makeCheckIn({ workout: true }),
      makeCheckIn({ workout: false }),
      makeCheckIn({ workout: true }),
    ];

    const adherence = computeAdherence(slices, 4);

    expect(adherence.workoutAdherence).toBe(75); // 3/4 * 100
  });

  it("computes calorie adherence as average score", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ calorieAdherence: 8 }),
      makeCheckIn({ calorieAdherence: 6 }),
      makeCheckIn({ calorieAdherence: null }),
      makeCheckIn({ calorieAdherence: 7 }),
    ];

    const adherence = computeAdherence(slices, 4);

    expect(adherence.calorieAdherence).toBe(7); // (8+6+7)/3
  });

  it("computes protein adherence as average score", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ proteinAdherence: 9 }),
      makeCheckIn({ proteinAdherence: 7 }),
    ];

    const adherence = computeAdherence(slices, 4);

    expect(adherence.proteinAdherence).toBe(8); // (9+7)/2
  });

  it("computes check-in consistency as percentage of expected days", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ date: "2025-01-13" }),
      makeCheckIn({ date: "2025-01-14" }),
      makeCheckIn({ date: "2025-01-15" }),
    ];

    // 3 check-ins out of 4 expected per week
    const adherence = computeAdherence(slices, 4);

    expect(adherence.checkInConsistency).toBe(75); // 3/4 * 100
  });

  it("caps workout adherence at 100%", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ workout: true }),
      makeCheckIn({ workout: true }),
      makeCheckIn({ workout: true }),
      makeCheckIn({ workout: true }),
      makeCheckIn({ workout: true }),
    ];

    const adherence = computeAdherence(slices, 3);

    expect(adherence.workoutAdherence).toBeLessThanOrEqual(100);
  });

  it("returns zero adherence for empty input", () => {
    const adherence = computeAdherence([], 4);

    expect(adherence.workoutAdherence).toBe(0);
    expect(adherence.calorieAdherence).toBe(0);
    expect(adherence.proteinAdherence).toBe(0);
    expect(adherence.checkInConsistency).toBe(0);
  });
});

// ────────────────────────────────────────────────
//  computeRecovery
// ────────────────────────────────────────────────

describe("computeRecovery", () => {
  it("computes average scores across check-ins", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ energyScore: 7, stressScore: 4, sleepAverage: 7, recoveryScore: 7, hungerScore: 5 }),
      makeCheckIn({ energyScore: 8, stressScore: 3, sleepAverage: 8, recoveryScore: 8, hungerScore: 4 }),
    ];

    const recovery = computeRecovery(slices);

    expect(recovery.avgEnergy).toBe(7.5);
    expect(recovery.avgStress).toBe(3.5);
    expect(recovery.avgSleep).toBe(7.5);
    expect(recovery.avgRecovery).toBe(7.5);
    expect(recovery.avgHunger).toBe(4.5);
  });

  it("ignores null values in averaging", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ energyScore: 6, stressScore: null, sleepAverage: 7, recoveryScore: null, hungerScore: 5 }),
      makeCheckIn({ energyScore: 8, stressScore: 4, sleepAverage: null, recoveryScore: 7, hungerScore: null }),
    ];

    const recovery = computeRecovery(slices);

    expect(recovery.avgEnergy).toBe(7); // (6+8)/2
    expect(recovery.avgStress).toBe(4); // only one value
    expect(recovery.avgSleep).toBe(7); // only one value
    expect(recovery.avgRecovery).toBe(7); // only one value
    expect(recovery.avgHunger).toBe(5); // only one value
  });

  it("returns all null when all scores are null", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({
        energyScore: null,
        stressScore: null,
        sleepAverage: null,
        recoveryScore: null,
        hungerScore: null,
      }),
    ];

    const recovery = computeRecovery(slices);

    expect(recovery.avgEnergy).toBeNull();
    expect(recovery.avgStress).toBeNull();
    expect(recovery.avgSleep).toBeNull();
    expect(recovery.avgRecovery).toBeNull();
    expect(recovery.avgHunger).toBeNull();
  });

  it("returns all null for empty input", () => {
    const recovery = computeRecovery([]);

    expect(recovery.avgEnergy).toBeNull();
    expect(recovery.avgStress).toBeNull();
    expect(recovery.avgSleep).toBeNull();
    expect(recovery.avgRecovery).toBeNull();
    expect(recovery.avgHunger).toBeNull();
  });

  it("handles single check-in", () => {
    const slices: CheckInSlice[] = [
      makeCheckIn({ energyScore: 6, stressScore: 5, sleepAverage: 6.5, recoveryScore: 6, hungerScore: 4 }),
    ];

    const recovery = computeRecovery(slices);

    expect(recovery.avgEnergy).toBe(6);
    expect(recovery.avgStress).toBe(5);
    expect(recovery.avgSleep).toBe(6.5);
    expect(recovery.avgRecovery).toBe(6);
    expect(recovery.avgHunger).toBe(4);
  });
});
