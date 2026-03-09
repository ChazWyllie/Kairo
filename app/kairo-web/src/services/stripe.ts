import Stripe from "stripe";
import { env } from "@/lib/env";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

/**
 * Lazy Stripe client — only instantiated on first access.
 * Prevents build-time errors when env vars aren't available
 * (e.g., Vercel build phase with SKIP_ENV_VALIDATION).
 */
export function getStripe(): Stripe {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return globalForStripe.stripe;
}
