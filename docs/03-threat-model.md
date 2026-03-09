# Kairo Coaching — Threat Model

> **Version:** 1.2
> **Last Updated:** 2026-03-09
> **Methodology:** STRIDE

---

## 1. Assets

| Asset | Sensitivity | Storage |
|-------|-------------|---------|
| Stripe secret key | Critical | Environment variable only |
| Stripe webhook secret | Critical | Environment variable only |
| Member records (email, phone, Stripe IDs, status) | High | PostgreSQL, encrypted at rest |
| Admin notification channel (Resend API key) | High | Environment variable only |
| COACH_SECRET (coach portal + session signing) | Critical | Environment variable only |
| CRON_SECRET (scheduled job auth) | High | Environment variable only |
| Session tokens (member + coach) | High | HttpOnly cookies only |
| Application records (name, goals, health context) | High | PostgreSQL, encrypted at rest |
| Check-in records (daily adherence data) | Medium | PostgreSQL, encrypted at rest |

---

## 2. Entry Points

### Public (no auth)
| Entry Point | Exposure | Auth |
|-------------|----------|------|
| Landing page | Public | None (static) |
| `POST /api/checkout` — create checkout session | Public | None (Stripe handles identity); rate limited |
| `POST /api/quiz` — quiz + lead capture | Public | None; rate limited |
| `POST /api/application` — submit application | Public | None; Zod validated |
| `GET /api/application?email=` — check status | Public | None; email validated |
| `POST /api/webhook` — Stripe webhook endpoint | Stripe only | Stripe signature verification |

### Auth-gated (member session)
| Entry Point | Exposure | Auth |
|-------------|----------|------|
| `POST /api/auth/register` — set password | Active members only | Active status gate |
| `POST /api/auth/login` — sign in | Members + coach | bcrypt / constant-time secret compare |
| `GET /api/auth/me` — profile | Authenticated | Session token (HMAC-SHA256) |
| `POST /api/auth/logout` — sign out | Any | Cookie cleared |
| `GET /api/member?email=` — member lookup | Public | Email validated; no Stripe IDs returned |
| `POST /api/onboarding` — onboarding data | Active members only | Active status gate |
| `POST /api/checkin` — daily check-in | Active members only | Active status gate |
| `GET /api/checkin?email=` — history | Active members only | Active status gate |

### Coach-only (COACH_SECRET)
| Entry Point | Exposure | Auth |
|-------------|----------|------|
| `GET /api/coach?secret=` — coach dashboard | Coach only | COACH_SECRET comparison |
| `PATCH /api/application?secret=` — approve/reject | Coach only | COACH_SECRET comparison |
| `POST /api/coach/cancel-member?secret=` — cancel sub | Coach only | COACH_SECRET comparison |
| `POST /api/review?secret=` — create review | Coach only | COACH_SECRET comparison |
| `PATCH /api/review?secret=` — update review | Coach only | COACH_SECRET comparison |
| `POST /api/program?secret=` — create program | Coach only | COACH_SECRET comparison |
| `PATCH /api/program?secret=` — update program | Coach only | COACH_SECRET comparison |
| `POST /api/macro?secret=` — set macro targets | Coach only | COACH_SECRET comparison |
| `PATCH /api/checkin/respond?secret=` — respond to check-in | Coach only | COACH_SECRET comparison |
| `GET /api/templates?secret=` — coach templates | Coach only | COACH_SECRET comparison |
| `POST /api/nurture?secret=` — run nurture batch | Coach only | COACH_SECRET comparison |

### Cron-only (CRON_SECRET)
| Entry Point | Exposure | Auth |
|-------------|----------|------|
| `POST /api/cron/checkin-reminder?secret=` — reminders | Cron only | CRON_SECRET comparison |

---

## 3. Trust Boundaries

```
┌──────────────────────┐
│   Public Internet    │
│   (untrusted)        │
└──────────┬───────────┘
           │
    ┌──────▼──────┐
    │  CDN / Edge  │  ← Static assets, security headers (CSP, HSTS), rate limiting
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Next.js App │  ← Input validation (Zod), auth (HMAC session), Stripe SDK
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  PostgreSQL  │  ← Encrypted at rest, Prisma parameterized queries
    └─────────────┘
           │
    ┌──────▼──────┐
    │  Stripe API  │  ← Webhook signatures, subscription management
    └─────────────┘
```

---

## 4. Top Threats & Mitigations (MVP)

