# Iteration Runbook

## Overview
Each iteration follows the strict phase-gated workflow. This runbook describes the day-to-day process.

---

## Daily Flow

### 1. Pick the next Work Package
- Check `docs/workpackages/` for the next WP in sequence
- Verify entry criteria are met (previous WP completed)
- Read the WP's acceptance criteria

### 2. Write Tests First (Phase 3)
- Create test files in `tests/`
- Cover: happy path, edge cases, error paths, security boundaries
- Run tests — they should FAIL (correct reason)
- Commit: `test: add tests for WP#`

### 3. Implement (Phase 4)
- Write minimal code to pass tests
- Follow repo structure (`src/`, `tests/`)
- Add error handling and logging
- Run tests — they should PASS
- Run linter — should be clean
- Commit: `feat: implement WP#`

### 4. Review (Phase 5)
- Complete reviewer checklist
- Complete security checklist (if applicable)
- Update CHANGELOG.md
- Commit: `docs: update changelog for WP#`

### 5. Merge & Deploy (Phase 6)
- Push to `main` or feature branch
- CI pipeline runs
- Deploy to staging (if applicable)
- Smoke test

---

## Commit Convention
```
<type>: <short description>

Types: feat, fix, test, docs, chore, refactor, style, ci
```

## Branch Strategy
```
main          — stable, deployable
feat/wp#-name — work package feature branch
fix/issue-#   — bug fix branch
```

---

## Emergency Procedure
If a WP is blocked:
1. Document the blocker in the WP file
2. Skip to the next independent WP (if any)
3. Create an RFC for the blocker resolution
4. Never merge blocked code to main
