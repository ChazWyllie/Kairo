/**
 * adaptation-rules.ts — Deterministic recommendation engine.
 *
 * Pure function: Insights + MemberContext → Recommendation[]
 * No database or external dependencies.
 */
import type {
  Insights,
  MemberContext,
  Recommendation,
  RecommendationPriority,
} from "./adaptation-types";

// ── Thresholds ──

const ADHERENCE_LOW_SCORE = 5; // calorie/protein 1-10 scale
const ADHERENCE_LOW_WORKOUT = 60; // workout % threshold
const RECOVERY_POOR = 4; // avg recovery/energy score
const RECOVERY_VERY_POOR = 3.5; // triggers deload
const SLEEP_POOR = 6; // avg sleep hours
const MUSCLE_GAIN_FAST = 0.6; // kg/week — too fast = excess fat
const MUSCLE_GAIN_GOOD_MAX = 0.5;
const RECOVERY_GOOD = 7; // threshold for "good" recovery
const ADHERENCE_GOOD_WORKOUT = 90;

// ── Priority sort order ──

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Generate adaptation recommendations from computed insights and member context.
 * Returns a sorted array of recommendations (high priority first).
 */
export function generateRecommendations(
  insights: Insights,
  context: MemberContext,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // ── 1. Adherence checks (always first — no point changing macros if not following plan) ──
  addAdherenceRecs(recs, insights, context);

  // ── 2. Recovery checks ──
  addRecoveryRecs(recs, insights);

  // ── 3. Goal-specific weight-based recommendations ──
  if (insights.weight.direction !== "insufficient_data") {
    switch (context.goal) {
      case "fat_loss":
        addFatLossRecs(recs, insights, context);
        break;
      case "muscle":
        addMuscleGainRecs(recs, insights, context);
        break;
      case "maintenance":
        addMaintenanceRecs(recs, insights);
        break;
    }
  }

  // ── 4. Protein check ──
  addProteinRecs(recs, insights);

  // ── 5. If nothing was flagged, maintain course ──
  if (recs.length === 0) {
    recs.push({
      action: "maintain_course",
      priority: "low",
      reason: "All metrics look good — keep up the current approach.",
    });
  }

  // Sort by priority
  recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return recs;
}

// ── Adherence ──

function addAdherenceRecs(
  recs: Recommendation[],
  insights: Insights,
  context: MemberContext,
): void {
  const { adherence } = insights;

  if (
    adherence.workoutAdherence < ADHERENCE_LOW_WORKOUT ||
    adherence.calorieAdherence < ADHERENCE_LOW_SCORE ||
    adherence.checkInConsistency < ADHERENCE_LOW_WORKOUT
  ) {
    recs.push({
      action: "increase_adherence",
      priority: "high",
      reason:
        "Adherence is below target — focus on consistency before making program changes.",
    });
  }
}

// ── Recovery ──

function addRecoveryRecs(recs: Recommendation[], insights: Insights): void {
  const { recovery } = insights;

  // Need at least some data to make recovery recommendations
  if (recovery.avgRecovery === null && recovery.avgEnergy === null) {
    return;
  }

  const avgRecoveryEnergy =
    recovery.avgRecovery !== null && recovery.avgEnergy !== null
      ? (recovery.avgRecovery + recovery.avgEnergy) / 2
      : recovery.avgRecovery ?? recovery.avgEnergy;

  if (avgRecoveryEnergy !== null && avgRecoveryEnergy <= RECOVERY_VERY_POOR) {
    recs.push({
      action: "deload",
      priority: "high",
      reason:
        "Recovery and energy scores are critically low — a deload week is recommended.",
    });
  } else if (
    avgRecoveryEnergy !== null &&
    avgRecoveryEnergy <= RECOVERY_POOR
  ) {
    recs.push({
      action: "reduce_volume",
      priority: "medium",
      reason:
        "Recovery scores are below average — consider reducing training volume.",
    });
  }

  if (recovery.avgSleep !== null && recovery.avgSleep < SLEEP_POOR) {
    recs.push({
      action: "improve_sleep",
      priority: "medium",
      reason: `Average sleep is ${recovery.avgSleep} hours — improving sleep will support recovery and progress.`,
    });
  }
}

