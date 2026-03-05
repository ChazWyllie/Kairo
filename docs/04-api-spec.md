# Kairo — API Specification

> **Version:** 1.0
> **Last Updated:** 2026-02-15
> **Status:** DRAFT (Phase 3+)

---

## 1. Base URL

```
Production:  https://api.kairo.app/v1
Staging:     https://api-staging.kairo.app/v1
Local:       http://localhost:3000/v1
```

---

## 2. Authentication

| Method | Use Case |
|--------|----------|
| Bearer JWT | Authenticated endpoints |
| API Key | Waitlist endpoint (public, rate-limited) |

---

## 3. Endpoints

### 3.1 Waitlist

```
POST /waitlist
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (201):**
```json
{
  "status": "ok",
  "message": "You're on the list!"
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Invalid email format |
| 429 | Rate limit exceeded (5 req/min/IP) |

---

### 3.2 Constraints

```
POST /constraints
Authorization: Bearer <token>
```

**Request:**
```json
{
  "timeAvailable": 20,
  "equipment": "none",
  "context": {
    "travelMode": true,
    "highStress": false,
    "lowSleep": false
  },
  "preferences": {
    "goal": "maintenance",
    "experience": "intermediate"
  },
  "optional": {
    "injuryLimitation": null,
    "noJumping": false
  }
}
```

**Response (200):**
```json
{
  "status": "ok",
  "constraintsId": "cst_abc123"
}
```

---

### 3.3 Plan

```
GET /plan?date=2026-02-15
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "date": "2026-02-15",
  "mode": "travel",
  "workouts": [
    {
      "id": "wo_001",
      "name": "20-min Hotel Circuit",
      "duration": 20,
      "equipment": "none",
      "description": "Full-body bodyweight circuit"
    },
    {
      "id": "wo_002",
      "name": "15-min Stretch & Core",
      "duration": 15,
      "equipment": "none",
      "description": "Recovery-focused session"
    }
  ],
  "nutrition": {
    "proteinGoal": 160,
    "mealsLeft": 3,
    "waterGoal": 3.0
  }
}
```

---

### 3.4 Swap Plan

```
POST /plan/swap
Authorization: Bearer <token>
```

**Request:**
```json
{
  "date": "2026-02-15",
  "currentWorkoutId": "wo_001"
}
```

**Response (200):** Returns a new plan with alternative workouts.

---

### 3.5 Log

```
POST /log
Authorization: Bearer <token>
```

**Request:**
```json
{
  "date": "2026-02-15",
  "workout": { "completed": true, "workoutId": "wo_001" },
  "meals": { "meal1": true, "meal2": true, "meal3": false },
  "waterTarget": true,
  "steps": false,
  "missed": false,
  "missedReason": null
}
```

**Response (200):**
```json
{
  "status": "ok",
  "streak": 12,
  "adaptationApplied": false
}
```

---

### 3.6 Insights

```
GET /insights?period=week
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "dayStreak": 12,
  "weeklyAdherence": 85,
  "workoutsCompleted": 4,
  "nextBestAction": {
    "title": "Add 30g protein tonight",
    "description": "Greek yogurt + scoop of whey gets you there."
  }
}
```

---

## 4. Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /waitlist` | 5 req/min/IP |
| All authenticated | 60 req/min/user |
| `POST /plan/swap` | 10 req/min/user |

---

## 5. Error Format

All errors follow:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```
