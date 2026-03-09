/**
 * Multi-tier pricing configuration.
 *
 * Stripe Price IDs are loaded from environment variables (STRIPE_PRICE_*).
 * See infrastructure/env.example for the full list.
 *
 * Tier lineup:
 *   Foundation  ($49/mo | $490/yr)  — Templates + async check-ins
 *   Coaching    ($129/mo | $1,290/yr) — Personalized programming + 24h response
 *   Performance ($229/mo | $2,290/yr) — Video reviews + weekly calls
 *   VIP Elite   ($349/mo | $3,490/yr) — Daily access + priority everything
 */

import { env } from "@/lib/env";

export type PlanTier = "foundation" | "coaching" | "performance" | "vip";
export type BillingInterval = "monthly" | "annual";

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  features: string[];
}

export const PLANS: PlanConfig[] = [
  {
    tier: "foundation",
    name: "Foundation",
    tagline: "A budget-friendly plan with the core essentials.",
    monthlyPrice: 49,
    annualPrice: 490,
    monthlyPriceId: env.STRIPE_PRICE_FOUNDATION_MONTHLY,
    annualPriceId: env.STRIPE_PRICE_FOUNDATION_ANNUAL,
    features: [
      "Personalized monthly training plan (updated each month)",
      "Nutrition targets & simple meal guidance",
      "Weekly async check-ins (coach responds within 48h)",
      "Progress adjustments & accountability",
      "Quarterly performance reviews",
    ],
  },
  {
    tier: "coaching",
    name: "Coaching",
    tagline: "Everything in Foundation plus more personalized support.",
    monthlyPrice: 129,
    annualPrice: 1290,
    monthlyPriceId: env.STRIPE_PRICE_COACHING_MONTHLY,
    annualPriceId: env.STRIPE_PRICE_COACHING_ANNUAL,
    features: [
      "Custom periodized workout program (tailored to your goals)",
      "Bi-weekly check-ins (every 2 weeks, <24h response)",
      "Personalized nutrition coaching with macro targets",
      "Video form reviews (2 coach-reviewed videos per month)",
      "Monthly progress report",
    ],
  },
  {
    tier: "performance",
    name: "Performance",
    tagline: "A high-touch plan for serious results.",
    monthlyPrice: 229,
    annualPrice: 2290,
    monthlyPriceId: env.STRIPE_PRICE_PERFORMANCE_MONTHLY,
    annualPriceId: env.STRIPE_PRICE_PERFORMANCE_ANNUAL,
    features: [
      "Weekly 30-min 1-on-1 calls with your coach",
      "Unlimited form critique videos",
      "Priority messaging (coach replies within 12h)",
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
    monthlyPriceId: env.STRIPE_PRICE_VIP_MONTHLY,
    annualPriceId: env.STRIPE_PRICE_VIP_ANNUAL,
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

/** Set of all valid Stripe Price IDs — used for checkout validation */
export const ALLOWED_PRICE_IDS = new Set(
  PLANS.flatMap((p) => [p.monthlyPriceId, p.annualPriceId])
);

/**
 * Look up plan config + billing interval from a Stripe Price ID.
 * Returns null for unknown price IDs.
 */
export function getPlanFromPriceId(
  priceId: string
): { plan: PlanConfig; interval: BillingInterval } | null {
  for (const plan of PLANS) {
    if (priceId === plan.monthlyPriceId) {
      return { plan, interval: "monthly" };
    }
    if (priceId === plan.annualPriceId) {
      return { plan, interval: "annual" };
    }
  }
  return null;
}
