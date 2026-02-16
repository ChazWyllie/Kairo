# Work Package 4: Constraints Engine

> **WP ID:** WP4  
> **Phase:** Design → TDD → Implementation  
> **Status:** NOT STARTED  
> **Estimated Effort:** M (Medium)  
> **Owner:** Agent  

---

## Objective
Build the Constraints Engine module that validates and normalizes user input for plan generation.

## Entry Criteria (Phase Gate)
- [ ] Architecture document Section 3.1 finalized
- [ ] Data models defined (Section 5)
- [ ] WP1-WP2 completed

## Confirm / Decide
- [ ] Language: TypeScript or JavaScript
- [ ] Runtime: Node.js
- [ ] Validation library: Zod vs Joi vs custom

## Input/Output Contracts

### Input
```json
{
  "timeAvailable": 15 | 20 | 30 | 45 | 60,
  "equipment": "none" | "hotel" | "dumbbells" | "full_gym",
  "context": { "travelMode": bool, "highStress": bool, "lowSleep": bool },
  "preferences": { "goal": "fat_loss"|"muscle"|"maintenance", "experience": "beginner"|"intermediate" },
  "optional": { "injuryLimitation": string|null, "noJumping": bool }
}
```

### Output
```json
{
  "valid": true,
  "normalized": { /* same shape, defaults applied */ },
  "errors": []
}
```

## Test Plan

### Unit Tests
- [ ] Valid input passes validation
- [ ] Missing required field returns error
- [ ] Invalid enum value returns error
- [ ] Defaults applied for missing optional fields
- [ ] All boolean context flags default to false
- [ ] Time values outside enum are rejected
- [ ] Equipment values outside enum are rejected

### Edge Cases
- [ ] Empty object input
- [ ] Null input
- [ ] Extra fields are stripped (deny-by-default)
- [ ] String "true" is not accepted for booleans
- [ ] Negative time values rejected
- [ ] Very long injury description truncated (max 200 chars)

### Security Tests
- [ ] XSS payloads in injury field are sanitized
- [ ] SQL injection payloads are safely handled
- [ ] Prototype pollution attempts are blocked

## Implementation Steps
1. Define TypeScript types/interfaces
2. Write validation function with Zod
3. Write normalization function (apply defaults)
4. Write sanitization function (strip dangerous input)
5. Export as module

## Acceptance Criteria
- [ ] All unit tests pass
- [ ] Edge case tests pass
- [ ] Security tests pass
- [ ] Module exports a single `validateConstraints()` function
- [ ] Function is pure (no side effects)
- [ ] TypeScript types are exported
