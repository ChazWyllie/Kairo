# Kairo Coaching — Secrets Handling (Non-negotiable)

> **Last Updated:** 2026-03-04

---

## 1. Rules

1. **Never** commit secrets, tokens, or API keys to version control
2. **Never** log secrets (even at debug level)
3. **Never** expose secrets in client-side code
4. **Always** use environment variables for secrets
5. **Always** use `.env.local` for local dev (gitignored)
6. **Always** use platform-native secret management in CI/production

---

## 2. Minimum Required Secrets (MVP)

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `DATABASE_URL` | PostgreSQL connection string |
| `RESEND_API_KEY` | Email provider (admin notifications) |

---

## 3. Local Development

```bash
cp infrastructure/env.example .env.local
# Edit .env.local with your values
```

Verify `.env*` is in `.gitignore`:
```
.env
.env.*
!.env.example
```

---

## 4. CI/CD (GitHub Actions)

Store secrets in: **Settings → Secrets and variables → Actions**

Access in workflows:
```yaml
env:
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

---

## 5. Production

Use platform-native secret management:
- **Vercel:** Project Settings → Environment Variables
- **Render / Fly / Heroku:** Their Secrets/Env configuration
- **AWS:** Secrets Manager or SSM Parameter Store

---

## 6. Principle of Least Privilege

- Use restricted API keys where possible
- Separate test vs production keys (`sk_test_*` vs `sk_live_*`)
- Service accounts get minimal permissions

---

## 7. Rotation Schedule

| Secret | Rotation |
|--------|----------|
| Stripe keys | On suspected compromise |
| Database credentials | Every 90 days |
| Email API keys | Every 90 days |
| AUTH_SECRET (when added) | Every 90 days |

---

## 8. Incident: Secret Exposed

1. **Immediately** rotate it in the provider dashboard
2. Replace in production env vars
3. Re-deploy
4. Audit logs if available
5. Check git history: `git log --all --full-history -- .env`
6. If committed, use BFG Repo Cleaner to purge
7. Document in incident report
