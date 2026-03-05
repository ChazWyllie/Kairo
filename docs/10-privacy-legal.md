# Kairo — Privacy & Legal

> **Version:** 1.0
> **Last Updated:** 2026-02-15
> **Status:** DRAFT

---

## 1. Data Collection

### Phase 1 (Landing Page)
| Data | Purpose | Retention |
|------|---------|-----------|
| Email address | Waitlist signup | Until product launch or user requests deletion |

### Phase 2+ (App)
| Data | Purpose | Retention |
|------|---------|-----------|
| Email + password | Account authentication | Account lifetime |
| Fitness constraints | Plan generation | Account lifetime |
| Daily logs | Adaptation + insights | Account lifetime |
| Payment info | Billing (via Stripe — not stored locally) | Managed by Stripe |

---

## 2. GDPR Compliance

| Right | Implementation |
|-------|---------------|
| Right to access | Export endpoint: `GET /api/me/export` |
| Right to deletion | Delete endpoint: `DELETE /api/me` (cascading delete) |
| Right to rectification | Profile edit via app |
| Right to portability | JSON export of all user data |
| Right to withdraw consent | Unsubscribe + account deletion |
| Data minimization | Collect only what's needed for core functionality |

---

## 3. Cookie Policy

| Cookie | Purpose | Type |
|--------|---------|------|
| Session token | Authentication | Essential (HttpOnly, Secure) |
| Theme preference | UI preference | Functional (localStorage) |

No tracking cookies. No third-party analytics cookies.

---

## 4. Third-Party Processors

| Processor | Purpose | DPA Required |
|-----------|---------|-------------|
| Stripe | Payment processing | Yes (Stripe provides standard DPA) |
| Vercel/Netlify | Hosting | Yes |
| Sentry | Error tracking (no PII) | Yes |

---

## 5. Privacy Policy Requirements

The public privacy policy must include:
- [ ] What data we collect and why
- [ ] How data is stored and protected
- [ ] Third-party processors
- [ ] User rights (access, deletion, export)
- [ ] Contact information for privacy inquiries
- [ ] Cookie usage
- [ ] Data retention periods

---

## 6. Terms of Service Requirements

- [ ] Service description
- [ ] User responsibilities
- [ ] Payment terms and refund policy
- [ ] Limitation of liability
- [ ] Termination conditions
- [ ] Governing law
