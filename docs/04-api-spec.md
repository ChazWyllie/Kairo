# Kairo — API Specification

> **Version:** 2.0
> **Last Updated:** 2026-03-09
> **Status:** Current — reflects all implemented endpoints

---

## 1. Base URL

```
Production:  https://kairo.app
Local:       http://localhost:3000
```

All endpoints are under `/api/`.

---

## 2. Authentication Methods

| Method | Header / Mechanism | Use Case |
|--------|-------------------|----------|
| Session cookie | `kairo_session` HttpOnly cookie (HMAC-SHA256 JWT) | Member-facing endpoints |
| Coach Bearer | `Authorization: Bearer <COACH_SECRET>` | Coach operations |
| Cron Bearer | `Authorization: Bearer <CRON_SECRET>` | Scheduled jobs |
| Stripe signature | `stripe-signature` header | Webhook events |
| None | — | Public endpoints (rate-limited where noted) |

---

## 3. Error Format

All errors return:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`, `ALREADY_CHECKED_IN`, `DUPLICATE`, `ALREADY_CANCELED`, `REGISTRATION_FAILED`, `INVALID_CREDENTIALS`.

---

## 4. Endpoints

### 4.1 Authentication

#### `POST /api/auth/login`

Authenticate member with email + password.
Also serves as the coach login path — if the password matches `COACH_SECRET`, returns `role: "coach"` with a session cookie (no separate endpoint, no UI indication).

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | Min 1 char |

**Rate Limit:** 5 req / 15min per IP+email

**Success — member (200):**
```json
{
  "status": "ok",
  "role": "member",
  "memberStatus": "active"
}
```

**Success — coach (200):**
```json
{
  "status": "ok",
  "role": "coach"
}
```

Sets `kairo_session` cookie (HttpOnly, SameSite=Strict, 7-day expiry).

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Wrong credentials | `INVALID_CREDENTIALS` | 401 |
| Too many attempts | `RATE_LIMITED` | 429 (+`Retry-After`) |

---

#### `POST /api/auth/register`

Set password for an existing active member (first-time registration).

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | 8–128 chars |

**Rate Limit:** 5 req / 15min per IP

**Success (201):**
```json
{ "status": "ok" }
```
Sets `kairo_session` cookie.

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Not eligible / already registered | `REGISTRATION_FAILED` | 403 |
| Too many attempts | `RATE_LIMITED` | 429 (+`Retry-After`) |

---

#### `GET /api/auth/me`

Return authenticated member profile from session cookie.

**Auth:** Session cookie required

**Success (200):**
```json
{
  "member": {
    "email": "user@example.com",
    "status": "active",
    "planTier": "coaching",
    "billingInterval": "monthly",
    "goal": "fat_loss",
    "daysPerWeek": 4,
    "fullName": "Jane Doe",
    "onboardedAt": "2026-03-01T00:00:00.000Z",
    "createdAt": "2026-02-28T00:00:00.000Z"
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| No/expired session | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `POST /api/auth/logout`

Clear session cookie.

**Success (200):**
```json
{ "status": "ok" }
```

---

### 4.2 Checkout & Webhook

#### `POST /api/checkout`

Create a Stripe Checkout session.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `phone` | string | | Optional |
| `planId` | string | ✅ | Must be in `ALLOWED_PRICE_IDS` |

**Rate Limit:** 5 req / 60s per IP

**Success (200):**
```json
{ "url": "https://checkout.stripe.com/..." }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unknown plan | `INVALID_PLAN` | 400 |
| Too many attempts | `RATE_LIMITED` | 429 (+`Retry-After`) |

---

#### `POST /api/webhook`

Handle Stripe webhook events. **Do not call directly.**

**Auth:** `stripe-signature` header verified via `stripe.webhooks.constructEvent()`

**Body:** Raw text (signature verification requires unmodified body bytes)

**Handled Events:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate member, send welcome + admin email |
| `customer.subscription.deleted` | Mark member canceled |
| `invoice.payment_failed` | Mark member `past_due` |
| `invoice.payment_succeeded` | Restore `active` if was `past_due` |
| Other events | Return 200 + `ignored` |

**Idempotency:** `StripeEvent` table — duplicate event IDs return `already_processed`.

**Success (200):**
```json
{ "received": true, "status": "processed" }
```

| Error | Code | Status |
|-------|------|--------|
| Missing/invalid signature | — | 400 |

---

### 4.3 Application / Qualification

#### `POST /api/application`

Submit a lead qualification application. **Public — no auth.**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `fullName` | string | ✅ | 1–200 chars |
| `phone` | string | | Max 30 chars |
| `age` | number | | 13–120 |
| `height` | string | | Max 50 chars |
| `currentWeight` | string | | Max 50 chars |
| `goal` | enum | ✅ | `fat_loss`, `muscle`, `maintenance` |
| `whyNow` | string | | Free text |
| `trainingExperience` | string | | Free text |
| `trainingFrequency` | string | | Free text |
| `gymAccess` | string | | Free text |
| `injuryHistory` | string | | Free text |
| `nutritionStruggles` | string | | Free text |
| `biggestObstacle` | string | | Free text |
| `helpWithMost` | string | | Free text |
| `preferredTier` | enum | | `foundation`, `coaching`, `performance`, `vip` |
| `readyForStructure` | boolean | | |
| `budgetComfort` | string | | Free text |

**Success (201):**
```json
{ "status": "ok", "applicationId": "clx..." }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Already applied | `DUPLICATE` | 409 |

---

#### `GET /api/application?email=<email>`

Check application status. **Public — no auth.**

**Success (200):**
```json
{
  "application": {
    "id": "clx...",
    "fullName": "Jane Doe",
    "status": "pending",
    "preferredTier": "coaching",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "approvedAt": null
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| Missing email | — | 400 |
| Not found | `NOT_FOUND` | 404 |

---

#### `PATCH /api/application`

Approve or reject an application. **Coach auth required.**

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `status` | enum | ✅ | `approved`, `rejected` |

**Success (200):**
```json
{ "status": "ok" }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Not found | `NOT_FOUND` | 404 |

---

### 4.4 Member

#### `GET /api/member?email=<email>`

Fetch member profile with check-in stats.

**Auth:** Session cookie (email must match) OR Coach Bearer

**Success (200):**
```json
{
  "member": {
    "email": "user@example.com",
    "status": "active",
    "planTier": "coaching",
    "billingInterval": "monthly",
    "goal": "fat_loss",
    "daysPerWeek": 4,
    "minutesPerSession": 45,
    "injuries": null,
    "onboardedAt": "2026-03-01T00:00:00.000Z",
    "createdAt": "2026-02-28T00:00:00.000Z"
  },
  "stats": {
    "totalCheckIns": 12,
    "currentStreak": 5
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid email | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Not found | `NOT_FOUND` | 404 |

---

#### `POST /api/member/cancel`

Member self-cancels their subscription (at period end).

**Auth:** Session cookie required

**Success (200):**
```json
{ "status": "ok", "method": "stripe_cancel_at_period_end" }
```

| Error | Code | Status |
|-------|------|--------|
| No session | `UNAUTHORIZED` | 401 |
| Not found | `NOT_FOUND` | 404 |
| Already canceled | `ALREADY_CANCELED` | 409 |

---

### 4.5 Onboarding

#### `POST /api/onboarding`

Save onboarding / extended intake data for an active member.

**Auth:** Session cookie (email must match) OR Coach Bearer

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `goal` | enum | | `fat_loss`, `muscle`, `maintenance` |
| `daysPerWeek` | number | | 1–7 |
| `minutesPerSession` | number | | 15, 20, 30, 45, or 60 |
| `injuries` | string | | Max 500 chars |
| `fullName` | string | | Max 200 chars |
| `age` | number | | 13–120 |
| `height`, `currentWeight`, `bodyFat` | string | | Max 50 chars |
| `timezone`, `occupation` | string | | |
| `yearsTraining` | number | | 0–50 |
| `currentSplit`, `favoriteLifts`, `weakBodyParts` | string | | |
| `equipmentAccess` | enum | | `none`, `hotel`, `dumbbells`, `full_gym` |
| `sessionLength` | number | | 10–180 |
| `currentCalories` | number | | 500–10000 |
| `proteinIntake` | number | | 0–500 |
| `mealsPerDay` | number | | 1–10 |
| `foodsEnjoy`, `foodsAvoid` | string | | |
| `appetiteLevel` | enum | | `low`, `normal`, `high` |
| `weekendEating`, `alcoholIntake`, `supplements` | string | | |
| `avgSleep` | number | | 0–24 |
| `stressLevel` | enum | | `low`, `moderate`, `high` |
| `stepCount` | number | | 0–100000 |
| `jobActivityLevel` | enum | | `sedentary`, `light`, `moderate`, `active` |
| `travelFrequency` | string | | |
| `fallOffCause`, `supportNeeded`, `success90Days` | string | | Max 1000 chars |

**Success (200):**
```json
{ "status": "ok" }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| No active member | `NOT_FOUND` | 404 |

---

### 4.6 Check-Ins

#### `POST /api/checkin`

Create a daily check-in.

**Auth:** Session cookie (email must match) OR Coach Bearer

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `workout` | boolean | | Default false |
| `meals` | number | | 0–3, default 0 |
| `water` | boolean | | Default false |
| `steps` | boolean | | Default false |
| `note` | string | | Max 500 chars |
| `avgWeight` | number | | 50–1000 |
| `waist` | number | | 10–100 |
| `photoSubmitted` | boolean | | |
| `frontPhotoUrl`, `sidePhotoUrl`, `backPhotoUrl` | string | | URL, max 2000 |
| `workoutsCompleted` | number | | 0–14 |
| `stepsAverage` | number | | 0–100000 |
| `calorieAdherence`, `proteinAdherence` | number | | 1–10 |
| `sleepAverage` | number | | 0–24 |
| `energyScore`, `hungerScore`, `stressScore`, `digestionScore`, `recoveryScore` | number | | 1–10 |
| `painNotes`, `biggestWin`, `biggestStruggle`, `helpNeeded` | string | | Max 1000 chars |

**Success (201):**
```json
{
  "checkIn": {
    "id": "clx...",
    "date": "2026-03-09T00:00:00.000Z",
    "workout": true,
    "meals": 3,
    "water": true,
    "steps": true,
    "note": "Great session"
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| No active member | `NOT_FOUND` | 404 |
| Duplicate today | `ALREADY_CHECKED_IN` | 409 |

---

#### `GET /api/checkin?email=<email>&limit=<n>`

Fetch check-in history with streak and adherence stats.

**Auth:** Session cookie (email must match) OR Coach Bearer

| Param | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `limit` | number | | 1–90, default 30 |

**Success (200):**
```json
{
  "checkIns": [
    {
      "id": "clx...",
      "date": "2026-03-09T00:00:00.000Z",
      "workout": true,
      "meals": 3,
      "water": true,
      "steps": true,
      "note": "Great session"
    }
  ]
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid email | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| No active member | `NOT_FOUND` | 404 |

---

#### `PATCH /api/checkin/respond`

Coach responds to a check-in with triage status.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `checkInId` | string | ✅ | Min 1 char |
| `coachStatus` | enum | ✅ | `green`, `yellow`, `red` |
| `coachResponse` | string | | Max 5000 chars |

**Success (200):**
```json
{ "status": "ok" }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Check-in not found | `NOT_FOUND` | 404 |

---

### 4.7 Programs

#### `POST /api/program`

Create a training program block.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `name` | string | ✅ | 1–200 chars |
| `status` | enum | | `active`, `completed`, `upcoming` (default `active`) |
| `startDate` | string | ✅ | ISO 8601 datetime |
| `endDate` | string | | ISO 8601 datetime |
| `primaryGoal` | enum | | `hypertrophy`, `strength`, `fat_loss`, `maintenance` |
| `split` | string | | Max 100 chars |
| `daysPerWeek` | number | | 1–7 |
| `progressionModel` | string | | Max 200 chars |
| `deloadPlanned` | boolean | | Default false |
| `deloadWeek` | number | | 1–12 |
| `keyExercises` | string | | Max 2000 chars |
| `workoutNotes` | string | | Max 10000 chars |
| `cardioTarget` | string | | |
| `stepsTarget` | number | | |
| `nextUpdateDate` | string | | ISO 8601 datetime |

**Success (201):**
```json
{
  "program": {
    "id": "clx...",
    "name": "Hypertrophy Block A",
    "status": "active"
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `GET /api/program?email=<email>`

Fetch programs for a member.

**Auth:** Session cookie (email must match) OR Coach Bearer

**Success (200):**
```json
{
  "programs": [
    {
      "id": "clx...",
      "name": "Hypertrophy Block A",
      "status": "active",
      "startDate": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

| Error | Code | Status |
|-------|------|--------|
| Missing email | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `PATCH /api/program`

Update a program block.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `programId` | string | ✅ | Min 1 char |
| All POST fields | — | | Optional |
| `adjustmentsMade` | string | | Max 5000 chars |
| `adjustmentReason` | string | | Max 5000 chars |

**Success (200):**
```json
{ "status": "ok" }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Not found | `NOT_FOUND` | 404 |

---

### 4.8 Macros (Nutrition Targets)

#### `POST /api/macro`

Create macro targets for a member.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `effectiveDate` | string | ✅ | ISO 8601 datetime |
| `calories` | number | ✅ | 800–10000 |
| `protein` | number | ✅ | 20–500 |
| `fatsMin` | number | | 0–300 |
| `carbs` | number | | 0–1500 |
| `stepsTarget` | number | | 0–100000 |
| `hydrationTarget` | string | | Max 50 chars |
| `adjustmentReason` | string | | Max 2000 chars |

**Success (201):**
```json
{
  "macro": {
    "id": "clx...",
    "status": "active",
    "calories": 2200,
    "protein": 180
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `GET /api/macro?email=<email>`

Fetch macro targets for a member.

**Auth:** Session cookie (email must match) OR Coach Bearer

**Success (200):**
```json
{
  "macros": [
    {
      "id": "clx...",
      "status": "active",
      "effectiveDate": "2026-03-01T00:00:00.000Z",
      "calories": 2200,
      "protein": 180
    }
  ]
}
```

| Error | Code | Status |
|-------|------|--------|
| Missing email | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `PATCH /api/macro`

Update macro targets.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `macroId` | string | ✅ | Min 1 char |
| `status` | enum | | `active`, `previous` |
| All POST fields | — | | Optional |

**Success (200):**
```json
{ "status": "ok" }
```

---

### 4.9 Reviews

#### `POST /api/review`

Create a coach review.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `type` | enum | ✅ | `monthly`, `quarterly`, `form_review`, `live_call` |
| `dueDate` | string | | ISO 8601 datetime |
| `completedDate` | string | | ISO 8601 datetime |
| `summary` | string | | Max 5000 chars |
| `actionItems` | string | | JSON stringified, max 5000 chars |
| `loomLink` | string | | Valid URL, max 2000 chars |
| `followUpNeeded` | boolean | | Default false |

**Success (201):**
```json
{
  "review": {
    "id": "clx...",
    "type": "monthly",
    "summary": "Great progress this month"
  }
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `GET /api/review?email=<email>`

Fetch reviews for a member.

**Auth:** Session cookie (email must match) OR Coach Bearer

**Success (200):**
```json
{
  "reviews": [
    {
      "id": "clx...",
      "type": "monthly",
      "completedDate": "2026-03-01T00:00:00.000Z",
      "summary": "Great progress"
    }
  ]
}
```

| Error | Code | Status |
|-------|------|--------|
| Missing email | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Member not found | `NOT_FOUND` | 404 |

---

#### `PATCH /api/review`

Update a review.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `reviewId` | string | ✅ | Min 1 char |
| `completedDate` | string | | ISO 8601 |
| `summary` | string | | Max 5000 chars |
| `actionItems` | string | | JSON stringified, max 5000 |
| `loomLink` | string | | Valid URL, max 2000 |
| `followUpNeeded` | boolean | | |

**Success (200):**
```json
{ "status": "ok" }
```

---

### 4.10 Coach Dashboard

#### `GET /api/coach`

Exception-first portfolio dashboard with per-client health.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

**Success (200):**
```json
{
  "portfolio": {
    "activeClients": 12,
    "atRiskCount": 2,
    "needsAttentionCount": 3,
    "averageAdherence7d": 78,
    "totalLeads": 45
  },
  "clients": [
    {
      "email": "user@example.com",
      "planTier": "coaching",
      "status": "needs_attention",
      "adherence7d": 60,
      "adherence30d": 72,
      "currentStreak": 2,
      "recentCheckIns": [],
      "activeProgram": null,
      "activeMacro": null
    }
  ],
  "applications": []
}
```

| Error | Code | Status |
|-------|------|--------|
| Unauthorized | `UNAUTHORIZED` | 401 |

---

#### `POST /api/coach/cancel-member`

Cancel a member's subscription (at period end) on their behalf.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |

**Success (200):**
```json
{ "status": "ok", "method": "stripe_cancel_at_period_end" }
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Unauthorized | `UNAUTHORIZED` | 401 |
| Not found | `NOT_FOUND` | 404 |
| Already canceled | `ALREADY_CANCELED` | 409 |

---

#### `GET /api/templates?category=<cat>`

Fetch pre-built coach message templates.

**Auth:** `Authorization: Bearer <COACH_SECRET>`

| Param | Type | Required | Validation |
|-------|------|----------|------------|
| `category` | enum | | `lead`, `onboarding`, `checkin`, `review`, `retention` |

**Success (200):**
```json
{
  "templates": [
    {
      "id": "welcome_1",
      "name": "Welcome Message",
      "category": "onboarding",
      "subject": "Welcome to Kairo!",
      "body": "Hey {{firstName}}...",
      "variables": ["firstName", "planTier"]
    }
  ]
}
```

| Error | Code | Status |
|-------|------|--------|
| Unauthorized | `UNAUTHORIZED` | 401 |

---

### 4.11 Quiz & Nurture

#### `POST /api/quiz`

Quiz submission + lead capture. Returns recommended tier.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `answers` | object | | |
| `answers.goal` | enum | | `fat_loss`, `muscle`, `maintenance` |
| `answers.experience` | enum | | `beginner`, `intermediate`, `advanced` |
| `answers.daysPerWeek` | number | | 1–7 |
| `answers.minutesPerSession` | number | | Min 1 |
| `answers.challenge` | enum | | `time`, `consistency`, `accountability`, `plateau` |

**Rate Limit:** 10 req / 60s per IP

**Success (200):**
```json
{
  "recommendedTier": "coaching",
  "leadId": "clx..."
}
```

| Error | Code | Status |
|-------|------|--------|
| Invalid fields | `VALIDATION_ERROR` | 400 |
| Too many attempts | `RATE_LIMITED` | 429 (+`Retry-After`) |

---

#### `POST /api/nurture`

Batch process nurture drip emails for eligible leads.

**Auth:** `Authorization: Bearer <CRON_SECRET>`

**Success (200):**
```json
{
  "processed": 15,
  "sent": 12,
  "skipped": 2,
  "errors": 1
}
```

| Error | Code | Status |
|-------|------|--------|
| Unauthorized | `UNAUTHORIZED` | 401 |

---

#### `GET /api/nurture/unsubscribe?email=<email>`

One-click unsubscribe from nurture drip. **Public — no auth.**

Sets `nurtureOptedOut=true` on the Lead record.

**Success (200):** HTML confirmation page

**Error (400):** HTML error page (invalid email)

---

### 4.12 Cron Jobs

#### `POST /api/cron/checkin-reminder`

Send check-in reminders to active members who haven't checked in 3+ days.

**Auth:** `Authorization: Bearer <CRON_SECRET>`

**Success (200):**
```json
{
  "status": "ok",
  "eligible": 8,
  "sent": 7,
  "errors": 1
}
```

| Error | Code | Status |
|-------|------|--------|
| Unauthorized | `UNAUTHORIZED` | 401 |

---

## 5. Rate Limits

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/checkout` | 5 req / 60s | IP |
| `POST /api/quiz` | 10 req / 60s | IP |
| `POST /api/auth/login` | 5 req / 15min | IP + email |
| `POST /api/auth/register` | 5 req / 15min | IP |

Rate-limited responses return 429 with a `Retry-After` header (seconds).

---

## 6. Auth Summary by Endpoint

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/auth/login` | POST | None (rate-limited) |
| `/api/auth/register` | POST | None (rate-limited) |
| `/api/auth/me` | GET | Session cookie |
| `/api/auth/logout` | POST | None |
| `/api/checkout` | POST | None (rate-limited) |
| `/api/webhook` | POST | Stripe signature |
| `/api/application` | POST | None |
| `/api/application` | GET | None |
| `/api/application` | PATCH | Coach Bearer |
| `/api/quiz` | POST | None (rate-limited) |
| `/api/nurture/unsubscribe` | GET | None |
| `/api/member` | GET | Session / Coach |
| `/api/member/cancel` | POST | Session cookie |
| `/api/onboarding` | POST | Session / Coach |
| `/api/checkin` | POST | Session / Coach |
| `/api/checkin` | GET | Session / Coach |
| `/api/checkin/respond` | PATCH | Coach Bearer |
| `/api/program` | POST | Coach Bearer |
| `/api/program` | GET | Session / Coach |
| `/api/program` | PATCH | Coach Bearer |
| `/api/macro` | POST | Coach Bearer |
| `/api/macro` | GET | Session / Coach |
| `/api/macro` | PATCH | Coach Bearer |
| `/api/review` | POST | Coach Bearer |
| `/api/review` | GET | Session / Coach |
| `/api/review` | PATCH | Coach Bearer |
| `/api/coach` | GET | Coach Bearer |
| `/api/coach/cancel-member` | POST | Coach Bearer |
| `/api/templates` | GET | Coach Bearer |
| `/api/nurture` | POST | Cron Bearer |
| `/api/cron/checkin-reminder` | POST | Cron Bearer |