// ── Fat loss ──

function addFatLossRecs(
  recs: Recommendation[],
  insights: Insights,
  _context: MemberContext,
): void {
  const { weight } = insights;

  if (weight.direction === "losing") {
    recs.push({
      action: "maintain_course",
      priority: "low",
      reason: `Weight is trending down (${weight.weeklyChangeKg} kg/week) — current plan is working.`,
    });
  } else if (
    weight.direction === "stable" ||
    weight.direction === "gaining"
  ) {
    // Only recommend calorie reduction if adherence is decent
    const hasAdherenceIssue = recs.some(
      (r) => r.action === "increase_adherence",
    );
    if (!hasAdherenceIssue) {
      recs.push({
        action: "reduce_calories",
        priority: "medium",
        reason:
          weight.direction === "stable"
            ? "Weight has plateaued — a small calorie reduction may help restart progress."
            : "Weight is trending up during a fat loss phase — review calorie intake.",
      });
    }
    // Also suggest steps for fat loss plateau
    recs.push({
      action: "increase_steps",
      priority: "low",
      reason:
        "Increasing daily activity through steps can support fat loss without additional training stress.",
    });
  }
}

// ── Muscle gain ──

function addMuscleGainRecs(
  recs: Recommendation[],
  insights: Insights,
  _context: MemberContext,
): void {
  const { weight, recovery, adherence } = insights;

  if (weight.direction === "stable" || weight.direction === "losing") {
    recs.push({
      action: "increase_calories",
      priority: "medium",
      reason:
        weight.direction === "stable"
          ? "Weight is stable in a muscle gain phase — a calorie increase may be needed."
          : "Weight is dropping in a muscle gain phase — significant calorie increase needed.",
    });
  } else if (weight.direction === "gaining") {
    const weeklyGain = weight.weeklyChangeKg ?? 0;
    if (weeklyGain > MUSCLE_GAIN_FAST) {
      recs.push({
        action: "reduce_calories",
        priority: "medium",
        reason: `Gaining ${weeklyGain} kg/week is too fast — reduce calories to limit fat gain.`,
      });
    } else if (weeklyGain <= MUSCLE_GAIN_GOOD_MAX) {
      recs.push({
        action: "maintain_course",
        priority: "low",
        reason: `Gaining at a good rate (${weeklyGain} kg/week) — stay the course.`,
      });

      // Suggest volume increase if recovery is good and adherence is strong
      const avgRec = recovery.avgRecovery ?? 0;
      const avgEn = recovery.avgEnergy ?? 0;
      if (
        (avgRec + avgEn) / 2 >= RECOVERY_GOOD &&
        adherence.workoutAdherence >= ADHERENCE_GOOD_WORKOUT
      ) {
        recs.push({
          action: "increase_volume",
          priority: "low",
          reason:
            "Recovery is strong and adherence is high — progressive overload can be increased.",
        });
      }
    }
  }
}

// ── Maintenance ──

function addMaintenanceRecs(
  recs: Recommendation[],
  insights: Insights,
): void {
  const { weight } = insights;

  if (weight.direction === "stable") {
    recs.push({
      action: "maintain_course",
      priority: "low",
      reason: "Weight is stable — maintenance is on track.",
    });
  } else if (weight.direction === "gaining") {
    recs.push({
      action: "reduce_calories",
      priority: "medium",
      reason:
        "Weight is trending up during maintenance — a small calorie reduction is advised.",
    });
  } else if (weight.direction === "losing") {
    recs.push({
      action: "increase_calories",
      priority: "medium",
      reason:
        "Weight is trending down during maintenance — a small calorie increase is advised.",
    });
  }
}

// ── Protein ──

function addProteinRecs(recs: Recommendation[], insights: Insights): void {
  if (insights.adherence.proteinAdherence > 0 && insights.adherence.proteinAdherence < ADHERENCE_LOW_SCORE) {
    recs.push({
      action: "increase_protein",
      priority: "medium",
      reason:
        "Protein adherence is low — prioritize hitting daily protein targets.",
    });
  }
}
