# Kairo

> **Your plan adapts. You stay consistent.**

Kairo Coaching is a secure, production-ready MVP that converts Instagram traffic into paid subscriptions ($50/mo) with a clean landing page + Stripe-hosted checkout + verified webhooks + minimal data storage.

Fitness that adapts when life happens. Set your real-life constraints — time, equipment, stress. Get a daily workout + protein plan. Log in 30 seconds. Tomorrow auto-adjusts.

---

## MVP Scope

**Includes:**
- Landing page (bio link)
- Stripe Checkout subscription ($50/mo)
- Webhook-verified member activation
- Minimal member record (email/phone optional + Stripe IDs + status)
- Admin email notification on successful signup
- Tests + CI + security baseline

**Explicitly NOT included (post-MVP):**
- Full client portal, messaging, custom daily meal plans
- Medical/diagnostic features
- Storing sensitive health data

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

### Run the App (when created)

```bash
cd app/kairo-web
npm install
npm run dev
```

### Demo Prompts

Try these scenarios to understand the product:

1. **Busy traveler:** "I have 20 minutes, hotel gym only, high stress day → what's my plan?"
2. **Weekend warrior:** "I have 60 minutes, full gym, muscle building goal → generate plan"
3. **Recovery day:** "Low sleep, no equipment, 15 minutes → recovery-focused plan"
4. **Missed day:** "I missed yesterday's workout → how does tomorrow adapt?"

---

## Project Structure

```
Kairo/
├── docs/
│   ├── 00-overview.md                 # Product overview
│   ├── 01-requirements.md             # Functional & non-functional requirements
│   ├── 02-architecture.md             # Technical architecture
│   ├── 03-threat-model.md             # STRIDE threat model
│   ├── 04-api-spec.md                 # REST API specification
│   ├── 05-data-model.md               # Database schema & models
│   ├── 06-stripe-flow.md              # Payment integration flow
│   ├── 07-security-controls.md        # Security controls & mitigations
│   ├── 08-testing-ci.md               # Testing strategy & CI pipeline
│   ├── 09-deployment-runbook.md       # Deployment & rollback procedures
│   ├── 10-privacy-legal.md            # Privacy, GDPR, legal
│   ├── 11-product-copy.md             # Marketing & product copy
│   ├── rfc-template.md                # RFC template
│   ├── slide-content.md               # Pitch deck content
│   ├── solution-slide.md              # Solution slide content
│   ├── rfcs/                          # Approved RFCs
│   ├── workflows/                     # Runbooks
│   ├── workpackages/                  # Work packages (WP1–WP6)
│   └── checklists/                    # Review checklists
├── agents/
│   ├── planner.md                     # Planning agent
│   ├── implementer.md                 # Implementation agent
│   ├── reviewer.md                    # Review agent
│   ├── security.md                    # Security review agent
│   └── qa.md                          # QA/testing agent
├── prompts/
│   ├── feature-template.md            # Feature implementation prompt
│   ├── bugfix-template.md             # Bug fix prompt
│   ├── refacror-template.md           # Refactoring prompt
│   ├── architecture-review.md         # Architecture review prompt
│   ├── multi-agent-orchestration.md   # Multi-agent orchestration
│   ├── landing-page.md               # Landing page design prompt
│   ├── master-agentic-engineering.md  # Master engineering prompt
│   ├── pr-template.md                # PR description prompt
│   ├── security-review-template.md   # Security review prompt
│   └── test-plan-template.md         # Test plan generation prompt
├── app/
│   └── kairo-web/                     # Next.js app (future)
├── src/
│   ├── landing/                       # Landing page (index.html + styles.css)
│   ├── index.html                     # Root redirect
│   └── showcase/                      # Landing page variant showcase
├── tests/                             # Automated test suite (50 tests)
│   ├── run-all.js
│   ├── test-html-structure.js
│   ├── test-content-quality.js
│   ├── test-accessibility.js
│   └── test-styles.js
├── infrastructure/
│   ├── env.example                    # Environment variable template
│   └── secrets-guidance.md            # Secrets management guide
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       └── dast-zap.yml
├── .editorconfig
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── package.json
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

See [`docs/02-architecture.md`](docs/02-architecture.md) for the full technical design.

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

MIT — see [LICENSE](LICENSE).
