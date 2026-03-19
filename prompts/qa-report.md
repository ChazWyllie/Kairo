# Kairo Production Readiness Audit — QA Report

**Date:** 2026-03-19
**Branch:** feat/launch-email
**Spec:** `prompts/kairo-qa-update.md`
**Scope:** Full codebase audit — marketing site, client dashboard, coach dashboard, all API routes, shared infrastructure
**Pre-audit fix applied:** Removed "Advanced programming and peaking protocols" and "Competition and photoshoot prep" from `COACHING_TIERS.premium.features` in `src/lib/products.ts`.

---

## Audit Coverage Summary

All 9 categories from the spec were reviewed:

| Category | Status |
|---|---|
| 1. Data flow integrity | Reviewed |
| 2. Conditional logic | Reviewed |
| 3. User workflow completeness | Reviewed |
| 4. Error handling | Reviewed |
| 5. State management | Reviewed |
| 6. UI ↔ Logic sync | Reviewed |
| 7. Auth & permissions | Reviewed |
| 8. Cross-dashboard consistency | Reviewed |
| 9. Kairo-specific checks | Reviewed |

---

## BUG REPORT

---

### BUG-001
- **Severity:** Critical
- **Location:** `src/app/api/webhook/route.ts:73–112`
- **Description:** The `checkout.session.completed` webhook handler never checks `session.mode`. When a template purchase completes (mode: `"payment"`), the session has no `subscription` ID. The handler hits the guard at line 99 (`!customerId || !subscriptionId`) and returns a `400` error. Stripe interprets a 400 as a permanent failure and retries the webhook multiple times before abandoning it. Template buyers will never trigger the lead conversion tracking (line 189) or application conversion tracking (line 204), and admin will receive no notification of the purchase.
- **Expected behavior:** Template purchases (mode: `"payment"`) are handled gracefully — webhook acknowledges receipt, records the event for idempotency, fires admin notification, and marks lead as converted. Subscription activation logic is skipped for one-time purchases.
- **Actual behavior:** Template webhook returns `400 WEBHOOK_ERROR` with message "Session missing customer or subscription ID", causing Stripe to retry the event up to the retry policy limit and ultimately abandon it.
- **Root cause:** Line 99 requires `subscriptionId` without first checking `session.mode`. One-time payments never produce a `subscription` object.
- **Suggested fix:**
  ```ts
  // Early exit for non-subscription sessions (e.g., template one-time purchases)
  if (session.mode !== "subscription") {
    // Record event for idempotency, fire admin notification, mark lead converted
    await prisma.stripeEvent.create({ data: { id: event.id } });
    // ... fire-and-forget admin notification and lead conversion ...
    return NextResponse.json({ received: true, status: "processed_non_subscription" });
  }
  // Continue with existing subscription activation logic...
  ```

---

### BUG-002
- **Severity:** Critical
- **Location:** `src/app/api/auth/logout/route.ts:11`, `src/lib/auth.ts:141–143`
- **Description:** The logout endpoint only clears the `kairo_session` cookie (member session). It does not clear the `coach_session` cookie. A coach who signs out via the Settings tab retains a valid `coach_session` cookie for up to 7 days. During this window they can make authenticated requests to any `/api/coach/*` endpoint directly.
- **Expected behavior:** Logout clears both `kairo_session` and `coach_session` cookies simultaneously.
- **Actual behavior:** Only `kairo_session` is cleared. `coach_session` persists until natural expiry.
- **Root cause:** `getClearSessionCookie()` returns only `kairo_session=; Path=/; HttpOnly; ...`. The `getClearCoachSessionCookie()` function exists at `auth.ts:168` but is never called in the logout route.
- **Suggested fix:**
  ```ts
  // In logout/route.ts
  import { getClearSessionCookie, getClearCoachSessionCookie } from "@/lib/auth";
  export async function POST() {
    const response = NextResponse.json({ status: "ok" });
    response.headers.append("Set-Cookie", getClearSessionCookie());
    response.headers.append("Set-Cookie", getClearCoachSessionCookie());
    return response;
  }
  ```

---

