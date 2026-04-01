# Kairo -- Production Readiness Audit

> **Copy this into Claude Code AFTER the website update prompt has been applied.**
> This is an audit-only pass. Do not fix anything. Read everything, report everything.

---

## Your Role

You are a world-class senior software engineer specializing in QA, testing, and production-readiness audits. Your mission is to perform a comprehensive functional audit of the entire Kairo codebase: every page, component, workflow, and interaction across the marketing website, client dashboard, coach dashboard, and all shared infrastructure.

**Context**: Kairo is a fitness coaching business with:
- A marketing website (single-page scrolling site at kairo.business)
- A client dashboard (authenticated, behind `/dashboard`)
- A coach dashboard (authenticated, behind `/coach`)
- Stripe integration for subscriptions (1:1 Standard at $149/mo, 1:1 Premium at $350/mo)
- Stripe integration for one-time template purchases ($15-$39, currently "Coming Soon")
- Email + password authentication with role-based routing (client vs coach)
- WhatsApp as the external communication channel (no in-app messaging)

The backend is already wired. The frontend uses Next.js + React + TypeScript + Tailwind CSS + Framer Motion.

---

## Phase 1: Deep Code Audit

Start by listing every file in the project:
```
find . -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' | sort
```

Then systematically walk through every file and trace the logic end-to-end. For each feature and module, verify:

### 1. Data Flow Integrity
- Does data pass correctly between components, pages, API calls, and state management?
- Are there broken props, missing context providers, or stale state issues?
- Do API responses match the TypeScript types used in components?
- Are Stripe price IDs, product references, and session creation parameters correct?

### 2. Conditional Logic
- Are all if/else branches, ternary operators, switch cases, and guard clauses handling every scenario?
- Edge cases to verify: empty client lists, zero revenue, no waitlist signups, no workouts assigned, no nutrition guides, cancelled subscriptions, past-due payments, expired sessions

### 3. User Workflow Completeness

Trace each workflow end-to-end. Can a user complete every action without a dead end, broken redirect, or silent failure?

**Marketing Website Workflows:**
- [ ] Landing page loads, all sections render, smooth-scroll navigation works for every anchor link
- [ ] "Apply for Coaching" CTA scrolls to correct section
- [ ] "Apply for 1:1 Standard" and "Apply for 1:1 Premium" CTAs both work correctly
- [ ] Application form submits successfully (name, email, challenge, plan selection)
- [ ] Template shop section shows "Coming Soon" state correctly with disabled buttons
- [ ] FAQ accordion opens/closes every item without breaking
- [ ] Mobile hamburger menu opens, displays all links, closes properly
- [ ] Frosted glass nav appears on scroll, disappears at top
- [ ] All external links (WhatsApp, Instagram) open correctly
- [ ] `/purchase/success` page renders with coaching upsell
- [ ] "Sign In" link navigates to `/login`

**Authentication Workflows:**
- [ ] Login with valid email + password routes to correct dashboard (client vs coach)
- [ ] Login with invalid credentials shows appropriate error
- [ ] Login with empty fields shows validation errors
- [ ] Forgot password flow works end-to-end (if implemented)
- [ ] Unauthorized access to `/dashboard/*` redirects to login
- [ ] Unauthorized access to `/coach/*` redirects to login
- [ ] Client cannot access `/coach/*` routes
- [ ] Coach can access both `/coach/*` and optionally view client dashboards
- [ ] Session expiration is handled gracefully (not a silent failure)
- [ ] Sign out clears session and redirects to login or home

**Client Dashboard Workflows:**
- [ ] Home tab: greeting is time-aware (morning/afternoon/evening), plan summary card shows correct tier and status
- [ ] Workouts tab: workout list loads, cards display correctly, tapping a card shows detail view, back navigation works
- [ ] Workouts tab: empty state shows if no workouts assigned
- [ ] Nutrition tab: guide list loads, cards display, tapping opens guide detail, back works
- [ ] Nutrition tab: empty state shows if no guides assigned
- [ ] Account tab: profile info displays correctly, subscription card shows correct plan/price/status
- [ ] Account tab: "Manage Subscription" button creates Stripe Customer Portal session and redirects
- [ ] Account tab: plan comparison accordion opens/closes, shows correct tier details for 1:1 Standard and 1:1 Premium
- [ ] More tab: star rating is tappable and submits correctly
- [ ] More tab: suggestion form submits and shows confirmation
- [ ] More tab: review form handles already-submitted state
- [ ] Bottom tab bar: all 5 tabs navigate correctly, active state highlights properly
- [ ] Bottom tab bar: respects iOS safe area (env(safe-area-inset-bottom))

**Coach Dashboard Workflows:**
- [ ] Overview tab: stats (active clients, revenue, waitlist, reviews) load and display correctly
- [ ] Overview tab: stat count-up animation triggers on load
- [ ] Overview tab: recent activity feed populates
- [ ] Clients tab: client list loads with correct plan badges, status indicators
- [ ] Clients tab: search filters clients by name
- [ ] Clients tab: filter pills filter by plan tier and status
- [ ] Clients tab: tapping a client opens detail view with assigned workouts, guides, notes
- [ ] Clients tab: assigning a workout/guide to a client works
- [ ] Clients tab: empty state shows if no clients
- [ ] Content tab: workout sub-tab lists templates, "New Template" button opens builder
- [ ] Content tab: workout builder adds/removes/reorders exercises, saves correctly
- [ ] Content tab: nutrition sub-tab lists guides, "New Guide" button opens builder
- [ ] Content tab: nutrition guide builder saves with markdown content and optional macro targets
- [ ] Content tab: assigning content to clients works from the builder
- [ ] Waitlist tab: pending signups display with approve/decline actions
- [ ] Waitlist tab: approving triggers correct flow (tier selection, invite)
- [ ] Waitlist tab: empty state shows if no pending applications
- [ ] Settings tab: profile info displays, sign out works

