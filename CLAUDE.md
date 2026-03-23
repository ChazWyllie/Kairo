# CLAUDE.md — Kairo Fitness Codebase Guide

This file provides AI assistants with context about the Kairo codebase structure, conventions, and development workflows.

---

## Project Overview

**Kairo Fitness** is a 1:1 online fitness coaching platform. Members get custom workout programming, personalized nutrition targets, and an adaptive daily plan that flexes with real-life constraints (time, equipment, stress, sleep).

**Business model:**
- Two coaching tiers: **Standard** ($149/mo) and **Premium** ($350/mo)
- One-time digital product sales (template guides, $15–$39)
- Application-based onboarding → Stripe subscription
- Founding member program (10% off forever, locked via Stripe coupon)

---

## Repository Structure

```
Kairo/
├── app/
│   └── kairo-web/          # Primary Next.js 15 application
│       ├── prisma/          # Database schema and migrations
│       ├── public/          # Static assets (SVG icons, manifest.json)
│       ├── src/
│       │   ├── app/         # Next.js App Router pages and API routes
│       │   ├── components/  # Shared React components
│       │   ├── data/        # Static data (exercise catalog, etc.)
│       │   ├── lib/         # Pure utility/business logic modules
│       │   ├── services/    # Service adapters (Stripe, email, etc.)
│       │   └── test/        # Vitest global setup and mocks
│       ├── eslint.config.mjs
│       ├── next.config.ts
│       ├── prisma.config.ts
│       ├── tsconfig.json
│       └── vitest.config.ts
├── infrastructure/          # Environment variable templates and secrets guidance
├── prompts/                 # Claude Code skills/prompts
├── tests/                   # Top-level integration/accessibility tests (Node scripts)
├── CHANGELOG.md
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) with React 19 |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL via Prisma 7 (ORM) |
| Payments | Stripe (subscriptions + one-time payments) |
| Email | Resend |
| Auth | Custom HMAC-SHA256 JWT (no NextAuth) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Analytics | Vercel Analytics |
| Testing | Vitest 4 (unit/integration, node environment) |
| Linting | ESLint 9 with `eslint-config-next` |
| Env validation | `@t3-oss/env-nextjs` + Zod |
| Deployment | Vercel |

---

## App Router Structure (`src/app/`)

### Pages
| Route | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/quiz` | Lead capture quiz — recommends coaching tier |
| `/apply` | Application form for prospective members |
| `/purchase` | One-time product purchase (template guides) |
| `/checkout` | Stripe checkout redirect |
| `/success` | Post-purchase success page |
| `/login` | Member login |
| `/register` | Member account creation (post-payment) |
| `/onboarding` | Member intake form |
| `/dashboard` | Member dashboard (workouts, nutrition, more) |
| `/coach` | Internal coach dashboard (protected by COACH_SECRET) |
| `/mobile` | Mobile app landing page |

### API Routes (`src/app/api/`)
| Route | Purpose |
|---|---|
| `/api/quiz` | Save quiz answers, recommend tier, nurture leads |
| `/api/waitlist` | Waitlist email capture |
| `/api/application` | Submit coaching application |
| `/api/checkout` | Create Stripe checkout session |
| `/api/webhook` | Stripe webhook handler (member activation/cancellation) |
| `/api/billing/portal` | Create Stripe billing portal session |
| `/api/auth/*` | Login, register, logout endpoints |
| `/api/checkin` | Daily check-in logging |
| `/api/plan` | Daily plan generation |
| `/api/member` | Member profile reads/updates |
| `/api/onboarding` | Onboarding form submission |
| `/api/coach/*` | Coach dashboard data endpoints |
| `/api/cron/*` | Scheduled job endpoints (nurture emails, etc.) |
| `/api/feedback` | Member review/suggestion submission |
| `/api/macro` | Macro target management |
| `/api/program` | Program block management |
| `/api/review` | Coach review management |
| `/api/adaptation` | Adaptation recommendations |
| `/api/nurture` | Nurture email sequence management |

---

## Database Schema (Prisma)

**Key models:**

