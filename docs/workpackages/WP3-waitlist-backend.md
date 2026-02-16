# Work Package 3: Waitlist Backend

> **WP ID:** WP3  
> **Phase:** Design → Implementation  
> **Status:** NOT STARTED  
> **Estimated Effort:** M (Medium)  
> **Owner:** Agent  

---

## Objective
Connect the landing page waitlist form to a real email capture backend (Formspree, Netlify Forms, or simple serverless function).

## Entry Criteria (Phase Gate)
- [ ] WP1 completed (landing page deployed)
- [ ] Hosting platform confirmed

## Confirm / Decide
- [ ] Backend choice: Formspree (free tier) vs Netlify Forms vs custom
- [ ] Email confirmation: send confirmation email? (Y/N)
- [ ] Data storage: where are emails stored?

## Input/Output Contracts

### Input
- Email string from form submission

### Output
- Success/error response to UI
- Email stored in backend

## Test Plan
- [ ] Valid email submits successfully
- [ ] Invalid email shows error message
- [ ] Duplicate email handled gracefully
- [ ] Rate limiting prevents spam (5 req/min/IP)
- [ ] Empty form submission blocked

## Implementation Steps
1. Choose and configure backend service
2. Update form `action` in `index.html`
3. Add success/error UI states
4. Test end-to-end submission
5. Add rate limiting (if custom backend)

## Acceptance Criteria
- [ ] Emails are captured and retrievable
- [ ] Form shows success message after submission
- [ ] Invalid inputs show clear error messages
- [ ] No PII leakage in logs or URLs
- [ ] Rate limiting active
