# Kairo Security Audit — Remediation Tracker

**Audit Date:** 2026-03-08  
**Auditor Agents:** Planner, Reviewer, Security, QA (per `agents/`)  
**Scope:** Full repository — `app/kairo-web/`, `src/landing/`, `tests/`, `infrastructure/`, `docs/`  
**Total Findings:** 3 Critical · 5 High · 6 Medium · 8 Low/Info · 10 Test Gaps · 3 Doc Gaps  
**Files Reviewed:** 65+ source files, 27 test files, 12 doc files, all configs  

---

## How to Use This Document

- Work through findings **top-to-bottom** (Critical → High → Medium → Low)
- Each finding gets its own PR branch: `fix/<finding-id>`
- Check the box `[x]` when the PR is **merged to main**
- Update the **PR** column with the branch name or PR link
- Run verification commands listed under each finding after fixing

---

## CRITICAL Findings (Must-Fix Before Any Deploy)

### - [ ] C-01: Missing `middleware.ts` — Security headers never applied
| Field | Detail |
|-------|--------|
| **Severity** | 🔴 CRITICAL |
| **File** | `app/kairo-web/src/proxy.ts` (exists) / `app/kairo-web/src/middleware.ts` (missing) |
| **PR** | `fix/c01-middleware` |
| **Description** | `proxy.ts` defines CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — but Next.js requires a `middleware.ts` (or `src/middleware.ts`) export to activate it. **No `middleware.ts` file exists.** Zero security headers are applied in production. `proxy.test.ts` passes because it calls `proxy()` directly — false confidence. `docs/07-security-controls.md` §6 claims "Edge middleware sets CSP" — currently inaccurate. |
| **Fix** | Create `app/kairo-web/src/middleware.ts` that imports and re-exports `proxy` (as `middleware`) and `config` from `proxy.ts`. |
| **Verification** | `curl -I http://localhost:3000/` — verify `content-security-policy`, `strict-transport-security`, `x-frame-options` headers present. |

---

### - [ ] C-02: COACH_SECRET leaked in URL query parameters (9 endpoints)
| Field | Detail |
|-------|--------|
| **Severity** | 🔴 CRITICAL |
| **Files** | `app/kairo-web/src/app/api/coach/route.ts:91`, `coach/cancel-member/route.ts:25`, `checkin/respond/route.ts:25`, `application/route.ts:215`, `macro/route.ts:45`, `program/route.ts:70`, `review/route.ts:46`, `templates/route.ts:100`, `cron/checkin-reminder/route.ts:21` |
| **PR** | `fix/c02-bearer-auth` |
| **Description** | 9 endpoints read `COACH_SECRET`/`CRON_SECRET` from `?secret=` query parameters. URL query strings appear in: server access logs, browser history, `Referer` headers, CDN/Vercel logs. This effectively logs the secret on **every request**. The nurture route already correctly uses `Authorization: Bearer <secret>` — the others do not. |
| **Fix** | Create shared `extractBearerSecret(request)` utility. Refactor all 9 endpoints to read from `Authorization: Bearer <token>` header. Update all corresponding test files. |
| **Verification** | `grep -rn "searchParams.*secret" app/kairo-web/src/app/api/` — should return 0 matches. All coach/cron test suites pass with Bearer header. |

---

### - [ ] C-03: Hardcoded fallback JWT secret in `lib/auth.ts`
| Field | Detail |
|-------|--------|
| **Severity** | 🔴 CRITICAL |
| **File** | `app/kairo-web/src/lib/auth.ts:31` |
| **PR** | `fix/c03-no-fallback-secret` |
| **Description** | `const base = env.COACH_SECRET ?? "dev-fallback-secret-not-for-production"` — since `COACH_SECRET` is marked `.optional()` in `env.ts:18`, any deployment missing it signs all JWTs with a **publicly-known** string. Attacker can forge arbitrary session tokens. |
| **Fix** | Option A (preferred): Make `COACH_SECRET` required in `env.ts` (remove `.optional()`). Option B: Throw at runtime in `getSecret()` if undefined. Never fall back to a hardcoded value. |
| **Verification** | `grep -rn "dev-fallback-secret" app/` — returns 0 matches. App fails to start without `COACH_SECRET` set. |

---

## HIGH Findings

