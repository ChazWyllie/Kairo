# ConsistAI — Technical Architecture Document

> **Version:** 1.0.0  
> **Date:** 2026-02-15  
> **Status:** APPROVED (Phase 1 Gate A)  
> **Author:** AI Agent (Senior Engineer)

---

## 1. Executive Summary

**ConsistAI** is a mobile-first fitness app that generates adaptive daily workout and nutrition plans based on a user's real-life constraints (time, equipment, stress, sleep, travel). The core differentiation is **adherence over perfection**: plans auto-adjust when life gets in the way.

### Success Criteria
| Metric | Target |
|--------|--------|
| Time to first plan | < 60 seconds from onboarding |
| Daily log completion time | ≤ 30 seconds |
| Weekly adherence rate (active users) | ≥ 70% |
| Plan adaptation latency | < 2 seconds |
| Landing page waitlist conversion | ≥ 5% of visitors |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Mobile App   │  │ Landing Page │  │  PWA (future) │  │
│  │  (React Native│  │ (Static HTML)│  │              │  │
│  │   / Expo)     │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                     API LAYER                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  REST API (Node.js / Express or Next.js API)     │   │
│  │  • /api/constraints   — POST user constraints    │   │
│  │  • /api/plan          — GET today's plan         │   │
│  │  • /api/plan/swap     — POST swap plan           │   │
│  │  • /api/log           — POST daily log           │   │
│  │  • /api/insights      — GET adherence metrics    │   │
│  │  • /api/waitlist      — POST email (landing)     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                         │
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────┐  │
│  │ Constraints    │ │ Plan Generator │ │ Insights    │  │
│  │ Engine         │ │ (workout +     │ │ Engine      │  │
│  │                │ │  nutrition)    │ │             │  │
│  └────────────────┘ └────────────────┘ └─────────────┘  │
│  ┌────────────────┐ ┌────────────────┐                  │
│  │ Adaptation     │ │ Logging        │                  │
│  │ Engine         │ │ Service        │                  │
│  └────────────────┘ └────────────────┘                  │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   DATA LAYER                            │
│  ┌────────────────┐ ┌────────────────┐                  │
│  │ User Store     │ │ Plan Store     │                  │
│  │ (profile,      │ │ (daily plans,  │                  │
│  │  constraints)  │ │  history)      │                  │
│  └────────────────┘ └────────────────┘                  │
│  ┌────────────────┐ ┌────────────────┐                  │
│  │ Log Store      │ │ Waitlist Store │                  │
│  │ (daily logs)   │ │ (emails)       │                  │
│  └────────────────┘ └────────────────┘                  │
│                                                         │
│  Storage: SQLite (MVP) → PostgreSQL (production)        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Design

### 3.1 Constraints Engine
**Purpose:** Captures and validates user constraints for plan generation.

**Input Contract:**
```json
{
  "timeAvailable": 15 | 20 | 30 | 45 | 60,
  "equipment": "none" | "hotel" | "dumbbells" | "full_gym",
  "context": {
    "travelMode": boolean,
    "highStress": boolean,
    "lowSleep": boolean
  },
  "preferences": {
    "goal": "fat_loss" | "muscle" | "maintenance",
    "experience": "beginner" | "intermediate"
  },
  "optional": {
    "injuryLimitation": string | null,
    "noJumping": boolean
  }
}
```

**Validation Rules:**
- `timeAvailable` must be one of the allowed values
- `equipment` must be a valid enum
- At least `goal` and `experience` are required
- All booleans default to `false`

### 3.2 Plan Generator
**Purpose:** Produces a daily plan (workout + nutrition) from constraints.

**Output Contract:**
```json
{
  "date": "2026-02-15",
  "mode": "travel" | "normal" | "recovery",
  "workouts": [
    {
      "id": "wo_001",
      "name": "20-min Hotel Circuit",
      "duration": 20,
      "equipment": "none",
      "description": "Full-body bodyweight circuit...",
      "exercises": [...]
    }
  ],
  "nutrition": {
    "proteinGoal": 160,
    "mealsLeft": 3,
    "waterGoal": 3.0,
    "mealSuggestions": [...]
  }
}
```

**Rules:**
- Always generate ≥ 2 workout alternatives
- Workout duration must be ≤ `timeAvailable`
- Equipment constraint is hard (never exceed available)
- Context toggles reduce intensity/volume by 20–40%

### 3.3 Logging Service
**Purpose:** Captures daily adherence in ≤ 30 seconds via checklist.

