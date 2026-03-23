# Kairo

> **Adaptive fitness coaching — your plan adjusts to your life, not the other way around.**

Kairo is a full-stack SaaS platform that delivers AI-driven, constraint-aware daily workout and nutrition plans to paying members. Coaches manage clients through a real-time dashboard while an automated adaptation engine adjusts each member's program based on daily check-ins.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [License](#license)

---

## Overview

Kairo solves the consistency problem in fitness: most plans fail because life isn't predictable. Kairo collects real-time constraints — available time, equipment, stress level, sleep — and generates a daily plan that fits *today*, then auto-adjusts tomorrow based on what was logged.

**Product scenarios:**

| User situation | Kairo response |
|---|---|
| 20 min, hotel gym, high-stress day | Generates a compact hotel workout with adjusted volume |
| 60 min, full gym, muscle-building goal | Full hypertrophy session with progressive overload |
| Low sleep, no equipment, 15 minutes | Recovery-focused mobility + reduced calorie target |
| Missed yesterday's workout | Tomorrow's plan redistributes volume automatically |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL via Prisma ORM 7 |
| **Auth** | bcrypt password hashing + HTTP-only cookie sessions |
| **Payments** | Stripe (subscriptions, one-time founding-member offer) |
| **Email** | Resend |
| **Animation** | Framer Motion 12 |
| **Testing** | Vitest 4 with full API-route coverage |
| **CI/CD** | GitHub Actions — lint, test, OWASP ZAP DAST |
| **Deployment** | Vercel (GitHub Pages for static assets) |

---

## Key Features

### Adaptive Daily Plans
An AI-powered constraints engine takes time availability, equipment, stress, sleep, and goals to generate 2–3 workout options plus daily macro and protein targets. Every plan is stored and used to inform the next.

### 30-Second Daily Check-In
Members log workout completion, meals, water, and steps in under a minute. Weekly check-ins add body metrics, adherence scores, energy/hunger/stress/recovery ratings, and a brief reflection — all feeding the adaptation engine.

### Coach Dashboard
Coaches see a colour-coded client triage (green / yellow / red), review weekly check-ins, write responses, update program blocks, and adjust macro targets — all from a single interface.

### Billing & Membership
Two-tier pricing (Standard / Premium) with monthly and annual billing intervals. Founding-member offer applies a permanent Stripe coupon at checkout. A full customer portal is available for self-serve subscription management.

### Lead Nurture Pipeline
Quiz-to-waitlist flow captures leads with a recommended tier. An automated drip sequence (up to 4 emails via Resend) guides leads through to application submission.

### Security & Compliance
- GDPR deletion: PII is nulled on request while financial records are preserved
- Input validation at all API boundaries via Zod
- No PII in server logs
- OWASP ZAP DAST scan on every push to `main`
- Stripe webhook idempotency via `StripeEvent` deduplication table

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Marketing │  │  Member    │  │  Coach       │  │
│  │  /apply    │  │  /dashboard│  │  /coach      │  │
│  └────────────┘  └────────────┘  └──────────────┘  │
│               App Router API Routes                 │
│  /api/auth  /api/checkin  /api/adaptation           │
│  /api/checkout  /api/billing  /api/coach            │
└─────────────────────────────────────────────────────┘
         │                            │
  ┌──────▼──────┐             ┌───────▼──────┐
  │  PostgreSQL  │             │    Stripe    │
  │  (Prisma)   │             │  Webhooks    │
  └─────────────┘             └──────────────┘
```

**Data flow:** Member completes daily check-in → adaptation engine queries prior check-ins and active program block → generates adjusted DailyPlan stored in DB → member sees updated plan on next login.

---

## Project Structure

```
Kairo/
├── app/
│   └── kairo-web/              # Next.js application
│       ├── src/
│       │   └── app/
│       │       ├── api/        # API route handlers + tests
│       │       │   ├── adaptation/
│       │       │   ├── auth/
│       │       │   ├── billing/
│       │       │   ├── checkin/
│       │       │   ├── checkout/
│       │       │   └── coach/
│       │       ├── apply/      # Application / onboarding flow
│       │       ├── coach/      # Coach dashboard
│       │       ├── dashboard/  # Member dashboard
│       │       └── quiz/       # Lead quiz → tier recommendation
│       └── prisma/
│           ├── schema.prisma   # Full data model
│           └── migrations/     # Versioned migration history
├── docs/                       # Architecture, API spec, security docs
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + test
│       ├── pages.yml           # Static asset deployment
│       └── dast-zap.yml        # OWASP ZAP security scan
├── CHANGELOG.md
└── LICENSE                     # MIT
```

---

## Getting Started

**Prerequisites:** Node.js 20+, PostgreSQL, a Stripe account, a Resend account.

```bash
# 1. Clone the repository
git clone https://github.com/ChazWyllie/Kairo.git
cd Kairo/app/kairo-web

# 2. Install dependencies
npm install

# 3. Configure environment
cp ../../infrastructure/env.example .env.local
# Fill in DATABASE_URL, STRIPE_SECRET_KEY, RESEND_API_KEY, etc.

# 4. Run database migrations
npx prisma migrate deploy

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Testing

```bash
# Run the full test suite
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

All API routes have co-located test files (`route.test.ts`). The CI pipeline runs tests and ESLint on every pull request.

---

## License

MIT — see [LICENSE](LICENSE).
