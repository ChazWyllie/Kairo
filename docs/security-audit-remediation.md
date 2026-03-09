# Kairo — Security & Quality Audit Remediation Tracker

> **Audit Date:** 2026-03-08
> **Auditor:** Planner + Reviewer + Security agents
> **Methodology:** STRIDE, OWASP Top 10, agents/reviewer.md checklist
> **Status:** In Progress

---

## Executive Summary

The codebase has grown beyond the original MVP scope (3 endpoints) to 15+ API routes including auth, coach dashboard, check-ins, programs, macros, reviews, applications, and cron jobs. The threat model, security controls docs, and test coverage have not kept pace. This tracker organizes all findings into sequenced PRs.

| Severity | Count |
|----------|-------|
| **CRITICAL** | 4 |
| **HIGH** | 8 |
| **MEDIUM** | 9 |
| **Test Gaps** | 7 |
| **Code Quality** | 6 |
| **Doc Drift** | 4 |

---

## PR1 — Wire Security Middleware + Make Secrets Required

**Branch:** `fix/c01-middleware`
**Priority:** CRITICAL — blocks all other PRs
**Risk:** Without this, the app has zero browser-level protections and a forgeable auth secret.

- [x] **C1 — Wire security headers as Next.js middleware**
  - Created `src/middleware.ts` that re-exports `proxy` as `middleware` + `config`
  - Next.js now auto-invokes the function on every matched request
  - **Verified:** 3 new tests confirm middleware re-export, config matcher, and header presence

- [x] **C2 — Remove hardcoded fallback auth secret**
  - `lib/auth.ts` → `getSecret()` now returns `env.AUTH_SECRET` directly (no fallback)
  - Added `AUTH_SECRET` as required env var (min 32 chars) in `lib/env.ts`
  - Updated `infrastructure/env.example` with generation instructions

- [x] **M1 — Add security headers in `next.config.ts` as defense-in-depth**
  - Added `headers()` with X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS
  - Set `poweredBy: false`

- [x] **M3 — Make `COACH_SECRET` and `CRON_SECRET` required in env validation**
  - Removed `.optional()` from both — app fails at startup if missing

- [x] **M9 — Add production guard for `SKIP_ENV_VALIDATION`**
  - Added runtime guard: throws if `SKIP_ENV_VALIDATION` is set when `NODE_ENV=production`

- [x] **A5 — Separate `AUTH_SECRET` from `COACH_SECRET`**
  - `AUTH_SECRET` is now independent — rotating `COACH_SECRET` no longer invalidates sessions
  - Updated `lib/auth.ts`, `lib/env.ts`, `infrastructure/env.example`

**Tests added/updated:**
- [x] 3 new tests in `proxy.test.ts`: middleware re-export, config matcher, header presence via middleware
- [x] Updated `test/setup.ts` with `AUTH_SECRET` in mock env
- [x] All 369 tests pass (27 test files)

---

## PR2 — Move Secrets from URL to Authorization Header

**Branch:** `fix/c03-secrets-in-headers`
**Priority:** CRITICAL — secrets currently leak into server logs
**Status:** COMPLETE — committed and pushed

- [x] **C3 — Migrate all coach/cron endpoints from `searchParams` to `Authorization: Bearer`**
  - Affected endpoints:
    - [x] `app/api/coach/route.ts`
    - [x] `app/api/coach/cancel-member/route.ts`
    - [x] `app/api/checkin/respond/route.ts`
    - [x] `app/api/program/route.ts`
    - [x] `app/api/macro/route.ts`
    - [x] `app/api/review/route.ts`
    - [x] `app/api/templates/route.ts`
    - [x] `app/api/cron/checkin-reminder/route.ts`
    - [x] `app/api/application/route.ts` (PATCH)
    - [x] `app/api/nurture/route.ts` (refactored to use shared utility)
  - **Pattern:** All use shared `requireCoachAuth()`/`requireCronAuth()` from `lib/auth.ts`

- [x] **Q2 — Create shared `requireCoachAuth()` utility**
  - Reads `Authorization: Bearer <secret>`, uses `crypto.timingSafeEqual()`
  - **File:** `lib/auth.ts` (new export)

- [x] **Q2b — Create shared `requireCronAuth()` utility**
  - Same pattern for `CRON_SECRET`
  - **File:** `lib/auth.ts` (new export)

- [x] **H8 — Fix non-constant-time secret comparison in application PATCH**
  - All routes now use `timingSafeCompare()` via `requireCoachAuth()`/`requireCronAuth()`
  - Uses Node.js `crypto.timingSafeEqual` for constant-time comparison

**Tests added/updated:**
- [x] Updated 8 test files to use `Authorization: Bearer` headers instead of `?secret=`
- [x] Tests cover: missing header → 401, wrong secret → 401, valid header → success
- [x] All 369 tests pass (27 test files)

