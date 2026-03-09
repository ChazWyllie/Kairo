# Kairo — Deployment Runbook

> **Version:** 1.0
> **Last Updated:** 2026-02-15

---

## 1. Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | `file://` or `localhost:3000` | Development |
| Staging | `https://staging.kairo.app` | Pre-production testing |
| Production | `https://kairo.app` | Live |

---

## 2. Phase 1 — Landing Page (Current)

### Deployment
```bash
# Option A: GitHub Pages
git push origin main
# GitHub Actions builds and deploys automatically

# Option B: Netlify
# Connected to repo, auto-deploys on push to main

# Option C: Local
open src/landing/index.html
```

### Rollback
```bash
git revert HEAD
git push origin main
```

---

## 3. Phase 3+ — Next.js App

### Pre-deployment Checklist
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set (see `infrastructure/env.example`)
- [ ] Database migrations applied
- [ ] Stripe webhook endpoint configured

### Deployment
```bash
# Vercel (recommended for Next.js)
vercel --prod

# Or via Git push (Vercel auto-deploy)
git push origin main
```

### Rollback
```bash
# Vercel instant rollback
vercel rollback

# Or revert and push
git revert HEAD
git push origin main
```

---

## 4. Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Uptime | UptimeRobot / Vercel | < 99.9% |
| Error rate | Sentry | > 1% of requests |
| Response time (p95) | Vercel Analytics | > 500ms |
| Failed payments | Stripe Dashboard | Any failure |

---

## 5. Incident Response

1. **Detect:** Alert triggers or user report
2. **Assess:** Check error logs, identify scope
3. **Mitigate:** Rollback if production-breaking
4. **Fix:** Hotfix branch → PR → merge
5. **Postmortem:** Document in `docs/incidents/` (create as needed)

---

## 6. Secret Rotation

All secrets are stored as platform environment variables (Vercel / hosting provider). Never commit secrets to source. Rotation should be performed whenever a secret is suspected compromised, a team member departs, or on a regular schedule (quarterly recommended).

### 6.1 AUTH_SECRET (Session JWT signing key)

**Impact:** All active member sessions are invalidated immediately.

1. Generate a new random value (≥ 32 characters):
   ```bash
   openssl rand -base64 48
   ```
2. Set the new value in the platform's environment variables.
3. Redeploy the application.
4. **All logged-in members will be logged out.** They can log in again immediately.
5. Verify: confirm `POST /api/auth/login` issues working sessions.

### 6.2 COACH_SECRET (Coach Bearer token)

**Impact:** All coach-authenticated API calls fail until clients are updated.

1. Generate a new random value (≥ 16 characters):
   ```bash
   openssl rand -base64 24
   ```
2. Set the new value in the platform's environment variables.
3. Update the secret in any coach-facing tools, scripts, or dashboards that call coach endpoints.
4. Redeploy the application.
5. Verify: confirm `GET /api/coach` returns 200 with the new Bearer token.

### 6.3 CRON_SECRET (Cron job Bearer token)

**Impact:** Scheduled jobs (`/api/nurture`, `/api/cron/checkin-reminder`) fail until cron config is updated.

1. Generate a new random value (≥ 16 characters):
   ```bash
   openssl rand -base64 24
   ```
2. Set the new value in the platform's environment variables.
3. Update the secret in the cron scheduler configuration (Vercel Cron, external scheduler, etc.).
4. Redeploy the application.
5. Verify: trigger a test cron job and confirm 200 response.

### 6.4 STRIPE_WEBHOOK_SECRET

**Impact:** Incoming Stripe webhooks are rejected (signature mismatch) until the new secret is active.

1. In the Stripe Dashboard → Webhooks → select the endpoint → **Roll secret**.
2. Stripe provides a new `whsec_...` value.
3. Set the new value in the platform's environment variables.
4. Redeploy the application.
5. Verify: trigger a test webhook event from the Stripe Dashboard and confirm it is processed.
6. **Note:** Stripe supports dual-secret verification during rotation — both old and new secrets are valid for ~24 hours after rolling.

### 6.5 STRIPE_SECRET_KEY

**Impact:** All Stripe API calls (checkout, subscription management) fail until updated.

1. In the Stripe Dashboard → API Keys → **Roll key**.
2. Stripe provides a new `sk_live_...` (or `sk_test_...`) value.
3. Set the new value in the platform's environment variables.
4. Redeploy the application.
5. Verify: confirm `POST /api/checkout` creates a checkout session.
6. **Note:** Stripe supports a grace period when rolling API keys — configure the overlap window in the Stripe Dashboard.

### 6.6 RESEND_API_KEY

**Impact:** All outbound emails (welcome, admin notifications, nurture drips, check-in reminders) fail until updated.

1. In the Resend Dashboard → API Keys → create a new key.
2. Set the new value in the platform's environment variables.
3. Redeploy the application.
4. Verify: trigger an email-sending flow (e.g., a test checkout) and confirm delivery.
5. Revoke the old key in the Resend Dashboard.

### 6.7 DATABASE_URL

**Impact:** All database operations fail during the transition. **Requires a maintenance window.**

1. Create the new database credentials in your PostgreSQL provider.
2. Verify the new credentials work by connecting with `psql` or a migration dry-run.
3. Set the new `DATABASE_URL` in the platform's environment variables.
4. Redeploy the application.
5. Verify: confirm the health of API endpoints that read/write the database.
6. Revoke the old database credentials.

### Rotation Schedule

| Secret | Rotation Frequency | Notes |
|--------|--------------------|-------|
| `AUTH_SECRET` | Quarterly or on compromise | Logs out all members |
| `COACH_SECRET` | Quarterly or on compromise | Coordinate with coach tooling |
| `CRON_SECRET` | Quarterly or on compromise | Update scheduler config |
| `STRIPE_WEBHOOK_SECRET` | On compromise only | Use Stripe's dual-secret window |
| `STRIPE_SECRET_KEY` | On compromise only | Use Stripe's key rolling overlap |
| `RESEND_API_KEY` | On compromise only | Create new before revoking old |
| `DATABASE_URL` | On compromise only | Requires maintenance window |

---

## 7. Database Migrations

```bash
# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status
```
