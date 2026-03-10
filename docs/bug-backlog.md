# Bug Backlog

This file tracks confirmed bugs and review findings as small, reviewable PR-sized items.

## Status Legend

- `fixed` — implemented on the current branch
- `ready` — confirmed and ready for a dedicated PR
- `needs-decision` — real issue, but implementation direction should be chosen first

## Fixed On Current Branch

### BB-001 — Apply form step progression feels dead
- Status: `fixed`
- Severity: High
- Area: Application flow
- Evidence:
  - [app/kairo-web/src/app/apply/page.tsx](app/kairo-web/src/app/apply/page.tsx)
  - The multi-step form previously relied on click-only `type="button"` handlers for Continue.
  - Validation failures were easy to miss, and keyboard submit behavior was inconsistent with the visual flow.
- Root cause:
  - Step advancement logic lived outside the form submit path, so the flow was more fragile than the final submit step and gave weak feedback when a required field blocked progression.
- Fix applied:
  - Added shared apply-flow validation/progression helpers.
  - Routed Continue through the form submit handler for non-review steps.
  - Surfaced explicit step-level error text when required fields block progression.
- Regression coverage:
  - [app/kairo-web/src/lib/apply-flow.test.ts](app/kairo-web/src/lib/apply-flow.test.ts)

### BB-002 — Monthly and annual pricing labels are not clickable
- Status: `fixed`
- Severity: Medium
- Area: Landing and quiz result pricing UI
- Evidence:
  - [app/kairo-web/src/app/page.tsx](app/kairo-web/src/app/page.tsx)
  - [app/kairo-web/src/app/quiz/result/page.tsx](app/kairo-web/src/app/quiz/result/page.tsx)
  - The visible Monthly and Annual labels were plain text, so only the small switch itself changed billing interval.
- Root cause:
  - The UI presented two obvious interval targets, but the implementation only bound click behavior to the center switch control.
- Fix applied:
  - Made Monthly and Annual direct button targets.
  - Added pressed-state semantics so the interval control is clearer and more accessible.

### BB-003 — Adaptation endpoint type mismatch blocks app typecheck
- Status: `fixed`
- Severity: Critical
- Area: Adaptation engine
- Root cause:
  - Adaptation service and tests queried MacroTarget by boolean `active: true`, but the Prisma schema uses `status: MacroTargetStatus` enum.
- Fix applied:
  - Changed filter to `status: "active"` in adaptation.ts and all test mocks.

### BB-004 — Auth tests mutate readonly env fields
- Status: `fixed`
- Severity: High
- Area: Test stability
- Root cause:
  - Direct assignment to `process.env.NODE_ENV` which is typed readonly in TypeScript strict mode.
- Fix applied:
  - Replaced with `vi.stubEnv()` / `vi.unstubAllEnvs()` — Vitest's idiomatic env override pattern.

### BB-005 — PII appears in development log and stub-log paths
- Status: `fixed`
- Severity: High
- Area: Logging and privacy
- Root cause:
  - All 11 email stub logs included email addresses via `to:` or named fields like `memberEmail`.
- Fix applied:
  - Removed email addresses from all stub log statements. Logs now include only safe fields (subject, tier, step, Stripe IDs).
  - Updated test assertions that depended on PII in log output.

## Ready For Separate PRs

### BB-006 — Landing waitlist behavior conflicts with `file://` requirement
- Status: `ready`
- Severity: Medium
- Area: Static landing compatibility
- Evidence:
  - [src/landing/index.html](src/landing/index.html)
  - [docs/01-requirements.md](docs/01-requirements.md)
  - The landing page uses a server-relative waitlist API path, which does not satisfy the documented `file://` compatibility requirement for actual submission behavior.
- Suggested PR:
  - Either add a graceful fallback or narrow the requirement in docs so preview-from-disk is clearly non-submitting.

## Needs Decision

### BB-007 — Hidden coach login path conflicts with documented auth model
- Status: `needs-decision`
- Severity: High
- Area: Authentication
- Evidence:
  - [app/kairo-web/src/app/api/auth/login/route.ts](app/kairo-web/src/app/api/auth/login/route.ts)
  - [app/kairo-web/src/app/api/auth/login/route.test.ts](app/kairo-web/src/app/api/auth/login/route.test.ts)
  - [docs/03-threat-model.md](docs/03-threat-model.md)
  - [docs/04-api-spec.md](docs/04-api-spec.md)
  - Code currently supports coach login via password matching `COACH_SECRET`, while the docs describe coach access as Bearer-only.
- Suggested PR after decision:
  - Either remove the hidden path and keep Bearer-only coach auth, or formally document and support coach session auth end-to-end.