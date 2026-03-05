# Security Review Template

## Entry points changed
- ...

## Threats
- **Forgery:**
- **Injection:**
- **Abuse:**
- **Data exposure:**

## Controls present
- **Validation:**
- **Authn/Authz:**
- **Webhook verification:**
- **Rate limiting:**
- **Headers/CSP:**
- **Secrets:**

## Evidence
- **Tests:**
- **CI checks:**

---

## Finding Format

For each issue found:

| Field | Value |
|-------|-------|
| Severity | Critical / High / Medium / Low / Info |
| Location | file:line |
| Description | What the issue is |
| Impact | What could happen |
| Recommendation | How to fix |
| Verification | How to confirm the fix |

## Summary
- Total findings by severity
- Overall risk assessment
- Recommended priority order for fixes
- Comparison against `docs/03-threat-model.md` controls
