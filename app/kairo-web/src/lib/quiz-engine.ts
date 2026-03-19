/**
 * Quiz recommendation engine — pure function.
 *
 * Maps quiz answers to a recommended PlanTier using a weighted scoring system.
 * No side effects, no dependencies — easy to test and reason about.
 *
 * Scoring approach:
 * - Each answer contributes points toward a tier threshold
 * - experience: beginner=0, intermediate=2, advanced=4
 * - goal: maintenance=0, fat_loss=1, muscle=2
 * - daysPerWeek: 1-2=0, 3-4=1, 5+=2
 * - minutesPerSession: <20=0, 20-40=1, 45+=2
 * - challenge: time=0, consistency/accountability=1, plateau=2
 *
 * Tier thresholds:
 * - 0-5  → standard  (1:1 Standard, $149/mo)
 * - 6+   → premium   (1:1 Premium, $350/mo)
 */
import type { PlanTier } from "@/lib/stripe-prices";

export interface QuizAnswers {
  goal?: "fat_loss" | "muscle" | "maintenance";
  experience?: "beginner" | "intermediate" | "advanced";
  daysPerWeek?: number;
  minutesPerSession?: number;
  challenge?: "time" | "consistency" | "accountability" | "plateau";
}

const EXPERIENCE_SCORES: Record<string, number> = {
  beginner: 0,
  intermediate: 2,
  advanced: 4,
};

const GOAL_SCORES: Record<string, number> = {
  maintenance: 0,
  fat_loss: 1,
  muscle: 2,
};

const CHALLENGE_SCORES: Record<string, number> = {
  time: 0,
  consistency: 1,
  accountability: 1,
  plateau: 2,
};

function scoreDaysPerWeek(days: number | undefined): number {
  if (!days || days <= 2) return 0;
  if (days <= 4) return 1;
  return 2;
}

function scoreMinutesPerSession(minutes: number | undefined): number {
  if (!minutes || minutes < 20) return 0;
  if (minutes <= 40) return 1;
  return 2;
}

/**
 * Recommend a plan tier based on quiz answers.
 *
 * Always returns a valid PlanTier — defaults to "standard"
 * for empty, undefined, or minimal input.
 */
export function recommendTier(answers: QuizAnswers): PlanTier {
  // Defensive: handle undefined/null input
  if (!answers || typeof answers !== "object") {
    return "standard";
  }

  let score = 0;

  // Experience level (biggest weight)
  if (answers.experience && answers.experience in EXPERIENCE_SCORES) {
    score += EXPERIENCE_SCORES[answers.experience];
  }

  // Goal ambition
  if (answers.goal && answers.goal in GOAL_SCORES) {
    score += GOAL_SCORES[answers.goal];
  }

  // Training frequency
  score += scoreDaysPerWeek(answers.daysPerWeek);

  // Session duration
  score += scoreMinutesPerSession(answers.minutesPerSession);

  // Challenge type
  if (answers.challenge && answers.challenge in CHALLENGE_SCORES) {
    score += CHALLENGE_SCORES[answers.challenge];
  }

  // Map score to tier
  if (score <= 5) return "standard";
  return "premium";
}
