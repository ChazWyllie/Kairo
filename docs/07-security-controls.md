# Kairo — Security Controls

> **Version:** 1.0
> **Last Updated:** 2026-02-15

---

## 1. Input Validation

| Control | Implementation |
|---------|---------------|
| Email format | Regex + library validation (server-side) |
| Constraint enums | Allowlist validation (Zod schema) |
| String length limits | Max 200 chars for free-text fields |
| XSS prevention | HTML entity encoding on all outputs |
| SQL injection | Parameterized queries only |
| Prototype pollution | Object.create(null) for user input parsing |

---

## 2. Authentication

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt, cost factor ≥ 12 |
| Session tokens | Cryptographically random, 256-bit |
| JWT | Short TTL (15 min access, 7 day refresh) |
| Cookie flags | HttpOnly, Secure, SameSite=Strict |
| Brute force protection | Account lockout after 5 failed attempts |

---

## 3. Authorization

| Control | Implementation |
|---------|---------------|
| Row-level security | Users can only access their own data |
| RBAC | `user`, `admin` roles |
| API scoping | JWT claims include userId, role |
| Least privilege | Service accounts have minimal permissions |

---

## 4. Transport & Infrastructure

| Control | Implementation |
|---------|---------------|
| HTTPS | Enforced via HSTS header (max-age=31536000) |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` |
| CORS | Restricted to known origins |
| Rate limiting | See [04 — API Spec](04-api-spec.md) |
| Dependency scanning | Dependabot + `npm audit` in CI |

---

## 5. Data Protection

| Control | Implementation |
|---------|---------------|
| Encryption at rest | Database-level encryption |
| PII minimization | Collect only email for waitlist |
| Log sanitization | No PII in application logs |
| Backup encryption | Encrypted backups with rotation |

---

## 6. Monitoring & Incident Response

| Control | Implementation |
|---------|---------------|
| Error tracking | Sentry (no PII in breadcrumbs) |
| Access logs | Structured JSON, 90-day retention |
| Alerting | Anomalous rate limit triggers, failed payments |
| Incident playbook | TODO: Create runbook |

---

## 7. Landing Page Specific (Phase 1)

| Control | Status |
|---------|--------|
| No inline event handlers | ✅ |
| No external scripts | ✅ |
| No dynamic rendering (no XSS surface) | ✅ |
| Form action is safe (`#` or validated endpoint) | ✅ |
| No tracking pixels | ✅ |
