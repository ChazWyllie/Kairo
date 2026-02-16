# Reviewer Checklist

Use this checklist for every PR / work package review.

## Code Quality
- [ ] Code follows repo conventions (file structure, naming)
- [ ] No dead code or commented-out blocks
- [ ] Functions are small and single-purpose
- [ ] Error handling is explicit (no silent failures)
- [ ] Logging is structured and meaningful

## Security
- [ ] No secrets, tokens, or keys in code
- [ ] User input is validated and sanitized
- [ ] Deny-by-default for permissions
- [ ] HTTPS enforced where applicable
- [ ] Rate limiting considered for public endpoints

## Testing
- [ ] Unit tests cover happy path + edge cases
- [ ] Integration tests verify component interaction
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test names describe the expected behavior

## Documentation
- [ ] CHANGELOG.md updated
- [ ] README reflects current state
- [ ] Architecture docs updated if behavior changed
- [ ] API contracts updated if endpoints changed

## Accessibility (UI)
- [ ] Semantic HTML used
- [ ] Color contrast meets WCAG AA
- [ ] Interactive elements are keyboard-accessible
- [ ] Alt text on meaningful images

## Performance
- [ ] No unnecessary external dependencies
- [ ] Assets are optimized (images, fonts)
- [ ] Critical rendering path is clean
- [ ] Page load target met (< 1s for landing page)