- **`Member`** — Core user record. Tracks profile, onboarding data, Stripe IDs, plan tier, billing interval, GDPR deletion, and all training/nutrition preferences.
- **`CheckIn`** — Daily and weekly check-ins. Includes workout adherence, body metrics, recovery scores, coach triage status, and coach response.
- **`Lead`** — Quiz/waitlist captures. Tracks nurture email sequence state.
- **`Application`** — Coaching applications with status workflow (pending → approved → converted).
- **`Review`** — Coach-generated progress reviews.
- **`ProgramBlock`** — Training mesocycles/phases with programming details.
- **`MacroTarget`** — Calorie and macro prescriptions, with adjustment history.
- **`DailyPlan`** — Generated daily workout + nutrition plans with constraint snapshots.
- **`MemberFeedback`** — Star ratings and suggestions.
- **`StripeEvent`** — Idempotency log for processed Stripe webhook events.

**Plan tiers (enum):** `standard`, `premium` (current). Legacy values (`foundation`, `coaching`, `performance`, `vip`) are kept to avoid breaking existing DB rows — do NOT remove them.

**Member statuses:** `pending` → `active` → `canceled` | `past_due`

---

## Authentication

Authentication is entirely custom — no NextAuth or third-party auth library.

**Two auth systems:**

1. **Member auth** — HMAC-SHA256 JWT stored in `kairo_session` httpOnly cookie (7-day expiry). Signed with `AUTH_SECRET`. Implementation: `src/lib/auth.ts`.

2. **Coach auth** — Shared secret (`COACH_SECRET`) checked via:
   - `Authorization: Bearer <COACH_SECRET>` header (API/programmatic access)
   - `coach_session` httpOnly cookie (browser-based access)

**Key functions in `src/lib/auth.ts`:**
- `requireMemberOrCoachAuth(request, email)` — Dual-path auth (coach can access any member, member can only access their own data)
- `requireCoachAuth(request)` — Coach-only endpoints
- `requireCronAuth(request)` — Cron job endpoints (uses `CRON_SECRET`)
- All secret comparisons use `timingSafeCompare` to prevent timing attacks

---

## Environment Variables

All env vars are validated at startup via `src/lib/env.ts` using `@t3-oss/env-nextjs`.

**Required server-side vars:**
```
DATABASE_URL              # PostgreSQL connection string
STRIPE_SECRET_KEY         # Must start with sk_
STRIPE_WEBHOOK_SECRET     # Must start with whsec_
APP_URL                   # Full URL (e.g. https://kairo.business)
ADMIN_NOTIFY_EMAIL        # Admin notification email
EMAIL_FROM                # Sender address for transactional emails
AUTH_SECRET               # ≥32 chars — JWT signing secret
COACH_SECRET              # ≥16 chars — coach dashboard secret
CRON_SECRET               # ≥16 chars — scheduled job secret
RESEND_API_KEY            # Required in production
```

**Optional server-side vars:**
```
FOUNDING_MEMBER_COUPON_ID           # Stripe coupon for 10% off forever
STRIPE_PRICE_STANDARD_MONTHLY       # price_xxx
STRIPE_PRICE_STANDARD_ANNUAL        # price_xxx
STRIPE_PRICE_PREMIUM_MONTHLY        # price_xxx
STRIPE_PRICE_PREMIUM_ANNUAL         # price_xxx
```

**No client-side env vars** — all Stripe keys stay server-side. Template: `infrastructure/env.example`.

> **SKIP_ENV_VALIDATION** may be set during CI/build (`NEXT_PHASE=phase-production-build`) but must NEVER be set at production runtime.

---

## `src/lib/` — Business Logic Modules

All modules here are pure utilities or thin wrappers. No direct Next.js dependencies.

