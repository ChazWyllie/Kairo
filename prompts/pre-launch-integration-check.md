# Kairo -- Pre-Launch Integration Check

> **Run this in Claude Code before launching.**
> This verifies that Neon DB, Stripe, and Vercel are properly connected and that every critical user flow works end-to-end.

---

## Your Role

You are a senior DevOps and full-stack engineer performing a pre-launch integration check for Kairo, a fitness coaching website. The stack is:

- **Frontend/Backend**: Next.js (App Router) deployed on Vercel
- **Database**: Neon (serverless Postgres)
- **Payments**: Stripe (subscriptions for coaching, one-time payments for templates in the future)
- **Domain**: kairo.business

Your job is to verify that every piece is connected, configured correctly, and ready for real users paying real money. Do NOT fix anything. Report what you find.

---

## Step 1: Environment Variables

Read the `.env`, `.env.local`, `.env.production`, and any Vercel-specific env config. Verify these exist and are properly set:

**Neon Database:**
- [ ] `DATABASE_URL` or equivalent Neon connection string exists
- [ ] Connection string uses `?sslmode=require` (Neon requires SSL)
- [ ] Connection string points to the correct database (not a dev/test DB)
- [ ] If using connection pooling, verify the pooled URL is used for queries and the direct URL for migrations

**Stripe:**
- [ ] `STRIPE_SECRET_KEY` exists (starts with `sk_live_` for production, `sk_test_` for testing)
- [ ] `STRIPE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists (starts with `pk_live_` or `pk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` exists (starts with `whsec_`)
- [ ] Stripe price IDs for coaching tiers exist: Standard ($149) and Premium ($350)
- [ ] **CRITICAL**: Are the keys test keys or live keys? Report which mode the site is currently in. For launch, they must be live keys.

**Vercel:**
- [ ] All environment variables listed above are also set in Vercel Dashboard (not just in local `.env`)
- [ ] Verify by checking `vercel env ls` or reading project config
- [ ] `NEXT_PUBLIC_` prefixed variables are set for both server and client
- [ ] No secrets are prefixed with `NEXT_PUBLIC_` (this would expose them to the browser)

**Report**: List every environment variable found, what it's for, whether it's set, and whether it's using test or production values. Flag any that are missing or misconfigured.

---

## Step 2: Neon Database Connectivity

Test that the app can actually talk to Neon:

- [ ] Read the database connection code (ORM, query builder, or raw SQL). What library is used? (Prisma, Drizzle, @neondatabase/serverless, pg, etc.)
- [ ] Verify the connection is established correctly for serverless (Neon requires specific connection handling for serverless environments like Vercel)
- [ ] Check if connection pooling is configured (Neon recommends pooled connections for serverless)
- [ ] Read database migration files or schema definitions. Is the schema up to date?
- [ ] Verify tables exist for: users, subscriptions/memberships, applications/waitlist, workout templates, nutrition guides, reviews, suggestions
- [ ] Check that the database client is properly closed/released after each request (connection leaks will crash the app under load)
- [ ] Verify error handling on database queries. What happens if Neon is temporarily unavailable? (This is rare but possible with serverless cold starts)

**Report**: The database library used, connection configuration, schema status, and any connection issues found.

---

## Step 3: Stripe Integration

Verify every Stripe touchpoint:

### Stripe Products and Prices
- [ ] Read the code that references Stripe price IDs. List every product/price referenced.
- [ ] Verify these match the actual products in the Stripe Dashboard (if accessible via the code or env vars)
- [ ] Confirm coaching tiers match: 1:1 Standard at $149/mo (recurring) and 1:1 Premium at $350/mo (recurring)
- [ ] Confirm template products (if configured): Workout $19, Nutrition $19, Supplements $15, Bundle $39 (one-time)
- [ ] Check that subscription prices are set to `recurring` mode and template prices to `one-time` mode

### Stripe Checkout Flow
- [ ] Find the API route that creates Checkout Sessions. Read it carefully.
- [ ] Verify `mode: "subscription"` for coaching and `mode: "payment"` for templates
- [ ] Verify `success_url` and `cancel_url` are set to correct production URLs (kairo.business, not localhost)
- [ ] Verify Apple Pay and Google Pay are not explicitly disabled
- [ ] Check: does the checkout flow collect the customer's email? (Required for account creation)

### Stripe Customer Portal
- [ ] Find the API route that creates Customer Portal sessions
- [ ] Verify it redirects to the correct return URL after the user finishes
- [ ] Verify the portal is configured in Stripe Dashboard to allow: cancel subscription, update payment method, view invoices

### Stripe Webhooks
- [ ] Find the webhook handler route (usually `/api/webhook` or `/api/stripe/webhook`)
- [ ] Verify it validates the webhook signature using `STRIPE_WEBHOOK_SECRET`
- [ ] List every event type the webhook handles. At minimum it should handle:
  - `checkout.session.completed` (new subscription or purchase)
  - `customer.subscription.updated` (plan changes)
  - `customer.subscription.deleted` (cancellation)
  - `invoice.payment_failed` (failed payment)
- [ ] For each event, trace what happens in the database. Does it update the user's subscription status in Neon?
- [ ] **CRITICAL**: Is the webhook URL registered in Stripe Dashboard? For production, it must be `https://kairo.business/api/webhook` (or whatever the actual route is), NOT a localhost URL.
- [ ] Verify the webhook route is excluded from CSRF protection and body parsing middleware (raw body is required for signature verification)

