# Kairo Coaching — Threat Model

> **Version:** 2.0
> **Last Updated:** 2026-03-09
> **Methodology:** STRIDE
> **Scope:** Full platform — auth, checkout, webhook, coaching dashboard, member portal, cron jobs

---

## 1. Assets

| Asset | Sensitivity | Storage |
|-------|-------------|---------|
| `STRIPE_SECRET_KEY` | Critical | Environment variable only |
| `STRIPE_WEBHOOK_SECRET` | Critical | Environment variable only |
| `AUTH_SECRET` (session JWT signing, ≥32 chars) | Critical | Environment variable only |
| `COACH_SECRET` (API auth, ≥16 chars) | Critical | Environment variable only |
| `CRON_SECRET` (cron job auth, ≥16 chars) | Critical | Environment variable only |
| `RESEND_API_KEY` | High | Environment variable only |
| Member passwords | High | PostgreSQL, bcrypt-hashed |
| Session tokens (HMAC-SHA256 JWTs) | High | HttpOnly / SameSite=Strict cookies |
| Member records (email, phone, Stripe IDs, status) | High | PostgreSQL, encrypted at rest |
| Lead / Application records (email, phone, intake data) | High | PostgreSQL, encrypted at rest |
| Check-in / Program / Macro / Review records | Medium | PostgreSQL, encrypted at rest |

---

## 2. Entry Points

### 2.1 Public (No Auth)

| Entry Point | Method | Auth | Rate Limit |
|-------------|--------|------|------------|
| Landing page | — | None (static HTML) | — |
| `POST /api/checkout` | POST | None | 5 req/60s per IP |
| `POST /api/quiz` | POST | None | 10 req/60s per IP |
| `POST /api/application` | POST | None | — |
| `GET /api/application?email=` | GET | None | — |
| `GET /api/nurture/unsubscribe?email=` | GET | None (one-click unsubscribe) | — |

### 2.2 Rate-Limited Auth Endpoints

| Entry Point | Method | Auth | Rate Limit |
|-------------|--------|------|------------|
| `POST /api/auth/login` | POST | None (issues session cookie) | 5 req/15min per IP+email |
| `POST /api/auth/register` | POST | None (sets password) | 5 req/15min per IP |

### 2.3 Session Cookie (Member Auth)

| Entry Point | Method | Auth |
|-------------|--------|------|
| `GET /api/auth/me` | GET | HMAC-SHA256 JWT in `kairo_session` cookie |
| `POST /api/auth/logout` | POST | Clears session cookie |
| `POST /api/member/cancel` | POST | Session cookie (email from token) |

### 2.4 Member or Coach Auth

| Entry Point | Method | Auth |
|-------------|--------|------|
| `POST /api/checkin` | POST | Session cookie (email match) OR Coach Bearer |
| `GET /api/checkin?email=` | GET | Session cookie (email match) OR Coach Bearer |
| `GET /api/member?email=` | GET | Session cookie (email match) OR Coach Bearer |
| `POST /api/onboarding` | POST | Session cookie (email match) OR Coach Bearer |
| `GET /api/review?email=` | GET | Session cookie (email match) OR Coach Bearer |
| `GET /api/program?email=` | GET | Session cookie (email match) OR Coach Bearer |
| `GET /api/macro?email=` | GET | Session cookie (email match) OR Coach Bearer |

### 2.5 Coach Bearer Only

| Entry Point | Method | Auth |
|-------------|--------|------|
| `GET /api/coach` | GET | `Authorization: Bearer <COACH_SECRET>` |
| `POST /api/coach/cancel-member` | POST | `Authorization: Bearer <COACH_SECRET>` |
| `PATCH /api/checkin/respond` | PATCH | `Authorization: Bearer <COACH_SECRET>` |
| `POST /api/program` | POST | `Authorization: Bearer <COACH_SECRET>` |
| `PATCH /api/program` | PATCH | `Authorization: Bearer <COACH_SECRET>` |
| `POST /api/macro` | POST | `Authorization: Bearer <COACH_SECRET>` |
| `PATCH /api/macro` | PATCH | `Authorization: Bearer <COACH_SECRET>` |
| `POST /api/review` | POST | `Authorization: Bearer <COACH_SECRET>` |
| `PATCH /api/review` | PATCH | `Authorization: Bearer <COACH_SECRET>` |
| `PATCH /api/application` | PATCH | `Authorization: Bearer <COACH_SECRET>` |
| `GET /api/templates` | GET | `Authorization: Bearer <COACH_SECRET>` |