---

## PR3 — Add Authentication to Member-Facing Endpoints

**Branch:** `fix/c04-member-auth`
**Priority:** CRITICAL — unauthenticated data access via email guessing
**Status:** COMPLETE — committed and pushed

- [x] **C4 — Require session cookie or coach Bearer auth on member data endpoints**
  - Created `requireMemberOrCoachAuth(request, email)` in `lib/auth.ts`
    - Coach Bearer → any email allowed
    - Session cookie JWT → email must match (case-insensitive)
  - Affected endpoints:
    - [x] `app/api/checkin/route.ts` — POST and GET
    - [x] `app/api/member/route.ts` — GET
    - [x] `app/api/onboarding/route.ts` — POST
    - [x] `app/api/review/route.ts` — GET (member path)
    - [x] `app/api/program/route.ts` — GET (member path)
    - [x] `app/api/macro/route.ts` — GET (member path)
  - **Intentionally public:** `app/api/application/route.ts` (pre-payment flow)

- [x] **Build fixes** (discovered during `npm run build`)
  - [x] `next.config.ts`: `poweredBy` → `poweredByHeader` (correct Next.js key)
  - [x] Deleted `src/middleware.ts` (Next.js 16 only supports `proxy.ts`, not both)
  - [x] Fixed escaped quotes in `review/route.ts`

**Tests added/updated:**
- [x] 7 new 401 auth tests (member GET, checkin POST, checkin GET, onboarding POST, review GET, program GET, macro GET)
- [x] New GET /api/checkin describe block with 4 tests (401, 400, 404, 200)
- [x] Updated 7 test helpers with optional `secret` param (default: coach Bearer)
- [x] Updated `checkin/history.test.ts` helper with auth
- [x] Removed 3 middleware re-export tests from `proxy.test.ts` (middleware.ts deleted)
- [x] All 376 tests pass (27 test files)

---

## PR4 — Fix Timing Attacks + Rate Limit Auth

**Branch:** `fix/c04-timing-rate-limit`
**Priority:** HIGH — enables brute-force and token forgery
**Status:** COMPLETE

- [x] **H1 — Fix non-constant-time token signature comparison**
  - `verifySessionToken()` now uses `timingSafeCompare()` instead of `!==`
  - Updated `timingSafeCompare()` to pad buffers to equal length (prevents length-leaking early return)
  - **File:** `lib/auth.ts`

- [x] **H2 — Remove length-check shortcut in coach login path**
  - Removed `password.length === coachSecret.length` guard
  - Now always performs padded constant-time comparison regardless of length
  - **File:** `app/api/auth/login/route.ts`

- [x] **H3 — Add rate limiting to auth endpoints**
  - Created `loginLimiter` (5 req/15min per IP+email) and `registerLimiter` (5 req/15min per IP)
  - Applied to:
    - [x] `POST /api/auth/login` — 429 with Retry-After header
    - [x] `POST /api/auth/register` — 429 with Retry-After header
  - **Files:** `lib/rate-limit.ts`, `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`

- [x] **H4 — Fix account enumeration in register**
  - Merged `NOT_ELIGIBLE` (403) and `ALREADY_REGISTERED` (409) into single `REGISTRATION_FAILED` (403)
  - Same generic error message for all failure cases
  - **File:** `app/api/auth/register/route.ts`

**Tests added/updated:**
- [x] Updated `test/setup.ts` with `mockLoginRateLimitCheck` and `mockRegisterRateLimitCheck`
- [x] All 376 tests pass (27 test files)

---

## PR5 — Auth Test Suite

**Branch:** TBD
**Priority:** HIGH — entire auth system has zero test coverage
**Status:** COMPLETE

- [x] **T1 — Write auth route tests**
  - `auth/login` — validation, rate limiting, coach auth, member auth, errors (18 tests)
  - `auth/register` — validation, rate limiting, not eligible, happy path, errors (17 tests)
  - `auth/logout` — clears cookie, correct flags (3 tests)
  - `auth/me` — no cookie, invalid/tampered token, not found, happy path (7 tests)
  - **Files:** `app/api/auth/login/route.test.ts`, `app/api/auth/register/route.test.ts`, `app/api/auth/logout/route.test.ts`, `app/api/auth/me/route.test.ts`

- [x] **T4 — Write `auth.ts` library tests**
  - `createSessionToken()` — 3-part JWT, email in payload, iat/exp, base64url-safe (5 tests)
  - `verifySessionToken()` — valid, expired, tampered sig/payload, malformed, invalid base64 (6 tests)
  - `getSessionCookieConfig()` — token value, HttpOnly, SameSite, Path, Max-Age, Secure prod/dev (7 tests)
  - `getClearSessionCookie()` — Max-Age=0, empty value, flags (3 tests)
  - `getSessionFromRequest()` — null, missing, single, multiple cookies, JWT-like value (5 tests)
  - `requireCoachAuth()` — valid, wrong, missing, non-Bearer (4 tests)
  - `requireCronAuth()` — valid, wrong, missing (3 tests)
  - `requireMemberOrCoachAuth()` — coach any email, member match, mismatch, case-insensitive, no auth, invalid token, coach priority (7 tests)
  - **File:** `lib/auth.test.ts` (40 tests)