| File | Purpose |
|---|---|
| `env.ts` | Validated environment variables (single source of truth) |
| `auth.ts` | JWT creation/verification, auth middleware helpers |
| `prisma.ts` | Singleton Prisma client |
| `products.ts` | Coaching tier and template product catalog/pricing |
| `stripe-prices.ts` | Stripe price ID resolution |
| `stripe-server.ts` | Server-side Stripe helpers |
| `rate-limit.ts` | In-memory sliding-window rate limiter |
| `validation.ts` | Email validation (shared client+server) |
| `sanitize.ts` | HTML escaping for email templates |
| `quiz-engine.ts` | Weighted scoring quiz → tier recommendation |
| `plan-generator.ts` | Daily workout + nutrition plan generation |
| `plan-types.ts` | TypeScript types for plan generation |
| `constraints.ts` | Normalize member constraints for plan gen |
| `nutrition-calculator.ts` | TDEE and macro calculations |
| `adaptation-rules.ts` | Pure recommendation engine (Insights → Recommendations) |
| `adaptation-types.ts` | Types for adaptation engine |
| `insights.ts` | Compute member insights from check-in history |
| `streak.ts` | Check-in streak calculation |
| `analytics.ts` | Analytics event helpers |
| `animations.ts` | Framer Motion animation presets |
| `design-tokens.ts` | Design system tokens |
| `landing-config.ts` | Landing page content config |
| `nurture-emails.ts` | Nurture sequence email content |

---

## `src/services/` — External Service Adapters

| File | Purpose |
|---|---|
| `stripe.ts` | Stripe client singleton |
| `email.ts` | Resend-based transactional email functions |
| `checkin.ts` | Check-in business logic |
| `application.ts` | Application workflow logic |
| `coach.ts` | Coach dashboard data aggregation |
| `nurture.ts` | Nurture email sequence logic |
| `adaptation.ts` | Adaptation service (orchestrates lib modules) |

---

## Security

Kairo applies defense-in-depth:

