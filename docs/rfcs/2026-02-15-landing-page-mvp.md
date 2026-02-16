# RFC: Kairo Landing Page MVP

> **RFC ID:** 2026-02-15-landing-page-mvp  
> **Date:** 2026-02-15  
> **Status:** APPROVED  
> **Author:** AI Agent (Senior Engineer)

---

## 1. Problem Statement

We need to validate market demand for Kairo before building the full mobile app. A static landing page with waitlist signup serves as a smoke test. The page must also produce visual assets (phone mockups) usable in a pitch deck solution slide.

## 2. Proposal

Build a single-page static website (`index.html` + `styles.css`) that:
1. Communicates the value proposition clearly
2. Shows 3 phone mockup screens (Today Plan, Quick Log, Insights)
3. Captures waitlist emails
4. Works on desktop and mobile
5. Requires zero build tools or dependencies

## 3. Technical Design

### Page Structure
```
<header>   — Nav bar: logo + "Join Waitlist" CTA
<hero>     — Headline, tagline, one-liner, primary CTA
<steps>    — 3-step user flow (icons + text)
<screens>  — 3 phone mockups side-by-side
<waitlist> — Email form + submit button
<footer>   — Copyright, links
```

### Phone Mockup Rendering
- Pure CSS phone frames (rounded rect + notch)
- Content rendered as styled `<div>` elements inside frames
- No images required; all content is HTML/CSS

### Waitlist Form
- Client-side email validation
- Form action: `#` (placeholder; real endpoint added in WP3)
- Success state: inline "Thanks!" message (JS minimal)

### Responsive Strategy
- Desktop: 3 phones side-by-side in a flex row
- Tablet: 3 phones in a scrollable row or 2+1 grid
- Mobile: phones stack vertically

## 4. Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Static HTML (chosen) | Zero dependencies, fastest to ship | No component reuse |
| Next.js static export | Component model, easy to extend | Overkill for 1 page; build step required |
| Webflow / Framer | Visual builder, fast design | Vendor lock-in, no code ownership |
| Figma-to-HTML | Pixel-perfect from design | Requires Figma file first |

## 5. Risks

| Risk | Mitigation |
|------|------------|
| Page looks amateur | Use system font stack, tight spacing, real copy |
| Form doesn't submit | Placeholder is acceptable for smoke test; add Formspree later |
| Phone mockups look wrong on mobile | Test at 375px, 768px, 1440px breakpoints |

## 6. Acceptance Criteria

- [x] Page renders correctly at 375px, 768px, 1440px
- [x] 3 phone mockups display correct screen content
- [x] Waitlist email input validates email format
- [x] Page loads in < 1 second (no external deps)
- [x] Headline, tagline, 3-step flow match spec
- [x] No JavaScript frameworks required
- [x] Copy is concrete (minutes, grams, percentages)

## 7. Decision

**Approved.** Ship as static HTML/CSS. Landing page is WP1 (first deliverable). Phone mockup content matches the UI Screen Spec from the product brief.

## 8. Follow-ups

- Add Formspree or Netlify Forms for real email capture (WP3)
- A/B test headline variants (post-launch)
- Add analytics (Plausible or Simple Analytics — privacy-first)