- [x] **T2 — Write `member/cancel` tests**
  - Self-cancel with valid session, no session (401), already canceled (409), Stripe cancel, DB-only cancel, errors (8 tests)
  - **File:** `app/api/member/cancel/route.test.ts`

- [x] **T3 — Write `coach/cancel-member` tests**
  - Valid coach secret, invalid secret, missing/invalid email, not found, already canceled, Stripe cancel, DB-only, errors (11 tests)
  - **File:** `app/api/coach/cancel-member/route.test.ts`

**Changes to test infrastructure:**
- [x] Extracted `mockStripeSubscriptionsUpdate` as named export in `test/setup.ts`

**Verification:**
- [x] `npx vitest run` — 480 tests pass (34 files)
- [x] All auth routes fully covered (login, register, logout, me, member/cancel, coach/cancel-member, auth.ts library)

---

## PR6 — HTML-Escape Email Templates + Fix PII Logging

**Branch:** `fix/pr6-html-escape-pii`
**Priority:** HIGH — HTML injection in emails, PII in logs
**Status:** COMPLETE

- [x] **H5 — Create `escapeHtml()` utility**
  - Escapes `&`, `<`, `>`, `"`, `'` in user-controlled strings
  - **File:** `lib/sanitize.ts` (new)

- [x] **H5b — Apply `escapeHtml()` to all email templates**
  - User-controlled values in `services/email.ts`:
    - [x] `firstName` (in sendApplicationReceived, sendApplicationApproved, sendReviewDelivered, sendProgramUpdated, sendCheckInReminder)
    - [x] `fullName` — via firstName derivation, escaped at interpolation
    - [x] `email` / `memberEmail` (in notifyAdmin)
    - [x] `summary` (in sendReviewDelivered)
    - [x] `adjustmentsMade` (in sendProgramUpdated)
    - [x] `loomLink` (in sendReviewDelivered href)
    - [x] `programName` (in sendProgramUpdated)
    - [x] `stripeCustomerId`, `stripeSubId` (in notifyAdmin, notifyAdminCancellation — defense-in-depth)
    - [x] `tierName` (in sendQuizWelcomeEmail)
    - [x] `row()` helper `display` value (in notifyAdminNewApplication — catches all user fields including label fallbacks)
    - [x] `label.toLowerCase()` (in sendReviewDelivered)
  - Nurture emails (`lib/nurture-emails.ts`) — audited, all interpolations use static lookup maps with safe fallbacks; no changes needed

- [x] **H7 — Remove PII from application PATCH log**
  - `console.log("[application] Status updated:", { email, status })` → `{ status }`
  - **File:** `app/api/application/route.ts`

- [x] **Audit all `console.log` calls for PII across the codebase**
  - [x] `app/api/application/route.ts` line 271 — removed `email` from status update log
  - [x] `app/api/program/route.ts` line 132 — removed `name` from program creation log (kept `id`)
  - [x] Email stubs (`[email-stub]`) — dev-only (gated by `!RESEND_API_KEY`), acceptable for local debugging; PR8 will make `RESEND_API_KEY` required in production

**Tests added:**
- [x] Unit tests for `escapeHtml()` — 10 tests covering `<script>`, `"onclick"`, `& entities`, empty string, no-op, combined chars

**Verification:**
- [x] `npx vitest run` — 490 tests pass (35 files)

---

## PR7 — Update Security Documentation

**Branch:** TBD
**Priority:** HIGH — docs are fundamentally inaccurate

- [x] **Rewrite `docs/03-threat-model.md`**
  - [x] Add all 15+ entry points (auth, coach, check-in, program, macro, review, templates, application, cron, nurture, quiz, onboarding, member, member/cancel, coach/cancel-member)
  - [x] Add auth system threats (brute-force, session forgery, credential stuffing)
  - [x] Add IDOR threat for member-facing endpoints
  - [x] Add timing attack threat
  - [x] Update risk matrix with new threat scores

- [x] **Rewrite `docs/07-security-controls.md`**
  - [x] Update §2 Authentication — document auth system (login, register, JWT sessions, bcrypt)
  - [x] Fix §6 Security headers — accurately reflect middleware wiring status
  - [x] Fix §4 "No PII in logs" — note known violations and fixes applied
  - [x] Add controls for coach auth (Authorization header, constant-time comparison)
  - [x] Add controls for member session auth on data endpoints
  - [x] Update §9 Test Coverage with new auth test counts

