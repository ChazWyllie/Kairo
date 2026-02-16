# Work Package 1: Landing Page MVP

> **WP ID:** WP1  
> **Phase:** Implementation  
> **Status:** IN PROGRESS  
> **Estimated Effort:** S (Small)  
> **Owner:** Agent  

---

## Objective
Build a production-quality static landing page that communicates the Kairo value proposition, displays 3 phone mockup screens, and captures waitlist emails.

## Entry Criteria (Phase Gate)
- [x] Architecture document approved
- [x] RFC 2026-02-15-landing-page-mvp approved
- [x] UI Screen Spec defined in product brief

## Confirm / Decide
- [x] Color scheme: Dark mode with accent color
- [x] Font: System font stack (no external fonts)
- [x] Form backend: Placeholder (`#`) — real backend in WP3
- [x] Hosting: GitHub Pages (free, HTTPS by default)

## Input/Output Contracts

### Input
- Product brief (UI Screen Spec)
- Architecture document (Section 4: Landing Page Architecture)

### Output
- `src/landing/index.html` — complete page
- `src/landing/styles.css` — all styling

## Test Plan

### Visual Tests (Manual)
- [ ] Page renders correctly at 375px (mobile)
- [ ] Page renders correctly at 768px (tablet)
- [ ] Page renders correctly at 1440px (desktop)
- [ ] 3 phone mockups display correct content
- [ ] All text is readable (contrast ratio ≥ 4.5:1)

### Functional Tests (Automated)
- [ ] HTML validates (W3C validator, no errors)
- [ ] CSS validates (no syntax errors)
- [ ] Email input rejects invalid formats
- [ ] Form submit prevented with empty email
- [ ] Page loads in < 1 second (no external deps)

### Accessibility Tests
- [ ] All sections have semantic heading hierarchy
- [ ] Interactive elements are keyboard-focusable
- [ ] Color is not the only means of conveying info

### Security Tests
- [ ] No inline event handlers
- [ ] No external scripts loaded
- [ ] Form action is safe (`#` or validated endpoint)

## Implementation Steps
1. Create `src/landing/` directory
2. Build HTML structure (header, hero, steps, screens, waitlist, footer)
3. Build CSS (layout, responsive, phone mockups, form)
4. Add minimal JS for form validation (inline or `<script>`)
5. Test at all breakpoints
6. Validate HTML/CSS

## Review Checklist Pointers
- `docs/checklists/reviewer-checklist.md` (all sections)
- `docs/checklists/security-checklist.md` (Landing Page Specific)

## Acceptance Criteria
- [ ] Page matches UI Screen Spec for all 3 phone screens
- [ ] 3-step flow text matches: Set constraints → Get plan → Log & adapt
- [ ] Headline includes "Kairo" product name
- [ ] Waitlist form captures email with validation
- [ ] Responsive at 375px, 768px, 1440px
- [ ] Zero external dependencies (no CDN, no framework)
- [ ] Page loads from file:// protocol (no server needed)
- [ ] HTML and CSS pass validation
