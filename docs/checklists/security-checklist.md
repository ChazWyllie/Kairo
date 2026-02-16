# Security Checklist

## Input Validation
- [ ] All user inputs are validated server-side
- [ ] Email format validated before storage
- [ ] No SQL injection vectors (parameterized queries)
- [ ] HTML special characters escaped in all outputs
- [ ] File upload disabled unless explicitly needed

## Authentication & Authorization
- [ ] Passwords hashed with bcrypt (cost ≥ 12)
- [ ] Session tokens are cryptographically random
- [ ] Least privilege: users see only their own data
- [ ] API keys rotated regularly
- [ ] No default credentials in any environment

## Data Protection
- [ ] PII minimized (collect only what's needed)
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced (HSTS header set)
- [ ] No sensitive data in URL parameters
- [ ] Logs do not contain PII

## Infrastructure
- [ ] Dependencies scanned for known vulnerabilities
- [ ] CSP headers configured
- [ ] CORS restricted to known origins
- [ ] Rate limiting on all public endpoints
- [ ] Error messages do not leak internal details

## Landing Page Specific
- [ ] No tracking pixels or third-party scripts
- [ ] Form uses `action="#"` (no data exfiltration)
- [ ] No inline event handlers (XSS vector)
- [ ] Static page: no server-side code execution risk