- [x] **Update `docs/04-api-spec.md`**
  - [x] Add specs for all new endpoints (auth routes, application, program, macro, review, templates, cron, nurture, member/cancel, coach/cancel-member, checkin/respond)
  - [x] Document auth requirements per endpoint (none, session cookie, coach secret, cron secret)

- [x] **Add secret rotation runbook**
  - [x] Document how to rotate `AUTH_SECRET` (invalidates all sessions)
  - [x] Document how to rotate `COACH_SECRET` (update all API clients)
  - [x] Document how to rotate `STRIPE_WEBHOOK_SECRET` (update in Stripe dashboard first)
  - [x] **File:** `docs/09-deployment-runbook.md` §6 Secret Rotation

---

## PR8 — Code Quality Cleanup

**Branch:** TBD
**Priority:** MEDIUM — maintainability and defense-in-depth

- [ ] **Q1 — Extract duplicated `calculateStreak()`**
  - Identical logic in `checkin/route.ts` and `coach/route.ts`
  - **Fix:** Create `lib/streak.ts`, import from both
  - [ ] Add unit tests for `calculateStreak()`

- [ ] **Q3 — Email service singleton**
  - `services/email.ts` creates new `Resend` instance per call
  - **Fix:** Lazy singleton initialization

- [ ] **Q4/Q5 — Extract business logic from large route files**
  - [ ] `coach/route.ts` (368 lines) → `services/coach.ts`
  - [ ] `checkin/route.ts` (352 lines) → `services/checkin.ts`
  - [ ] `application/route.ts` (305 lines) → `services/application.ts`

- [ ] **M2 — Remove `'unsafe-inline'` from CSP**
  - **File:** `proxy.ts` (or `middleware.ts` after PR1)
  - **Fix:** Use nonce-based or hash-based script loading

- [ ] **M6 — Remove `as any` type assertions**
  - **File:** `checkin/route.ts` — define proper Prisma create input type

- [ ] **M8 — Convert Prisma string status fields to enums**
  - Fields: `Member.status`, `Application.status`, `ProgramBlock.status`, etc.
  - **File:** `prisma/schema.prisma`
  - ⚠️ Requires migration — test thoroughly

- [ ] **M5 — Fix `Secure` cookie flag logic**
  - Set `Secure` whenever HTTPS, not just when `NODE_ENV=production`
  - **File:** `lib/auth.ts`

- [ ] **CF3 — Make `RESEND_API_KEY` required for production**
  - Silent stub in production means no emails sent with no alerts
  - **Fix:** Only allow stub when `NODE_ENV === 'development'`
  - **File:** `lib/env.ts`

- [ ] **CF4 — Move Stripe Price IDs to environment variables**
  - Currently hardcoded in `lib/stripe-prices.ts`
  - **Fix:** Load from env, with validation

---

## Deferred / Post-MVP Items

These are acknowledged risks accepted for MVP with planned follow-up:

| Item | Severity | Rationale |
|------|----------|-----------|
| **H6** — In-memory rate limiter resets on cold start | HIGH | Document limitation. Plan Redis/Upstash migration for production scale. |
| **M4** — No session rotation/revocation | MEDIUM | Stateless JWT is acceptable for MVP. Plan `Session` table for post-MVP. |
| **M7** — No CSRF tokens | MEDIUM | `SameSite=Strict` mitigates most CSRF. Add tokens post-MVP if needed. |
| **Q6** — No structured logging | MEDIUM | Adopt `pino` with request correlation IDs when scaling. |
| **T5** — No integration/E2E tests | HIGH | All tests use mocks. Plan Playwright E2E and DB integration tests. |
| **A4** — Single-secret coach auth model | MEDIUM | Post-MVP: proper coach user accounts with RBAC. |
| **A5b** — Landing page waitlist form is non-functional | LOW | Form shows "success" but never sends data. Wire to quiz API or document as placeholder. |

---

## Verification Checklist (Run After Each PR)

```bash
# Unit tests
cd app/kairo-web && npx vitest run

# Root landing page tests
cd ../.. && npm test

# TypeScript strict
cd app/kairo-web && npx tsc --noEmit

# Lint
cd app/kairo-web && npx next lint

# Security audit
npm audit

# Manual: verify security headers
curl -I http://localhost:3000
```

---

## Risk Summary

**Top 3 regressions to watch:**
1. Middleware change breaks existing route behavior — verify all routes still respond correctly
2. Auth requirement on member endpoints breaks existing client integrations — coordinate with frontend
3. Env var changes require all deployment environments to be updated — update Vercel/platform secrets before deploying

**Detection:**
- CI must pass all tests
- Manual smoke test of checkout → webhook → activation flow
- Verify coach dashboard still functions after auth pattern migration

---

*Last updated: 2026-03-08 — Initial audit*
