Here is the full documented bug report for the **Apply for Coaching** flow on kairo.business:

---

# 🐛 Bug Report — Apply for Coaching Flow
**Site:** kairo.business/apply
**Date Tested:** March 31, 2026
**Tester:** QA Audit

---

## Flow Overview

The application is a 4-step multi-page form:

| Step | Name | Fields |
|------|------|--------|
| 1 | **INFO** | Full name (required), Email (required), Phone (optional), Age (optional) |
| 2 | **TRAINING** | Training experience (Beginner/Intermediate/Advanced), Current training frequency, Gym access, Injury history |
| 3 | **GOALS** | Primary goal* (required — Fat Loss / Build Muscle / Stay Consistent), Why now, Nutrition struggles, Biggest obstacle, What help is needed most |
| 4 | **REVIEW** | Plan selection (Monthly/Annual toggle), Commitment checkbox, Application Summary, Submit |

---

## Bug #1 — Post-Submission Redirects to Account Creation Instead of Stripe Payment

**Severity:** Critical
**Location:** After clicking "Submit Application" on Step 4 (Review)

**Expected behavior:** After completing the application and selecting a coaching plan, the user should be redirected to a Stripe payment checkout to complete their purchase.

**Actual behavior:** After submission, the user is taken to an "Application Received" confirmation screen that says *"We will review your application and reach out with next steps within 24 to 48 hours."* Below that, a "Set Up Your Account" card prompts the user to create a password. Clicking "Create Account" takes them to `/register?email=...` — a standard account registration page.

**Impact:** No payment is ever collected. Users complete the entire application thinking they're signing up for coaching, but are never charged. The flow implies a manual review/outreach process rather than an immediate checkout, which contradicts the intent of collecting payment at the point of application.

**Additional finding from source code:** The coaching plans (1:1 Standard, 1:1 Premium) have no `stripePriceId` defined in the codebase. Stripe is only wired up for the template/guide products (Workout Guide, Nutrition Guide, Supplement Guide, Bundle). The coaching checkout integration is entirely missing.

---

## Bug #2 — Plan Comparison Shows 4 Incorrect Plans Instead of 2

**Severity:** High
**Location:** Step 4 (Review) — "Choose Your Plan" section

**Expected behavior:** The plan selector should display only the 2 correct coaching plans: **1:1 Standard ($149/mo)** and **1:1 Premium ($350/mo)**.

**Actual behavior:** Per your report, when the "compare plans" feature is triggered, it displays 4 plans — none of which are the correct two. The correct plans are defined in the source code as:

- `1:1 Standard` — $149/mo (or $134/mo annual), described as "Custom programming, nutrition guidance, and ongoing coach support."
- `1:1 Premium` — $350/mo (or $315/mo annual), described as "Full personalization with weekly video calls and daily access to your coach."

The 4 plans shown in the comparison appear to be incorrect/stale data that doesn't match the live product offerings.

---

## Additional Observations

**Observation 1 — Training step has no required fields**
On Step 2 (Training), none of the fields are marked as required. A user can click Continue without selecting any training experience level or gym access type. The Application Summary on the Review step will then only show the goal, not the training level (e.g. "Goal: Fat Loss" with no experience level listed). This may result in incomplete applicant profiles reaching the coach.

**Observation 2 — Confirmation copy is misaligned with a payment-first flow**
The bottom of Step 4 reads: *"We will review your application and reach out within 24 to 48 hours."* This language is appropriate for a manual review/approval flow, but contradicts any intended payment-at-checkout model. Both the copy and the post-submit screen will need to be updated once Stripe is integrated.

**Observation 3 — /coaching page returns 404**
Navigating directly to `kairo.business/coaching` returns a 404 error page. If this route is ever linked to from marketing materials or emails, users will hit a dead end.

---

## Summary Table

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | No Stripe payment after application — redirects to account creation instead | Critical | Post-submit / `/register` |
| 2 | Compare plans shows 4 incorrect plans instead of 2 | High | Step 4 — Plan selector |
| 3 | Training step fields are not required — incomplete data can be submitted | Medium | Step 2 — Training |
| 4 | Confirmation copy implies manual review, not immediate checkout | Low | Post-submit screen |
| 5 | `/coaching` route returns 404 | Low | Site navigation |