### BUG-003
- **Severity:** High
- **Location:** `src/app/apply/page.tsx:47–54`, `src/app/apply/page.tsx:54`
- **Description:** The `TIERS` array and `VALID_APPLY_TIERS` constant on the application form still reference the old 4-tier product names: "Foundation", "Coaching", "Performance", "VIP Elite". The marketing site now only sells two coaching tiers: "1:1 Standard" and "1:1 Premium". Users who arrive at `/apply` from the marketing site will see a plan selection UI that doesn't match the products advertised.
- **Expected behavior:** Plan selection shows "1:1 Standard" and "1:1 Premium" only, matching `COACHING_TIERS` in `products.ts`.
- **Actual behavior:** Form shows Foundation, Coaching, Performance, and VIP Elite as tier options.
- **Root cause:** `TIERS` array at line 47 was not updated during the website restructure. It still reads old tier data instead of pulling from `COACHING_TIERS` in `products.ts`.
- **Suggested fix:** Replace `TIERS` with values derived from `COACHING_TIERS` in `products.ts`. Update `VALID_APPLY_TIERS` to `["standard", "premium"]`. Update `getTierLabel()` and the Zod schema in `application/route.ts`.

---

### BUG-004
- **Severity:** High
- **Location:** `src/app/api/application/route.ts:42–44`
- **Description:** The Zod schema for `preferredTier` validates against old tier enum values: `["foundation", "coaching", "performance", "vip"]`. If a user arrives at `/apply?tier=standard` or `/apply?tier=premium` (as linked from the CoachingSection), the `tier` query param is silently ignored because it fails the `VALID_APPLY_TIERS` check in the frontend (BUG-003). Even if the frontend were fixed, the API would reject `"standard"` and `"premium"` with a validation error.
- **Expected behavior:** `preferredTier` accepts `"standard"` and `"premium"`.
- **Actual behavior:** `preferredTier` only accepts `"foundation"`, `"coaching"`, `"performance"`, `"vip"` — any new tier value fails Zod validation.
- **Root cause:** `z.enum(["foundation", "coaching", "performance", "vip"])` at line 42 was not updated.
- **Suggested fix:** Change to `z.enum(["standard", "premium"]).optional()`. Coordinate with database migration if `preferredTier` is a DB enum.

---

### BUG-005
- **Severity:** High
- **Location:** `src/app/api/checkout/founding/route.ts:27`
- **Description:** The founding member checkout Zod schema validates `tier` against old values: `["foundation", "coaching", "performance", "vip"]`. The marketing site now only offers "1:1 Standard" ($149/mo) and "1:1 Premium" ($350/mo). Any founding member checkout initiated from the current marketing site will fail validation.
- **Expected behavior:** Founding checkout accepts `"standard"` and `"premium"`.
- **Actual behavior:** Founding checkout rejects `"standard"` and `"premium"` with a 400 validation error.
- **Root cause:** `z.enum(["foundation", "coaching", "performance", "vip"])` at line 27 was not updated.
- **Suggested fix:** Change to `z.enum(["standard", "premium"])`. Update `getStripePriceId()` in `stripe-server.ts` to resolve price IDs for the new tier keys.

---

### BUG-006
- **Severity:** High
- **Location:** `src/services/email.ts:162–167`, `src/services/email.ts:322–327`, `src/services/email.ts:378`, `src/services/email.ts:454–457`, `src/services/email.ts:537–542`
- **Description:** Multiple email templates reference the old 4-tier plan names and old prices. Specifically:
  - `sendQuizWelcomeEmail` (line 162): tierNames map includes Foundation/Coaching/Performance/VIP Elite
  - `sendApplicationApproved` (line 322): same old tier name map
  - `notifyAdminNewApplication` (line 378): tierLabels map shows old prices `Foundation ($49)`, `Coaching ($129)`, `Performance ($229)`, `VIP Elite ($349)`
  - `sendFoundingMemberWelcome` (line 454): old tier name map
  - `sendLaunchEmail` (line 537): lists all 4 old plans with wrong names in email body, and links to `/#pricing` instead of `/#coaching`
- **Expected behavior:** Email templates reflect the current product catalog: "1:1 Standard ($149/mo)" and "1:1 Premium ($350/mo)". Launch email links to `/#coaching`.
- **Actual behavior:** Emails sent to members and admins show discontinued product names and incorrect prices.
- **Root cause:** Email service was not updated during the product restructure.
- **Suggested fix:** Update all `tierNames` and `tierLabels` maps to `{ standard: "1:1 Standard", premium: "1:1 Premium" }`. Update prices to $149/$350. Update `sendLaunchEmail` body and fix `/#pricing` → `/#coaching` link.

---