1. **Edge proxy** (`src/proxy.ts` / `middleware.ts`) — Sets security headers on every response:
   - CSP with per-request nonce (`x-nonce` header forwarded to layout)
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy`
   - `Strict-Transport-Security`

2. **Framework headers** (`next.config.ts`) — Fallback layer if proxy doesn't run.

3. **Input validation** — Zod schemas on all API routes; `isValidEmail()` on both client and server.

4. **HTML sanitization** — `escapeHtml()` on all user content in email templates.

5. **Rate limiting** — In-memory sliding-window limits on sensitive endpoints:
   - Checkout: 5 req/60s per IP
   - Quiz: 10 req/60s per IP
   - Login: 5 req/15min per IP+email
   - Register: 5 req/15min per IP
   - Waitlist: 5 req/60s per IP
   - Plan gen: 10 req/60s per IP

6. **Stripe webhook security** — Raw body + signature verification; idempotency via `StripeEvent` table.

7. **GDPR** — Member deletion nulls PII fields but preserves financial records; `deletedAt` timestamp set on `Member`.

8. **Passwords** — bcrypt hashing (`bcryptjs`); never logged.

---

## Rate Limiting Notes

Current rate limiter (`src/lib/rate-limit.ts`) is **in-memory only** — it resets on cold start/redeploy. This is intentional for the Vercel serverless MVP. At scale, migrate to Redis/Upstash.

---

## Testing

**Framework:** Vitest 4 in `node` environment.

**Run tests:**
```bash
cd app/kairo-web
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with v8 coverage
```

**Test file convention:** Co-located with source — `foo.ts` → `foo.test.ts`. Coverage configured for `src/app/api/**`, `src/lib/**`, `src/services/**`.

**Global mocks** (`src/test/setup.ts`):
- `@/lib/env` → fake env values
- `@/lib/prisma` → `mockPrisma` (full vi.fn() stubs for all models)
- `@/services/stripe` → mock Stripe client
- `@/services/email` → all email functions mocked
- `@/lib/rate-limit` → always-allow mock (rate-limit.test.ts tests the real implementation directly)

**Pattern:** Tests import mocks from `setup.ts` and reset them with `vi.clearAllMocks()` (or `beforeEach` reset). Never call real external services from unit tests.

---

## Development Workflow

### Prerequisites
- Node.js (see `.nvmrc` if present)
- PostgreSQL database
- Stripe CLI (for webhook forwarding in dev)

### Setup
```bash
cd app/kairo-web
cp ../../infrastructure/env.example .env.local
# Fill in .env.local values
npm install
npx prisma migrate dev
npm run dev
```

### Webhook forwarding (dev)
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

### Linting
```bash
npm run lint
```

### Database migrations
```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate      # regenerate client after schema change
```

---

## Git Conventions

- Branch naming: `claude/<feature>-<id>` for AI-generated branches
- Commit style: conventional commits — `feat(scope): message`, `fix(scope): message`, `chore:`, `test:`
- PRs are squash-merged into `main`

---

## Key Patterns and Conventions

### API Route Pattern
Every API route handler:
1. Validates the `Content-Type` header where applicable
2. Validates the request body with Zod
3. Checks rate limits (returns `429` with `Retry-After` header)
4. Checks auth (`requireCoachAuth` / `requireMemberOrCoachAuth` / `requireCronAuth`)
5. Returns structured errors: `{ error: { code: "SCREAMING_SNAKE_CASE", message: "..." } }`

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description"
  }
}
```

### Pure Functions First
Business logic lives in `src/lib/` as pure functions with no framework dependencies. Services in `src/services/` compose these. API routes orchestrate services.

### Prisma Usage
- Singleton pattern: always import `prisma` from `@/lib/prisma`
- Use `$transaction` for multi-step writes that must be atomic
- Stripe webhook handler uses `StripeEvent` table for idempotency — always check before processing

### Environment Access
Never access `process.env` directly in application code. Always use `import { env } from "@/lib/env"` to get typed, validated values.

### Stripe Price IDs
Price IDs come from env vars. Do not hardcode `price_xxx` strings in application logic — always resolve through `src/lib/stripe-prices.ts` or `env`.

### No Client-Side Secrets
No env vars are exposed to the browser (`NEXT_PUBLIC_*`). All Stripe operations happen server-side. The only exception is `NEXT_PUBLIC_STRIPE_*_PRICE_ID` vars used for one-time template product purchases.

### Content Security Policy
The nonce for CSP is generated per-request in `src/proxy.ts` (edge middleware) and forwarded to the app via the `x-nonce` request header. The root layout (`src/app/layout.tsx`) reads it with `headers().get("x-nonce")` and passes it to any inline `<Script>` tags.

---

## Coaching Product Tiers

| Tier | Price | Notes |
|---|---|---|
| Standard | $149/mo | Custom programming + nutrition + check-ins |
| Premium | $350/mo | Everything in Standard + weekly video calls + daily messaging |

Annual billing: 10% discount (multiply monthly by 0.9).
Founding member: additional 10% off applied via Stripe coupon forever.

Legacy tiers (`foundation`, `coaching`, `performance`, `vip`) exist in the DB enum — do NOT delete them, but do not use them for new members.

---

## Plan Generation Engine

The adaptive daily plan generator lives in `src/lib/`:

- **`constraints.ts`** — Normalizes member context (travel mode, high stress, low sleep, equipment, time budget)
- **`plan-generator.ts`** — Selects exercises, builds workout + nutrition plan from normalized constraints
- **`nutrition-calculator.ts`** — TDEE and macro calculations
- **`adaptation-rules.ts`** — Deterministic rules engine: Insights + MemberContext → Recommendations[]
- **`insights.ts`** — Computes aggregated metrics from check-in history

Plan modes: `normal`, `travel`, `recovery` — detected automatically from constraints.

---

## Nurture Email Sequence

Leads (from quiz/waitlist) receive a drip sequence tracked via `Lead.lastNurtureStep` (0–4) and `Lead.lastNurtureAt`. Opt-out is tracked in `Lead.nurtureOptedOut`. Triggered by cron jobs hitting `/api/cron/*` with `Authorization: Bearer <CRON_SECRET>`.

---

## What to Avoid

- **Do not** access `process.env` directly — use `env` from `@/lib/env`
- **Do not** hardcode Stripe price IDs or product prices
- **Do not** add `console.log` with PII (emails, names, payment info)
- **Do not** skip Stripe webhook signature verification
- **Do not** remove legacy PlanTier enum values (`foundation`, `coaching`, `performance`, `vip`)
- **Do not** set `SKIP_ENV_VALIDATION` at production runtime
- **Do not** use `Math.random()` for security comparisons — use `timingSafeCompare`
- **Do not** create new client-side (`NEXT_PUBLIC_*`) env vars for sensitive data
