# Feature Template (Spec → Diff → Test → Review)

## Context
- **Link docs:** (requirements, architecture, threat model)
- **Feature goal:**

## Scope
- **In scope:**
- **Out of scope:**

## Interfaces
- **Routes / functions:**
- **Inputs (schemas):**
- **Outputs:**

## Data Model Changes
- **Tables/fields:**
- **Migrations:**

## Security
- **Threats touched:**
- **Controls required:**
- **Logging policy:**

## Tests
- **Unit:**
- **Integration:**
- **E2E (if needed):**

## Acceptance Criteria
- [ ] ...
- [ ] ...

---

## Agent Workflow

> Follow this sequence strictly. Do NOT write code until Phase 4.

### Phase 1 — Requirements
Ask clarifying questions regarding:
- Business goal and success criteria
- Constraints (performance, security, scale)
- Affected systems and architecture dependencies

### Phase 2 — Design
Produce:
- High-level architecture overview
- Data model changes and API contract definitions
- Flow diagram (described textually)
- Risk assessment and backward compatibility impact

### Phase 3 — Test Plan
Generate:
- Unit test cases and integration test scenarios
- Edge cases and error handling validation
- Permission/security tests

### Phase 4 — Implementation
Only after approval:
- Implement in modular chunks
- Include logging and error handling
- Follow project style guide
- Document assumptions

### Phase 5 — Review
Provide:
- Code review summary
- Complexity and security analysis
- Suggested improvements