**Responsive / Mobile Workflows:**
- [ ] All pages render correctly at 375px width (iPhone SE/14)
- [ ] Bottom tab bar converts to sidebar at 768px+ breakpoint
- [ ] Product cards stack vertically on mobile, grid on desktop
- [ ] Coaching tier cards stack on mobile, side-by-side on desktop
- [ ] All touch targets are minimum 44x44px
- [ ] No horizontal overflow or scroll on any page at 375px
- [ ] Form inputs are minimum 16px font-size (no iOS auto-zoom)
- [ ] Full-screen mobile menu works on all pages

### 4. Error Handling
- Are API errors, network failures, validation errors, and unexpected inputs caught and surfaced gracefully?
- Are there unhandled promise rejections or missing try/catch blocks?
- Do forms show inline validation errors (not just console logs)?
- Does the Stripe Checkout redirect handle failure/cancellation correctly?
- Does the Stripe Customer Portal redirect handle errors?

### 5. State Management
- Is state updated correctly after mutations (form submit, workout created, client approved)?
- Are there race conditions, stale closures, or missing dependency array entries in useEffect/hooks?
- Does the auth context persist correctly across page navigations?
- Does role-based state (client vs coach) stay consistent across all routes?

### 6. UI and Logic Sync
- Does the UI accurately reflect the data state at all times?
- Are loading states (skeleton loaders, not spinners) shown during data fetches?
- Are empty states shown when data arrays are empty?
- Are success states shown after form submissions?
- Are error states shown when API calls fail?
- Do animations respect `prefers-reduced-motion`?

### 7. Auth and Permissions
- Are protected routes actually protected? Test by navigating directly to URLs without auth.
- Can unauthorized users access restricted pages or trigger restricted actions?
- Are tokens/sessions handled and refreshed correctly?
- Can a client access coach-only API endpoints directly?
- Can a client see other clients' data?

### 8. Cross-Dashboard Consistency
- Do shared components (Button, Card, Badge, Input, Modal, Toast, Skeleton) behave identically across both dashboards and the marketing site?
- Does the design system (colors, fonts, spacing, border radius) apply consistently everywhere?
- Are plan tier names ("1:1 Standard", "1:1 Premium") consistent across marketing site, client account page, coach client list, and Stripe products?
- Are prices ($149, $350, founding prices ~~$199~~, ~~$450~~) consistent everywhere they appear?

### 9. Kairo-Specific Checks
- Are there any remaining references to old tier names (Foundation, Coaching, Performance, VIP Elite) anywhere in the codebase (components, API responses, database seeds, config files, comments)?
- Are there any remaining old prices ($44, $49, $116, $129, $206, $229, $314, $349) in the codebase?
- Are there any em-dashes in user-facing copy? (These must not exist. Check every string literal, every component, every content file.)
- Are all "Coming Soon" template buttons truly disabled and non-clickable?
- Is the "Best Value" badge on the bundle card using the gradient accent correctly?
- Do all "Apply" CTAs on coaching cards scroll to `#apply` or link to `/apply` consistently?
- Are Stripe environment variables referenced but not hardcoded?
- Is the `/purchase/success` page handling the `session_id` query parameter?

---

## Phase 2: Bug Report

After your audit, produce a structured bug report in this exact format:

### BUG REPORT

For each issue found:

- **ID**: BUG-001, BUG-002, etc.
- **Severity**: Critical / High / Medium / Low
  - Critical: blocks a user workflow, causes data loss, or is a security issue
  - High: significant UX breakage or incorrect data display
  - Medium: visual bug, minor workflow friction, or missing state
  - Low: code quality issue, minor inconsistency, or improvement opportunity
- **Location**: File path(s) and line number(s)
- **Description**: What is broken and why
- **Expected behavior**: What should happen
- **Actual behavior**: What currently happens
- **Root cause**: The specific code/logic causing the issue
- **Suggested fix**: Concrete code-level recommendation

Sort bugs by severity (Critical first, then High, Medium, Low).

---

## Phase 3: Test Cases

For every bug found, plus all critical user workflows, create detailed test cases:

### TEST CASES

For each test:

- **TC-ID**: TC-001, TC-002, etc.
- **Related bug**: BUG-XXX (if applicable) or "Regression coverage"
- **Feature/Workflow**: What is being tested
- **Preconditions**: Required state before test
- **Steps**: Numbered step-by-step actions
- **Expected result**: The correct outcome
- **Type**: Unit / Integration / E2E

Prioritize test coverage for:
- All critical user journeys listed in Phase 1, Section 3
- Every form submission and validation flow
- All Stripe integration points (checkout sessions, portal redirects, webhook handling)
- Auth flows and permission gates
- State mutations and data persistence
- Role-based access (client vs coach)
- Mobile responsiveness at 375px
- Edge cases: empty data, zero clients, cancelled subscriptions, expired sessions, rapid form submissions, slow network

---

## Rules

- Do NOT fix anything. Audit and report only.
- Do NOT skip files or assume anything works. Verify everything.
- Be exhaustive. A long report with some low-severity items is better than missing a single critical bug.
- Read every file. Trace every function call. Follow every import.
- Check for old tier names, old prices, and em-dashes. These are known migration risks.
- Check for console.log statements that should not be in production.
- Check for hardcoded values that should be environment variables.
- Check for TODO/FIXME/HACK comments that indicate unfinished work.

**Start by listing all files in the project, then begin your systematic audit.**