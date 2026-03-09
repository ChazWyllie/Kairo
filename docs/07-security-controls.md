# Kairo Coaching — Security Controls

> **Version:** 6.0
> **Last Updated:** 2026-03-09
> **Scope:** Full platform — auth, checkout, webhook, coaching dashboard, member portal, cron jobs
> **Cross-reference:** [03 — Threat Model](03-threat-model.md)

---

## 1. Input Validation

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Checkout request validation | Zod schema — `email` (required), `phone` (optional), `planId` (validated against `ALLOWED_PRICE_IDS`) | `app/api/checkout/route.ts` | ✅ |
| No raw `req.body` access | All request parsing goes through Zod; invalid payloads rejected with 400 | All route files | ✅ |
| Webhook body handling | Raw `request.text()` for signature verification — never JSON-parsed before validation | `app/api/webhook/route.ts` | ✅ |
| SQL injection prevention | Prisma ORM — all queries use parameterized statements | `lib/prisma.ts` | ✅ |
| Required field enforcement | Webhook rejects events missing email, customer ID, or subscription ID | `app/api/webhook/route.ts` | ✅ |
| Auth input validation | Login: email + password (min 1). Register: email + password (8–128 chars) | `app/api/auth/login/route.ts`, `auth/register/route.ts` | ✅ |
| Application input validation | Zod schema — email, fullName (1–200), goal (enum), age (13–120), plus 15+ optional intake fields | `app/api/application/route.ts` | ✅ |
| Onboarding input validation | Zod schema — email, goal (enum), daysPerWeek (1–7), minutesPerSession (enum), injuries (max 500), plus 30+ extended intake fields | `app/api/onboarding/route.ts` | ✅ |
| Check-in input validation | Zod schema — email, workout (bool), meals (0–3), water (bool), steps (bool), note (max 500), plus 20+ enhanced weekly fields | `app/api/checkin/route.ts` | ✅ |
| Check-in respond validation | Zod schema — checkInId, coachStatus (green/yellow/red), coachResponse (max 5000) | `app/api/checkin/respond/route.ts` | ✅ |
| Program validation | Zod schema — email, name (1–200), status (enum), startDate, primaryGoal (enum), 10+ optional fields | `app/api/program/route.ts` | ✅ |
| Macro validation | Zod schema — email, effectiveDate, calories (800–10000), protein (20–500), plus optional fields | `app/api/macro/route.ts` | ✅ |
| Review validation | Zod schema — email, type (enum: monthly/quarterly/form_review/live_call), summary (max 5000), loomLink (URL) | `app/api/review/route.ts` | ✅ |
| Active member gate | Onboarding, check-in, and program endpoints only accept `status: "active"` members — 404 for pending/canceled | Multiple routes | ✅ |
| Check-in duplicate prevention | One check-in per member per day — DB unique constraint + 409 response | `app/api/checkin/route.ts` | ✅ |
| Member lookup validation | Email query param validated before DB query — 400 for missing/invalid | `app/api/member/route.ts` | ✅ |
| No Stripe ID leakage | Member responses omit `stripeCustomerId` and `stripeSubId` | `app/api/member/route.ts` | ✅ |
| No internal ID leakage | Check-in responses omit `memberId` | `app/api/checkin/route.ts` | ✅ |
| Quiz input validation | Zod schema — email, answers (goal, experience, daysPerWeek, minutesPerSession, challenge) | `app/api/quiz/route.ts` | ✅ |

---

## 2. Authentication & Authorization

