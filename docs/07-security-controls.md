# Kairo Coaching — Security Controls

> **Version:** 2.0
> **Last Updated:** 2026-03-05
> **Scope:** MVP (landing page + Stripe subscription flow)
> **Cross-reference:** [03 — Threat Model](03-threat-model.md)

---

## 1. Input Validation

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Checkout request validation | Zod schema — validates `successUrl` and `cancelUrl` as required URL strings | `app/api/checkout/route.ts` | ✅ Implemented |
| No raw `req.body` access | All request parsing goes through Zod; invalid payloads rejected with 400 | `app/api/checkout/route.ts` | ✅ Implemented |
| Webhook body handling | Raw `request.text()` for signature verification — never JSON-parsed before validation | `app/api/webhook/route.ts` | ✅ Implemented |
| SQL injection prevention | Prisma ORM — all queries use parameterized statements | `lib/prisma.ts` | ✅ Implemented |
| Required field enforcement | Webhook rejects `checkout.session.completed` events missing email, customer ID, or subscription ID | `app/api/webhook/route.ts` | ✅ Implemented |

---

## 2. Authentication & Identity

| Control | Implementation | Status |
|---------|---------------|--------|
| No user auth | By design — Stripe handles member identity via Checkout | ✅ By design |
| Webhook caller verification | `stripe.webhooks.constructEvent()` — cryptographic signature verification on every event | ✅ Implemented |
| Signature header required | Missing `stripe-signature` header → 400 rejection before any processing | ✅ Implemented |

> **Note:** MVP has no user login. Stripe is the identity provider. This eliminates an entire class of auth vulnerabilities (credential stuffing, session hijacking, password storage).

---

## 3. Webhook Security (Mitigates: T-01 Webhook Forgery)

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Signature verification | `stripe.webhooks.constructEvent(rawBody, signature, secret)` on every request | `app/api/webhook/route.ts` | ✅ Implemented |
| Raw body integrity | Uses `request.text()` — not `request.json()` — to preserve exact bytes for signature check | `app/api/webhook/route.ts` | ✅ Implemented |
| Event type allowlist | Only `checkout.session.completed` is processed; all other types return 200 + `ignored` | `app/api/webhook/route.ts` | ✅ Implemented |
| Idempotency guard | `StripeEvent` table stores processed event IDs; duplicates return 200 + `already_processed` | `app/api/webhook/route.ts` | ✅ Implemented |
| Pre-processing event storage | Event ID stored *before* member upsert to prevent race condition on duplicate delivery | `app/api/webhook/route.ts` | ✅ Implemented |

---

## 4. Secrets Management (Mitigates: T-05 Secrets Leakage)

| Control | Implementation | Status |
|---------|---------------|--------|
| Env-only secrets | All secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`) loaded from env vars | ✅ Implemented |
| Validated at startup | `@t3-oss/env-nextjs` + Zod validates all required env vars exist and are well-formed at build time | ✅ Implemented |
| `.env.local` gitignored | Dev secrets in `.env.local`; prod secrets via platform-level secret management | ✅ Implemented |
| `env.example` provided | Documents all required vars without exposing values | ✅ Implemented |
| No PII in logs | Structured logging with safe fields only; no email, no Stripe keys | ✅ Implemented |
| Generic error responses | API errors return `code` + `message` — no stack traces, no internal details | ✅ Implemented |

---

## 5. Data Protection (Mitigates: T-05 Information Disclosure)

| Control | Implementation | Status |
|---------|---------------|--------|
| PII minimization | Only email stored; phone optional; no health/fitness data | ✅ Implemented |
| Unique constraints | `email`, `stripeCustomerId`, `stripeSubId` all unique — prevents duplicate member records | ✅ Implemented |
| Upsert pattern | Member creation uses `upsert` — safe for concurrent/duplicate webhook delivery | ✅ Implemented |
| No admin UI | Admin notifications via email only — no dashboard to attack in MVP | ✅ By design |
| Fire-and-forget notifications | Email send failure doesn't block webhook processing or expose errors | ✅ Implemented |

---

## 6. Transport & Infrastructure

| Control | Implementation | Status |
|---------|---------------|--------|
| HTTPS | Enforced by Vercel (production) | ✅ Platform |
| Dependency pinning | `package-lock.json` committed; exact versions | ✅ Implemented |
| Rate limiting | **⚠️ Not yet implemented** — planned for `POST /api/checkout` | ❌ TODO |
| CSP headers | **⚠️ Not yet implemented** — planned via `next.config.ts` | ❌ TODO |
| CORS | Next.js defaults — same-origin only | ✅ Default |

---

## 7. Landing Page (Static)

| Control | Status |
|---------|--------|
| No inline event handlers | ✅ |
| No external scripts | ✅ |
| No dynamic rendering (zero XSS surface) | ✅ |
| No tracking pixels | ✅ |
| Static HTML — no server-side processing | ✅ |

---

## 8. Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Checkout route | 12 unit tests (Zod validation, error paths, Stripe session creation) | ✅ Passing |
| Webhook route | 16 unit tests (signature, idempotency, member upsert, email, edge cases) | ✅ Passing |
| End-to-end flow | Manual: Checkout → real Stripe payment → webhook → Member in DB | ✅ Verified |
| Landing page | 50 tests (HTML structure, a11y, CSS, content) | ✅ Passing |

---

## 9. Open Items

| Item | Priority | Ticket |
|------|----------|--------|
| Rate limiting on `POST /api/checkout` | P2 | Pre-launch |
| CSP + security headers via `next.config.ts` | P2 | Pre-launch |
| Dependabot + `npm audit` in CI | P1 | CI pipeline setup |
| Incident response playbook | P2 | Pre-launch |
| CAPTCHA/honeypot if checkout spam observed | P3 | Post-launch |

---

## 10. Control ↔ Threat Mapping

| Threat (from 03-threat-model.md) | Controls Applied |
|----------------------------------|-----------------|
| T-01 Webhook Forgery | Signature verification, raw body, event allowlist |
| T-02 Replay Attacks | Idempotency via StripeEvent table, upsert pattern |
| T-03 Injection | Zod validation, Prisma parameterized queries |
| T-04 Checkout Spam | ⚠️ Rate limiting TODO |
| T-05 Secrets Leakage | Env-only, validated at startup, no PII in logs |
| T-06 Elevation of Privilege | No admin UI, Dependabot planned |