### Stripe to Neon Sync
- [ ] When a user subscribes via Stripe Checkout, does the webhook create/update a record in Neon?
- [ ] What data is stored? (Stripe customer ID, subscription ID, plan tier, status, current period end)
- [ ] When a subscription is cancelled in Stripe, does the webhook update the user's status in Neon?
- [ ] When a payment fails, does the status update to reflect this?
- [ ] Is there a risk of duplicate records if a webhook fires twice? (Webhooks should be idempotent)

**Report**: Every Stripe integration point, whether it's correctly configured, and any issues found.

---

## Step 4: Vercel Deployment Configuration

- [ ] Read `vercel.json` if it exists. Check for redirects, rewrites, headers, and function configuration.
- [ ] Read `next.config.js` / `next.config.mjs`. Check for:
  - Image domains (if loading external images)
  - Environment variable exposure
  - Redirects/rewrites
  - Any experimental features that might cause issues
- [ ] Verify the build succeeds without errors: check the build output or run `npm run build` locally
- [ ] Check if there are any API routes that might hit Vercel's function timeout (default 10s for Hobby, 60s for Pro). Long-running Stripe operations should be handled by webhooks, not synchronous routes.
- [ ] Verify the domain `kairo.business` is properly configured in Vercel with DNS pointing correctly
- [ ] Check if there are any middleware files that could interfere with API routes (especially the Stripe webhook route)

**Report**: Deployment configuration status, any timeout risks, and domain setup.

---

## Step 5: End-to-End Flow Trace

Trace these two critical flows through the entire codebase without running code. Follow every function call, every API request, every database query:

### Flow 1: New User Signs Up for 1:1 Standard Coaching

```
1. User clicks "Apply for 1:1 Standard" on marketing site
2. Scrolls to / navigates to application form
3. Fills out: name, email, biggest challenge, selects "1:1 Standard"
4. Clicks "Submit Application"
   --> What API route handles this?
   --> What data is stored in Neon? What table?
   --> What response does the user see?
5. Coach sees the application in Coach Dashboard waitlist tab
   --> How does the waitlist query work?
6. Coach approves the application
   --> What happens in the database?
   --> Is an email sent to the applicant? How?
7. User receives approval and clicks link to subscribe
   --> What creates the Stripe Checkout Session?
   --> What happens on the success URL?
8. Stripe sends webhook for checkout.session.completed
   --> What does the webhook handler do?
   --> What records are created/updated in Neon?
9. User can now log in to the Client Dashboard
   --> How is the account created? When?
   --> What role is assigned?
```

### Flow 2: Existing Client Manages Their Subscription

```
1. Client logs into dashboard
2. Goes to Account tab
3. Sees current plan (1:1 Standard, $149/mo, Active)
   --> Where does this data come from? Neon? Stripe API? Both?
4. Clicks "Manage Subscription"
   --> What API route creates the Stripe Customer Portal session?
   --> Where does it redirect back to?
5. Client cancels in Stripe Portal
6. Stripe sends webhook for customer.subscription.deleted
   --> What does the webhook update in Neon?
7. Client returns to dashboard
   --> Does their status now show "Cancelled"?
   --> Can they still access dashboard content until period end?
```

**Report**: For each flow, document exactly what happens at every step. Flag any step where the logic is missing, broken, or unclear.

---

## Step 6: Missing Pieces Checklist

Based on everything above, report on whether these common pre-launch items exist:

- [ ] **Error monitoring**: Is there a service like Sentry, LogRocket, or Vercel's built-in error tracking configured?
- [ ] **Analytics**: Is there any analytics tracking (Vercel Analytics, Google Analytics, Plausible, etc.)?
- [ ] **Email delivery**: How are transactional emails sent (welcome, application approved, download links)? Is there an email service (Resend, SendGrid, Postmark) configured, or is this not yet implemented?
- [ ] **Rate limiting**: Are API routes protected against abuse? (Especially the application form and any public endpoints)
- [ ] **CORS configuration**: Are API routes properly configured for cross-origin requests if needed?
- [ ] **Favicon and Open Graph**: Does the site have a favicon, og:image, og:title, and og:description for proper social media sharing? (Critical for Instagram link shares)
- [ ] **robots.txt and sitemap**: Are these present for SEO?
- [ ] **404 page**: Does a custom 404 page exist that matches the design system?
- [ ] **Loading/error boundaries**: Are there React error boundaries to catch runtime crashes gracefully?
- [ ] **Console cleanup**: Are there any `console.log` statements that should be removed before launch?

**Report**: What exists, what's missing, and what's critical vs nice-to-have for launch day.

---

## Output Format

Structure your report as:

### INTEGRATION STATUS REPORT

**Overall Rating**: Ready / Needs Work / Not Ready

**Environment Variables**: [status]
**Neon Database**: [status]
**Stripe Integration**: [status]
**Vercel Configuration**: [status]
**End-to-End Flows**: [status]
**Missing Pieces**: [list]

Then the detailed findings for each section, followed by a prioritized action list:

### LAUNCH BLOCKERS (Must fix before going live)
1. ...

### HIGH PRIORITY (Fix within first week)
1. ...

### NICE TO HAVE (Fix when you can)
1. ...