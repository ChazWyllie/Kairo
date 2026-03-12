/**
 * Server-only Stripe price ID utilities.
 *
 * This module accesses env vars and must ONLY be imported by server-side code
 * (API routes, services, test fixtures). Client components must use
 * stripe-prices.ts for display data instead.
 */

import { env } from "@/lib/env";
import { PLANS } from "@/lib/stripe-prices";
import type { PlanTier, PlanDisplay, BillingInterval } from "@/lib/stripe-prices";

/** Price ID lookup table — server only, env vars read here */
const PRICE_IDS: Record<PlanTier, { monthly: string; annual: string }> = {
  foundation: {
    monthly: env.STRIPE_PRICE_FOUNDATION_MONTHLY,
    annual: env.STRIPE_PRICE_FOUNDATION_ANNUAL,
  },
  coaching: {
    monthly: env.STRIPE_PRICE_COACHING_MONTHLY,
    annual: env.STRIPE_PRICE_COACHING_ANNUAL,
  },
  performance: {
    monthly: env.STRIPE_PRICE_PERFORMANCE_MONTHLY,
    annual: env.STRIPE_PRICE_PERFORMANCE_ANNUAL,
  },
  vip: {
    monthly: env.STRIPE_PRICE_VIP_MONTHLY,
    annual: env.STRIPE_PRICE_VIP_ANNUAL,
  },
};

/** Get a Stripe price ID for a given tier + interval */
export function getStripePriceId(tier: PlanTier, interval: BillingInterval): string {
  return PRICE_IDS[tier][interval === "monthly" ? "monthly" : "annual"];
}

/** Set of all valid Stripe Price IDs — for checkout validation */
export const ALLOWED_PRICE_IDS = new Set(
  Object.values(PRICE_IDS).flatMap((p) => [p.monthly, p.annual])
);

/** Pre-built reverse map: priceId → { tier, interval } for O(1) lookup */
const PRICE_ID_REVERSE = new Map<string, { tier: PlanTier; interval: BillingInterval }>(
  (Object.entries(PRICE_IDS) as [PlanTier, { monthly: string; annual: string }][]).flatMap(
    ([tier, ids]) => [
      [ids.monthly, { tier, interval: "monthly" as BillingInterval }],
      [ids.annual, { tier, interval: "annual" as BillingInterval }],
    ]
  )
);

/**
 * Look up plan display config + billing interval from a Stripe Price ID.
 * Returns null for unknown price IDs.
 */
export function getPlanFromPriceId(
  priceId: string
): { plan: PlanDisplay; tier: PlanTier; interval: BillingInterval } | null {
  const entry = PRICE_ID_REVERSE.get(priceId);
  if (!entry) return null;
  const plan = PLANS.find((p) => p.tier === entry.tier) ?? null;
  if (!plan) return null;
  return { plan, tier: entry.tier, interval: entry.interval };
}
