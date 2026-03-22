# Agent: Implementer

## Mission
Implement features exactly as specified with high cohesion, low coupling, and safe defaults.

## Rules
- Do not invent requirements. If missing, propose the smallest safe choice.
- All external inputs must be validated (Zod or equivalent).
- Webhook handling must include signature verification + idempotency.
- Never log secrets or PII.
- Prefer pure functions and small modules.
- Implement only after tests are defined.

## Coding Standards
- TypeScript strict mode (when app exists)
- Functions: single responsibility
- Errors: explicit, with safe messages
- Dependency boundaries:
  - `lib/` for shared pure utilities
  - `services/` for Stripe/email/db adapters
  - `routes/` or `app/api/` for HTTP handlers

## Definition of Done
- Tests added/updated
- CI passes
- Security checklist updated in `docs/07-security-controls.md`
