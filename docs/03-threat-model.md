# Kairo Coaching — Threat Model

> **Version:** 1.1
> **Last Updated:** 2026-03-05
> **Methodology:** STRIDE

---

## 1. Assets

| Asset | Sensitivity | Storage |
|-------|-------------|---------|
| Stripe secret key | Critical | Environment variable only |
| Stripe webhook secret | Critical | Environment variable only |
| Member records (email, phone, Stripe IDs, status) | High | PostgreSQL, encrypted at rest |
| Admin notification channel (Resend API key) | High | Environment variable only |
| AUTH_SECRET (session signing) | Critical | Environment variable only |

---

## 2. Entry Points

| Entry Point | Exposure | Auth |
|-------------|----------|------|
| Landing page | Public | None (static) |
| `POST /api/checkout` — create checkout session | Public | None (Stripe handles identity) |
| `POST /api/webhook` — Stripe webhook endpoint | Stripe only | Stripe signature verification |

---

## 3. Trust Boundaries

```
┌──────────────────────┐
│   Public Internet    │
│   (untrusted)        │
└──────────┬───────────┘
           │
    ┌──────▼──────┐
    │  CDN / Edge  │  ← Static assets, rate limiting
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Next.js App │  ← Input validation, Stripe SDK
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  PostgreSQL  │  ← Encrypted at rest
    └─────────────┘
           │
    ┌──────▼──────┐
    │  Stripe API  │  ← Webhook signatures
    └─────────────┘
```

---

## 4. Top Threats & Mitigations (MVP)

### 4.1 Webhook Forgery (Spoofing / Tampering)
| Threat | Mitigation |
|--------|------------|
| Attacker sends fake webhook events | Stripe signature verification (`stripe.webhooks.constructEvent`) |
| Modified event payloads | Signature covers entire body — reject on mismatch |
| Strict event handling | Only process `checkout.session.completed`; ignore unknown events |

### 4.2 Replay Attacks (Repudiation)
| Threat | Mitigation |
|--------|------------|
| Duplicate webhook delivery | Idempotency key — store processed event IDs |
| Duplicate member activation | Check `status` before updating; unique constraint on Stripe customer ID |

### 4.3 Injection (Tampering)
| Threat | Mitigation |
|--------|------------|
| SQL injection via inputs | ORM parameterized queries (Prisma/Drizzle) |
| Malformed checkout requests | Zod schema validation on all inputs |
| XSS via stored data | No user-generated content rendered in MVP; CSP headers |

### 4.4 Abuse — Spam Signups (Denial of Service)
| Threat | Mitigation |
|--------|------------|
| Checkout session spam | Rate limiting (IP-based) |
| Bot-driven form submissions | Bot friction later if needed (honeypot, CAPTCHA) |
| API flooding | Rate limiting + CDN caching for static assets |

### 4.5 Secrets Leakage (Information Disclosure)
| Threat | Mitigation |
|--------|------------|
| Secrets in source control | `.env.local` in `.gitignore`; env vars only |
| Secrets in logs | No PII or secrets logged; structured logging |
| Error message leaks | Generic error responses in production |
| Member data exposure | Minimal data stored; encrypted at rest; no health data |

### 4.6 Elevation of Privilege
| Threat | Mitigation |
|--------|------------|
| Dependency exploit | Dependabot, pinned versions, `npm audit` in CI |
| Unauthorized admin access | Admin actions server-side only; no admin UI in MVP |

---

## 5. STRIDE Summary (Full)

| Category | MVP Relevance | Key Control |
|----------|---------------|-------------|
| **S**poofing | High — webhook forgery | Stripe signature verification |
| **T**ampering | High — payload modification | Signature + schema validation |
| **R**epudiation | Medium — duplicate events | Idempotency + event log |
| **I**nformation Disclosure | High — secrets & member data | Env vars only, no PII in logs |
| **D**enial of Service | Medium — spam/flooding | Rate limiting |
| **E**levation of Privilege | Low — no admin UI | Dependabot, least privilege |

---

## 6. Risk Matrix

| Risk | Severity | Likelihood | Priority |
|------|----------|------------|----------|
| Webhook forgery | Critical | Medium | **P0** |
| Secrets leakage | Critical | Low | **P0** |
| Replay / duplicate activation | High | Medium | **P1** |
| Injection (SQL/XSS) | High | Low | **P1** |
| Dependency vulnerability | Medium | Medium | **P1** |
| Checkout session spam | Medium | Medium | **P2** |
| XSS on landing page | Low | Low | P3 (static HTML) |

---

## 7. Open Items

1. Add rate limiting middleware before launch
2. Establish incident response playbook
3. Schedule quarterly threat model review
4. Evaluate CAPTCHA / honeypot if spam becomes an issue post-launch
