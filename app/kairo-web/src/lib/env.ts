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
    STRIPE_PRICE_FOUNDATION_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_FOUNDATION_ANNUAL: z.string().startsWith("price_"),
    STRIPE_PRICE_COACHING_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_COACHING_ANNUAL: z.string().startsWith("price_"),
    STRIPE_PRICE_PERFORMANCE_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_PERFORMANCE_ANNUAL: z.string().startsWith("price_"),
    STRIPE_PRICE_VIP_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_VIP_ANNUAL: z.string().startsWith("price_"),
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
    STRIPE_PRICE_FOUNDATION_MONTHLY: process.env.STRIPE_PRICE_FOUNDATION_MONTHLY,
    STRIPE_PRICE_FOUNDATION_ANNUAL: process.env.STRIPE_PRICE_FOUNDATION_ANNUAL,
    STRIPE_PRICE_COACHING_MONTHLY: process.env.STRIPE_PRICE_COACHING_MONTHLY,
    STRIPE_PRICE_COACHING_ANNUAL: process.env.STRIPE_PRICE_COACHING_ANNUAL,
    STRIPE_PRICE_PERFORMANCE_MONTHLY: process.env.STRIPE_PRICE_PERFORMANCE_MONTHLY,
    STRIPE_PRICE_PERFORMANCE_ANNUAL: process.env.STRIPE_PRICE_PERFORMANCE_ANNUAL,
    STRIPE_PRICE_VIP_MONTHLY: process.env.STRIPE_PRICE_VIP_MONTHLY,
    STRIPE_PRICE_VIP_ANNUAL: process.env.STRIPE_PRICE_VIP_ANNUAL,
  },
  // Skip validation during build phase (env vars are injected at runtime on Vercel,
  // not available during `next build`) or when explicitly bypassed for CI.
  skipValidation: isBuildPhase || !!process.env.SKIP_ENV_VALIDATION,
});
