# Work Package 1: Project Scaffolding & CI Setup

> **WP ID:** WP1
> **Phase:** 2 (Task Decomposition)
> **Status:** Ready
> **Effort:** S (Small)
> **Owner:** Agent

---

## Objective
Set up the complete project structure, CI pipeline, and documentation skeleton so all subsequent WPs have a stable foundation.

## Entry Criteria (Phase Gate)
- [x] Architecture document approved
- [x] RFC-001 written and reviewed

## Confirm / Decide Checklist
- [x] Repo structure matches spec
- [x] CI workflow target: GitHub Actions
- [x] HTML validation tool: `html-validate` or manual W3C check
- [x] CSS lint: `stylelint` (optional, manual review acceptable for Phase A)

## Input / Output Contracts
**Input:** Repo with empty `src/`, `tests/`, `docs/` folders
**Output:** Fully scaffolded repo with CI workflow, all doc templates, README skeleton

## Test Plan
| Test | Type | Expectation |
|------|------|-------------|
| CI workflow syntax is valid | Unit (YAML lint) | No parse errors |
| All required directories exist | Integration | `src/`, `tests/`, `docs/workpackages/`, `docs/rfcs/`, etc. |
| README has required sections | Unit | Sections: Overview, Quick Start, Architecture, Contributing |

## Implementation Steps
1. Create `src/landing/` directory
2. Create `.github/workflows/ci.yml`
3. Create `docs/checklists/reviewer-checklist.md`
4. Create `docs/checklists/security-checklist.md`
5. Create `docs/checklists/definition-of-done.md`
6. Create `docs/workflows/iteration-runbook.md`
7. Populate README.md skeleton
8. Initialize CHANGELOG.md with `[Unreleased]` section

## Review Checklist
- [ ] All directories from spec exist
- [ ] CI workflow is syntactically valid
- [ ] No secrets or tokens in any file
- [ ] README has clear Quick Start instructions

## Acceptance Criteria
- [ ] `tree` output matches required repo structure
- [ ] CI workflow can be parsed without errors
- [ ] All checklist and workflow docs created
- [ ] README.md has content (not empty)
- [ ] CHANGELOG.md has `[Unreleased]` section
