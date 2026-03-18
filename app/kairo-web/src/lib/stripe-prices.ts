/**
 * Client-safe pricing display data.
 *
 * No env var imports — safe for "use client" components.
 * For Stripe price IDs and server-only utilities, use stripe-server.ts.
 *
 * Tier lineup:
 *   Foundation  ($49/mo | $490/yr)  — Templates + async check-ins
 *   Coaching    ($129/mo | $1,290/yr) — Personalized programming + 24h response
 *   Performance ($229/mo | $2,290/yr) — Video reviews + weekly calls
 *   VIP Elite   ($349/mo | $3,490/yr) — Daily access + priority everything
 */

export type PlanTier = "foundation" | "coaching" | "performance" | "vip";
export type BillingInterval = "monthly" | "annual";

export interface PlanDisplay {
  tier: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

/** @deprecated Use PlanDisplay instead */
export type PlanConfig = PlanDisplay;

export const PLANS: PlanDisplay[] = [
  {
    tier: "foundation",
    name: "Foundation",
    tagline: "Training and nutrition templates with direct WhatsApp access.",
    monthlyPrice: 49,
    annualPrice: 490,
    features: [
      "Monthly training template (updated to your progress)",
      "Nutrition targets and simple meal guidance",
      "Direct WhatsApp access to your coach",
      "Weekly check-ins and progress adjustments",
      "Quarterly performance reviews",
    ],
  },
  {
    tier: "coaching",
    name: "Coaching",
    tagline: "Everything in Foundation, plus fully personalized 1-on-1 coaching.",
    monthlyPrice: 129,
    annualPrice: 1290,
    features: [
      "Everything in Foundation",
      "Custom periodized workout program built around your goals",
      "Bi-weekly check-ins with your coach",
      "Personalized nutrition coaching with macro targets",
      "Video form reviews (2 per month)",
      "Monthly progress report",
    ],
  },
  {
    tier: "performance",
    name: "Performance",
    tagline: "A high-touch plan for serious results.",
    monthlyPrice: 229,
    annualPrice: 2290,
    features: [
      "Weekly 30-min 1-on-1 calls with your coach",
      "Unlimited form critique videos",
      "Priority messaging with your coach",
      "Advanced programming & peaking protocols",
      "Everything in Coaching included",
    ],
  },
  {
    tier: "vip",
    name: "VIP Elite",
    tagline: "The ultimate 1:1 experience with unlimited access.",
    monthlyPrice: 349,
    annualPrice: 3490,
    features: [
      "Everything in Performance, plus:",
      "Daily messaging access (unlimited text/video)",
      "Weekly 60-min 1-on-1 calls",
      "Competition & photoshoot prep",
      "Priority scheduling (book any time)",
      "Quarterly deep-dive progress reviews",
    ],
  },
];