### 4.1 Webhook Forgery (Spoofing / Tampering)
| Threat | Mitigation |
|--------|------------|
| Attacker sends fake webhook events | Stripe signature verification (`stripe.webhooks.constructEvent`) |
| Modified event payloads | Signature covers entire body — reject on mismatch |
| Strict event handling | Process only known events; return 200 for unknowns |

### 4.2 Replay Attacks (Repudiation)
| Threat | Mitigation |
|--------|------------|
| Duplicate webhook delivery | Idempotency key — store processed event IDs before processing |
| Duplicate member activation | `upsert` pattern; unique constraints on email + Stripe IDs |

### 4.3 Injection (Tampering)
| Threat | Mitigation |
|--------|------------|
| SQL injection via inputs | Prisma ORM — all queries use parameterized statements |
| Malformed requests | Zod schema validation on all endpoints |
| XSS via stored data | CSP headers; no user-generated HTML rendered |

### 4.4 Abuse — Spam / Flooding (Denial of Service)
| Threat | Mitigation |
|--------|------------|
| Checkout session spam | Rate limiting — 5 req/60s per IP |
| Quiz lead spam | Rate limiting — 10 req/60s per IP |
| Application spam | Zod validation; duplicate prevention (409) |
| API flooding | Rate limiting + CDN caching for static assets |

### 4.5 Secrets Leakage (Information Disclosure)
| Threat | Mitigation |
|--------|------------|
| Secrets in source control | `.env.local` in `.gitignore`; env vars only |
| Secrets in logs | No PII or secrets logged; structured logging with safe fields |
| Error message leaks | Generic error codes + messages — no stack traces |
| Member data exposure | Stripe IDs excluded from member lookups; explicit safe response objects |
| Session token exposure | HttpOnly cookies, SameSite=Strict, Secure in production |
| Coach secret in logs | URL params with secrets not logged in structured format |

### 4.6 Authentication & Session Attacks
| Threat | Mitigation |
|--------|------------|
| Session forgery | HMAC-SHA256 signed tokens; tampered tokens rejected |
| Session hijacking | HttpOnly, SameSite=Strict, Secure cookies |
| Credential enumeration | Generic error messages on login failure (no "email not found" hint) |
| Timing attack on coach secret | Constant-time XOR comparison in login route |
| Password brute force | bcrypt with cost 12; post-MVP: account lockout |

### 4.7 Elevation of Privilege
| Threat | Mitigation |
|--------|------------|
| Dependency exploit | Dependabot, pinned versions, `npm audit` in CI |
| Unauthorized coach access | COACH_SECRET required; unconfigured secret → 401 |
| Pending/canceled member bypass | Active-status gate on onboarding, check-in, member operations |
| Webhook-triggered cancel | cancel-member requires COACH_SECRET; not callable via Stripe |

---

## 5. STRIDE Summary (Full)

| Category | MVP Relevance | Key Control |
|----------|---------------|-------------|
| **S**poofing | High — webhook forgery, session forgery | Stripe sig verification, HMAC sessions |
| **T**ampering | High — payload modification, Zod bypass | Sig + schema validation, Prisma ORM |
| **R**epudiation | Medium — duplicate events, conflicting states | Idempotency + event log, upsert pattern |
| **I**nformation Disclosure | High — secrets, member data, session tokens | Env vars only, no PII in logs, explicit safe responses |
| **D**enial of Service | Medium — spam/flooding | Rate limiting on public endpoints |
| **E**levation of Privilege | Medium — admin bypass | COACH_SECRET gate, active status gate |

---

## 6. Risk Matrix

| Risk | Severity | Likelihood | Priority |
|------|----------|------------|----------|
| Webhook forgery | Critical | Medium | **P0** |
| Secrets leakage | Critical | Low | **P0** |
| Session forgery | Critical | Low | **P0** |
| Replay / duplicate activation | High | Medium | **P1** |
| Injection (SQL/XSS) | High | Low | **P1** |
| Credential enumeration | High | Medium | **P1** |
| Dependency vulnerability | Medium | Medium | **P1** |
| Checkout session spam | Medium | Medium | **P2** |
| Coach secret brute force (URL param) | Medium | Low | **P2** |
| XSS on landing page | Low | Low | P3 (static HTML) |

---

## 7. Open Items

1. Move COACH_SECRET from query param to `Authorization` header (reduces server log exposure)
2. Add rate limiting to coach and cron endpoints
3. Establish incident response playbook
4. Schedule quarterly threat model review
5. Evaluate CAPTCHA / honeypot if spam observed post-launch
6. Dedicated AUTH_SECRET separate from COACH_SECRET (post-MVP)
