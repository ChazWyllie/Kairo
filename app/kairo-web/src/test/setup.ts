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
    APP_URL: "http://localhost:3000",
    ADMIN_NOTIFY_EMAIL: "admin@test.com",
    RESEND_API_KEY: undefined,
    EMAIL_FROM: "Test <test@test.com>",
    AUTH_SECRET: "test-auth-secret-must-be-at-least-32-chars-long!!",
    COACH_SECRET: "test-coach-secret-1234567890",
    CRON_SECRET: "test-cron-secret-1234567890",
    STRIPE_PRICE_FOUNDATION_MONTHLY: "price_test_foundation_m",
    STRIPE_PRICE_FOUNDATION_ANNUAL: "price_test_foundation_a",
    STRIPE_PRICE_COACHING_MONTHLY: "price_test_coaching_m",
    STRIPE_PRICE_COACHING_ANNUAL: "price_test_coaching_a",
    STRIPE_PRICE_PERFORMANCE_MONTHLY: "price_test_performance_m",
    STRIPE_PRICE_PERFORMANCE_ANNUAL: "price_test_performance_a",
    STRIPE_PRICE_VIP_MONTHLY: "price_test_vip_m",
    STRIPE_PRICE_VIP_ANNUAL: "price_test_vip_a",
  },
}));

// ── Mock Prisma ──
export const mockPrisma = {
  member: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  stripeEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  checkIn: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  lead: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  application: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  review: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  programBlock: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  macroTarget: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ── Mock Stripe ──
export const mockStripeCheckoutCreate = vi.fn();
export const mockStripeConstructEvent = vi.fn();
export const mockStripeSubscriptionsUpdate = vi.fn().mockResolvedValue({});

vi.mock("@/services/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate,
      },
    },
    webhooks: {
      constructEvent: mockStripeConstructEvent,
    },
    subscriptions: {
      update: mockStripeSubscriptionsUpdate,
    },
  }),
}));

// ── Mock email service ──
export const mockNotifyAdmin = vi.fn();
export const mockNotifyAdminCancellation = vi.fn();
export const mockSendWelcomeEmail = vi.fn();
export const mockSendQuizWelcomeEmail = vi.fn();
export const mockSendNurtureEmail = vi.fn();
export const mockSendApplicationReceived = vi.fn().mockResolvedValue(undefined);
export const mockSendApplicationApproved = vi.fn().mockResolvedValue(undefined);
export const mockNotifyAdminNewApplication = vi.fn().mockResolvedValue(undefined);
export const mockSendReviewDelivered = vi.fn().mockResolvedValue(undefined);
export const mockSendCheckInReminder = vi.fn().mockResolvedValue(undefined);
export const mockSendProgramUpdated = vi.fn().mockResolvedValue(undefined);

vi.mock("@/services/email", () => ({
  notifyAdmin: mockNotifyAdmin,
  notifyAdminCancellation: mockNotifyAdminCancellation,
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendQuizWelcomeEmail: mockSendQuizWelcomeEmail,
  sendNurtureEmail: mockSendNurtureEmail,
  sendApplicationReceived: mockSendApplicationReceived,
  sendApplicationApproved: mockSendApplicationApproved,
  notifyAdminNewApplication: mockNotifyAdminNewApplication,
  sendReviewDelivered: mockSendReviewDelivered,
  sendCheckInReminder: mockSendCheckInReminder,
  sendProgramUpdated: mockSendProgramUpdated,
}));

// ── Mock rate limiter (always allow — rate-limit.test.ts tests it directly) ──
export const mockRateLimitCheck = vi.fn().mockReturnValue({
  allowed: true,
  retryAfter: 0,
});

export const mockQuizRateLimitCheck = vi.fn().mockReturnValue({
  allowed: true,
  retryAfter: 0,
});

export const mockLoginRateLimitCheck = vi.fn().mockReturnValue({
  allowed: true,
  retryAfter: 0,
});

export const mockRegisterRateLimitCheck = vi.fn().mockReturnValue({
  allowed: true,
  retryAfter: 0,
});

export const mockWaitlistRateLimitCheck = vi.fn().mockReturnValue({
  allowed: true,
  retryAfter: 0,
});

vi.mock("@/lib/rate-limit", () => ({
  checkoutLimiter: {
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
  },
  quizLimiter: {
    check: (...args: unknown[]) => mockQuizRateLimitCheck(...args),
  },
  loginLimiter: {
    check: (...args: unknown[]) => mockLoginRateLimitCheck(...args),
  },
  registerLimiter: {
    check: (...args: unknown[]) => mockRegisterRateLimitCheck(...args),
  },
  waitlistLimiter: {
    check: (...args: unknown[]) => mockWaitlistRateLimitCheck(...args),
  },
  createRateLimiter: vi.fn(),
}));
