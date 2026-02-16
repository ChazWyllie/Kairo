# Work Package 2: Test Suite Setup

> **WP ID:** WP2
> **Phase:** 3 (Test First / TDD)
> **Status:** Ready
> **Effort:** S (Small)
> **Owner:** Agent

---

## Objective
Write all tests for the landing page BEFORE implementation. Tests validate HTML structure, content requirements, accessibility basics, and responsiveness contract.

## Entry Criteria (Phase Gate)
- [x] WP1 completed (project scaffolded)
- [x] Architecture + RFC approved

## Confirm / Decide Checklist
- [x] Test runner: Node.js scripts (no heavy framework needed for static HTML)
- [x] HTML parsing: `cheerio` or `jsdom` for structural tests
- [x] Approach: Shell scripts + Node.js test files

## Input / Output Contracts
**Input:** Test specifications from architecture doc (Section 4) and UI screen specs
**Output:** Test files in `tests/` that FAIL (no implementation yet)

## Test Plan

### Unit Tests (`tests/test-html-structure.js`)
| # | Test Case | Expectation |
|---|-----------|-------------|
| T1 | index.html exists | File at `src/landing/index.html` |
| T2 | Has `<title>` with "Kairo" | Title contains product name |
| T3 | Has meta viewport tag | Responsive meta tag present |
| T4 | Has hero section | Element with class/id `hero` exists |
| T5 | Hero contains product name | Text "Kairo" in hero |
| T6 | Hero contains tagline | Text "Your plan adapts" in hero |
| T7 | Has 3-step flow section | Section with 3 step items |
| T8 | Step 1 text correct | Contains "Set" and "constraints" |
| T9 | Step 2 text correct | Contains "Get today's plan" |
| T10 | Step 3 text correct | Contains "Log" and "30 seconds" |
| T11 | Has 3 phone mockup containers | Exactly 3 phone mock elements |
| T12 | Phone 1: Today screen content | Contains "Today", workout options, nutrition |
| T13 | Phone 2: Quick Log content | Contains "Quick Log", checklist items |
| T14 | Phone 3: Insights content | Contains "Insights", adherence, streak |
| T15 | Has waitlist form | Form with email input + submit button |
| T16 | Email input has type="email" | Input validation |
| T17 | Has bottom nav in each phone | Nav items: Today, Log, Plan, Insights |
| T18 | Has footer | Footer element exists |

### Content Tests (`tests/test-content-quality.js`)
| # | Test Case | Expectation |
|---|-----------|-------------|
| C1 | No lorem ipsum | No placeholder Latin text |
| C2 | Protein mentioned with grams | "160g" or similar in nutrition |
| C3 | Adherence % mentioned | "85%" or similar in insights |
| C4 | Streak mentioned | "streak" appears in insights |
| C5 | Competitor contrast present | "Unlike" or differentiation copy |

### Accessibility Tests (`tests/test-accessibility.js`)
| # | Test Case | Expectation |
|---|-----------|-------------|
| A1 | Has lang attribute | `<html lang="en">` |
| A2 | All images have alt text | No `<img>` without `alt` |
| A3 | Form has labels | Email input has associated label |
| A4 | Heading hierarchy | h1 → h2 → h3 (no skips) |

### CSS Tests (`tests/test-styles.js`)
| # | Test Case | Expectation |
|---|-----------|-------------|
| S1 | styles.css exists | File at `src/landing/styles.css` |
| S2 | No external URLs in CSS | No `url(http...)` |
| S3 | Has responsive media query | `@media` rule present |

## Implementation Steps
1. Create `tests/package.json` with test dependencies (`cheerio`)
2. Create `tests/test-html-structure.js`
3. Create `tests/test-content-quality.js`
4. Create `tests/test-accessibility.js`
5. Create `tests/test-styles.js`
6. Verify all tests FAIL (no implementation exists yet)

## Review Checklist
- [ ] Tests are deterministic (no randomness, no network calls)
- [ ] Tests cover all acceptance criteria from RFC-001
- [ ] Tests use absolute paths or reliable relative paths
- [ ] No tests depend on external services

## Acceptance Criteria
- [ ] All test files exist in `tests/`
- [ ] Tests fail for the correct reason (missing files/content)
- [ ] Test output is readable and indicates what's missing
- [ ] `npm test` runs all tests from repo root
