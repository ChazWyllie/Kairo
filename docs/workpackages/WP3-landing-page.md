# Work Package 3: Landing Page Implementation

> **WP ID:** WP3
> **Phase:** 4 (Implementation)
> **Status:** Blocked (requires WP2 tests)
> **Effort:** M (Medium)
> **Owner:** Agent

---

## Objective
Implement the static landing page (`index.html` + `styles.css`) that satisfies all tests from WP2. This is the core deliverable of Phase A.

## Entry Criteria (Phase Gate)
- [ ] WP2 tests written and failing for correct reasons
- [ ] Architecture + RFC approved
- [ ] UI screen specs finalized

## Confirm / Decide Checklist
- [x] Color scheme: Dark mode, accent #4f8cff (blue)
- [x] Font: System font stack (no external fonts)
- [x] Layout: CSS Grid + Flexbox (no floats)
- [x] Phone mockups: CSS-only (border-radius + shadow)
- [x] Form action: No-op (or Formspree placeholder)

## Input / Output Contracts
**Input:** UI screen specs (architecture.md §5), test expectations (WP2)
**Output:** `src/landing/index.html` + `src/landing/styles.css`

## Test Plan
All tests from WP2 must PASS after implementation.

## Implementation Steps

### index.html
1. HTML5 boilerplate with semantic elements
2. `<header>` with hero section:
   - Product name (h1)
   - Tagline (h2)
   - One-liner value prop (p)
3. `<section>` with 3-step flow:
   - Step 1: Set constraints
   - Step 2: Get today's plan
   - Step 3: Log in 30 seconds
4. `<section>` with 3 phone mockups:
   - Phone 1: Today Plan screen
   - Phone 2: Quick Log screen
   - Phone 3: Insights screen
5. `<section>` with waitlist form:
   - Email input (type="email", required)
   - Submit button
   - Success message (hidden by default)
6. `<footer>` with copyright

### styles.css
1. CSS custom properties (variables) for colors, spacing
2. Reset / normalize
3. Typography scale (system fonts)
4. Dark mode base styles
5. Hero section layout
6. 3-step flow (flex row → column on mobile)
7. Phone mockup frames (CSS-only):
   - Device bezel (border-radius, shadow)
   - Screen content (overflow hidden)
   - Aspect ratio 9:19.5
8. Waitlist form styling
9. Footer
10. Responsive breakpoints:
    - `< 768px`: Stack everything vertically
    - `768px–1024px`: 2-column where applicable
    - `> 1024px`: Full 3-column phone layout

### Content Rules
- All copy matches spec exactly
- Workout options: "20-min Hotel Circuit", "30-min Dumbbell HIIT"
- Nutrition: Protein 160g, Meals 2, Water 3.0L
- Insights: Streak 12, Adherence 85%, Workouts 4/5
- Next best action: "Add 30g protein tonight"

## Review Checklist
- [ ] All WP2 tests pass
- [ ] Page renders correctly at 375px, 768px, 1440px
- [ ] No external dependencies (CDN, npm, images)
- [ ] HTML is semantic (header, main, section, footer, nav)
- [ ] No inline styles (all in styles.css)
- [ ] No JavaScript (pure HTML/CSS)
- [ ] Color contrast ratio ≥ 4.5:1 for body text

## Acceptance Criteria
- [ ] `index.html` + `styles.css` exist in `src/landing/`
- [ ] All WP2 tests pass
- [ ] Page opens correctly in Chrome (local file)
- [ ] Responsive at 375px (iPhone SE), 768px (iPad), 1440px (desktop)
- [ ] All 3 phone mockups show correct content
- [ ] Waitlist form is present with email input
- [ ] No build tools required