### BUG-007
- **Severity:** High
- **Location:** `src/lib/quiz-engine.ts` (inferred — quiz engine still returns old tier recommendations)
- **Description:** The quiz engine (`/api/quiz` → `quiz-engine.ts`) still recommends tiers from the old 4-tier model: `foundation`, `coaching`, `performance`, `vip`. The quiz result page (`/quiz/result`) reads the `tier` query param and validates it against `VALID_TIERS = ["foundation", "coaching", "performance", "vip"]` (line 19 of `quiz/result/page.tsx`). These tiers no longer exist in the public product catalog. Users who complete the quiz will be shown a plan card for a product that doesn't exist on the marketing site.
- **Expected behavior:** Quiz recommends either `"standard"` or `"premium"` and links to `/apply?tier=standard` or `/apply?tier=premium`.
- **Actual behavior:** Quiz recommends `"foundation"`, `"coaching"`, `"performance"`, or `"vip"`. Result page shows pricing from the old `PLANS` array (e.g., $49/mo for Foundation). CTA links to `/apply?tier=foundation` etc., which the new apply form doesn't handle.
- **Root cause:** `VALID_TIERS` constant and quiz engine tier output were not updated during product restructure.
- **Suggested fix:** Update `VALID_TIERS` to `["standard", "premium"]`. Update quiz engine scoring to output new tier keys. Update `/quiz/result` page to read from `COACHING_TIERS` in `products.ts` instead of `PLANS` from `stripe-prices.ts`.

---

### BUG-008
- **Severity:** High
- **Location:** `src/app/coach/clients/[id]/page.tsx:167`
- **Description:** The WhatsApp deep-link on the client detail page is always empty: `href="https://wa.me/"`. Clicking this link opens WhatsApp with no pre-filled number and no chat target — it navigates to an invalid WhatsApp URL.
- **Expected behavior:** Link opens WhatsApp chat with the client's phone number, e.g., `https://wa.me/12345678900`.
- **Actual behavior:** Link always goes to `https://wa.me/` (no number appended).
- **Root cause:** The `ClientDetail` interface does not include a `phone` field, and the `href` is hardcoded with an empty number. The `client.phone` property is never fetched from the API.
- **Suggested fix:** Add `phone?: string` to `ClientDetail` interface. Fetch `phone` from `/api/coach` response. Build the link as `href={client.phone ? \`https://wa.me/${client.phone.replace(/\D/g, "")}\` : "#"}`. Disable/hide the button if no phone is stored.

---