### 2.6 Cron Bearer Only

| Entry Point | Method | Auth |
|-------------|--------|------|
| `POST /api/cron/checkin-reminder` | POST | `Authorization: Bearer <CRON_SECRET>` |
| `POST /api/nurture` | POST | `Authorization: Bearer <CRON_SECRET>` |

### 2.7 Stripe Signature

| Entry Point | Method | Auth |
|-------------|--------|------|
| `POST /api/webhook` | POST | `stripe.webhooks.constructEvent()` + `StripeEvent` idempotency |

---

## 3. Trust Boundaries

```
┌─────────────────────────┐
│    Public Internet       │
│    (untrusted)           │
└────────────┬────────────┘
             │
     ┌───────▼───────┐
     │  Edge / CDN    │  ← Static assets, security headers (proxy.ts)
     │  Rate Limiting │  ← IP-based sliding window (checkout, quiz, login, register)
     └───────┬───────┘
             │
     ┌───────▼───────────────────────────────────────┐
     │              Next.js API Layer                 │
     │                                                │
     │  ┌───────────────────────────────────────┐     │
     │  │  Auth Boundary                        │     │
     │  │  • Session cookie (HMAC-SHA256 JWT)   │     │
     │  │  • Coach Bearer (COACH_SECRET)        │     │
     │  │  • Cron Bearer (CRON_SECRET)          │     │
     │  │  • Stripe signature verification      │     │
     │  └───────────────┬───────────────────────┘     │
     │                  │                              │
     │  ┌───────────────▼───────────────────────┐     │
     │  │  Input Validation (Zod schemas)       │     │
     │  └───────────────┬───────────────────────┘     │
     └──────────────────┼─────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
   ┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
   │ PostgreSQL  │ │ Stripe │ │   Resend    │
   │ (Prisma)    │ │  API   │ │ (email)     │
   └─────────────┘ └────────┘ └─────────────┘
```

---

## 4. Top Threats & Mitigations