### - [ ] H-01: Non-constant-time secret comparison (timing attack)
| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Files** | All 9 files from C-02 use `===` for secret comparison |
| **PR** | `fix/h01-timing-safe-compare` |
| **Description** | Only `auth/login/route.ts` implements proper constant-time XOR comparison. All 9 coach-authenticated endpoints use `===`, which is vulnerable to timing attacks that can leak the secret byte-by-byte. |
| **Fix** | Extract the constant-time comparison into `lib/crypto.ts` (`timingSafeEqual(a, b): boolean`). Replace all `===` secret comparisons. Write unit tests. |
| **Verification** | `grep -rn "secret !== " app/kairo-web/src/app/api/` — returns 0 matches. `lib/crypto.test.ts` passes. |

---

### - [ ] H-02: Unauthenticated GET endpoints — data leakage + email enumeration
| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Files** | `member/route.ts` (GET), `checkin/route.ts` (GET), `review/route.ts` (GET), `program/route.ts` (GET), `macro/route.ts` (GET), `application/route.ts` (GET) |
| **PR** | `fix/h02-auth-gate-get-endpoints` |
| **Description** | Anyone who knows/guesses a member's email can retrieve their full profile, check-in history, programs, macros, reviews, and application data. No session validation or auth required. The 404-vs-200 response difference enables email enumeration. |
| **Fix** | Require `verifySessionToken` (cookie-based) on member-facing GET endpoints. Coach endpoints should use coach auth. Application GET should be auth-gated. |
| **Verification** | `curl` without session cookie returns 401 on all member-facing GETs. Tests updated to pass session cookies. |

---

### - [ ] H-03: PII logged to console in application route
| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **File** | `app/kairo-web/src/app/api/application/route.ts:272` |
| **PR** | `fix/h03-remove-pii-logs` |
| **Description** | `console.log("[application] Status updated:", { email, status })` logs the applicant's email address. Violates the "no PII in logs" policy in copilot-instructions.md and threat model. Also check line 116 for similar issue. |
| **Fix** | Replace `{ email, status }` with `{ id: existing.id, status }`. Audit all other `console.log` calls across all API routes for PII. |
| **Verification** | `grep -rn "console.log.*email" app/kairo-web/src/app/api/` — returns 0 matches with PII. |

---

### - [ ] H-04: CSP allows `'unsafe-inline'` for scripts
| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **File** | `app/kairo-web/src/proxy.ts:40` |
| **PR** | `fix/h04-csp-nonce` |
| **Description** | `script-src 'self' 'unsafe-inline'` completely negates XSS protection from CSP. Any injected content can run inline scripts. The TODO comment in the code acknowledges this. |
| **Fix** | Implement nonce-based CSP (Next.js supports this). If too complex for MVP, document the risk explicitly in `docs/07-security-controls.md` with a timeline and accept the risk. |
| **Verification** | Response headers show `script-src 'self' 'nonce-...'` instead of `'unsafe-inline'`. Or risk acceptance documented. |

---

### - [ ] H-05: No rate limiting on auth login (brute force)
| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Files** | `app/kairo-web/src/app/api/auth/login/route.ts`, `auth/register/route.ts`, `application/route.ts` |
| **PR** | `fix/h05-rate-limit-auth` |
| **Description** | Only `POST /api/checkout` and `POST /api/quiz` have rate limiting. `POST /api/auth/login` has **none** — enables credential stuffing and brute force. Same for register and application submission. |
| **Fix** | Add rate limiting to login (5 req/min/IP), register (10 req/min/IP), and application (5 req/min/IP). |
| **Verification** | Send 6 rapid POST requests to `/api/auth/login` — 6th returns 429. Test file verifies rate limiting. |

---

## MEDIUM Findings

### - [ ] M-01: Email templates vulnerable to HTML injection
| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **File** | `app/kairo-web/src/services/email.ts:57` and throughout |
| **Description** | Email HTML is built via template literals with unescaped values: `` `<p><strong>Email:</strong> ${memberEmail}</p>` ``. If a member email contains HTML special characters, it creates an XSS vector in email clients. |
| **Fix** | HTML-escape all interpolated values in email templates. Create `lib/html-escape.ts` utility. |
| **Verification** | Unit test: email with `<script>alert(1)</script>` in name renders as escaped text. |

---

