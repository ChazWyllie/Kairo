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

**Branch:** TBD
**Priority:** CRITICAL — secrets currently leak into server logs

- [ ] **C3 — Migrate all coach/cron endpoints from `searchParams` to `Authorization: Bearer`**
  - Affected endpoints:
    - [ ] `app/api/coach/route.ts`
    - [ ] `app/api/coach/cancel-member/route.ts`
    - [ ] `app/api/checkin/respond/route.ts`
    - [ ] `app/api/program/route.ts`
    - [ ] `app/api/macro/route.ts`
    - [ ] `app/api/review/route.ts`
    - [ ] `app/api/templates/route.ts`
    - [ ] `app/api/cron/checkin-reminder/route.ts`
    - [ ] `app/api/application/route.ts` (PATCH)
  - **Pattern:** Use the nurture endpoint as reference (already uses `Authorization` header)

- [ ] **Q2 — Create shared `requireCoachAuth()` utility**
  - Reads `Authorization: Bearer <secret>`, uses `crypto.timingSafeEqual()`
  - **File:** `lib/auth.ts` (new export)

- [ ] **Q2b — Create shared `requireCronAuth()` utility**
  - Same pattern for `CRON_SECRET`
  - **File:** `lib/auth.ts` (new export)

- [ ] **H8 — Fix non-constant-time secret comparison in application PATCH**
  - `if (!secret || secret !== env.COACH_SECRET)` → use `crypto.timingSafeEqual()`
  - **File:** `app/api/application/route.ts`

**Tests to add/update:**
- [ ] Update all coach/cron route tests to use `Authorization` header
- [ ] Test missing header → 401
- [ ] Test wrong secret → 401
- [ ] Test valid header → success

---

## PR3 — Add Authentication to Member-Facing Endpoints

**Branch:** TBD
**Priority:** CRITICAL — unauthenticated data access via email guessing

- [ ] **C4 — Require session cookie auth on member data endpoints**
  - Affected endpoints (all accept email with no auth):
    - [ ] `app/api/checkin/route.ts` — POST and GET
    - [ ] `app/api/member/route.ts` — GET
    - [ ] `app/api/onboarding/route.ts` — POST
    - [ ] `app/api/review/route.ts` — GET (member path)
    - [ ] `app/api/program/route.ts` — GET (member path)
    - [ ] `app/api/macro/route.ts` — GET (member path)
    - [ ] `app/api/application/route.ts` — GET
  - **Fix:** Call `verifySessionToken()` → verify authenticated email matches requested email or has coach role

**Tests to add/update:**
- [ ] Test unauthenticated request → 401
- [ ] Test authenticated request for wrong email → 403
- [ ] Test authenticated request for own email → 200
- [ ] Test coach-authenticated request for any email → 200

---

## PR4 — Fix Timing Attacks + Rate Limit Auth

**Branch:** TBD
**Priority:** HIGH — enables brute-force and token forgery

- [ ] **H1 — Fix non-constant-time token signature comparison**
  - `auth.ts` → `if (signature !== expectedSig)` → use `crypto.timingSafeEqual()`
  - **File:** `lib/auth.ts`

- [ ] **H2 — Remove length-check shortcut in coach login path**
  - `auth/login/route.ts` → `if (coachSecret && password.length === coachSecret.length)` leaks secret length
  - **Fix:** Always perform constant-time comparison regardless of length
  - **File:** `app/api/auth/login/route.ts`

- [ ] **H3 — Add rate limiting to auth endpoints**
  - Apply `checkRateLimit()` to:
    - [ ] `POST /api/auth/login` — 5 req/15min per IP+email
    - [ ] `POST /api/auth/register` — 5 req/15min per IP
  - **Files:** `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`

- [ ] **H4 — Fix account enumeration in register**
  - Returns 403 `"NOT_ELIGIBLE"` vs 409 `"ALREADY_REGISTERED"` — reveals membership status
  - **Fix:** Return same generic error for both cases
  - **File:** `app/api/auth/register/route.ts`

**Tests to add/update:**
- [ ] Test rate limiting triggers on login after N attempts
- [ ] Test register returns same error for unknown vs already-registered email
- [ ] Test constant-time comparison doesn't short-circuit

---

## PR5 — Auth Test Suite

**Branch:** TBD
**Priority:** HIGH — entire auth system has zero test coverage