### 2.1 Member Auth (Session Cookies)

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Member login | `POST /api/auth/login` — email + bcrypt password verification → session cookie | `app/api/auth/login/route.ts` | ✅ |
| Member registration | `POST /api/auth/register` — password-set for active members only (8–128 chars, bcrypt hashed) | `app/api/auth/register/route.ts` | ✅ |
| Session tokens | HMAC-SHA256 JWT with `AUTH_SECRET` (≥32 chars, required); contains `{ email, iat, exp }` | `lib/auth.ts` | ✅ |
| Session cookie flags | HttpOnly, SameSite=Strict, Secure in production, 7-day Max-Age, path=/ | `lib/auth.ts` | ✅ |
| Session verification | `GET /api/auth/me` — verifies HMAC signature (constant-time), checks expiry | `app/api/auth/me/route.ts` | ✅ |
| Session logout | `POST /api/auth/logout` — clears cookie (Max-Age=0) | `app/api/auth/logout/route.ts` | ✅ |
| Member data isolation | `requireMemberOrCoachAuth(request, email)` — session email must match requested email (case-insensitive) | `lib/auth.ts` | ✅ |
| Self-service cancel | `POST /api/member/cancel` — session-authenticated, cancels at period end via Stripe | `app/api/member/cancel/route.ts` | ✅ |

### 2.2 Coach Auth (Bearer Token)

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Coach API auth | `requireCoachAuth(request)` — reads `Authorization: Bearer <COACH_SECRET>` | `lib/auth.ts` | ✅ |
| Constant-time comparison | `timingSafeCompare()` using `crypto.timingSafeEqual` with buffer padding | `lib/auth.ts` | ✅ |
| Secret requirements | `COACH_SECRET` ≥16 chars, required at startup | `lib/env.ts` | ✅ |
| Applied to all coach endpoints | 11 endpoints: coach dashboard, cancel-member, checkin respond, program CRUD, macro CRUD, review CRUD, application PATCH, templates | Multiple routes | ✅ |

### 2.3 Cron Auth (Bearer Token)

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Cron API auth | `requireCronAuth(request)` — reads `Authorization: Bearer <CRON_SECRET>` | `lib/auth.ts` | ✅ |
| Constant-time comparison | Same `timingSafeCompare()` as coach auth | `lib/auth.ts` | ✅ |
| Secret requirements | `CRON_SECRET` ≥16 chars, required at startup | `lib/env.ts` | ✅ |
| Applied to cron endpoints | `POST /api/cron/checkin-reminder`, `POST /api/nurture` | 2 route files | ✅ |

### 2.4 Stripe Webhook Auth

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Webhook signature verification | `stripe.webhooks.constructEvent()` with cryptographic signature | `app/api/webhook/route.ts` | ✅ |
| Signature header required | Missing `stripe-signature` header → 400 | `app/api/webhook/route.ts` | ✅ |

### 2.5 Secret Separation

| Control | Implementation | Status |
|---------|---------------|--------|
| `AUTH_SECRET` independent | Rotating `COACH_SECRET` does not invalidate sessions; rotating `AUTH_SECRET` does not affect API auth | ✅ |
| No hardcoded fallbacks | `getSecret()` returns `env.AUTH_SECRET` directly — no default values | ✅ |

---

## 3. Webhook Security (Mitigates: T-01 Webhook Forgery)

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Signature verification | `stripe.webhooks.constructEvent(rawBody, signature, secret)` on every request | `app/api/webhook/route.ts` | ✅ |
| Raw body integrity | Uses `request.text()` — not `request.json()` — preserves exact bytes for signature check | `app/api/webhook/route.ts` | ✅ |
| Event type allowlist | `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded` processed; others return 200 + `ignored` | `app/api/webhook/route.ts` | ✅ |
| Idempotency guard | `StripeEvent` table stores processed event IDs; duplicates return 200 + `already_processed` | `app/api/webhook/route.ts` | ✅ |
| Pre-processing event storage | Event ID stored *before* member upsert to prevent race conditions | `app/api/webhook/route.ts` | ✅ |

---

## 4. Secrets Management (Mitigates: T-05 Secrets Leakage)

