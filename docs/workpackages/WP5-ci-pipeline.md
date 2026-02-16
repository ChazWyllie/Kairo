# Work Package 5: CI Pipeline & Validation

> **WP ID:** WP5
> **Phase:** 4 (Implementation)
> **Status:** Blocked (requires WP2 + WP3)
> **Effort:** S (Small)
> **Owner:** Agent

---

## Objective
Create a GitHub Actions CI workflow that runs all tests from WP2 against the landing page from WP3. Ensures continuous quality.

## Entry Criteria (Phase Gate)
- [ ] WP2 tests passing locally
- [ ] WP3 implementation complete

## Confirm / Decide Checklist
- [x] CI platform: GitHub Actions
- [x] Node.js version: 20.x (LTS)
- [x] Trigger: push to main, pull requests
- [x] Test command: `npm test`

## Input / Output Contracts
**Input:** Test suite (WP2), implementation (WP3)
**Output:** `.github/workflows/ci.yml`

## Test Plan
| Test | Type | Expectation |
|------|------|-------------|
| CI workflow syntax valid | Unit (YAML) | Parseable YAML |
| CI runs tests | Integration | `npm test` exits 0 |
| CI fails on broken HTML | Regression | Removing a section causes test failure |

## Implementation Steps
1. Create `.github/workflows/ci.yml`
2. Configure: checkout, setup-node, install deps, run tests
3. Verify workflow runs locally with `act` (optional)

## Review Checklist
- [ ] YAML is valid
- [ ] No secrets in workflow file
- [ ] Uses pinned action versions (e.g., `actions/checkout@v4`)
- [ ] Node version matches project requirements

## Acceptance Criteria
- [ ] `.github/workflows/ci.yml` exists and is valid YAML
- [ ] Workflow runs `npm test`
- [ ] Workflow triggers on push and PR to main
