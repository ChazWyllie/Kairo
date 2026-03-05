# Kairo Coaching — Copilot Instructions

## Project Overview
Kairo Coaching is a fitness coaching MVP that converts Instagram traffic into $50/mo Stripe subscriptions. The flow is: **landing page → Stripe Checkout → webhook → member activation → admin notification**. There is no user auth — Stripe handles identity.

## Architecture
- **`src/landing/`** — Static HTML/CSS landing page (no build tools, works from `file://`)
- **`app/kairo-web/`** — Next.js app (TypeScript strict, being scaffolded)
- **`app/kairo-web/prisma/schema.prisma`** — Data model: `Member` (email, phone?, Stripe IDs, status) + `StripeEvent` (idempotency)
- **Database:** PostgreSQL via Prisma. Env loaded from `.env.local` (see `prisma.config.ts`)
- **Payments:** Stripe Checkout (hosted). Two API endpoints: `POST /api/checkout`, `POST /api/webhook`
- **Email:** Resend for admin notifications on successful activation

## How to Work in This Repo — Automatic Routing

When given a task, determine the type and follow the matching workflow automatically. Read the linked files before producing output.

### → Building a feature
1. Read `docs/01-requirements.md` + `docs/03-threat-model.md` for context
2. **Plan** per `agents/planner.md` — output spec, interfaces, risks, acceptance criteria
3. **Test first** per `agents/qa.md` — generate test cases (happy path + failure + abuse) before any code
4. **Implement** per `agents/implementer.md` — Zod validation, webhook sig+idempotency, no PII logging, TypeScript strict, boundaries: `lib/` → `services/` → `app/api/`
5. **Review** per `agents/reviewer.md` + `agents/security.md` — must-fix vs nice-to-have
6. **Gate** with `docs/checklists/definition-of-done.md`
7. Fill the spec using `prompts/feature-template.md`

### → Fixing a bug
1. Follow `prompts/bugfix-template.md`: root cause → write failing test → minimal fix → validate → report
2. Apply `agents/implementer.md` rules during the fix
3. Run `npm test` to confirm no regressions

### → Refactoring code
1. Follow `prompts/refacror-template.md`: identify smells → add regression tests → refactor → show diff
2. No behavior changes — tests must pass before and after

### → Writing or reviewing a PR
1. Use `prompts/pr-template.md` for the description (What / Why / How to test / Security / Checklist)
2. Review per `agents/reviewer.md` + `docs/checklists/reviewer-checklist.md`
3. If endpoints or data handling changed, also run `agents/security.md` and `docs/checklists/security-checklist.md`

### → Security review
1. Follow `prompts/security-review-template.md`: entry points → threats → controls → evidence
2. Cross-reference `docs/03-threat-model.md` for known threats and mitigations
3. Update `docs/07-security-controls.md` with any new controls implemented

### → Generating a test plan
1. Follow `prompts/test-plan-template.md`: feature → risks → test cases (happy/failure/abuse) → automation
2. Map cases back to `docs/01-requirements.md` acceptance criteria and `docs/03-threat-model.md` threats

### → Architecture review
1. Follow `prompts/architecture-review.md`: scalability, security, bottlenecks, single points of failure
2. Reference `docs/02-architecture.md` for current design

### → Complex multi-step task
1. Use `prompts/multi-agent-orchestration.md` to assign subtasks to planner → implementer → reviewer → QA
2. Or use `prompts/master-agentic-engineering.md` for full autonomous workflow: requirements → decomposition → TDD → implement → review

### → Landing page work
1. Reference `prompts/landing-page.md` for the showcase app design spec
2. Landing page lives in `src/landing/` — static HTML/CSS, no build tools

## Critical Conventions
- **Validate all inputs with Zod** — no raw `req.body` access
- **Webhook handling requires:** `stripe.webhooks.constructEvent()` signature verification + idempotency via `StripeEvent` table (store processed event IDs, skip duplicates)
- **Never log secrets or PII** — use structured logging with safe fields only
- **Secrets live in env vars only** — `.env.local` for dev, platform secrets for prod. See `infrastructure/env.example` for the full list
- **Dependency boundaries:** `lib/` (pure utilities), `services/` (Stripe/email/db adapters), `app/api/` (HTTP handlers)

## Commands
```bash
# Root tests (50 cheerio-based HTML/CSS/a11y/content tests)
npm test                    # run all
npm run test:html           # HTML structure (22 tests)
npm run test:a11y           # accessibility (9 tests)
npm run test:css            # CSS quality (8 tests)
npm run test:content        # content quality (11 tests)

# Landing page (no build step)
open src/landing/index.html

# Web app (when initialized)
cd app/kairo-web && npm run dev
```

## Security Non-negotiables
Before writing any endpoint or handler, check `docs/03-threat-model.md` for relevant threats. Key controls:
- Stripe webhook signature verification on every webhook event
- Idempotency: check `StripeEvent` before processing; only handle `checkout.session.completed`
- Rate limiting on public endpoints
- No PII in logs, no secrets in source
- Update `docs/07-security-controls.md` when adding new controls