### T-01 — Webhook Forgery (Spoofing / Tampering)
| Threat | Mitigation | Status |
|--------|------------|--------|
| Attacker sends fake webhook events | `stripe.webhooks.constructEvent()` signature verification | ✅ |
| Modified event payloads | Signature covers entire raw body — reject on mismatch | ✅ |
| Unexpected event types | Allowlist: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`; all others return 200 + `ignored` | ✅ |

### T-02 — Replay Attacks (Repudiation)
| Threat | Mitigation | Status |
|--------|------------|--------|
| Duplicate webhook delivery | `StripeEvent` table stores processed event IDs; duplicates return `already_processed` | ✅ |
| Duplicate member activation | Upsert pattern; unique constraint on `stripeCustomerId` | ✅ |

### T-03 — Injection (Tampering)
| Threat | Mitigation | Status |
|--------|------------|--------|
| SQL injection | Prisma ORM — all queries use parameterized statements | ✅ |
| Malformed request data | Zod schema validation on all endpoint inputs | ✅ |
| XSS via stored data | CSP headers via edge middleware; no user-generated content rendered server-side | ✅ |
| HTML injection in emails | User data interpolated into HTML email templates without escaping | ⚠️ PR6 |

### T-04 — Abuse / Spam (Denial of Service)
| Threat | Mitigation | Status |
|--------|------------|--------|
| Checkout session spam | `checkoutLimiter` — 5 req/60s per IP | ✅ |
| Quiz spam | `quizLimiter` — 10 req/60s per IP | ✅ |
| Login brute-force | `loginLimiter` — 5 req/15min per IP+email | ✅ |
| Registration abuse | `registerLimiter` — 5 req/15min per IP | ✅ |
| Coach/cron endpoint flooding | No rate limiting on Bearer-auth endpoints | ⚠️ Accepted (single-user coach) |
| API flooding (general) | Edge-level CDN caching for static assets | ✅ |

### T-05 — Secrets Leakage (Information Disclosure)
| Threat | Mitigation | Status |
|--------|------------|--------|
| Secrets in source control | `.env.local` in `.gitignore`; env vars only | ✅ |
| Secrets in URL query params | All secrets moved to `Authorization: Bearer` header | ✅ |
| Secrets in logs | Structured logging with safe fields only | ⚠️ Some PII in logs (PR6) |
| Error message leaks | Generic error responses — no stack traces or internal details | ✅ |
| Stripe ID leakage | Member/check-in responses omit `stripeCustomerId`, `stripeSubId`, `memberId` | ✅ |
| Env var validation bypass | `SKIP_ENV_VALIDATION` blocked at production runtime | ✅ |

### T-06 — Elevation of Privilege
| Threat | Mitigation | Status |
|--------|------------|--------|
| Dependency exploit | Dependabot planned; pinned versions; `npm audit` | ⚠️ CI pending |
| Coach secret in admin UI | No admin UI — coach operations via API only | ✅ |

### T-07 — Brute-Force Login
| Threat | Mitigation | Status |
|--------|------------|--------|
| Password guessing on `/api/auth/login` | `loginLimiter` — 5 attempts per 15min per IP+email | ✅ |
| Offline password cracking | bcrypt with default cost factor | ✅ |
| Credential stuffing | Rate limiting + generic "Invalid email or password" message | ✅ |

### T-08 — Session Forgery / Token Tampering
| Threat | Mitigation | Status |
|--------|------------|--------|
| Forged JWT tokens | HMAC-SHA256 signing with `AUTH_SECRET` (≥32 chars, required) | ✅ |
| Stolen tokens replayed | 7-day expiry; HttpOnly + SameSite=Strict cookies | ✅ |
| Signature timing attack | `timingSafeCompare()` with buffer padding for constant-time verification | ✅ |
| AUTH_SECRET compromise | Separate from `COACH_SECRET` — rotating one doesn't affect the other | ✅ |
| Session revocation | No revocation mechanism (stateless JWT) | ⚠️ Deferred (M4) |

### T-09 — IDOR on Member Endpoints
| Threat | Mitigation | Status |
|--------|------------|--------|
| Email guessing to access other members' data | `requireMemberOrCoachAuth()` — session email must match requested email (case-insensitive) | ✅ |
| Coach bypasses member isolation | Coach Bearer auth intentionally accesses any member (by design) | ✅ By design |
| Unauthenticated access to member data | All member data endpoints require session or coach auth | ✅ |

### T-10 — Account Enumeration
| Threat | Mitigation | Status |
|--------|------------|--------|
| Registration oracle (`email exists` vs `not eligible`) | Merged into single `REGISTRATION_FAILED` (403) with generic message | ✅ |
| Login oracle | Generic "Invalid email or password" for all failure cases | ✅ |
| Application status leakage | `GET /api/application` is public by email — intentional (pre-payment flow) | ✅ Accepted |

### T-11 — Timing Attacks on Secret Comparison
| Threat | Mitigation | Status |
|--------|------------|--------|
| Coach secret length/value leaked via timing | `timingSafeCompare()` with buffer padding to equal length via `crypto.timingSafeEqual` | ✅ |
| Session signature leaked via timing | `verifySessionToken()` uses same `timingSafeCompare()` | ✅ |
| Login password timing leak | Always performs padded constant-time comparison regardless of input length | ✅ |

### T-12 — Coach Secret Brute-Force
| Threat | Mitigation | Status |
|--------|------------|--------|
| Brute-force on `Authorization: Bearer` | Constant-time comparison; `COACH_SECRET` ≥16 chars required | ⚠️ Partial |
| No rate limiting on coach endpoints | Accepted risk — single-coach MVP with long secret | ⚠️ Accepted |
| Mitigation plan | Post-MVP: proper coach accounts with RBAC | 📋 Planned |

### T-13 — CSRF
| Threat | Mitigation | Status |
|--------|------------|--------|
| Cross-site form submission | `SameSite=Strict` on session cookie | ✅ |
| Cross-origin API calls | Next.js defaults to same-origin CORS | ✅ |
| Full CSRF token protection | Not implemented — `SameSite=Strict` sufficient for MVP | ⚠️ Deferred (M7) |

---

## 5. STRIDE Summary

| Category | Relevance | Key Controls |
|----------|-----------|--------------|
| **S**poofing | High — webhook forgery, session forgery, coach impersonation | Stripe signature, HMAC-SHA256 JWT, constant-time Bearer auth |
| **T**ampering | High — payload modification, token tampering | Signature verification, Zod validation, `timingSafeCompare()` |
| **R**epudiation | Medium — duplicate events, replay | `StripeEvent` idempotency, upsert patterns |
| **I**nformation Disclosure | High — secrets, PII, member data | Env-only secrets, Authorization header (not URL), omit Stripe IDs from responses, `requireMemberOrCoachAuth` |
| **D**enial of Service | Medium — spam, brute-force | 4 rate limiters (checkout, quiz, login, register), CDN caching |
| **E**levation of Privilege | Medium — IDOR, secret brute-force | Email-match on member endpoints, min-length secrets, Dependabot planned |

---

## 6. Risk Matrix

| Risk | Severity | Likelihood | Priority |
|------|----------|------------|----------|
| Webhook forgery (T-01) | Critical | Medium | **P0** |
| Secrets leakage (T-05) | Critical | Low | **P0** |
| Session forgery / AUTH_SECRET compromise (T-08) | Critical | Low | **P0** |
| Replay / duplicate activation (T-02) | High | Medium | **P1** |
| Injection — SQL/XSS (T-03) | High | Low | **P1** |
| Brute-force login (T-07) | High | Medium | **P1** |
| IDOR on member endpoints (T-09) | High | Medium | **P1** |
| Timing attacks (T-11) | High | Low | **P1** |
| Dependency vulnerability (T-06) | Medium | Medium | **P1** |
| Account enumeration (T-10) | Medium | Medium | **P2** |
| Coach secret brute-force (T-12) | Medium | Low | **P2** |
| Checkout/quiz spam (T-04) | Medium | Medium | **P2** |
| CSRF (T-13) | Medium | Low | **P2** |
| HTML injection in emails (T-03) | Medium | Low | **P2** |
| XSS on landing page | Low | Low | P3 (static HTML) |

---

## 7. Open Items

| # | Item | Status |
|---|------|--------|
| 1 | ~~Add rate limiting~~ — Implemented for checkout, quiz, login, register | ✅ Done |
| 2 | HTML-escape user data in email templates (T-03) | ⚠️ PR6 |
| 3 | Audit and remove PII from console.log calls (T-05) | ⚠️ PR6 |
| 4 | In-memory rate limiter resets on cold start (T-04) — plan Redis/Upstash | 📋 Post-MVP |
| 5 | No session revocation mechanism (T-08) — plan `Session` table | 📋 Post-MVP |
| 6 | No CSRF tokens (T-13) — `SameSite=Strict` sufficient for now | 📋 Post-MVP |
| 7 | Add rate limiting to coach endpoints (T-12) — or migrate to proper auth | 📋 Post-MVP |
| 8 | Establish incident response playbook | 📋 Pre-launch |
| 9 | Schedule quarterly threat model review | 📋 Recurring |
| 10 | Evaluate CAPTCHA/honeypot if spam observed post-launch | 📋 Post-launch |
