# Kairo -- Security Audit

> **Run this in Claude Code after the integration check.**
> This is an audit-only pass. Do not fix anything. Report every finding.

---

## Your Role

You are a senior application security engineer performing a pre-launch security audit for Kairo, a fitness coaching web application that handles user accounts, payment processing, and personal data. The stack is Next.js on Vercel, Neon (Postgres), and Stripe.

This is a business that collects: names, email addresses, fitness goals, payment information (via Stripe, not stored directly), and coaching-related personal data. A security breach would damage trust and potentially violate data protection regulations.

Be thorough. Think like an attacker trying to exploit this application.

---

## 1. Authentication and Session Security

- [ ] What authentication library/method is used? (NextAuth, custom JWT, session cookies, etc.)
- [ ] Are passwords hashed before storing in Neon? What hashing algorithm? (bcrypt with 10+ rounds is the minimum. MD5/SHA-256 without salt is not acceptable.)
- [ ] Are sessions/tokens signed with a strong secret? Is the secret in an environment variable (not hardcoded)?
- [ ] What is the session/token expiration time? Is it reasonable? (30 days max for "remember me", 24 hours otherwise)
- [ ] Are tokens stored in httpOnly cookies (safe) or localStorage (vulnerable to XSS)?
- [ ] Is there CSRF protection on state-changing requests?
- [ ] Is there brute-force protection on the login endpoint? (Rate limiting, account lockout, or CAPTCHA)
- [ ] Can a user enumerate valid email addresses through the login or forgot-password flow? (Error messages should not reveal whether an email exists)
- [ ] Are there any hardcoded test accounts, backdoor passwords, or debug login shortcuts in the code?

**Report**: Authentication method, password storage, session management, and any vulnerabilities found.

---

## 2. Authorization and Access Control

- [ ] How are roles (client vs coach) determined and enforced? Is it a database field, JWT claim, or middleware check?
- [ ] Are all `/coach/*` routes protected by middleware that checks for coach role?
- [ ] Are all `/dashboard/*` routes protected by middleware that checks for authenticated user?
- [ ] **Test each API route**: Can an authenticated client call coach-only API endpoints? (e.g., approve a waitlist application, view all clients, create workout templates)
- [ ] Can a client access another client's data by changing an ID in the URL? (e.g., `/dashboard/workouts/[id]` where `[id]` belongs to someone else)
- [ ] Can a coach view/modify data for clients that don't belong to them? (Relevant if you ever have multiple coaches)
- [ ] Are there any API routes that are completely unprotected (no auth check at all)?
- [ ] Is the Stripe Customer Portal session created with the correct customer ID for the logged-in user? (A user should not be able to manage someone else's subscription)

**Report**: Every route and API endpoint with its authorization status. Flag any that are unprotected or improperly scoped.

---

## 3. Input Validation and Injection

- [ ] **SQL Injection**: Are database queries parameterized? Search for any raw SQL string concatenation. If using an ORM (Prisma, Drizzle), this is usually handled, but check for any `.raw()` or `$queryRaw` calls.
- [ ] **XSS (Cross-Site Scripting)**: Is user input sanitized before rendering? Check:
  - Application form fields (name, email, "biggest challenge" textarea)
  - Review/suggestion text
  - Coach notes on clients
  - Workout template names, exercise names
  - Nutrition guide content (especially if using markdown rendering)
- [ ] **CSRF**: Are state-changing API routes (POST, PUT, DELETE) protected against cross-site request forgery?
- [ ] **Email validation**: Is the email field validated on both client and server? Can someone submit a malformed email?
- [ ] **File upload**: Are there any file upload endpoints? If so, are file types validated? Are files scanned? Is there a size limit?
- [ ] **URL injection**: Are any redirect URLs constructed from user input? (Open redirect vulnerability)
- [ ] **Header injection**: Are any HTTP headers set from user input?

**Report**: Every input point in the application and whether it's properly validated/sanitized.

---

## 4. Stripe Security

- [ ] **Secret key exposure**: Is `STRIPE_SECRET_KEY` only used server-side? Search for it in any client-side code or `NEXT_PUBLIC_` variable. This would be a critical vulnerability.
- [ ] **Webhook signature verification**: Does the webhook handler verify the Stripe signature on every request? Without this, anyone can send fake webhook events to your endpoint.
- [ ] **Webhook endpoint exposure**: Is the webhook route accessible without authentication? (It should be, but only validated via Stripe signature)
- [ ] **Checkout session validation**: On the success page, is the `session_id` validated server-side before granting access or showing confirmation? (A user could fabricate a session_id in the URL)
- [ ] **Price manipulation**: Can a user modify the price or product before checkout? (Prices should be determined server-side by Stripe Price IDs, never sent from the client)
- [ ] **Subscription status trust**: Does the app trust Stripe as the source of truth for subscription status, or could a user manipulate their local status to gain access?
- [ ] **PCI compliance**: Confirm that no credit card numbers, CVVs, or full card details are ever sent to or stored on your server. All payment data should flow directly to Stripe via Checkout or Elements.

**Report**: Stripe security posture and any risks found.

---

## 5. Data Exposure

- [ ] **API response over-fetching**: Do any API routes return more data than the client needs? (e.g., returning all user fields including password hash when only name and email are needed)
- [ ] **Client-side data leaks**: Open browser DevTools Network tab perspective: do any API responses contain sensitive data that shouldn't be visible to the user? (Other users' emails, internal IDs, admin flags)
- [ ] **Error message leaks**: Do error responses reveal internal details (stack traces, database table names, query text, file paths)?
- [ ] **Console logging**: Are there any `console.log` statements that output sensitive data (tokens, passwords, full user objects)?
- [ ] **Source maps**: Are source maps exposed in production? (They reveal your original source code)
- [ ] **Git exposure**: Is there a `.env` file committed to the Git repository? Check `.gitignore` for proper exclusions.
- [ ] **Package vulnerabilities**: Run `npm audit` (or read package-lock.json) and report any known vulnerabilities in dependencies.