## Docs — Reference Library (`docs/`)
Numbered docs are the source of truth. Read before building, update when changing behavior.

| Doc | When to consult |
|-----|-----------------|
| `00-overview.md` | MVP goal, success criteria, phase roadmap |
| `01-requirements.md` | What to build (MVP) vs defer (post-MVP) |
| `02-architecture.md` | System layers, component design, data flow |
| `03-threat-model.md` | STRIDE threats, assets, entry points, risk matrix — **read before any endpoint work** |
| `04-api-spec.md` | Route contracts, request/response schemas |
| `05-data-model.md` | Database schema design and field semantics |
| `06-stripe-flow.md` | Checkout → webhook → activation sequence |
| `07-security-controls.md` | Implemented controls — **update when adding new ones** |
| `08-testing-ci.md` | Test strategy, CI pipeline design |
| `09-deployment-runbook.md` | Deploy steps, rollback, monitoring |
| `10-privacy-legal.md` | PII handling, GDPR, data retention |
| `11-product-copy.md` | Marketing copy, CTA text, brand voice |

Sub-directories:
- **`docs/checklists/`** — Gate checklists. Apply `definition-of-done.md` to every WP. Use `reviewer-checklist.md` and `security-checklist.md` during reviews.
- **`docs/workflows/iteration-runbook.md`** — Day-to-day dev loop: pick WP → write tests → implement → review → commit.
- **`docs/workpackages/`** — Scoped work items (WP1–WP6) with acceptance criteria. Follow sequentially.
- **`docs/rfcs/`** — Approved design decisions. Use `docs/rfc-template.md` for new proposals.

## Agents — Role-Specific AI Behaviors (`agents/`)
Each agent has a defined mission, rules, and output format. Invoke by role:

| Agent | File | Use when… |
|-------|------|-----------|
| **Planner** | `agents/planner.md` | Breaking requirements into milestones and task checklists. Reads `01-requirements.md` + `03-threat-model.md`. Outputs spec, interfaces, risks, acceptance criteria. |
| **Implementer** | `agents/implementer.md` | Writing production code. Enforces Zod validation, webhook sig+idempotency, no PII logging, TypeScript strict, dependency boundaries (`lib/` → `services/` → `app/api/`). Only codes after tests exist. |
| **Reviewer** | `agents/reviewer.md` | Reviewing PRs/changes. Checks requirements met, input validation, Stripe webhook correctness, idempotency, secrets handling, test coverage. Outputs must-fix vs nice-to-have. |
| **Security** | `agents/security.md` | Threat-model-first review. Focuses on webhook forgery, injection, rate limiting, secrets, headers, least data. Updates `03-threat-model.md` and `07-security-controls.md`. |
| **QA** | `agents/qa.md` | Generating test plans. TDD-first, deterministic tests, maps requirements + threats to test cases. |

## Prompts — Task Templates (`prompts/`)
Structured templates for consistent output. Use the right one for the task:

| Template | File | Purpose |
|----------|------|---------|
| **Feature** | `prompts/feature-template.md` | Full spec: context, scope, interfaces, data model, security, tests, AC. Enforces the 5-phase workflow (Requirements → Design → Test Plan → Implement → Review). |
| **Bug Fix** | `prompts/bugfix-template.md` | Root cause → failing test → minimal fix → validation → report. |
| **Refactor** | `prompts/refacror-template.md` | Analyze smells → add regression tests → refactor → show diff. |
| **PR Description** | `prompts/pr-template.md` | What / Why / How to test / Security notes / Checklist. |
| **Security Review** | `prompts/security-review-template.md` | Entry points → threats → controls → evidence. |
| **Test Plan** | `prompts/test-plan-template.md` | Feature → risks → test cases (happy/failure/abuse) → automation. |
| **Architecture Review** | `prompts/architecture-review.md` | Evaluate scalability, security, bottlenecks, single points of failure. |
| **Landing Page** | `prompts/landing-page.md` | Design spec for the landing page showcase app. |
| **Multi-Agent** | `prompts/multi-agent-orchestration.md` | Orchestrate planner → implementer → reviewer → QA with I/O contracts. |
| **Master Engineering** | `prompts/master-agentic-engineering.md` | Full autonomous workflow: requirements → decomposition → TDD → implement → review → stage. |

## Agent Workflow
Follow the sequence strictly: **Spec → Design → Test Plan → Implement → Review**. Do not write production code before tests are defined.

1. Start with `prompts/feature-template.md` (or appropriate template)
2. Use `agents/planner.md` to break down the task
3. Use `agents/qa.md` to generate test cases
4. Use `agents/implementer.md` to write code (after tests)
5. Use `agents/reviewer.md` + `agents/security.md` to review
6. Gate with `docs/checklists/definition-of-done.md`

## Infrastructure (`infrastructure/`)
- **`env.example`** — All env vars (Stripe, DB, Resend, etc.). Copy to `app/kairo-web/.env.local`
- **`secrets-guidance.md`** — Non-negotiable secrets rules: never commit, never log, `.env.local` for dev, platform secrets for prod