| Control | Implementation | Status |
|---------|---------------|--------|
| Env-only secrets | All secrets loaded from env vars: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AUTH_SECRET`, `COACH_SECRET`, `CRON_SECRET`, `RESEND_API_KEY` | ✅ |
| Validated at startup | `@t3-oss/env-nextjs` + Zod validates all required env vars with format/length constraints | ✅ |
| Minimum secret lengths | `AUTH_SECRET` ≥32 chars, `COACH_SECRET` ≥16 chars, `CRON_SECRET` ≥16 chars | ✅ |
| Format validation | `STRIPE_SECRET_KEY` must start with `sk_`, `STRIPE_WEBHOOK_SECRET` must start with `whsec_` | ✅ |
| Production env guard | `SKIP_ENV_VALIDATION` throws error if set when `NODE_ENV=production` (allowed during build only) | ✅ |
| Secrets in Authorization headers | All coach/cron secrets sent via `Authorization: Bearer` — never in URL query params | ✅ |
| `.env.local` gitignored | Dev secrets in `.env.local`; prod secrets via platform-level secret management | ✅ |
| `env.example` provided | Documents all required vars with generation instructions; no values exposed | ✅ |
| Generic error responses | API errors return `code` + `message` — no stack traces, no internal details | ✅ |
| PII in logs | Known violations in some `console.log` calls (email in application PATCH) | ⚠️ PR6 |

---

## 5. Data Protection (Mitigates: T-05 Information Disclosure)

| Control | Implementation | Status |
|---------|---------------|--------|
| PII minimization | Email + phone as PII; onboarding/intake fields are training preferences, not medical data | ✅ |
| Unique constraints | `email`, `stripeCustomerId`, `stripeSubId` all unique — prevents duplicates | ✅ |
| Upsert pattern | Member creation uses `upsert` — safe for concurrent/duplicate webhook delivery | ✅ |
| Application duplicate guard | Application POST returns 409 for existing email — prevents duplicate submissions | ✅ |
| Fire-and-forget notifications | Email send failure doesn't block processing or expose errors | ✅ |
| Anti-enumeration | Registration merges failure reasons into generic `REGISTRATION_FAILED`; login returns generic `INVALID_CREDENTIALS` | ✅ |

---

## 6. Transport & Infrastructure

| Control | Implementation | Status |
|---------|---------------|--------|
| HTTPS | Enforced by Vercel (production) | ✅ Platform |
| Dependency pinning | `package-lock.json` committed; exact versions | ✅ |
| Security headers (edge) | `proxy.ts` edge middleware: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS | ✅ |
| Security headers (defense-in-depth) | `next.config.ts` `headers()`: duplicate header set + `poweredByHeader: false` | ✅ |
| Rate limiting (checkout) | `checkoutLimiter` — 5 req/60s per IP | ✅ |
| Rate limiting (quiz) | `quizLimiter` — 10 req/60s per IP | ✅ |
| Rate limiting (login) | `loginLimiter` — 5 req/15min per IP+email (returns 429 + `Retry-After`) | ✅ |
| Rate limiting (register) | `registerLimiter` — 5 req/15min per IP (returns 429 + `Retry-After`) | ✅ |
| In-memory limiter limitation | Resets on cold start / redeploy; no cross-process sharing in serverless | ⚠️ Accepted for MVP |
| CORS | Next.js defaults — same-origin only | ✅ Default |
| SameSite cookie | `SameSite=Strict` on session cookie — mitigates CSRF | ✅ |

---

## 7. Quiz & Lead Capture

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Quiz input validation | Zod schema — email, answers (goal, experience, daysPerWeek, minutesPerSession, challenge) | `app/api/quiz/route.ts` | ✅ |
| Quiz rate limiting | 10 req/60s per IP | `lib/rate-limit.ts` | ✅ |
| Lead upsert pattern | Prisma `upsert` on email — safe for concurrent submissions | `app/api/quiz/route.ts` | ✅ |
| No PII in quiz analytics | Analytics contain only tier name, source tag — no email or answers | `lib/analytics.ts` | ✅ |
| Shared email validation | `isValidEmail()` used on both client and server | `lib/validation.ts` | ✅ |
| Lead conversion tracking | Webhook updates `convertedAt` on Lead record when email matches activated member | `app/api/webhook/route.ts` | ✅ |
| Fire-and-forget welcome email | Email failure doesn't block lead creation | `services/email.ts` | ✅ |
| Nurture drip processing | `POST /api/nurture` batch processor with `CRON_SECRET` auth | `app/api/nurture/route.ts` | ✅ |
| One-click unsubscribe | `GET /api/nurture/unsubscribe?email=` sets `nurtureOptedOut=true` | `app/api/nurture/unsubscribe/route.ts` | ✅ |

---

## 8. Application & Qualification Flow

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Public application submission | `POST /api/application` — intentionally public (pre-payment flow) | `app/api/application/route.ts` | ✅ |
| Public status check | `GET /api/application?email=` — intentionally public (applicant tracks status) | `app/api/application/route.ts` | ✅ |
| Coach-only approval | `PATCH /api/application` requires `COACH_SECRET` via Bearer auth | `app/api/application/route.ts` | ✅ |
| Duplicate prevention | Application duplicate check returns 409 | `app/api/application/route.ts` | ✅ |

---

## 9. Coaching Operations

| Control | Implementation | File(s) | Status |
|---------|---------------|---------|--------|
| Coach dashboard | `GET /api/coach` — exception-first portfolio stats, per-client health with triage | `app/api/coach/route.ts` | ✅ |
| Coach cancel member | `POST /api/coach/cancel-member` — cancels at period end via Stripe | `app/api/coach/cancel-member/route.ts` | ✅ |
| Program management | POST/GET/PATCH `/api/program` — coach writes, member reads | `app/api/program/route.ts` | ✅ |
| Macro management | POST/GET/PATCH `/api/macro` — coach writes, member reads | `app/api/macro/route.ts` | ✅ |
| Review management | POST/GET/PATCH `/api/review` — coach writes, member reads | `app/api/review/route.ts` | ✅ |
| Check-in triage | `PATCH /api/checkin/respond` — coach sets green/yellow/red status | `app/api/checkin/respond/route.ts` | ✅ |
| Message templates | `GET /api/templates` — pre-built templates by category | `app/api/templates/route.ts` | ✅ |
| All coach endpoints auth | Every coach endpoint uses `requireCoachAuth()` with constant-time comparison | `lib/auth.ts` | ✅ |

---

## 10. Landing Page (Static)

| Control | Status |
|---------|--------|
| No inline event handlers | ✅ |
| No external scripts | ✅ |
| No dynamic rendering (zero XSS surface) | ✅ |
| No tracking pixels | ✅ |
| Static HTML — no server-side processing | ✅ |

---

## 11. Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Auth login route | 18 tests (validation, rate limiting, coach auth, member auth, errors) | ✅ Passing |
| Auth register route | Tests (validation, eligibility, rate limiting, anti-enumeration) | ✅ Passing |
| Auth logout route | Tests (cookie clearing) | ✅ Passing |
| Auth me route | Tests (profile, expired token, no token) | ✅ Passing |
| Auth library (`auth.ts`) | 40 tests (token create/verify, session cookie, requireCoachAuth, requireCronAuth, requireMemberOrCoachAuth, timingSafeCompare) | ✅ Passing |
| Member cancel route | 8 tests (self-cancel, no session, already canceled, Stripe cancel, DB-only) | ✅ Passing |
| Coach cancel-member route | 11 tests (coach secret, missing email, not found, Stripe cancel, DB-only) | ✅ Passing |
| Checkout route | 19 tests (Zod validation, error paths, Stripe session, rate limiting) | ✅ Passing |
| Webhook route | 23 tests (signature, idempotency, member upsert, cancellation, email, edge cases) | ✅ Passing |
| Quiz route | 23 tests (Zod validation, rate limiting, lead upsert, tier recommendation) | ✅ Passing |
| Quiz engine | 25 tests (scoring, tier boundaries, edge cases) | ✅ Passing |
| Onboarding route | 15 tests (Zod validation, active member gate, field persistence) | ✅ Passing |
| Member lookup route | 6 tests (validation, 404, profile + stats, no Stripe ID leakage) | ✅ Passing |
| Check-in POST | 11 tests (validation, active gate, duplicate prevention, happy path) | ✅ Passing |
| Check-in GET/history | 8 tests (validation, 404, history + stats, limit param) | ✅ Passing |
| Auth 401 tests | 7 tests (member GET, checkin POST/GET, onboarding, review, program, macro — all 401 without auth) | ✅ Passing |
| Rate limiter | 7 tests (allow/deny, window reset, IP isolation, retry-after) | ✅ Passing |
| Security headers | 9 tests (all headers present on HTML/API paths, non-blocking) | ✅ Passing |
| Landing config | 15 tests (section types, content validation) | ✅ Passing |
| Analytics | 9 tests (SSR guard, dev logging, prod no-op, quiz events) | ✅ Passing |
| Lead conversion | 3 tests (webhook lead conversion tracking) | ✅ Passing |
| End-to-end flow | Manual: Checkout → Stripe payment → webhook → Member in DB | ✅ Verified |
| Landing page (static) | 50 tests (HTML structure, a11y, CSS, content) | ✅ Passing |
| **Total** | **480 tests across 34 test files** | ✅ All passing |

---

## 12. Open Items

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Dependabot + `npm audit` in CI | P1 | 📋 CI pipeline setup |
| 2 | HTML-escape user data in email templates | P1 | ⚠️ PR6 |
| 3 | Audit & remove PII from `console.log` calls | P1 | ⚠️ PR6 |
| 4 | In-memory rate limiter resets on cold start — plan Redis/Upstash | P2 | 📋 Post-MVP |
| 5 | No session rotation/revocation — plan `Session` table | P2 | 📋 Post-MVP |
| 6 | No CSRF tokens — `SameSite=Strict` sufficient for MVP | P3 | 📋 Post-MVP |
| 7 | Rate limiting on coach endpoints — or migrate to proper auth | P3 | 📋 Post-MVP |
| 8 | `RESEND_API_KEY` optional → silent stub in production (no alerts) | P2 | 📋 PR8 |
| 9 | Incident response playbook | P2 | 📋 Pre-launch |
| 10 | CAPTCHA/honeypot if spam observed | P3 | 📋 Post-launch |

---

## 13. Control ↔ Threat Mapping

| Threat (from [03-threat-model.md](03-threat-model.md)) | Controls Applied |
|-------------------------------------------------------|------------------|
| T-01 Webhook Forgery | §3 — Signature verification, raw body, event allowlist, idempotency |
| T-02 Replay Attacks | §3 — StripeEvent idempotency table, upsert pattern |
| T-03 Injection | §1 — Zod validation on all inputs, Prisma parameterized queries, CSP headers |
| T-04 Abuse / Spam | §6 — 4 rate limiters (checkout 5/60s, quiz 10/60s, login 5/15min, register 5/15min) |
| T-05 Secrets Leakage | §4 — Env-only with startup validation, Authorization headers (not URL), no Stripe IDs in responses |
| T-06 Elevation of Privilege | §4 — No admin UI, Dependabot planned, pinned deps |
| T-07 Brute-Force Login | §2.1 + §6 — loginLimiter, bcrypt, generic error messages |
| T-08 Session Forgery | §2.1 + §2.5 — HMAC-SHA256 JWT, AUTH_SECRET ≥32 chars, constant-time verify, HttpOnly/SameSite=Strict, 7-day expiry |
| T-09 IDOR on Member Endpoints | §2.1 — `requireMemberOrCoachAuth()` validates email matches session |
| T-10 Account Enumeration | §5 — Merged register errors, generic login errors |
| T-11 Timing Attacks | §2.2 + §2.3 — `timingSafeCompare()` with buffer padding via `crypto.timingSafeEqual` |
| T-12 Coach Secret Brute-Force | §2.2 — Constant-time comparison, ≥16 chars required; no rate limiting (accepted) |
| T-13 CSRF | §6 — SameSite=Strict cookie, same-origin CORS |
