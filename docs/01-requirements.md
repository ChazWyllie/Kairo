# Kairo Coaching — Requirements

> **Version:** 1.1
> **Last Updated:** 2026-03-05

---

## 1. Functional Requirements (MVP)

### FR-1: Landing Page
- Clear offer and CTA (Instagram bio link destination)
- Email capture with format validation
- Responsive: 375px (mobile), 768px (tablet), 1440px (desktop)

### FR-2: Stripe Subscription Checkout
- Stripe Checkout session for $50/mo subscription
- Redirect to success/cancel pages

### FR-3: Webhook-Verified Member Activation
- Webhook verifies payment events (signature verification)
- Activates member record on successful payment
- Idempotent processing (no duplicate activations)

### FR-4: Admin Notification
- Admin email notification on successful activation

### FR-5: Minimal Member Record
- Store: email, phone (optional), Stripe customer ID, subscription ID, status
- No sensitive health data

---

## 2. Functional Requirements (Post-MVP)

### FR-6: Constraint Input
- Users can set: time available, equipment, context toggles (travel, stress, low sleep)
- Users can set preferences: goal (fat loss / muscle / maintenance), experience level
- Optional: injury limitations, no-jumping flag
- Time values: 15, 20, 30, 45, 60 minutes

### FR-7: Daily Plan Generation
- System generates ≥ 2 workout alternatives per day
- Workout duration ≤ `timeAvailable`
- Equipment constraint is hard (never exceed available)
- Nutrition targets: protein goal (g), meal count, water goal (L)
- Context toggles reduce intensity/volume by 20–40%

### FR-8: Quick Logging
- Checklist UI: workout, meals (1–3), water, steps
- "I missed" button with optional reason
- Completion time target: ≤ 30 seconds

### FR-9: Auto-Adaptation
- Missed day → reduce tomorrow's volume by 20%
- Streak ≥ 3 → unlock progressive overload
- Adherence < 50% for 3 consecutive days → suggest reset week
- Never reset streaks punitively

### FR-10: Insights
- Day streak (consecutive logged days)
- Weekly adherence percentage
- Workouts completed this week
- Next best action recommendation

---

## 3. Non-Functional Requirements

### NFR-1: Security
- Secure-by-default (OWASP-aligned controls)
- No inline event handlers
- Webhook signature verification
- HTTPS enforced in production
- See [03 — Threat Model](03-threat-model.md) and [07 — Security Controls](07-security-controls.md)

### NFR-2: Testing & CI
- Automated tests and CI
- All code changes require tests

### NFR-3: Deployability
- Deployable MVP with environment-based config
- Zero external dependencies for landing page

### NFR-4: Performance
| Metric | Target |
|--------|--------|
| Page load (landing) | < 1 second |
| Checkout redirect | < 2 seconds |
| Webhook processing | < 500ms |

### NFR-5: Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML with proper heading hierarchy
- Keyboard navigable
- Color contrast ratio ≥ 4.5:1

### NFR-6: Compatibility
- Browsers: Chrome, Safari, Firefox (latest 2 versions)
- Landing page works from `file://` protocol

---

## 4. Constraints

- MVP scope: landing → checkout → webhook → member activation → notify
- No user accounts for MVP (Stripe handles identity)
- No ML — rule-based engine only (post-MVP)
- Static landing page — no build tools

---

## 5. Acceptance Criteria Summary

See individual work packages in `docs/workpackages/` for detailed acceptance criteria.
