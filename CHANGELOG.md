# Changelog

All notable changes to ConsistAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
- RFC for landing page (`docs/rfcs/2026-02-15-consistai-landing-page.md`)
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
