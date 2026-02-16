# Work Package 6: Logging & Adaptation Engine

> **WP ID:** WP6  
> **Phase:** Design → TDD → Implementation  
> **Status:** NOT STARTED  
> **Estimated Effort:** L (Large)  
> **Owner:** Agent  

---

## Objective
Build the Logging Service (30-sec daily checklist) and Adaptation Engine (auto-adjusts tomorrow's plan based on today's log).

## Entry Criteria (Phase Gate)
- [ ] WP5 completed (Plan Generator)
- [ ] Architecture document Sections 3.3 + 3.4 finalized
- [ ] DailyLog schema confirmed

## Confirm / Decide
- [ ] Storage: in-memory (MVP) vs SQLite
- [ ] Adaptation aggressiveness: conservative (20% adjustment) vs moderate (30%)
- [ ] Streak definition: any logged item counts vs workout-only

## Input/Output Contracts

### Logging Input
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

### Adaptation Output
```json
{
  "adjustments": {
    "volumeModifier": 0.8,
    "intensityModifier": 0.9,
    "encouragement": "Great effort yesterday! Let's keep it lighter today.",
    "proteinAdjustment": 0
  },
  "insights": {
    "dayStreak": 5,
    "weeklyAdherence": 78,
    "workoutsCompleted": 4,
    "nextBestAction": "Add 30g protein at dinner to hit your daily target."
  }
}
```

## Test Plan

### Unit Tests (Logging)
- [ ] Complete log saves successfully
- [ ] Partial log saves successfully
- [ ] Missed flag + reason saves
- [ ] Invalid date rejected
- [ ] Duplicate date log updates (upsert)

### Unit Tests (Adaptation)
- [ ] Missed day → volume reduced 20%
- [ ] 3-day streak → progressive overload unlocked
- [ ] 3 consecutive days < 50% adherence → reset week suggested
- [ ] Streaks never reset punitively
- [ ] Next best action is context-specific

### Edge Cases
- [ ] First ever log (no history)
- [ ] All items missed
- [ ] All items completed
- [ ] Log submitted for future date → rejected
- [ ] Log submitted for date > 7 days ago → rejected

### Integration Tests
- [ ] Log feeds into Adaptation Engine
- [ ] Adaptation output modifies next Plan Generator call
- [ ] Insights Engine reads from log history

## Implementation Steps
1. Define log storage interface
2. Build logging service (validate + save)
3. Build adaptation rules engine
4. Build insights calculator
5. Wire log → adapt → plan pipeline

## Acceptance Criteria
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Logging a day takes < 100ms
- [ ] Adaptation runs in < 50ms
- [ ] No data loss on concurrent log writes
- [ ] Streaks are calculated correctly across timezone boundaries
