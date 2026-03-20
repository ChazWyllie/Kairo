/**
 * Shared test fixtures for checkout and webhook tests.
 * No real secrets — all fake test data.
 */
import Stripe from "stripe";

// ── Test Plan ID — standard/monthly price (matches setup.ts env mock) ──
// Note: Foundation tier no longer has a configured price ID.
// Using hardcoded value to match STRIPE_PRICE_STANDARD_MONTHLY in setup.ts.
export const TEST_PLAN_ID = "price_test_standard_m";

// ── Stripe Checkout Session fixtures ──

export const MOCK_CHECKOUT_SESSION: Partial<Stripe.Checkout.Session> = {
  id: "cs_test_abc123",
  url: "https://checkout.stripe.com/pay/cs_test_abc123",
  mode: "subscription",
};

export const MOCK_CHECKOUT_SESSION_NO_URL: Partial<Stripe.Checkout.Session> = {
  id: "cs_test_no_url",
  url: null,
  mode: "subscription",
};

// ── Stripe Webhook Event fixtures ──

export function makeCheckoutCompletedEvent(
  overrides: {
    eventId?: string;
    email?: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    metadata?: Record<string, string>;
  } = {}
): Stripe.Event {
  const {
    eventId = "evt_test_123",
    email = "member@test.com",
    customerId = "cus_test_abc",
    subscriptionId = "sub_test_xyz",
    metadata = { planTier: "foundation", billingInterval: "monthly" },
  } = overrides;

  return {
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    api_version: "2025-12-18.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: {
        id: "cs_test_session",
        object: "checkout.session",
        customer: customerId,
        subscription: subscriptionId,
        customer_details: {
          email,
        },
        metadata,
        mode: "subscription",
      } as unknown as Stripe.Checkout.Session,
    },
  } as unknown as Stripe.Event;
}

export function makeUnknownEvent(type = "invoice.payment_failed"): Stripe.Event {
  return {
    id: "evt_unknown_123",
    object: "event",
    type,
    api_version: "2025-12-18.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: {} as Stripe.Event.Data.Object,
    },
  } as unknown as Stripe.Event;
}

export function makeSubscriptionDeletedEvent(
  overrides: {
    eventId?: string;
    subscriptionId?: string | null;
  } = {}
): Stripe.Event {
  const {
    eventId = "evt_sub_del_123",
    subscriptionId = "sub_canceled_xyz",
  } = overrides;

  return {
    id: eventId,
    object: "event",
    type: "customer.subscription.deleted",
    api_version: "2025-12-18.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: {
        id: subscriptionId,
        object: "subscription",
      } as unknown as Stripe.Subscription,
    },
  } as unknown as Stripe.Event;
}

// ── Request helpers ──

export function makeWebhookRequest(
  body: string,
  signature: string | null = "sig_test_valid"
): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature) {
    headers.set("stripe-signature", signature);
  }
  return new Request("http://localhost:3000/api/webhook", {
    method: "POST",
    headers,
    body,
  });
}

export function makeCheckoutRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Quiz fixtures ──

export const VALID_QUIZ_ANSWERS = {
  goal: "muscle" as const,
  experience: "intermediate" as const,
  daysPerWeek: 4,
  minutesPerSession: 30,
  challenge: "consistency" as const,
};

export const MINIMAL_QUIZ_SUBMISSION = {
  email: "quiz@test.com",
  answers: {},
};

export const FULL_QUIZ_SUBMISSION = {
  email: "quiz@test.com",
  answers: VALID_QUIZ_ANSWERS,
};

export const MOCK_LEAD = {
  id: "lead_test_abc",
  email: "quiz@test.com",
  quizAnswers: VALID_QUIZ_ANSWERS,
  recommendedTier: "standard",
  source: "quiz",
  capturedAt: new Date("2026-03-07T00:00:00Z"),
  convertedAt: null,
};

export function makeQuizRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
