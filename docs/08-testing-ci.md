# Kairo — Testing & CI Strategy

> **Version:** 1.0
> **Last Updated:** 2026-02-15

---

## 1. Testing Pyramid

```
        ┌───────────┐
        │   E2E     │  ← Playwright (future)
        ├───────────┤
        │Integration│  ← API + DB tests
        ├───────────┤
        │   Unit    │  ← Component logic, validators
        ├───────────┤
        │  Static   │  ← HTML structure, content, a11y
        └───────────┘
```

---

## 2. Current Test Suites (Phase 1)

| Suite | File | Count | Purpose |
|-------|------|-------|---------|
| HTML Structure | `tests/test-html-structure.js` | 22 | Semantic HTML, sections, elements |
| Content Quality | `tests/test-content-quality.js` | 11 | No placeholders, concrete copy |
| Accessibility | `tests/test-accessibility.js` | 9 | Lang attr, alt text, heading hierarchy |
| CSS Quality | `tests/test-styles.js` | 8 | File exists, valid structure |
| **Total** | | **50** | |

---

## 3. Running Tests

```bash
npm install          # Install cheerio
npm test             # Run all 50 tests
npm run test:html    # HTML structure only
npm run test:content # Content quality only
npm run test:a11y    # Accessibility only
npm run test:css     # CSS quality only
```

---

## 4. CI Pipeline

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Push to `main`
- Pull requests to `main`

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run `npm test`

**DAST (future):**
- OWASP ZAP scan via `.github/workflows/dast-zap.yml`
- Runs against staging environment

---

## 5. Test-First Workflow

Per the [Iteration Runbook](workflows/iteration-runbook.md):
1. Write tests that FAIL (correct reason)
2. Implement until tests PASS
3. Review and merge

---

## 6. Future Testing Plans

| Phase | Tests to Add |
|-------|-------------|
| Phase 2 | React Native component tests (Jest + RTL) |
| Phase 3 | API integration tests (supertest) |
| Phase 3 | Database migration tests |
| Phase 4 | Stripe webhook integration tests |
| Phase 4 | E2E tests (Playwright) |
