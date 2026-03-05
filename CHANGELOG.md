# Changelog

All notable changes to Kairo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added — Repository Restructuring
- Numbered docs series (`docs/00-overview.md` through `docs/11-product-copy.md`)
- Threat model (`docs/03-threat-model.md`) with STRIDE analysis
- API specification (`docs/04-api-spec.md`) with full endpoint contracts
- Data model (`docs/05-data-model.md`) with table schemas and indexes
- Stripe payment flow (`docs/06-stripe-flow.md`)
- Security controls reference (`docs/07-security-controls.md`)
- Testing & CI strategy (`docs/08-testing-ci.md`)
- Deployment runbook (`docs/09-deployment-runbook.md`)
- Privacy & legal requirements (`docs/10-privacy-legal.md`)
- Product copy reference (`docs/11-product-copy.md`)
- Security agent (`agents/security.md`)
- QA agent (`agents/qa.md`)
- PR description prompt (`prompts/pr-template.md`)
- Security review prompt (`prompts/security-review-template.md`)
- Test plan prompt (`prompts/test-plan-template.md`)
- GitHub PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
- Dependabot configuration (`.github/dependabot.yml`)
- OWASP ZAP DAST workflow (`.github/workflows/dast-zap.yml`)
- Next.js app directory placeholder (`app/kairo-web/`)
- Infrastructure config (`infrastructure/env.example`, `infrastructure/secrets-guidance.md`)
- `.editorconfig` for editor consistency
- `LICENSE` file (MIT)

### Changed
- Renamed `docs/architecture.md` → `docs/02-architecture.md`
- Updated README.md project structure to reflect new layout
- Updated `.gitignore` with Next.js, ZAP report, and env file entries

---

## [0.1.0] — 2026-02-15

### Added — WP1: Landing Page MVP
- Static landing page (`src/landing/index.html` + `styles.css`)
- Hero section with headline, tagline, and CTA buttons
- 3-step "How It Works" section (Set constraints → Get plan → Log & adapt)
- 3 phone mockup screens rendered in pure CSS:
  - **Today:** Workout options, nutrition targets, mode pill
  - **Quick Log:** 30-second checklist, "Missed today?" card
  - **Insights:** Streak, adherence %, next best action, weekly summary
- Competitor contrast section
- Waitlist email capture form with client-side validation
- Responsive design (375px, 768px, 1024px, 1440px breakpoints)
- Dark mode color scheme with accent gradient
- Zero external dependencies (no CDN, no framework, no images)
- Accessible: semantic HTML, aria-labels, keyboard navigation

### Added — Project Infrastructure
- Technical architecture document (`docs/architecture.md`)
- RFC for landing page (`docs/rfcs/2026-02-15-kairo-landing-page.md`)
- RFC template (`docs/rfcs/rfc-template.md`)
- 6 work packages (`docs/workpackages/WP1–WP6`)
- Reviewer, security, and DoD checklists (`docs/checklists/`)
- Iteration runbook (`docs/workflows/iteration-runbook.md`)
- Solution slide content package (`docs/solution-slide.md`)
- CI/CD workflow (`.github/workflows/ci.yml`) with Node.js test runner
- Complete README with demo instructions

### Added — Test Suite (50 tests, TDD)
- HTML structure tests (22 tests) — validates all required sections and elements
- Content quality tests (11 tests) — ensures concrete copy, no placeholders
- Accessibility tests (9 tests) — semantic HTML, ARIA, heading hierarchy
- CSS quality tests (8 tests) — responsive queries, custom properties, no externals
- Minimal test runner (`tests/run-all.js`) — no framework dependency
- `package.json` with test scripts and cheerio dependency

### Security
- No inline event handlers (XSS prevention)
- No external scripts or CDN dependencies
- Form uses `action="#"` (no data exfiltration)
- Input validation on email field
- No tracking pixels or third-party code