### BUG-009
- **Severity:** Medium
- **Location:** `src/app/dashboard/account/page.tsx:16–18`
- **Description:** `PLAN_MONTHLY_PRICES` is hardcoded as `{ foundation: 49, coaching: 129, performance: 229, vip: 349 }`. These are the old 4-tier prices, not the current "1:1 Standard ($149/mo)" and "1:1 Premium ($350/mo)" prices. A member on the new `standard` or `premium` plan tier will see `monthlyPrice = null` (because the key doesn't exist in the record), causing the price display and "Manage Subscription" button visibility logic to silently fail (the button is gated on `member.status === "active"`, not on `monthlyPrice` being set, so the button will still show — but the price display will be blank).
- **Expected behavior:** Account page shows the correct current plan price: $149 for standard, $350 for premium.
- **Actual behavior:** `monthlyPrice` resolves to `undefined` for `standard`/`premium` tier members, so the price section doesn't render.
- **Root cause:** `PLAN_MONTHLY_PRICES` object uses old tier keys and old prices. It should be derived from `COACHING_TIERS` in `products.ts`.
- **Suggested fix:** Replace `PLAN_MONTHLY_PRICES` with `{ standard: 149, premium: 350 }` or derive from `Object.entries(COACHING_TIERS).reduce(...)`.

---

### BUG-010
- **Severity:** Medium
- **Location:** `src/app/coach/settings/page.tsx:12,19`
- **Description:** The coach settings page's "Sign Out" button calls `POST /api/auth/logout`, which only clears `kairo_session` (the member cookie). The coach is authenticated via `coach_session` cookie (set during coach login). Clicking "Sign Out" from the coach settings page does not actually sign the coach out — the `coach_session` cookie is untouched.
- **Expected behavior:** Sign out clears `coach_session` and redirects to `/login`.
- **Actual behavior:** Sign out clears `kairo_session` (which the coach likely doesn't have) and redirects to `/login`. The coach can immediately navigate back to `/coach` and is still authenticated.
- **Root cause:** `coach/settings/page.tsx` calls the same `/api/auth/logout` endpoint used by members. This endpoint only clears `kairo_session`. (This is a symptom of BUG-002 — fixing BUG-002 would resolve this as well.)
- **Suggested fix:** Fix BUG-002 first (clear both cookies in the logout endpoint). If coach sign-out needs a dedicated endpoint, create `/api/auth/coach-logout` that calls `getClearCoachSessionCookie()`.

---

### BUG-011
- **Severity:** Medium
- **Location:** `src/app/coach/settings/page.tsx:35`
- **Description:** The coach settings page reads profile email from `member?.email`, but coaches are authenticated via `coach_session` and do not have a `Member` database record. The `useAuth()` hook fetches `/api/auth/me`, which returns `null` for an unauthenticated member session. As a result, `member?.email` will always be `undefined`, and the email field falls back to the hardcoded string `"coach"`.
- **Expected behavior:** Coach settings page shows the coach's actual email address.
- **Actual behavior:** Email field displays the string `"coach"`.
- **Root cause:** `useAuth()` is designed for member sessions. Coaches have no member profile — `/api/auth/me` will return a 401/null for coach sessions. The coach email is not accessible via this hook.
- **Suggested fix:** Create a `/api/auth/coach/me` endpoint that decodes `coach_session` and returns `{ email: env.COACH_EMAIL }` or similar. Alternatively, expose a `coachEmail` field from the auth context when the `coach_session` cookie is present.

---

### BUG-012
- **Severity:** Medium
- **Location:** `src/app/api/billing/portal/route.ts:44–51` (TODO comment at line 19)
- **Description:** The billing portal endpoint performs a Stripe customer list lookup by email on every request (`stripe.customers.list({ email, limit: 1 })`). This is slower, costs an extra Stripe API call, and can fail if a customer's email changes. The `stripeCustomerId` is already stored on the `Member` model (`webhook/route.ts:140`) but is not used here.
- **Expected behavior:** Portal session created using `member.stripeCustomerId` directly, avoiding the email lookup.
- **Actual behavior:** Every portal request does a Stripe customer search by email.
- **Root cause:** TODO comment at line 19 explicitly acknowledges this. The Member model lookup was not implemented when the portal route was built.
- **Suggested fix:** Look up `prisma.member.findUnique({ where: { email } })`, use `member.stripeCustomerId` directly for the portal session, and skip the `stripe.customers.list()` call.

---

### BUG-013
- **Severity:** Medium
- **Location:** `src/app/apply/page.tsx` (line approx. 200–230, `getTierLabel` function and billing toggle display)
- **Description:** The `getTierLabel()` function and the price display in the review step of the application form use `PLANS.find((p) => p.tier === formData.preferredTier)` to look up pricing. Since `PLANS` only contains old tier keys (`foundation`, `coaching`, `performance`, `vip`), any user who somehow passes `"standard"` or `"premium"` as a tier will see no price displayed, and `getTierLabel()` will return `undefined`.
- **Expected behavior:** Review step shows correct plan name and price for "1:1 Standard" or "1:1 Premium".
- **Actual behavior:** Price display is blank/undefined for new tier keys.
- **Root cause:** Price lookup uses `stripe-prices.ts:PLANS` which doesn't contain new tier keys. This is downstream of BUG-003.
- **Suggested fix:** Resolve BUG-003 first. Then update `getTierLabel()` and pricing display to use `COACHING_TIERS` from `products.ts`.

---

### BUG-014
- **Severity:** Medium
- **Location:** `src/services/email.ts:351`, `src/services/email.ts:533`
- **Description:** Two email templates link to `/#pricing` which no longer exists. `sendApplicationApproved` (line 351) sends approved applicants a "Choose your plan" button linking to `${APP_URL}/#pricing`. `sendLaunchEmail` (line 533) sends a "Choose Your Plan" CTA to `${APP_URL}/#pricing`. The homepage no longer has a `#pricing` section — it was replaced by `#coaching`.
- **Expected behavior:** Email CTAs link to `/#coaching`.
- **Actual behavior:** CTAs link to `/#pricing`, which scrolls nowhere (no matching anchor).
- **Root cause:** Email templates not updated during homepage restructure.
- **Suggested fix:** Replace `/#pricing` with `/#coaching` in both email templates.

---

### BUG-015
- **Severity:** Medium
- **Location:** `src/app/quiz/result/page.tsx:19`, `src/app/quiz/result/page.tsx:29–30`
- **Description:** The quiz result page imports and uses `PLANS` from `stripe-prices.ts` (the old 4-tier array) for both tier validation and plan display. The `VALID_TIERS` constant lists old tier keys. The `plan` lookup uses `PLANS.find((p) => p.tier === tier)`. The `billingInterval` toggle and `annualPrice` display are shown — but the new coaching model has no annual billing option (only monthly at $149/$350).
- **Expected behavior:** Quiz result page uses `COACHING_TIERS` from `products.ts`. Annual billing toggle is removed since there are no annual plans. New tier keys (`standard`/`premium`) are validated correctly.
- **Actual behavior:** Page shows old tier data and prices. If/when quiz engine is updated (BUG-007), an invalid tier will fall back to `PLANS[1]` ("Coaching" at $129/mo) — an incorrect and discontinued product.
- **Root cause:** `quiz/result/page.tsx` was not updated during product restructure.
- **Suggested fix:** Replace `VALID_TIERS`, `PLANS` reference, and billing toggle logic. Show fixed monthly prices from `COACHING_TIERS`. Remove `billingInterval` state and annual pricing display.

---

### BUG-016
- **Severity:** Low
- **Location:** `src/app/api/billing/portal/route.ts` (no rate limit middleware)
- **Description:** The billing portal endpoint has no rate limiting. An authenticated attacker (or a malfunctioning client) could spam this endpoint, generating many Stripe API calls and potentially exceeding Stripe rate limits. All other checkout endpoints use `checkoutLimiter` from `@/lib/rate-limit`.
- **Expected behavior:** Billing portal requests are rate-limited per IP, consistent with other checkout endpoints.
- **Actual behavior:** No rate limiting applied.
- **Root cause:** `checkoutLimiter` was not added when the portal route was implemented.
- **Suggested fix:** Import `checkoutLimiter` and add IP-based rate limiting at the top of the `POST` handler, same pattern as `checkout/founding/route.ts:33–41`.

---

### BUG-017
- **Severity:** Low
- **Location:** `src/app/coach/settings/page.tsx:15,59`
- **Description:** The WhatsApp number field on the coach settings page has a TODO comment: "Persist whatsapp to coach profile endpoint when built". The input value is captured in `useState` but never saved — there is no `onBlur` or `onSubmit` handler that POSTs the value to an API. The field appears to be functional but silently discards input on page reload.
- **Expected behavior:** Coach can save their WhatsApp number and it persists across sessions. Client detail pages use this number to pre-fill WhatsApp links (related to BUG-008).
- **Actual behavior:** WhatsApp number is captured in local state only. Any entered value is lost on navigation away.
- **Root cause:** Backend endpoint for persisting coach profile data has not been built yet. The TODO is acknowledged but not resolved.
- **Suggested fix:** Either implement the persistence endpoint, or remove the input field until it's ready to avoid misleading the coach. If keeping the field, add a disabled "Save" button and a "(coming soon)" indicator.

---

### BUG-018
- **Severity:** Low
- **Location:** `src/lib/stripe-prices.ts` (file header comment, line 8)
- **Description:** The file header comment still documents the old 4-tier pricing: "Foundation ($49/mo | $490/yr) — Templates + async check-ins", etc. This is a developer-facing documentation issue but will mislead engineers working on the codebase.
- **Expected behavior:** Comments reflect current product: "1:1 Standard ($149/mo) — Custom programming..." and "1:1 Premium ($350/mo) — Full personalization...".
- **Actual behavior:** Comment describes discontinued 4-tier product lineup.
- **Root cause:** Code comment not updated during product restructure.
- **Suggested fix:** Update the file header comment. Note that `stripe-prices.ts` PLANS array is intentionally kept for the client dashboard's "Compare Plans" accordion — add a comment explaining this.

---

### BUG-019
- **Severity:** Low
- **Location:** `src/app/quiz/result/page.tsx:83`
- **Description:** The plan card uses an inline `animation` style that duplicates the `animate-slide-up` class animation and adds a `shimmer` animation. The `style.animation` property overrides the Tailwind class `animate-slide-up`, meaning the actual keyframe animation is defined twice with the same timing, which could cause a flash of incorrect positioning before the override takes effect in some browsers.
- **Expected behavior:** Animation applies cleanly without potential override conflict.
- **Actual behavior:** `className="animate-slide-up"` and `style={{ animation: "shimmer 3s linear infinite, slide-up 0.5s ..." }}` compete — the inline style wins, but the class adds specificity noise.
- **Root cause:** The shimmer + slide-up combination on the plan card border gradient was added without removing the now-redundant Tailwind class.
- **Suggested fix:** Remove `animate-slide-up` from `className` since the inline style fully controls the animation.

---

## TEST CASES

---

### TC-001
- **Related bug:** BUG-001
- **Feature/Workflow:** Stripe webhook — template purchase (one-time payment)
- **Preconditions:** Template checkout session completed in Stripe (mode: "payment", no subscription ID). `RESEND_API_KEY` configured. Lead record exists for buyer's email.
- **Steps:**
  1. Simulate `checkout.session.completed` event with `session.mode = "payment"`, `session.subscription = null`
  2. POST to `/api/webhook` with valid Stripe signature
  3. Check response status
  4. Check `StripeEvent` table for idempotency record
  5. Check Lead table for `convertedAt` timestamp
- **Expected result:** 200 response, event recorded for idempotency, lead marked converted, admin notified. No Member upsert attempted.
- **Type:** Integration

---

### TC-002
- **Related bug:** BUG-001
- **Feature/Workflow:** Stripe webhook idempotency for template purchases
- **Preconditions:** Same event already processed (StripeEvent record exists)
- **Steps:**
  1. POST duplicate `checkout.session.completed` event to `/api/webhook`
- **Expected result:** 200 with `{ received: true, status: "already_processed" }`. No duplicate DB writes.
- **Type:** Integration

---

### TC-003
- **Related bug:** BUG-002
- **Feature/Workflow:** Coach logout clears session
- **Preconditions:** Coach is authenticated (both `kairo_session` and `coach_session` cookies set)
- **Steps:**
  1. POST to `/api/auth/logout` with both cookies present
  2. Inspect `Set-Cookie` response headers
  3. Attempt to GET `/api/coach` after logout
- **Expected result:** Both `kairo_session` and `coach_session` cleared (Max-Age=0). `/api/coach` returns 401.
- **Type:** Integration

---

### TC-004
- **Related bug:** BUG-003
- **Feature/Workflow:** Apply form — tier selection shows current products
- **Preconditions:** User navigates to `/apply`
- **Steps:**
  1. Open `/apply` page
  2. Advance to step where tier is selectable
  3. Inspect tier options displayed
- **Expected result:** Only "1:1 Standard" and "1:1 Premium" options visible. No Foundation, Coaching, Performance, VIP Elite.
- **Type:** E2E

---

### TC-005
- **Related bug:** BUG-003, BUG-004
- **Feature/Workflow:** Apply form — tier pre-selection from URL param
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/apply?tier=standard`
  2. Observe tier pre-selection in the form
  3. Submit application
- **Expected result:** "1:1 Standard" is pre-selected. Application submitted successfully with `preferredTier: "standard"` in the payload.
- **Type:** E2E

---

### TC-006
- **Related bug:** BUG-004
- **Feature/Workflow:** Application API — tier validation
- **Preconditions:** Application API running
- **Steps:**
  1. POST `/api/application` with `preferredTier: "standard"`
  2. POST `/api/application` with `preferredTier: "premium"`
  3. POST `/api/application` with `preferredTier: "foundation"` (old value)
- **Expected result:** Steps 1–2 return 200. Step 3 returns 400 validation error.
- **Type:** Integration

---

### TC-007
- **Related bug:** BUG-005
- **Feature/Workflow:** Founding member checkout — new tier keys
- **Preconditions:** `FOUNDING_MEMBER_COUPON_ID` configured. Stripe test keys active.
- **Steps:**
  1. POST `/api/checkout/founding` with `{ email: "test@test.com", tier: "standard", interval: "monthly" }`
  2. POST `/api/checkout/founding` with `tier: "foundation"` (old value)
- **Expected result:** Step 1 returns `{ url: "https://checkout.stripe.com/..." }`. Step 2 returns 400.
- **Type:** Integration

---

### TC-008
- **Related bug:** BUG-006
- **Feature/Workflow:** Welcome email content — correct plan names and prices
- **Preconditions:** `RESEND_API_KEY` not set (log-only mode)
- **Steps:**
  1. Call `sendApplicationApproved({ email, fullName, preferredTier: "standard" })`
  2. Inspect log output for tier name and plan link
  3. Call `sendLaunchEmail({ email, isFoundingMember: false })`
  4. Inspect log output for plan list and CTA URL
- **Expected result:** Tier name shows "1:1 Standard". CTA links to `/#coaching`. Launch email lists only Standard and Premium plans at correct prices.
- **Type:** Unit

---

### TC-009
- **Related bug:** BUG-007
- **Feature/Workflow:** Quiz flow end-to-end — returns valid tier for current product catalog
- **Preconditions:** None
- **Steps:**
  1. Complete quiz at `/quiz` (any combination of answers)
  2. Observe redirect to `/quiz/result?tier=X`
  3. Check that tier X is either "standard" or "premium"
  4. Click "Join the Waitlist →" CTA
- **Expected result:** Result page shows "1:1 Standard" or "1:1 Premium" card. CTA links to `/apply?tier=standard` or `/apply?tier=premium`. Billing toggle is absent (no annual billing).
- **Type:** E2E

---

### TC-010
- **Related bug:** BUG-008
- **Feature/Workflow:** Coach client detail — WhatsApp link
- **Preconditions:** Client has a phone number stored. Coach is authenticated.
- **Steps:**
  1. Navigate to `/coach/clients/{email}`
  2. Inspect WhatsApp link `href`
- **Expected result:** `href` = `https://wa.me/[digits-only-phone-number]`.
- **Type:** E2E

---

### TC-011
- **Related bug:** BUG-008
- **Feature/Workflow:** Coach client detail — WhatsApp link when no phone stored
- **Preconditions:** Client has no phone number in their profile.
- **Steps:**
  1. Navigate to `/coach/clients/{email}` for a client with no phone
  2. Inspect WhatsApp button
- **Expected result:** Button is disabled or hidden. No navigation to `https://wa.me/`.
- **Type:** E2E

---

### TC-012
- **Related bug:** BUG-009
- **Feature/Workflow:** Client account page — plan price display for new tiers
- **Preconditions:** Member authenticated with `planTier: "standard"`.
- **Steps:**
  1. Navigate to `/dashboard/account`
  2. Inspect subscription card price display
- **Expected result:** Shows "$149/mo". Founding member discount shows "$134/mo" with strikethrough "$149/mo".
- **Type:** E2E

---

### TC-013
- **Related bug:** BUG-010
- **Feature/Workflow:** Coach sign out from settings page
- **Preconditions:** Coach authenticated (`coach_session` cookie present).
- **Steps:**
  1. Navigate to `/coach/settings`
  2. Click "Sign Out"
  3. Attempt to navigate to `/coach`
- **Expected result:** Redirected to `/login`. Cannot access `/coach` after sign out.
- **Type:** E2E

---

### TC-014
- **Related bug:** BUG-014
- **Feature/Workflow:** Application approval email — CTA URL
- **Preconditions:** Application approved by coach.
- **Steps:**
  1. Trigger application approval via PATCH `/api/application`
  2. Check email HTML for CTA button `href`
- **Expected result:** CTA `href` contains `/#coaching` not `/#pricing`.
- **Type:** Integration

---

### TC-015
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Auth — member cannot access coach routes
- **Preconditions:** Member authenticated (`kairo_session` present, no `coach_session`).
- **Steps:**
  1. GET `/api/coach` with member `kairo_session` cookie
  2. Navigate to `/coach` in browser
- **Expected result:** `/api/coach` returns 401. `/coach` redirects to `/login`.
- **Type:** Integration

---

### TC-016
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Auth — unauthenticated access to dashboard is blocked
- **Preconditions:** No cookies set.
- **Steps:**
  1. Navigate directly to `/dashboard`
  2. Navigate directly to `/dashboard/account`
  3. Navigate directly to `/coach`
- **Expected result:** All three redirect to `/login`.
- **Type:** E2E

---

### TC-017
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Stripe webhook — subscription activation (happy path)
- **Preconditions:** No existing Member record for email.
- **Steps:**
  1. POST `checkout.session.completed` with valid subscription, mode: "subscription", metadata: `{ planTier: "standard", billingInterval: "monthly" }`
  2. Check Member table
  3. Check StripeEvent table
- **Expected result:** Member created with `status: "active"`, `planTier: "standard"`, `billingInterval: "monthly"`. StripeEvent record created.
- **Type:** Integration

---

### TC-018
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Stripe webhook — signature verification rejects tampered payloads
- **Preconditions:** None
- **Steps:**
  1. POST to `/api/webhook` with invalid/missing `stripe-signature` header
- **Expected result:** 400 response with `WEBHOOK_SIGNATURE_ERROR` or `WEBHOOK_ERROR`.
- **Type:** Integration

---

### TC-019
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Template shop — Coming Soon gate (all buttons non-functional)
- **Preconditions:** `COMING_SOON = true` in `TemplateShop.tsx`
- **Steps:**
  1. Navigate to homepage `/#templates`
  2. Attempt to click any product "Coming Soon" button
  3. Inspect button attributes
- **Expected result:** All buttons have `disabled` attribute, `aria-disabled="true"`, cursor not-allowed. No network request to `/api/checkout/templates`.
- **Type:** E2E

---

### TC-020
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Mobile nav — hamburger menu opens, closes, shows all links
- **Preconditions:** Viewport set to 375px width.
- **Steps:**
  1. Load homepage at 375px
  2. Click hamburger icon
  3. Verify all 5 nav links visible: Coaching, Templates, Results, About, FAQ
  4. Click a nav link
  5. Verify menu closes and page scrolls to correct section
- **Expected result:** Menu opens/closes correctly. All links present. Smooth scroll navigation works.
- **Type:** E2E

---

### TC-021
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Client dashboard — empty states render when no data
- **Preconditions:** Member authenticated with no workouts, no nutrition guides assigned.
- **Steps:**
  1. Navigate to `/dashboard/workouts`
  2. Navigate to `/dashboard/nutrition`
- **Expected result:** Both pages show empty state components (not blank screens or errors).
- **Type:** E2E

---

### TC-022
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Billing portal — authenticated member can open portal
- **Preconditions:** Member authenticated. Member has Stripe customer record.
- **Steps:**
  1. Navigate to `/dashboard/account`
  2. Click "Manage Subscription"
  3. Check for redirect to Stripe Customer Portal
- **Expected result:** Portal opens at Stripe URL. Returns to `/dashboard/account` on exit.
- **Type:** E2E

---

### TC-023
- **Related bug:** BUG-016
- **Feature/Workflow:** Billing portal — rate limiting
- **Preconditions:** Member authenticated. Rate limiter configured.
- **Steps:**
  1. POST `/api/billing/portal` 6 times in under 60 seconds from same IP
- **Expected result:** 6th request returns 429 with `Retry-After` header.
- **Type:** Integration

---

### TC-024
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Login — role-based routing
- **Preconditions:** Both a member account and the coach account exist.
- **Steps:**
  1. Login with member credentials
  2. Verify redirect to `/dashboard`
  3. Logout
  4. Login with coach credentials (COACH_EMAIL / COACH_SECRET)
  5. Verify redirect to `/coach`
- **Expected result:** Member → `/dashboard`. Coach → `/coach`. No cross-role access.
- **Type:** E2E

---

### TC-025
- **Related bug:** None (Regression coverage)
- **Feature/Workflow:** Apply CTA on coaching section — scrolls to apply
- **Preconditions:** Viewport at desktop width.
- **Steps:**
  1. Load homepage
  2. Click "Apply for 1:1 Standard" button
  3. Click "Apply for 1:1 Premium" button
- **Expected result:** Both CTAs navigate to `/apply` page (or scroll to `#apply` if on the same page). No broken links.
- **Type:** E2E

---

## Migration Risk Summary

The following items are confirmed clear:

- **No em-dashes in user-facing component copy** — grep of `.tsx` files in `src/components` found zero matches for `—` within string literals.
- **No hardcoded Stripe price IDs** — all price IDs read from `process.env.*`.
- **`COMING_SOON = true` gate is active** — template buttons are disabled.
- **BundleCard "Best Value" badge** — confirmed gradient border and positioned badge present.
- **Purchase success page** — wrapped in `<Suspense>` for `useSearchParams`, renders correctly.
- **Hero trust strip** — shows "From $149/month", correct.
- **Navigation links** — 5 links: Coaching, Templates, Results, About, FAQ. Correct.
- **Webhook signature verification** — present and correct.
- **Rate limiting on checkout routes** — present on `/api/checkout/founding` and `/api/checkout/templates`.
- **Zod validation on all API inputs** — confirmed across all reviewed routes.
- **No PII in error logs** — webhook and auth routes log without email/token data.

The following items require fixes before launch (see bugs above):

- Old tier names in: `apply/page.tsx`, `application/route.ts`, `founding/route.ts`, `quiz-engine.ts`, `quiz/result/page.tsx`, `email.ts`, `stripe-prices.ts` (comments)
- Old prices in: `dashboard/account/page.tsx`, `email.ts`
- `/#pricing` links in email templates → `/#coaching`
- Webhook `checkout.session.completed` mode check for template purchases
- Logout must clear both cookies
- WhatsApp link on client detail page requires phone number data
