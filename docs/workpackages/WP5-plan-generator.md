# Work Package 5: Plan Generator

> **WP ID:** WP5  
> **Phase:** Design → TDD → Implementation  
> **Status:** NOT STARTED  
> **Estimated Effort:** L (Large)  
> **Owner:** Agent  

---

## Objective
Build the Plan Generator that produces daily workout + nutrition plans from validated constraints.

## Entry Criteria (Phase Gate)
- [ ] WP4 completed (Constraints Engine)
- [ ] Architecture document Section 3.2 finalized
- [ ] Workout library defined (static data)

## Confirm / Decide
- [ ] Workout library format: JSON file vs database
- [ ] Nutrition calculation: formula-based vs lookup table
- [ ] Number of workout alternatives: 2 minimum

## Input/Output Contracts

### Input
- Validated constraints object (output of WP4)

### Output
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
      "description": "Full-body bodyweight circuit",
      "exercises": [{ "name": "Push-ups", "sets": 3, "reps": 12 }]
    }
  ],
  "nutrition": {
    "proteinGoal": 160,
    "mealsLeft": 3,
    "waterGoal": 3.0,
    "mealSuggestions": [{ "name": "Chicken + rice", "protein": 40, "time": "lunch" }]
  }
}
```

## Test Plan

### Unit Tests
- [ ] Returns ≥ 2 workout alternatives
- [ ] Workout duration ≤ timeAvailable
- [ ] Equipment constraint respected (never exceeds available)
- [ ] Travel mode reduces intensity by ≥ 20%
- [ ] High-stress context reduces volume
- [ ] Low-sleep context suggests recovery focus
- [ ] Protein goal calculation is correct for each goal type
- [ ] Beginner gets lower volume than intermediate

### Edge Cases
- [ ] 15-minute time slot with full gym equipment
- [ ] 60-minute time slot with no equipment
- [ ] All context toggles active simultaneously
- [ ] Injury limitation + no jumping combined

### Integration Tests
- [ ] Constraints Engine output feeds directly into Plan Generator
- [ ] Plan output matches DailyPlan schema

## Implementation Steps
1. Create workout library (JSON)
2. Create nutrition lookup/formula module
3. Build plan generation algorithm
4. Wire constraints → plan pipeline
5. Add mode detection logic (travel/normal/recovery)

## Acceptance Criteria
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Generated plans are deterministic (same input → same output)
- [ ] Plan generation completes in < 100ms
- [ ] Output matches DailyPlan schema exactly
