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

## 6. Database Migrations

```bash
# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status
```