**Log Schema:**
```json
{
  "date": "2026-02-15",
  "workout": { "completed": boolean, "workoutId": string | null },
  "meals": { "meal1": boolean, "meal2": boolean, "meal3": boolean },
  "waterTarget": boolean,
  "steps": boolean,
  "missed": boolean,
  "missedReason": string | null
}
```

### 3.4 Adaptation Engine
**Purpose:** Adjusts tomorrow's plan based on today's log.

**Rules:**
- If `missed === true` → reduce tomorrow's volume by 20%, add encouraging copy
- If streak ≥ 3 → unlock progressive overload option
- If adherence < 50% for 3 consecutive days → suggest "reset week" (lower targets)
- Never reset streaks punitively

### 3.5 Insights Engine
**Purpose:** Computes adherence metrics and "next best action."

**Metrics:**
- `dayStreak`: consecutive days with ≥ 1 logged item
- `weeklyAdherence`: (logged items / planned items) × 100
- `workoutsCompleted`: count this week
- `nextBestAction`: rule-based recommendation (e.g., "Add 30g protein tonight")

---

## 4. Landing Page Architecture

The landing page is a **static HTML/CSS** file (no build tools, no JavaScript framework). It serves as a smoke-test for market validation.

**Structure:**
```
src/
  landing/
    index.html      — Full page (hero + 3 steps + phone mockups + waitlist form)
    styles.css       — All styling (responsive, dark/light)
```

**Sections:**
1. Hero: Product name, tagline, one-liner value prop
2. 3-step flow: Set constraints → Get plan → Log & adapt
3. Phone mockups: 3 side-by-side screens (Today, Quick Log, Insights)
4. Waitlist CTA: Email input + button
5. Footer: Copyright + links

---

## 5. Data Models (MVP)

### User
| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| email | string | Yes |
| preferences | JSON | Yes |
| createdAt | timestamp | Yes |

### DailyPlan
| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| userId | UUID (FK) | Yes |
| date | date | Yes |
| constraints | JSON | Yes |
| plan | JSON | Yes |
| createdAt | timestamp | Yes |

### DailyLog
| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| userId | UUID (FK) | Yes |
| date | date | Yes |
| log | JSON | Yes |
| createdAt | timestamp | Yes |

### WaitlistEntry
| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| email | string | Yes |
| createdAt | timestamp | Yes |

---

## 6. Security & Privacy

| Concern | Mitigation |
|---------|------------|
| Email collection | Validate format, sanitize input, store hashed if possible |
| XSS on landing page | No dynamic rendering; pure static HTML |
| CSRF | API will use SameSite cookies + CSRF tokens |
| Data minimization | Collect only email for waitlist; no tracking pixels |
| Rate limiting | Waitlist endpoint: 5 req/min per IP |
| HTTPS | Enforced at deployment (Vercel/Netlify default) |

---

## 7. Technology Stack (MVP)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Landing page | Static HTML/CSS | Zero dependencies, instant deploy |
| Mobile app | React Native (Expo) | Cross-platform, rapid iteration |
| API | Node.js + Express | Simple, well-known, fast to build |
| Database | SQLite (MVP) → PostgreSQL | Zero-config for MVP |
| Hosting (landing) | Vercel / Netlify / GitHub Pages | Free tier, automatic HTTPS |
| CI/CD | GitHub Actions | Native to repo |

---

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Plan quality is poor for edge cases | High | Medium | Extensive test fixtures; human review of workout library |
| Users don't log daily | High | High | 30-sec logging; push reminders; "missed" button removes guilt |
| Landing page doesn't convert | Medium | Medium | A/B test headline; iterate on copy |
| Scope creep into AI/ML | High | Medium | MVP uses rule-based engine only; no ML until PMF |
| Performance on low-end devices | Medium | Low | Static landing page; mobile app uses Expo optimizations |

---

## 9. Adaptability

The architecture supports incremental evolution:
- **Phase 1 (now):** Static landing page + design docs
- **Phase 2:** Mobile app shell with mock data
- **Phase 3:** Backend API with SQLite
- **Phase 4:** Real plan generation engine
- **Phase 5:** AI-powered adaptation (post-PMF)

Each phase is independently deployable and testable.

---

## 10. Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-02-15 | Static HTML landing page (no framework) | Fastest to ship; zero dependencies | Next.js, Astro, Hugo |
| 2026-02-15 | Rule-based plan generator (no ML) | Simpler, deterministic, testable | GPT-powered generation |
| 2026-02-15 | Mobile-first (React Native) | Single codebase for iOS + Android | Native Swift/Kotlin, Flutter |
| 2026-02-15 | SQLite for MVP data | Zero config, works locally | Supabase, Firebase |
