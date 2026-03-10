/**
 * adaptation.ts — Adaptation engine service.
 *
 * Orchestrates insights computation + recommendation generation.
 * Reads check-in history from DB, computes trends, returns recommendations.
 */
import { prisma } from "@/lib/prisma";
import { computeWeightTrend, computeAdherence, computeRecovery } from "@/lib/insights";
import { generateRecommendations } from "@/lib/adaptation-rules";
import type { CheckInSlice, MemberContext, AdaptationResult } from "@/lib/adaptation-types";

/** Minimum check-ins required to generate adaptation recommendations. */
const MIN_CHECKINS = 3;
/** Default lookback window (days). */
const LOOKBACK_DAYS = 28;

/**
 * Run adaptation analysis for a member.
 * Loads recent check-ins + member context, computes insights, returns recommendations.
 */
export async function runAdaptation(email: string): Promise<AdaptationResult> {
  const member = await prisma.member.findUnique({ where: { email } });
  if (!member || member.status !== "active") {
    return {
      ok: false,
      code: "INSUFFICIENT_DATA",
      message: "No active membership found.",
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const checkIns = await prisma.checkIn.findMany({
    where: { memberId: member.id, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  if (checkIns.length < MIN_CHECKINS) {
    return {
      ok: false,
      code: "INSUFFICIENT_DATA",
      message: `Need at least ${MIN_CHECKINS} check-ins for adaptation analysis (found ${checkIns.length}).`,
    };
  }

  // Map DB records to CheckInSlice
  const slices: CheckInSlice[] = checkIns.map((ci) => ({
    date: ci.date.toISOString().split("T")[0],
    workout: ci.workout,
    meals: ci.meals,
    water: ci.water,
    steps: ci.steps,
    avgWeight: ci.avgWeight ? Number(ci.avgWeight) : null,
    waist: ci.waist ? Number(ci.waist) : null,
    workoutsCompleted: ci.workoutsCompleted,
    stepsAverage: ci.stepsAverage,
    calorieAdherence: ci.calorieAdherence,
    proteinAdherence: ci.proteinAdherence,
    sleepAverage: ci.sleepAverage ? Number(ci.sleepAverage) : null,
    energyScore: ci.energyScore,
    hungerScore: ci.hungerScore,
    stressScore: ci.stressScore,
    recoveryScore: ci.recoveryScore,
  }));

  // Build member context
  const macroTarget = await prisma.macroTarget.findFirst({
    where: { memberId: member.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  const context: MemberContext = {
    goal: mapGoal(member.goal),
    daysPerWeek: member.daysPerWeek ?? 4,
    currentCalories: macroTarget?.calories ?? null,
    currentProtein: macroTarget?.protein ?? null,
  };

  // Compute insights
  const weight = computeWeightTrend(slices);
  const adherence = computeAdherence(slices, context.daysPerWeek);
  const recovery = computeRecovery(slices);

  // Calculate week count from data span
  const firstDate = new Date(slices[0].date);
  const lastDate = new Date(slices[slices.length - 1].date);
  const daySpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  const weekCount = Math.max(Math.ceil(daySpan / 7), 1);

  const insights = { weight, adherence, recovery, weekCount };
  const recommendations = generateRecommendations(insights, context);

  return { ok: true, recommendations, insights };
}

/** Map free-text goal field to typed goal. */
function mapGoal(goal: string | null): MemberContext["goal"] {
  if (!goal) return "maintenance";
  const lower = goal.toLowerCase();
  if (lower.includes("fat") || lower.includes("lose") || lower.includes("cut") || lower.includes("lean")) {
    return "fat_loss";
  }
  if (lower.includes("muscle") || lower.includes("gain") || lower.includes("bulk") || lower.includes("mass")) {
    return "muscle";
  }
  return "maintenance";
}
