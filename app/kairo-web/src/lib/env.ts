import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Guard: SKIP_ENV_VALIDATION must not be set at production runtime.
// Allow it during build phase (NEXT_PHASE=phase-production-build) because
// Vercel injects env vars at runtime, not during `next build`.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
if (
  process.env.SKIP_ENV_VALIDATION &&
  process.env.NODE_ENV === "production" &&
  !isBuildPhase
) {
  throw new Error(
    "SKIP_ENV_VALIDATION is set in production runtime — this is unsafe. " +
      "Remove it from your deployment environment."
  );
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
    STRIPE_SECRET_KEY: z
      .string()
      .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
    APP_URL: z.string().url("APP_URL must be a valid URL"),
    ADMIN_NOTIFY_EMAIL: z.string().email("ADMIN_NOTIFY_EMAIL must be valid"),
    RESEND_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string().min(1, "RESEND_API_KEY is required in production")
        : z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters")
      .describe("Dedicated secret for signing session JWTs — independent of COACH_SECRET"),
    COACH_SECRET: z
      .string()
      .min(16, "COACH_SECRET must be at least 16 characters"),
    CRON_SECRET: z
      .string()
      .min(16, "CRON_SECRET must be at least 16 characters"),
    // Founding Stripe coupon (10% off forever) — optional until coupon is created
    FOUNDING_MEMBER_COUPON_ID: z.string().min(1).optional(),
    // Stripe price IDs — 2-tier coaching model (1:1 Standard / 1:1 Premium)
    STRIPE_PRICE_STANDARD_MONTHLY: z.string().startsWith("price_").optional(),
    STRIPE_PRICE_STANDARD_ANNUAL: z.string().startsWith("price_").optional(),
    STRIPE_PRICE_PREMIUM_MONTHLY: z.string().startsWith("price_").optional(),
    STRIPE_PRICE_PREMIUM_ANNUAL: z.string().startsWith("price_").optional(),
    // Stripe price IDs — one-time template purchases
    STRIPE_TEMPLATE_WORKOUT_PRICE_ID: z.string().startsWith("price_").optional(),
    STRIPE_TEMPLATE_NUTRITION_PRICE_ID: z.string().startsWith("price_").optional(),
    STRIPE_TEMPLATE_SUPPLEMENTS_PRICE_ID: z.string().startsWith("price_").optional(),
    STRIPE_TEMPLATE_BUNDLE_PRICE_ID: z.string().startsWith("price_").optional(),
  },
  // No client-side env vars — Stripe keys stay server-side
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    APP_URL: process.env.APP_URL,
    ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AUTH_SECRET: process.env.AUTH_SECRET,
    COACH_SECRET: process.env.COACH_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    FOUNDING_MEMBER_COUPON_ID: process.env.FOUNDING_MEMBER_COUPON_ID,
    STRIPE_PRICE_STANDARD_MONTHLY: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
    STRIPE_PRICE_STANDARD_ANNUAL: process.env.STRIPE_PRICE_STANDARD_ANNUAL,
    STRIPE_PRICE_PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    STRIPE_PRICE_PREMIUM_ANNUAL: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
    STRIPE_TEMPLATE_WORKOUT_PRICE_ID: process.env.STRIPE_TEMPLATE_WORKOUT_PRICE_ID,
    STRIPE_TEMPLATE_NUTRITION_PRICE_ID: process.env.STRIPE_TEMPLATE_NUTRITION_PRICE_ID,
    STRIPE_TEMPLATE_SUPPLEMENTS_PRICE_ID: process.env.STRIPE_TEMPLATE_SUPPLEMENTS_PRICE_ID,
    STRIPE_TEMPLATE_BUNDLE_PRICE_ID: process.env.STRIPE_TEMPLATE_BUNDLE_PRICE_ID,
  },
  // Skip validation during build phase (env vars are injected at runtime on Vercel,
  // not available during `next build`) or when explicitly bypassed for CI.
  skipValidation: isBuildPhase || !!process.env.SKIP_ENV_VALIDATION,
});
