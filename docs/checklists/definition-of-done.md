# Definition of Done (DoD)

A work package is "done" when ALL of the following are true:

## Code
- [ ] Implementation satisfies all acceptance criteria
- [ ] Code compiles / renders without errors
- [ ] Linter passes with zero warnings
- [ ] No TODO/FIXME left without a tracking issue

## Tests
- [ ] All tests pass (unit + integration)
- [ ] Edge cases are covered
- [ ] No flaky tests
- [ ] Test coverage ≥ 80% for new code (when measurable)

## Documentation
- [ ] CHANGELOG.md entry added
- [ ] README updated if user-facing behavior changed
- [ ] Architecture docs updated if system design changed
- [ ] Inline comments explain "why," not "what"

## Review
- [ ] Reviewer checklist completed
- [ ] Security checklist completed (if applicable)
- [ ] At least one review pass completed (human or agent)

## Deployment
- [ ] CI pipeline passes
- [ ] Deployed to staging (if applicable)
- [ ] Manual smoke test passes (if applicable)
