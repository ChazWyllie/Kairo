# Kairo — Stripe Payment Flow

> **Version:** 1.0
> **Last Updated:** 2026-02-15
> **Status:** PLANNED (Phase 4+)

---

## 1. Overview

Kairo uses Stripe for subscription billing. Three tiers:

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic plan generation, limited insights |
| Pro | $9.99/mo | Full plan generation, all insights, meal suggestions |
| Teams | TBD | Everything in Pro + team challenges, admin dashboard |

---

## 2. Flow Diagram

```
User clicks "Upgrade to Pro"
        │
        ▼
┌─────────────────────┐
│  Create Stripe      │
│  Checkout Session    │  ← Server-side, POST /api/checkout
│  (mode: subscription)│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Stripe Checkout     │  ← Hosted by Stripe (PCI-compliant)
│  (user enters card)  │
└────────┬────────────┘
         │
    ┌────▼────┐
    │ Success? │
    ├── Yes ──► Redirect to /dashboard?session_id=xxx
    └── No ───► Redirect to /pricing?cancelled=true
         │
         ▼
┌─────────────────────┐
│  Stripe Webhook      │  ← POST /api/webhooks/stripe
│  checkout.session    │
│  .completed          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Update Subscription │
│  record in DB        │
│  Activate Pro tier   │
└─────────────────────┘
```

---

## 3. Webhook Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update Subscription, activate tier |
| `invoice.paid` | Extend subscription period |
| `invoice.payment_failed` | Mark status `past_due`, notify user |
| `customer.subscription.deleted` | Mark status `cancelled`, downgrade to Free |
| `customer.subscription.updated` | Update plan/status |

---

## 4. Security Requirements

- Webhook signature verification (`stripe-signature` header)
- Checkout sessions created server-side only (never expose secret key)
- `STRIPE_SECRET_KEY` in environment variables, never in code
- `STRIPE_WEBHOOK_SECRET` for webhook validation
- Idempotency keys on all create operations
- See [infrastructure/secrets-guidance.md](../infrastructure/secrets-guidance.md)

---

## 5. Testing

- Use Stripe test mode (`sk_test_*` keys)
- Test card numbers: `4242424242424242` (success), `4000000000000002` (decline)
- Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## 6. Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
```
