# ConsistAI

> **Your plan adapts. You stay consistent.**

Fitness that adapts when life happens. Set your real-life constraints — time, equipment, stress. Get a daily workout + protein plan. Log in 30 seconds. Tomorrow auto-adjusts.

---

## Quick Start

### View the Landing Page

No build tools required. Open the file directly in your browser:

```bash
open src/landing/index.html
```

Or use VS Code Live Server:
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `src/landing/index.html` → "Open with Live Server"

### Demo Prompts

Try these scenarios to understand the product:

1. **Busy traveler:** "I have 20 minutes, hotel gym only, high stress day → what's my plan?"
2. **Weekend warrior:** "I have 60 minutes, full gym, muscle building goal → generate plan"
3. **Recovery day:** "Low sleep, no equipment, 15 minutes → recovery-focused plan"
4. **Missed day:** "I missed yesterday's workout → how does tomorrow adapt?"

---

## Project Structure

```
ConsistAI/
├── docs/
│   ├── architecture.md           # Technical architecture
│   ├── rfc-template.md           # RFC template
│   ├── slide-content.md          # Pitch deck content
│   ├── rfcs/                     # Approved RFCs
│   │   └── 2026-02-15-landing-page-mvp.md
│   ├── workflows/                # Runbooks
│   │   └── iteration-runbook.md
│   ├── workpackages/             # Work packages (WP1–WP6)
│   │   ├── WP1-landing-page.md
│   │   ├── WP2-solution-slide.md
│   │   ├── WP3-waitlist-backend.md
│   │   ├── WP4-constraints-engine.md
│   │   ├── WP5-plan-generator.md
│   │   └── WP6-logging-adaptation.md
│   └── checklists/               # Review checklists
│       ├── reviewer-checklist.md
│       ├── security-checklist.md
│       └── definition-of-done.md
├── prompts/                      # Agent prompt templates
│   ├── feature-template.md
│   ├── bugfix-template.md
│   ├── refacror-template.md
│   ├── architecture-review.md
│   └── multi-agent-orchestration.md
├── agents/                       # Agent definitions
│   ├── planner.md
│   ├── implementer.md
│   └── reviewer.md
├── src/
│   └── landing/
│       ├── index.html            # Landing page
│       └── styles.css            # Styles
├── tests/                        # Automated test suite (50 tests)
│   ├── run-all.js                # Test runner
│   ├── test-html-structure.js    # HTML structure tests (22)
│   ├── test-content-quality.js   # Content quality tests (11)
│   ├── test-accessibility.js     # Accessibility tests (9)
│   └── test-styles.js            # CSS quality tests (8)
├── .github/workflows/ci.yml     # CI pipeline
├── CHANGELOG.md
└── README.md
```

---

## Work Packages (Roadmap)

| WP | Name | Status | Effort |
|----|------|--------|--------|
| WP1 | Project Scaffolding & CI | ✅ Done | S |
| WP2 | Test Suite (TDD) | ✅ Done | S |
| WP3 | Landing Page Implementation | ✅ Done | M |
| WP4 | Solution Slide Content | ✅ Done | S |
| WP5 | CI Pipeline & Validation | ✅ Done | S |
| WP6 | Documentation & Release | ✅ Done | S |

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Constraints Engine** | Input time, equipment, context (travel/stress/sleep), and preferences |
| **Daily Plan Generator** | 2–3 workout options + protein targets + meal suggestions |
| **30-Second Logging** | Checklist for workout, meals, water, steps |
| **Auto-Adaptation** | Tomorrow's plan adjusts based on today's log |
| **Insights** | Streak, weekly adherence %, next best action |

---

## Running Tests

```bash
npm install    # Install cheerio (HTML parser)
npm test       # Run all 50 tests
```

Individual suites:
```bash
npm run test:html      # HTML structure (22 tests)
npm run test:content   # Content quality (11 tests)
npm run test:a11y      # Accessibility (9 tests)
npm run test:css       # CSS quality (8 tests)
```

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full technical design.

**Key decisions:**
- Static HTML landing page (zero dependencies)
- Rule-based plan generator (no ML for MVP)
- Mobile-first (React Native / Expo planned)
- SQLite for MVP → PostgreSQL for production

---

## Contributing

1. Read the [Iteration Runbook](docs/workflows/iteration-runbook.md)
2. Follow TDD: write tests before implementation
3. Complete the [Reviewer Checklist](docs/checklists/reviewer-checklist.md) for every PR
4. Update [CHANGELOG.md](CHANGELOG.md) per work package

---

## License

Proprietary. All rights reserved.
