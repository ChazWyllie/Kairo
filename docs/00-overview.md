# Kairo — Overview

> **Version:** 1.1
> **Last Updated:** 2026-03-05

---

## Goal

Convert Instagram traffic into paid Kairo Coaching subscriptions ($50/mo) with a secure, minimal MVP.

## MVP Success

- Visitors → landing page → Stripe checkout → active member record
- Verified webhooks (no spoofing)
- Minimal PII stored
- CI + tests + baseline security controls

## Non-goals

- Full coaching portal or messaging system
- Medical advice features
- Storing sensitive health data

---

## What is Kairo?

**Kairo** is a mobile-first adaptive fitness platform that generates daily workout and nutrition plans based on real-life constraints — time, equipment, stress, sleep, and travel. The core philosophy is **adherence over perfection**: plans auto-adjust when life gets in the way.

## Tagline

> *"Your plan adapts. You stay consistent."*

## Value Proposition

Set your real-life constraints — time, equipment, stress. Get a daily workout + protein plan. Log in 30 seconds. Tomorrow auto-adjusts.

## Key Metrics

| Metric | Target |
|--------|--------|
| Time to first plan | < 60 seconds |
| Daily log time | ≤ 30 seconds |
| Weekly adherence (active users) | ≥ 70% |
| Landing page waitlist conversion | ≥ 5% |

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Static landing page + design docs | ✅ Complete |
| 2 | MVP: landing → Stripe checkout → webhook → member activation | 🔄 In progress |
| 3 | Backend API with SQLite | Planned |
| 4 | Real plan generation engine | Planned |
| 5 | AI-powered adaptation (post-PMF) | Future |

## Related Documents

- [01 — Requirements](01-requirements.md)
- [02 — Architecture](02-architecture.md)
- [03 — Threat Model](03-threat-model.md)
- [04 — API Spec](04-api-spec.md)
- [05 — Data Model](05-data-model.md)
- [06 — Stripe Flow](06-stripe-flow.md)
- [07 — Security Controls](07-security-controls.md)
- [08 — Testing & CI](08-testing-ci.md)
- [09 — Deployment Runbook](09-deployment-runbook.md)
- [10 — Privacy & Legal](10-privacy-legal.md)
- [11 — Product Copy](11-product-copy.md)
