/**
 * Multi-tier pricing configuration.
 *
 * All Stripe Price IDs live here — no more single STRIPE_PRICE_ID env var.
 * Prices were created via `stripe prices create` CLI.
 *
 * Tier lineup:
 *   Foundation  ($49/mo | $490/yr)  — Templates + async check-ins
 *   Coaching    ($129/mo | $1,290/yr) — Personalized programming + 24h response
 *   Performance ($229/mo | $2,290/yr) — Video reviews + weekly calls
 *   VIP Elite   ($349/mo | $3,490/yr) — Daily access + priority everything
 */

export type PlanTier = "foundation" | "coaching" | "performance" | "vip";
export type BillingInterval = "monthly" | "annual";

export interface PlanConfig {
  tier: PlanTier;
  name: string;
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
    monthlyPrice: 49,
    annualPrice: 490,
    monthlyPriceId: "price_1T7xEjGvnI8mNPSSxDFaLBjd",
    annualPriceId: "price_1T7xFVGvnI8mNPSSqF6xPdwx",
    features: [
      "Personalized training plan template (updated monthly)",
      "Nutrition targets + simple meal structure",
      "Weekly async check-in (48h response window)",
      "Accountability + adjustments based on progress",
    ],
  },
  {
    tier: "coaching",
    name: "Coaching",
    monthlyPrice: 129,
    annualPrice: 1290,
    monthlyPriceId: "price_1T7xGPGvnI8mNPSSLaS6wL1x",
    annualPriceId: "price_1T7xGuGvnI8mNPSSKVQ4W94S",
    features: [
      "Everything in Foundation",
      "Custom programming (periodized for your goals)",
      "Bi-weekly async check-ins (24h response)",
      "Nutrition coaching with macro guidance",
      "Form review via video (2 per month)",
    ],
  },
  {
    tier: "performance",
    name: "Performance",
    monthlyPrice: 229,
    annualPrice: 2290,
    monthlyPriceId: "price_1T7xHaGvnI8mNPSSjhiE6CDF",
    annualPriceId: "price_1T7xI6GvnI8mNPSSWNJh2ywl",
    features: [
      "Everything in Coaching",
      "Weekly 1-on-1 video calls (30 min)",
      "Unlimited form review videos",
      "Priority response (12h turnaround)",
      "Advanced periodization + peaking protocols",
    ],
  },
  {
    tier: "vip",
    name: "VIP Elite",
    monthlyPrice: 349,
    annualPrice: 3490,
    monthlyPriceId: "price_1T7xIpGvnI8mNPSSNwq7rxQx",
    annualPriceId: "price_1T7xJKGvnI8mNPSSadMSr2D7",
    features: [
      "Everything in Performance",
      "Daily messaging access",
      "Weekly 1-on-1 video calls (60 min)",
      "Competition / photoshoot prep",
      "Priority booking + schedule flexibility",
      "Quarterly in-depth progress review",
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
