# Kairo Coaching — Stripe Payment Flow

> **Version:** 2.0
> **Last Updated:** 2026-03-05
> **Status:** MVP — Active

---

## 1. Overview

Kairo uses Stripe Checkout (hosted) for a single subscription product. Stripe handles all payment UI and card data — we never touch it.

| Product | Price | Billing |
|---------|-------|---------|
| Kairo Coaching | $50.00 USD | Monthly, recurring |

Price ID: configured via `STRIPE_PRICE_ID` env var.

---

## 2. Flow Diagram

```
Visitor lands on page (from Instagram bio link)
        │
        ▼
┌─────────────────────┐
│  Clicks CTA          │  ← "Start Coaching" button
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  POST /api/checkout  │  ← Server creates Stripe Checkout Session
│  line_items:         │     mode: subscription
│    STRIPE_PRICE_ID   │     from env var
│    quantity: 1       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Stripe Checkout     │  ← Hosted by Stripe (PCI-compliant)
│  (user enters card)  │     Collects email automatically
└────────┬────────────┘
         │
    ┌────▼────┐
    │ Success? │
    ├── Yes ──► Redirect to /success?session_id={CHECKOUT_SESSION_ID}
    └── No ───► Redirect to /cancel
         │
         ▼ (async, seconds later)
┌─────────────────────┐
│  Stripe sends        │
│  checkout.session    │  ← POST /api/webhook
│  .completed          │     with stripe-signature header
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Webhook handler:    │
│  1. Verify signature │  ← stripe.webhooks.constructEvent()
│  2. Check idempotency│  ← StripeEvent table lookup
│  3. Upsert Member    │  ← email, stripeCustomerId, stripeSubId
│  4. Set status=active│
│  5. Send admin email │  ← Resend notification
└─────────────────────┘
```

---

## 3. Webhook Events (MVP)

| Event | Action | Idempotency |
|-------|--------|-------------|
| `checkout.session.completed` | Create/activate Member record, notify admin | Store event ID in `StripeEvent` table; skip if already processed |

### Post-MVP (add when needed)
| Event | Action |
|-------|--------|
| `invoice.payment_failed` | Mark status `past_due`, notify member |
| `customer.subscription.deleted` | Mark status `canceled` |
| `customer.subscription.updated` | Update subscription details |

---

## 4. Security Requirements

- **Signature verification:** Every webhook request verified with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
- **Idempotency:** Check `StripeEvent` table before processing; skip duplicates
- **Server-side only:** Checkout sessions created on the server; `STRIPE_SECRET_KEY` never exposed to the client
- **Secrets in env vars only:** See [infrastructure/secrets-guidance.md](../infrastructure/secrets-guidance.md)
- **Strict event handling:** Only process `checkout.session.completed`; return 200 for unknown events without action
- Cross-reference: [03 — Threat Model](03-threat-model.md), [07 — Security Controls](07-security-controls.md)

---

## 5. Testing

### Local Development
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook`
4. Use the CLI-provided `whsec_...` as `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Test Cards
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 3220` | 3D Secure required |

### Trigger Test Events
```bash
stripe trigger checkout.session.completed
```

---

## 6. Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...          # API secret key (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Publishable key (for client if needed)
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret
STRIPE_PRICE_ID=price_...              # $50/mo Kairo Coaching (test mode)
```

---

## 7. Data Model Reference

See `app/kairo-web/prisma/schema.prisma`:

- **`Member`** — email, phone?, stripeCustomerId, stripeSubId, status (pending → active → canceled)
- **`StripeEvent`** — stores processed event IDs for idempotency
