# Kairo — Data Model

> **Version:** 1.0
> **Last Updated:** 2026-02-15

---

## 1. Entity Relationship Diagram (Textual)

```
User 1──* DailyPlan
User 1──* DailyLog
User 1──* Subscription
WaitlistEntry (standalone)
```

---

## 2. Tables

### User
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| email | string | Yes | Unique, indexed |
| passwordHash | string | Yes | bcrypt, cost ≥ 12 |
| preferences | JSON | Yes | Goal, experience, etc. |
| stripeCustomerId | string | No | Set after first payment |
| createdAt | timestamp | Yes | |
| updatedAt | timestamp | Yes | |

### DailyPlan
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| userId | UUID (FK) | Yes | References User |
| date | date | Yes | Indexed, unique per user+date |
| constraints | JSON | Yes | Snapshot of input constraints |
| plan | JSON | Yes | Generated workouts + nutrition |
| createdAt | timestamp | Yes | |

### DailyLog
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| userId | UUID (FK) | Yes | References User |
| date | date | Yes | Indexed, unique per user+date |
| log | JSON | Yes | Checklist data |
| createdAt | timestamp | Yes | |

### WaitlistEntry
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| email | string | Yes | Unique, indexed |
| createdAt | timestamp | Yes | |

### Subscription
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| userId | UUID (FK) | Yes | References User |
| stripeSubscriptionId | string | Yes | Stripe reference |
| plan | enum | Yes | `free`, `pro`, `teams` |
| status | enum | Yes | `active`, `cancelled`, `past_due` |
| currentPeriodEnd | timestamp | Yes | |
| createdAt | timestamp | Yes | |
| updatedAt | timestamp | Yes | |

---

## 3. JSON Schemas

### Constraints (stored in DailyPlan.constraints)
```json
{
  "timeAvailable": 20,
  "equipment": "none",
  "context": { "travelMode": true, "highStress": false, "lowSleep": false },
  "preferences": { "goal": "maintenance", "experience": "intermediate" },
  "optional": { "injuryLimitation": null, "noJumping": false }
}
```

### Log (stored in DailyLog.log)
```json
{
  "workout": { "completed": true, "workoutId": "wo_001" },
  "meals": { "meal1": true, "meal2": true, "meal3": false },
  "waterTarget": true,
  "steps": false,
  "missed": false,
  "missedReason": null
}
```

---

## 4. Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| User | `email` (unique) | Login lookup |
| DailyPlan | `userId + date` (unique) | One plan per user per day |
| DailyLog | `userId + date` (unique) | One log per user per day |
| WaitlistEntry | `email` (unique) | Dedup |
| Subscription | `userId` | User subscription lookup |

---

## 5. Migration Strategy

- Phase 1: No database (static landing page)
- Phase 2: SQLite (local dev, MVP)
- Phase 3: PostgreSQL (production)
- All schema changes via versioned migration files
