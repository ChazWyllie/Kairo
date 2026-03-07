# Kairo Coaching — Security Controls

> **Version:** 5.0
> **Last Updated:** 2026-03-07
> **Scope:** MVP + client dashboard, check-in logging, member lookup
> **Cross-reference:** [03 — Threat Model](03-threat-model.md)

---

## 1. Input Validation

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Checkout request validation | Zod schema — validates `email` (required) and `phone` (optional string) | `app/api/checkout/route.ts` | ✅ Implemented |
| No raw `req.body` access | All request parsing goes through Zod; invalid payloads rejected with 400 | `app/api/checkout/route.ts` | ✅ Implemented |
| Webhook body handling | Raw `request.text()` for signature verification — never JSON-parsed before validation | `app/api/webhook/route.ts` | ✅ Implemented |
| SQL injection prevention | Prisma ORM — all queries use parameterized statements | `lib/prisma.ts` | ✅ Implemented |
| Required field enforcement | Webhook rejects `checkout.session.completed` events missing email, customer ID, or subscription ID | `app/api/webhook/route.ts` | ✅ Implemented |
| Onboarding request validation | Zod schema — validates email (required), goal (enum), daysPerWeek (1-7), minutesPerSession (enum), injuries (max 500 chars) | `app/api/onboarding/route.ts` | ✅ Implemented |
| Active member gate | Onboarding endpoint only updates members with `status: "active"` — pending/canceled members receive 404 | `app/api/onboarding/route.ts` | ✅ Implemented |
| Check-in request validation | Zod schema — validates email (required), workout (bool), meals (0-3), water (bool), steps (bool), note (max 500 chars) | `app/api/checkin/route.ts` | ✅ Implemented |
| Check-in active member gate | Only active members can create check-ins or view history — 404 for pending/canceled | `app/api/checkin/route.ts` | ✅ Implemented |
| Check-in duplicate prevention | One check-in per member per day — DB unique constraint + application-level check returns 409 | `app/api/checkin/route.ts` | ✅ Implemented |
| Member lookup validation | Email query param validated before DB query — 400 for missing/invalid | `app/api/member/route.ts` | ✅ Implemented |
| No Stripe ID leakage | Member lookup response omits `stripeCustomerId` and `stripeSubId` — prevents data leakage | `app/api/member/route.ts` | ✅ Implemented |
| No internal ID leakage | Check-in responses omit `memberId` — internal IDs not exposed | `app/api/checkin/route.ts` | ✅ Implemented |

---

## 2. Authentication & Identity

| Control | Implementation | Status |
|---------|---------------|--------|
| No user auth | By design — Stripe handles member identity via Checkout | ✅ By design |
| Webhook caller verification | `stripe.webhooks.constructEvent()` — cryptographic signature verification on every event | ✅ Implemented |
| Signature header required | Missing `stripe-signature` header → 400 rejection before any processing | ✅ Implemented |

> **Note:** MVP has no user login. Stripe is the identity provider. This eliminates an entire class of auth vulnerabilities (credential stuffing, session hijacking, password storage). Onboarding uses email as identity key — only active (paid) members can submit onboarding data.

---

## 3. Webhook Security (Mitigates: T-01 Webhook Forgery)

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Signature verification | `stripe.webhooks.constructEvent(rawBody, signature, secret)` on every request | `app/api/webhook/route.ts` | ✅ Implemented |
| Raw body integrity | Uses `request.text()` — not `request.json()` — to preserve exact bytes for signature check | `app/api/webhook/route.ts` | ✅ Implemented |
| Event type allowlist | `checkout.session.completed` and `customer.subscription.deleted` are processed; all other types return 200 + `ignored` | `app/api/webhook/route.ts` | ✅ Implemented |
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
| PII minimization | Only email + phone stored as PII; onboarding fields (goal, schedule, injuries) are training preferences, not medical data | ✅ Implemented |
| Unique constraints | `email`, `stripeCustomerId`, `stripeSubId` all unique — prevents duplicate member records | ✅ Implemented |
| Upsert pattern | Member creation uses `upsert` — safe for concurrent/duplicate webhook delivery | ✅ Implemented |
| Client dashboard (email-only) | Dashboard uses email as identity — no auth tokens, no session hijacking surface. Stripe remains the identity provider | ✅ By design |
| Fire-and-forget notifications | Email send failure doesn't block webhook processing or expose errors | ✅ Implemented |

---

## 6. Transport & Infrastructure