**Report**: Every instance of data exposure risk found.

---

## 6. API Route Security

List every API route in the project and verify each one:

| Route | Method | Auth Required? | Auth Implemented? | Input Validated? | Rate Limited? |
|-------|--------|---------------|-------------------|-----------------|---------------|
| /api/... | GET/POST | Yes/No | Yes/No | Yes/No | Yes/No |

For each route, also check:
- [ ] Is the HTTP method restricted? (A GET endpoint should not accept POST, etc.)
- [ ] Are query parameters and request body validated?
- [ ] Is there proper error handling that doesn't leak information?
- [ ] Could this endpoint be abused for spam, enumeration, or denial of service?

**Report**: Complete API route inventory with security status for each.

---

## 7. Infrastructure and Configuration

- [ ] **HTTPS**: Is the site served over HTTPS only? Does Vercel handle this automatically?
- [ ] **Security headers**: Check for these headers (Vercel may set some automatically, others need manual config):
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` or `SAMEORIGIN`
  - `X-XSS-Protection`
  - `Content-Security-Policy` (CSP)
  - `Referrer-Policy`
- [ ] **CORS**: Are CORS headers set? If so, is the allowed origin restricted to kairo.business, or is it wildcard (`*`)?
- [ ] **Vercel function secrets**: Are environment variables set as "sensitive" in Vercel (encrypted at rest)?
- [ ] **Neon connection security**: Is the database connection using SSL? Is the database password strong? Is the database accessible only from Vercel's IP range, or is it open to the internet?
- [ ] **Next.js configuration**: Are there any experimental features enabled that could introduce vulnerabilities?
- [ ] **Dependency versions**: Are Next.js, React, and critical packages on supported versions with security patches?

**Report**: Infrastructure security posture and any missing protections.

---

## 8. Privacy and Data Protection

- [ ] **Data collection inventory**: List every piece of personal data collected (name, email, fitness challenges, goals, coaching notes, reviews, suggestions, payment references)
- [ ] **Data storage**: Where is each piece stored? (Neon tables, Stripe, logs)
- [ ] **Data retention**: Is there a mechanism to delete user data on request? (Account deletion flow)
- [ ] **Privacy policy**: Does the site have a privacy policy page? Does it accurately describe what data is collected and how it's used?
- [ ] **Terms of service**: Does the site have terms of service?
- [ ] **Cookie consent**: Does the site set cookies beyond essential session cookies? If so, is there a consent banner?
- [ ] **Email marketing consent**: If template purchasers are added to a mailing list, is there an explicit opt-in at checkout?
- [ ] **Medical disclaimer**: Is the "This is fitness coaching, not medical advice" disclaimer present on the marketing site, application form, and dashboard?
- [ ] **Data minimization**: Is the application collecting only the data it needs? Are there any fields that collect unnecessary personal information?

**Report**: Data handling practices and any compliance concerns.

---

## Output Format

### SECURITY AUDIT REPORT

**Overall Risk Level**: Low / Medium / High / Critical

For each finding:

- **ID**: SEC-001, SEC-002, etc.
- **Severity**: Critical / High / Medium / Low / Informational
  - Critical: can be exploited immediately for data access, payment fraud, or account takeover
  - High: significant vulnerability that should be fixed before launch
  - Medium: real risk but requires specific conditions to exploit
  - Low: minor issue or hardening recommendation
  - Informational: not a vulnerability but worth noting
- **Category**: Authentication / Authorization / Injection / Stripe / Data Exposure / API / Infrastructure / Privacy
- **Description**: What the issue is
- **Risk**: What could happen if exploited
- **Location**: File path(s) and line number(s)
- **Recommendation**: How to fix it

Sort by severity (Critical first).

Then provide a prioritized summary:

### MUST FIX BEFORE LAUNCH
1. ...

### FIX WITHIN FIRST WEEK
1. ...

### HARDENING (Do when possible)
1. ...