### - [ ] M-02: In-memory rate limiter resets on serverless cold starts
| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **File** | `app/kairo-web/src/lib/rate-limit.ts` |
| **Description** | On Vercel serverless, each cold start creates a fresh rate limiter. An attacker can spread requests across cold starts to bypass limits entirely. Currently documented as a known limitation. |
| **Fix** | Migrate to Upstash Redis or Vercel KV for rate limiting before production launch. For now, document the limitation. |
| **Verification** | Post-MVP: Rate limiter uses external store. Pre-MVP: Risk documented in `docs/07-security-controls.md`. |

---

### - [ ] M-03: Prisma client bypasses env validation
| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **File** | `app/kairo-web/src/lib/prisma.ts:12` |
| **Description** | Uses `process.env.DATABASE_URL!` directly with non-null assertion instead of validated `env.DATABASE_URL` from the env module. Bypasses startup validation and could cause a cryptic runtime crash. |
| **Fix** | Replace `process.env.DATABASE_URL!` with the import from `env.ts`. |
| **Verification** | `grep -rn "process.env.DATABASE_URL" app/kairo-web/src/lib/prisma.ts` — returns 0 matches. |

---

### - [ ] M-04: `SKIP_ENV_VALIDATION` escape hatch in production
| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **File** | `app/kairo-web/src/lib/env.ts:30` |
| **Description** | `skipValidation: !!process.env.SKIP_ENV_VALIDATION` allows deployment without any env validation. If set in production, all secrets could be missing and the app starts with undefined keys. |
| **Fix** | Add a production guard: only allow `SKIP_ENV_VALIDATION` when `NODE_ENV !== "production"`. Ensure CI/CD never sets it in prod. |
| **Verification** | `SKIP_ENV_VALIDATION=1 NODE_ENV=production` → app throws on startup. |

---

### - [ ] M-05: Empty `next.config.ts` — no security configuration
| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **File** | `app/kairo-web/next.config.ts` |
| **Description** | Completely empty config. Missing: `poweredBy: false` (removes `X-Powered-By: Next.js` header revealing framework), security headers in `headers()`, image domain restrictions. |
| **Fix** | Add `poweredBy: false`, explicit CORS/security headers as fallback, image domain restrictions. |
| **Verification** | `curl -I` response does not contain `X-Powered-By`. |

---

### - [ ] M-06: Application submission has no rate limiting or bot protection
| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **File** | `app/kairo-web/src/app/api/application/route.ts` |
| **Description** | Public `POST /api/application` has no rate limiting. Attacker could flood with fake applications, generating spam emails to admin and filling the database. |
| **Fix** | Add rate limiting (5 req/min/IP). Consider adding honeypot field for bot detection. |
| **Verification** | 6th rapid POST returns 429. Test verifies rate limiting. |

---

## LOW / Informational Findings

### - [ ] L-01: `next.config.ts` missing `poweredBy: false`
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **File** | `app/kairo-web/next.config.ts` |
| **Description** | `X-Powered-By: Next.js` header is sent, revealing the framework. Covered by M-05 fix. |
| **Fix** | Addressed as part of M-05. |

---

### - [ ] L-02: `.env.example` divergence from actual env vars  
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **File** | `infrastructure/env.example` |
| **Description** | Lists `STRIPE_PUBLISHABLE_KEY` and `SENTRY_DSN` which are not referenced in code. Lists `AUTH_SECRET` but code uses `COACH_SECRET`. Creates confusion for new developers. |
| **Fix** | Sync `env.example` with actual `env.ts` variables. Remove unused, add missing. |

---