| Control | Implementation | Status |
|---------|---------------|--------|
| HTTPS | Enforced by Vercel (production) | ✅ Platform |
| Dependency pinning | `package-lock.json` committed; exact versions | ✅ Implemented |
| Rate limiting (checkout) | In-memory sliding-window limiter on `POST /api/checkout` — 5 req/60s per IP | ✅ Implemented |
| Rate limiting (quiz) | In-memory sliding-window limiter on `POST /api/quiz` — 10 req/60s per IP | ✅ Implemented |
| Security headers | Edge middleware sets CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS | ✅ Implemented |
| CORS | Next.js defaults — same-origin only | ✅ Default |

---

## 7. Quiz & Lead Capture

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Quiz input validation | Zod schema — validates email (required), answers object (goal, experience, daysPerWeek, minutesPerSession, challenge) | `app/api/quiz/route.ts` | ✅ Implemented |
| Quiz rate limiting | 10 req/60s per IP — prevents bot spam and abuse | `lib/rate-limit.ts`, `app/api/quiz/route.ts` | ✅ Implemented |
| Lead upsert pattern | Uses Prisma `upsert` on email — safe for concurrent/duplicate submissions | `app/api/quiz/route.ts` | ✅ Implemented |
| No PII in quiz analytics | Analytics events contain only tier name, source tag — no email, no answers | `lib/analytics.ts` | ✅ Implemented |
| Shared email validation | `isValidEmail()` utility used on both client and server — prevents validation mismatch | `lib/validation.ts` | ✅ Implemented |
| Lead conversion tracking | Webhook updates `convertedAt` on Lead record when email matches activated member | `app/api/webhook/route.ts` | ✅ Implemented |
| Fire-and-forget welcome email | Quiz welcome email failure doesn't block lead creation | `services/email.ts` | ✅ Implemented |

---

## 8. Landing Page (Static)

| Control | Status |
|---------|--------|
| No inline event handlers | ✅ |
| No external scripts | ✅ |
| No dynamic rendering (zero XSS surface) | ✅ |
| No tracking pixels | ✅ |
| Static HTML — no server-side processing | ✅ |

---

## 9. Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Checkout route | 19 unit tests (Zod validation, error paths, Stripe session, rate limiting, pending member upsert) | ✅ Passing |
| Webhook route | 23 unit tests (signature, idempotency, member upsert, cancellation, welcome email, admin notification, edge cases) | ✅ Passing |
| Quiz route | 23 unit tests (Zod validation, rate limiting, lead upsert, tier recommendation, welcome email) | ✅ Passing |
| Onboarding route | 15 unit tests (Zod validation, active member gate, field persistence, error handling) | ✅ Passing |
| Member lookup | 6 unit tests (validation, 404, profile + stats, no Stripe ID leakage) | ✅ Passing |
| Check-in POST | 11 unit tests (validation, active gate, duplicate prevention, happy path, no memberId leakage) | ✅ Passing |
| Check-in GET/history | 8 unit tests (validation, 404, history + stats, limit param, no memberId leakage) | ✅ Passing |
| Rate limiter | 7 unit tests (allow/deny, window reset, IP isolation, retry-after) | ✅ Passing |
| Security headers | 9 unit tests (all headers present on HTML/API paths, non-blocking) | ✅ Passing |
| Quiz engine | 25 unit tests (scoring, tier boundaries, edge cases) | ✅ Passing |
| Landing config | 15 unit tests (section types, content validation) | ✅ Passing |
| Analytics | 9 unit tests (SSR guard, dev logging, prod no-op, quiz events) | ✅ Passing |
| Lead conversion | 3 unit tests (webhook lead conversion tracking) | ✅ Passing |
| End-to-end flow | Manual: Checkout → real Stripe payment → webhook → Member in DB | ✅ Verified |
| Landing page (static) | 50 tests (HTML structure, a11y, CSS, content) | ✅ Passing |

---

## 10. Open Items

| Item | Priority | Ticket |
|------|----------|--------|
| Dependabot + `npm audit` in CI | P1 | CI pipeline setup |
| Incident response playbook | P2 | Pre-launch |
| CAPTCHA/honeypot if checkout spam observed | P3 | Post-launch |

---

## 11. Control ↔ Threat Mapping

| Threat (from 03-threat-model.md) | Controls Applied |
|----------------------------------|------------------|
| T-01 Webhook Forgery | Signature verification, raw body, event allowlist |
| T-02 Replay Attacks | Idempotency via StripeEvent table, upsert pattern |
| T-03 Injection | Zod validation, Prisma parameterized queries |
| T-04 Checkout Spam | Rate limiting on checkout — 5 req/60s per IP |
| T-04b Quiz Spam | Rate limiting on quiz — 10 req/60s per IP; Zod validation; lead upsert (idempotent) |
| T-05 Secrets Leakage | Env-only, validated at startup, no PII in logs |
| T-06 Elevation of Privilege | No admin UI, Dependabot planned |
