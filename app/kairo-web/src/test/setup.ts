/**
 * Vitest global setup — mocks for env, Prisma, Stripe, and email.
 * Keeps tests deterministic and isolated from real services.
 */
import { vi } from "vitest";

// ── Mock env vars (before any module imports env) ──
vi.mock("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    STRIPE_SECRET_KEY: "sk_test_fake",
    STRIPE_WEBHOOK_SECRET: "whsec_test_fake",
    STRIPE_PRICE_ID: "price_test_fake",
    APP_URL: "http://localhost:3000",
    ADMIN_NOTIFY_EMAIL: "admin@test.com",
    RESEND_API_KEY: undefined,
    EMAIL_FROM: "Test <test@test.com>",
  },
}));

// ── Mock Prisma ──
export const mockPrisma = {
  member: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  stripeEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ── Mock Stripe ──
export const mockStripeCheckoutCreate = vi.fn();
export const mockStripeConstructEvent = vi.fn();

vi.mock("@/services/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate,
      },
    },
    webhooks: {
      constructEvent: mockStripeConstructEvent,
    },
  },
}));

// ── Mock email service ──
export const mockNotifyAdmin = vi.fn();

vi.mock("@/services/email", () => ({
  notifyAdmin: mockNotifyAdmin,
}));