### - [ ] L-03: Email validation regex is overly permissive
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **File** | `app/kairo-web/src/lib/validation.ts` |
| **Description** | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` accepts many technically-invalid emails. Noted as intentional (matching Zod's behavior). |
| **Fix** | Accept risk or tighten to RFC-compliant regex. Document decision. |

---

### - [ ] L-04: Root `package.json` has old branding name
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **File** | `package.json` |
| **Description** | `"name": "consistai"` — should be `"kairo"` or `"kairo-coaching"`. |
| **Fix** | Update name field. |

---

### - [ ] L-05: Landing page waitlist form has no backend
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **File** | `src/landing/index.html:363` |
| **Description** | Waitlist form only shows a success message client-side. No actual POST to backend. Data is lost. Comment says "real submission in WP3." |
| **Fix** | Implement in WP3 as planned. No immediate action required. |

---

### - [ ] L-06: Duplicate `calculateStreak` function in 3 files
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **Files** | `member/route.ts`, `checkin/route.ts`, `coach/route.ts` |
| **Description** | Same function copy-pasted in 3 route files. Creates maintenance risk — a bug fix in one file won't propagate. |
| **Fix** | Extract to `lib/streak.ts` with unit tests. Import in all 3 routes. |

---

### - [ ] L-07: Missing `package-lock.json` (unconfirmed)
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **Description** | May exist but not shown in workspace tree. If missing, dependency versions are non-deterministic across installs. |
| **Fix** | Verify existence. If missing, run `npm install` and commit the lockfile. |

---

### - [ ] L-08: `any` type in checkin route undermines TypeScript strict
| Field | Detail |
|-------|--------|
| **Severity** | 🔵 LOW |
| **File** | `app/kairo-web/src/app/api/checkin/route.ts:112` |
| **Description** | `const createData: any = {` with eslint-disable comment. Undermines TypeScript strict mode that's otherwise properly configured. |
| **Fix** | Type properly with Prisma's generated `Prisma.CheckInCreateInput` type. |

---

## TEST COVERAGE GAPS

### - [ ] T-01: Auth login route — ZERO tests
| Field | Detail |
|-------|--------|
| **Risk** | 🟠 HIGH |
| **Missing File** | `app/kairo-web/src/app/api/auth/login/route.test.ts` |
| **Tests Needed** | Valid credentials → 200 + session cookie, invalid password → 401, nonexistent user → 401, inactive member → 403, brute force (rate limit after fix), constant-time compare used, missing fields → 400 |

---

### - [ ] T-02: Auth register route — ZERO tests
| Field | Detail |
|-------|--------|
| **Risk** | 🟠 HIGH |
| **Missing File** | `app/kairo-web/src/app/api/auth/register/route.test.ts` |
| **Tests Needed** | Success → 201 + password hashed, duplicate email → 409, inactive member → 403, missing fields → 400, password too short → 400 |

---

### - [ ] T-03: Auth me route — ZERO tests
| Field | Detail |
|-------|--------|
| **Risk** | 🟠 HIGH |
| **Missing File** | `app/kairo-web/src/app/api/auth/me/route.test.ts` |
| **Tests Needed** | Valid session → 200 + email, expired token → 401, missing cookie → 401, tampered token → 401 |

---

### - [ ] T-04: Auth logout route — ZERO tests
| Field | Detail |
|-------|--------|
| **Risk** | 🔵 LOW |
| **Missing File** | `app/kairo-web/src/app/api/auth/logout/route.test.ts` |
| **Tests Needed** | Clears cookie → 200, already logged out → 200 |

---

### - [ ] T-05: Auth module (`lib/auth.ts`) — ZERO unit tests
| Field | Detail |
|-------|--------|
| **Risk** | 🟠 HIGH |
| **Missing File** | `app/kairo-web/src/lib/auth.test.ts` |
| **Tests Needed** | `createSessionToken` → valid JWT, `verifySessionToken` → decode + verify, expired token → null, tampered token → null, missing secret → throws (after C-03 fix) |

---

### - [ ] T-06: Member cancel route — ZERO tests
| Field | Detail |
|-------|--------|
| **Risk** | 🟡 MEDIUM |
| **Missing File** | `app/kairo-web/src/app/api/member/cancel/route.test.ts` |
| **Tests Needed** | Session auth required, Stripe subscription cancelled, member status updated, unauthenticated → 401 |

---

### - [ ] T-07: Coach cancel-member route — ZERO tests
| Field | Detail |
|-------|--------|
| **Risk** | 🟡 MEDIUM |
| **Missing File** | `app/kairo-web/src/app/api/coach/cancel-member/route.test.ts` |
| **Tests Needed** | Coach auth required, Stripe cancel called, member updated, invalid secret → 401 |

---

### - [ ] T-08: Middleware activation — NOT tested
| Field | Detail |
|-------|--------|
| **Risk** | 🟠 HIGH |
| **Description** | `proxy.test.ts` calls `proxy()` directly but middleware never runs in test context. Need integration-level test proving headers appear on actual HTTP responses. |
| **Tests Needed** | After C-01 fix: test that importing `middleware.ts` exports the correct function + config matcher. |

---

### - [ ] T-09: Constant-time compare utility — NOT tested
| Field | Detail |
|-------|--------|
| **Risk** | 🟡 MEDIUM |
| **Missing File** | `app/kairo-web/src/lib/crypto.test.ts` |
| **Tests Needed** | Equal strings → true, different strings → false, different lengths → false, empty strings → true |

---

### - [ ] T-10: Integration tests (real DB) — NONE exist
| Field | Detail |
|-------|--------|
| **Risk** | 🟠 HIGH |
| **Description** | All 27 test files use mocked Prisma client. Zero tests hit a real database. False confidence in data layer. |
| **Tests Needed** | Post-MVP: Set up test database with Prisma migrations, run integration tests against real PostgreSQL. |

---

## DOCUMENTATION GAPS

### - [ ] D-01: Threat model outdated — lists only 3 entry points
| Field | Detail |
|-------|--------|
| **File** | `docs/03-threat-model.md` |
| **Description** | Entry points section lists only 3 endpoints. Actual API surface is 15+ routes. Missing: auth/*, application, checkin, coach, review, program, macro, nurture, cron, templates. Says "No admin UI in MVP" but coach dashboard exists. Says "No user auth" but full auth system exists (login/register/me/logout/sessions). |
| **Fix** | Add all current routes to entry points. Add threats: brute-force login, session hijacking, IDOR via email lookups, application spam. |

---

### - [ ] D-02: Security controls doc has inaccurate claims
| Field | Detail |
|-------|--------|
| **File** | `docs/07-security-controls.md` |
| **Description** | §6 claims "Edge middleware sets CSP..." — no `middleware.ts` exists (until C-01 is fixed). Missing controls: auth system, application endpoint, coach cancel-member, cron endpoints, macro/program/review. Missing threats: brute-force login, session hijacking, IDOR. |
| **Fix** | Correct §6 after C-01 fix. Add all new controls as they're implemented. |

---

### - [ ] D-03: Testing doc outdated — lists only Phase 1 tests
| Field | Detail |
|-------|--------|
| **File** | `docs/08-testing-ci.md` |
| **Description** | Lists only 50 tests (Phase 1 landing page). Actual test count is 200+ across 27 files. Vitest infrastructure not documented. All API route tests missing from roadmap. CI pipeline `.github/workflows/ci.yml` referenced but unconfirmed. |
| **Fix** | Update with complete test inventory, Vitest config, and actual test counts. |

---

## POSITIVE OBSERVATIONS (No Action Needed)

- ✅ Webhook handler: Stripe signature verification, raw body handling, pre-processing idempotency — well implemented
- ✅ Zod validation consistently applied across all POST/PATCH endpoints
- ✅ No `.env` files committed to repository (properly gitignored)
- ✅ No hardcoded real API keys found anywhere
- ✅ Fire-and-forget pattern for emails prevents webhook handler failures
- ✅ Checkout + webhook test coverage is thorough (50+ tests)
- ✅ TypeScript strict mode enabled in `tsconfig.json`
- ✅ Env vars validated at startup via `@t3-oss/env-nextjs`
- ✅ Landing page: 50 tests covering HTML structure, accessibility, CSS quality, content

---

## PR Execution Order

| Order | Finding(s) | Branch | Status |
|-------|-----------|--------|--------|
| 1 | C-01 | `fix/c01-middleware` | ⬜ Not started |
| 2 | C-02 + H-01 | `fix/c02-bearer-auth` | ⬜ Not started |
| 3 | C-03 | `fix/c03-no-fallback-secret` | ⬜ Not started |
| 4 | H-03 | `fix/h03-remove-pii-logs` | ⬜ Not started |
| 5 | H-05 + M-06 | `fix/h05-rate-limit-auth` | ⬜ Not started |
| 6 | M-03 + M-05 | `fix/m03-m05-config-hardening` | ⬜ Not started |
| 7 | T-01 to T-05 | `fix/t01-auth-tests` | ⬜ Not started |
| 8 | L-04 + L-06 | `fix/low-cleanup` | ⬜ Not started |
| 9 | D-01 to D-03 | `fix/docs-sync` | ⬜ Not started |

---

*Last updated: 2026-03-08*
