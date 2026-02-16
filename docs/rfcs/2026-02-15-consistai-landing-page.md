# RFC: ConsistAI Landing Page & Solution Slide

> **RFC ID:** RFC-001
> **Date:** 2026-02-15
> **Status:** Proposed
> **Author:** AI Agent (Planner)
> **Reviewers:** Human (Product Owner)

---

## Summary

Build a static landing page for **ConsistAI** that serves as a smoke test for product-market fit. The page includes a hero section, 3-step user flow, 3 phone mockups showing the core UI screens, and a waitlist email capture form. Additionally, produce a solution slide layout for pitch deck use.

---

## Motivation

Before investing in mobile app development, we need to validate:
1. Does the value proposition resonate? (Bounce rate, time on page)
2. Is there interest? (Waitlist signups)
3. Does the UI concept communicate the idea? (Qualitative feedback)

A static landing page is the cheapest possible validation artifact.

---

## Design Decisions

### D1: Static HTML/CSS — No Build Tools
**Decision:** Single `index.html` + embedded or linked `styles.css`. No npm, no bundler.
**Rationale:** Zero setup friction. Can be hosted on GitHub Pages, Netlify, or opened locally.
**Alternatives considered:**
- React/Next.js → Overkill for a static page, adds build dependency
- WordPress → Too heavy, not developer-friendly
- Figma-to-HTML export → Low code quality, hard to maintain

### D2: Dark Mode Default
**Decision:** Dark background (#0a0a0f or similar), light text, accent color (electric blue or green).
**Rationale:** Modern consumer apps (Strava, Nike Training) use dark modes. High contrast. Looks premium.
**Alternative:** Light mode with dark accents — viable but less "app-like."

### D3: CSS-Only Phone Mockups
**Decision:** Phone frames built with CSS (border-radius, box-shadow, aspect-ratio). Content inside is HTML.
**Rationale:** No external images needed. Fully responsive. Editable content.
**Alternative:** Screenshot images of a Figma mockup — but those are static and non-editable.

### D4: Waitlist Form — No Backend
**Decision:** Render a form with email input and submit button. Form `action` can point to Formspree or be a no-op.
**Rationale:** Phase A is a smoke test. Actual email collection can be added in minutes via Formspree/Mailchimp embed.

### D5: Responsive Breakpoints
**Decision:** Mobile-first. Breakpoints at 768px (tablet) and 1024px (desktop).
**Rationale:** Primary audience will share/view the link on mobile. Phone mockups stack vertically on small screens.

---

## Solution Slide Content

### Headline
**ConsistAI**

### Tagline
*"Your plan adapts. You stay consistent."*

### One-liner Value Prop
> ConsistAI generates a daily workout + nutrition plan from your real constraints — and adapts tomorrow when today doesn't go as planned.

### 3-Step Flow
1. **Set your constraints** — Time, equipment, travel, stress level
2. **Get today's plan** — Workout options + protein targets, tailored to you
3. **Log in 30 seconds** — Tomorrow's plan adapts automatically

### Recommended Slide Layout
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ConsistAI                                          │
│   "Your plan adapts. You stay consistent."           │
│                                                      │
│   One daily plan. Real constraints.                  │
│   Automatic adaptation.                              │
│                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│   │  TODAY    │  │ QUICK LOG│  │ INSIGHTS │          │
│   │  PLAN    │  │          │  │          │          │
│   │  screen  │  │  screen  │  │  screen  │          │
│   └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│   1. Set constraints  →  2. Get plan  →  3. Log     │
│                                                      │
│   "Unlike rigid plans, ConsistAI adapts daily —     │
│    so missing a day makes tomorrow smarter."         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] `index.html` renders without errors in Chrome, Safari, Firefox
- [ ] Page is responsive (375px, 768px, 1440px)
- [ ] All 3 phone mockups visible with correct content
- [ ] Hero section contains name, tagline, one-liner
- [ ] 3-step flow is visually clear
- [ ] Waitlist form has email input + submit button
- [ ] No external dependencies (CDN, npm, images)
- [ ] HTML passes basic validation
- [ ] Solution slide content documented in this RFC
- [ ] CHANGELOG updated

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Form submits without backend → user confusion | Medium | Add "Thanks! We'll be in touch." message via CSS/JS |
| Phone mockups break on small screens | High | Test at 375px width; stack vertically below 768px |
| Page looks "too simple" for investor pitch | Low | Focus on content quality and polish over features |

---

## Open Questions

1. Should the waitlist form actually submit somewhere (Formspree)? → **Default: No-op for Phase A**
2. Should we include a "Planner" mini-view? → **Default: Yes, as a small teaser section**
3. Color palette preference — electric blue or green accent? → **Default: Blue (#4f8cff)**

---

## Timeline

| Task | Effort | Status |
|------|--------|--------|
| Architecture doc | S | ✅ Done |
| RFC (this doc) | S | ✅ Done |
| Work packages | S | Next |
| Tests (HTML validation) | S | WP2 |
| Landing page implementation | M | WP3 |
| Solution slide content | S | WP4 |
| CI workflow | S | WP5 |
| README + CHANGELOG | S | WP6 |