- [ ] **T1 — Write auth route tests**
  - `auth/login` — valid login, invalid password, missing fields, coach hidden path, rate limit
  - `auth/register` — valid registration, not eligible, already registered, missing fields
  - `auth/logout` — clears cookie
  - `auth/me` — returns profile, expired token, no token
  - **Target:** ~20-25 tests

- [ ] **T4 — Write `auth.ts` library tests**
  - `createSessionToken()` — produces valid token
  - `verifySessionToken()` — valid, expired, tampered signature, wrong secret, malformed
  - `getSessionFromRequest()` — with cookie, without cookie
  - `getSessionCookieConfig()` — production vs development flags
  - `getClearSessionCookie()` — expires in past
  - **Target:** ~15 tests

- [ ] **T2 — Write `member/cancel` tests**
  - Self-cancel with valid session, no session (401), inactive member, Stripe cancel, DB-only cancel
  - **Target:** ~8 tests

- [ ] **T3 — Write `coach/cancel-member` tests**
  - Valid coach secret, invalid secret, missing email, active member, already canceled
  - **Target:** ~8 tests

**Verification:**
- [ ] `npx vitest run` — all pass
- [ ] Coverage report shows auth routes ≥ 80%

---

## PR6 — HTML-Escape Email Templates + Fix PII Logging

**Branch:** TBD
**Priority:** HIGH — HTML injection in emails, PII in logs

- [ ] **H5 — Create `escapeHtml()` utility**
  - Escapes `&`, `<`, `>`, `"`, `'` in user-controlled strings
  - **File:** `lib/sanitize.ts` (new)

- [ ] **H5b — Apply `escapeHtml()` to all email templates**
  - User-controlled values in `services/email.ts`:
    - [ ] `firstName`
    - [ ] `fullName`
    - [ ] `email`
    - [ ] `summary`
    - [ ] `adjustmentsMade`
    - [ ] `loomLink`
    - [ ] Any other interpolated user data

- [ ] **H7 — Remove PII from application PATCH log**
  - `console.log("[application] Status updated:", { email, status })` → remove `email`
  - **File:** `app/api/application/route.ts`

- [ ] **Audit all `console.log` calls for PII across the codebase**
  - [ ] Check every route file for email/phone/name in log statements
  - [ ] Replace with safe identifiers (e.g., `memberId`, `applicationId`)

**Tests to add:**
- [ ] Unit tests for `escapeHtml()` — covers `<script>`, `"onclick"`, `& entities`, null/undefined

---

## PR7 — Update Security Documentation

**Branch:** TBD
**Priority:** HIGH — docs are fundamentally inaccurate

- [ ] **Rewrite `docs/03-threat-model.md`**
  - [ ] Add all 15+ entry points (auth, coach, check-in, program, macro, review, templates, application, cron, nurture, quiz, onboarding, member, member/cancel, coach/cancel-member)
  - [ ] Add auth system threats (brute-force, session forgery, credential stuffing)
  - [ ] Add IDOR threat for member-facing endpoints
  - [ ] Add timing attack threat
  - [ ] Update risk matrix with new threat scores

- [ ] **Rewrite `docs/07-security-controls.md`**
  - [ ] Update §2 Authentication — document auth system (login, register, JWT sessions, bcrypt)
  - [ ] Fix §6 Security headers — accurately reflect middleware wiring status
  - [ ] Fix §4 "No PII in logs" — note known violations and fixes applied
  - [ ] Add controls for coach auth (Authorization header, constant-time comparison)
  - [ ] Add controls for member session auth on data endpoints
  - [ ] Update §9 Test Coverage with new auth test counts

- [ ] **Update `docs/04-api-spec.md`**
  - [ ] Add specs for all new endpoints (auth routes, application, program, macro, review, templates, cron, nurture, member/cancel, coach/cancel-member, checkin/respond)
  - [ ] Document auth requirements per endpoint (none, session cookie, coach secret, cron secret)

- [ ] **Add secret rotation runbook**
  - [ ] Document how to rotate `AUTH_SECRET` (invalidates all sessions)
  - [ ] Document how to rotate `COACH_SECRET` (update all API clients)
  - [ ] Document how to rotate `STRIPE_WEBHOOK_SECRET` (update in Stripe dashboard first)
  - [ ] **File:** `docs/09-deployment-runbook.md` (append) or new `docs/secret-rotation.md`

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
