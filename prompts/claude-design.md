# Kairo Fitness — Website Design Prompt for Claude Code

> **Copy this entire file into your Claude Code session as the prompt.**
> Before starting, read the full codebase with `find app/kairo-web/src -type f` to understand the existing structure.

---

## Role & Standards

You are a senior frontend engineer and UI designer at a top design agency (think Work & Co, Instrument, or Ueno). You are redesigning **Kairo Coaching** — an adaptive fitness and nutrition coaching business. The current site at https://kairo.business/ is a placeholder. You are building the real production site.

Your work should be indistinguishable from a hand-crafted site by a world-class design studio. Every pixel, every transition, every typographic choice must be intentional. No generic templates. No Bootstrap aesthetics. No "AI slop."

---

## Brand & Product Context

**Kairo Coaching** helps busy people stay consistent with fitness and nutrition by adapting plans to their real life — schedule changes, travel, stress, low sleep. The core value proposition is: **"Your plan adapts. You stay consistent."**

- **Audience**: Working professionals (25–40), primarily reached via Instagram on mobile
- **Price point**: $50/month subscription (founding member pricing available)
- **Tone**: Confident but approachable. Expert without being intimidating. Think a calm, knowledgeable friend who happens to be an elite trainer — not a screaming gym bro
- **Competitors to outclass**: Most fitness coaching sites look cheap, cluttered, or overly "bro." Kairo should feel more like a premium tech product (Linear, Vercel, Stripe) that happens to be in fitness

---

## Design Direction — "Dark Precision"

The aesthetic is **dark, minimal, and premium** — the intersection of Apple's restraint and Linear's engineering elegance, applied to fitness.

### Color System
```
--bg-primary:        #0A0A0A    (near-black base)
--bg-secondary:      #111111    (elevated surfaces, cards)
--bg-tertiary:       #1A1A1A    (subtle section differentiation)
--border-subtle:     #222222    (dividers, card borders)
--border-hover:      #333333    (interactive border states)

--text-primary:      #F5F5F5    (headlines, primary content)
--text-secondary:    #A0A0A0    (body copy, descriptions)
--text-tertiary:     #666666    (captions, metadata, labels)

--accent-primary:    #E0FF4F    (electric lime — primary CTAs, highlights)
--accent-glow:       rgba(224, 255, 79, 0.15)  (subtle glow effects behind accent elements)
--accent-secondary:  #4FFFE0    (teal — secondary accent, used sparingly for variety)

--gradient-accent:   linear-gradient(135deg, #E0FF4F 0%, #4FFFE0 100%)  (used very sparingly for special moments)
```

**Rules**: The accent color (#E0FF4F electric lime) is used ONLY for primary CTAs, key highlights, and active states. It should feel like a precise surgical highlight — not splashed everywhere. When it appears, it should draw the eye instantly because the rest of the palette is so restrained.

### Typography
Use **two fonts only**:

1. **Display / Headlines**: `"Cabinet Grotesk"` (from Fontshare — free, high-quality) — bold, geometric, confident. Use in weights 700–900. If unavailable, fall back to `"Satoshi"` or `"General Sans"` from Fontshare.
2. **Body / UI**: `"Inter"` (variable weight) — clean, highly readable at small sizes on mobile. Use weights 400 and 500 only.

```
--font-display:      'Cabinet Grotesk', sans-serif;
--font-body:         'Inter', sans-serif;

--text-xs:           0.75rem / 1.5;
--text-sm:           0.875rem / 1.6;
--text-base:         1rem / 1.7;
--text-lg:           1.125rem / 1.6;
--text-xl:           1.25rem / 1.5;
--text-2xl:          1.5rem / 1.3;
--text-3xl:          2rem / 1.2;
--text-4xl:          2.5rem / 1.1;
--text-5xl:          3.5rem / 1.05;

Letter-spacing for headlines: -0.02em to -0.04em (tighter = more premium)
Letter-spacing for body: 0 to 0.01em
Letter-spacing for labels/caps: 0.05em to 0.1em
```

### Spacing System (8px base grid)
```
--space-1: 0.25rem    (4px)
--space-2: 0.5rem     (8px)
--space-3: 0.75rem    (12px)
--space-4: 1rem       (16px)
--space-5: 1.5rem     (24px)
--space-6: 2rem       (32px)
--space-7: 3rem       (48px)
--space-8: 4rem       (64px)
--space-9: 6rem       (96px)
--space-10: 8rem      (128px)

Section vertical padding: --space-9 (mobile) / --space-10 (desktop)
Max content width: 1200px
Content padding (mobile): 20px sides
Content padding (desktop): 40px sides
```

### Border Radius
```
--radius-sm: 8px      (buttons, small elements)
--radius-md: 12px     (cards, inputs)
--radius-lg: 16px     (large cards, sections)
--radius-full: 9999px (pills, tags)
```

---

## Animation & Motion System

Motion should feel **buttery smooth and intentional** — like Linear or Stripe, not like a WordPress theme.

### Core Principles
- Every animation uses `cubic-bezier(0.16, 1, 0.3, 1)` (smooth overshoot) or `cubic-bezier(0.33, 1, 0.68, 1)` (smooth ease-out)
- Default duration: 600ms for entrances, 200ms for hover states, 300ms for transitions
- **Stagger pattern**: When multiple elements enter, stagger by 80–120ms each
- **Scroll-triggered reveals**: Elements fade up (translate 30px → 0) + opacity (0 → 1) as they enter the viewport using Intersection Observer
- No animation on elements already in the viewport on page load — only on scroll

### Specific Animations
1. **Hero text**: Words or lines reveal with a staggered upward slide + fade, 100ms delay between each line
2. **Cards**: Subtle scale(0.98) → scale(1) + opacity on scroll entry
3. **CTA buttons**: On hover, background fills with accent color via a left-to-right wipe (not instant), text color inverts. Subtle `box-shadow: 0 0 30px var(--accent-glow)` on hover
4. **Section transitions**: Soft fade between sections as you scroll. Optional: subtle parallax on decorative elements (keep it tasteful, max 20px offset)
5. **Numbers/stats**: Count-up animation when they enter viewport
6. **Navigation**: Frosted glass effect (`backdrop-filter: blur(12px)`) + border-bottom that appears on scroll
7. **Mobile menu**: Full-screen overlay that slides in from right, menu items stagger in from bottom
8. **Testimonial cards**: Gentle auto-scroll carousel on mobile, grid on desktop

### Micro-interactions
- Buttons: slight `translateY(-1px)` on hover
- Links: underline animates from left to right on hover
- Form inputs: border-color transitions to accent on focus, label floats up
- Cards: subtle border-color brightening on hover

---

## Page Structure & Sections

Build this as a **single-page scrolling site** with smooth-scroll navigation anchors. Each section below should feel like a distinct "room" you enter as you scroll.

### 1. Navigation (Sticky)
- **Mobile**: Logo (left), hamburger menu (right). Hamburger is a custom animated icon (two lines that morph to X)
- **Desktop**: Logo (left), nav links (center), "Apply Now" CTA button (right)
- Background: transparent at top, frosted glass on scroll
- Logo: "KAIRO" in Cabinet Grotesk, bold, letter-spacing: 0.15em. Clean wordmark, no icon needed
- Nav links: How It Works, Pricing, Results, About, FAQ
- The "Apply Now" button is always visible — this is the primary conversion action

### 2. Hero Section
- **Layout**: Full viewport height (100svh). Content vertically centered.
- **Headline**: "Coaching that adapts to your real life." — large (text-5xl mobile, bigger desktop), Cabinet Grotesk Black, tight letter-spacing
- **Subheadline**: "Expert fitness & nutrition coaching that flexes with your schedule, stress, and energy — so you actually stay consistent." — text-lg, text-secondary color, max-width 540px
- **CTA**: Primary button "Start Your Transformation" → links to apply section. Secondary text link below: "See how it works ↓"
- **Visual accent**: A subtle gradient orb or mesh in the background (accent colors at very low opacity, 5-10%) that slowly drifts/breathes. NOT a static blob — it should have gentle, almost imperceptible movement
- **Trust strip below hero**: A single horizontal line of micro-proof: "✦ Personalized Plans  ✦  Adapts Daily  ✦  $50/month  ✦  No Commitment Required" — in text-tertiary, text-xs, caps, tracked out

### 3. "How It Works" Section
- **Heading**: "Simple by design." or "How Kairo Works"
- **Layout**: 3-step vertical flow on mobile, horizontal on desktop
- **Steps**:
  1. **Share Your Reality** — "Tell us your schedule, equipment access, stress level, and goals. Takes 2 minutes."
  2. **Get Your Adaptive Plan** — "Receive a daily workout + nutrition guidance that fits your actual day — not an idealized one."
  3. **Log in 30 Seconds, Repeat** — "Quick daily check-in. Tomorrow's plan auto-adjusts based on today. Consistency compounds."
- **Design**: Each step has a large step number (like "01") in a faded accent color, a short title in bold, and description in text-secondary. Connected by a subtle vertical line (mobile) or horizontal line (desktop) — like a timeline
- **Animation**: Steps reveal one by one on scroll with stagger

### 4. Results / Testimonials Section
- **Heading**: "Real people. Real consistency."
- **Layout**: Scrollable horizontal card carousel on mobile, 2-column offset grid on desktop
- **Card design**: Dark card (--bg-secondary), subtle border, rounded-lg. Contains:
  - Pull quote in text-lg italic
  - Name + context (e.g., "Sarah K. — Software Engineer, Mom of 2") in text-sm, text-tertiary
  - Optional: A small metric like "12 weeks consistent" with accent highlight
- **Use placeholder testimonials** since this is pre-launch. Mark them clearly in the code as `{/* PLACEHOLDER — replace with real testimonials */}`
- **Social proof bar** below testimonials: "Trusted by professionals at [generic placeholder logos or text like 'tech, finance, healthcare']" — keep subtle

### 5. Pricing Section
- **Heading**: "One plan. Everything included."
- **Design**: Single pricing card, centered, elevated with a subtle glow or border accent. NOT a 3-tier comparison grid — Kairo has one plan.
- **Card content**:
  - Price: "$50" large + "/month" small. Below: "Founding member pricing" with a line-through on a higher price like "$75" (creates urgency)
  - Feature list (use checkmarks with accent color):
    - Personalized workout plans
    - Nutrition guidance & protein targets
    - Daily plan adaptation
    - 30-second logging system
    - Direct coach access
    - Cancel anytime
  - CTA button: "Join the Waitlist" (primary accent style)
- **Design note**: The card should feel like a floating, premium object — subtle shadow, maybe a very faint gradient border (1px border using background-clip trick with the gradient-accent)

### 6. About / Coach Section
- **Heading**: "Meet your coach." or "The person behind the plan."
- **Layout**: Asymmetric — text on one side, photo placeholder on the other (with a styled placeholder frame, like a rounded rectangle with a subtle accent border)
- **Content**: Brief, warm, credible bio. Something like: "I built Kairo because I got tired of programs that assume you have perfect days. Life is messy. Your fitness plan should work with that, not against it."
- **Credentials below bio**: In a horizontal row of small pills/tags: "NASM Certified", "10+ Years Experience", "500+ Clients" etc. (use placeholders, mark in code)
- **Photo**: Use a styled placeholder box with text "Coach Photo" — NOT a stock photo

### 7. FAQ Section
- **Heading**: "Questions? Answered."
- **Design**: Accordion-style. Clean, minimal. Each question is a row with the question text and a "+" icon that rotates to "×" on open
- **Animation**: Smooth height transition on open/close (use max-height or grid trick, not janky)
- **Questions to include** (write the answers too — keep them concise and confident):
  1. "How is this different from a generic workout app?"
  2. "What if I miss a day?"
  3. "Do I need a gym membership?"
  4. "What does the nutrition coaching include?"
  5. "Can I cancel anytime?"
  6. "Is this medical advice?"
- **Style**: Questions in --text-primary, answers in --text-secondary. Subtle border-bottom between items

### 8. Apply / Waitlist Section (Final CTA)
- **Heading**: "Ready to stop starting over?" or "Your plan is waiting."
- **Design**: Full-width section with a subtle background differentiation (maybe --bg-tertiary or a very subtle gradient). This should feel like a "destination" at the bottom of the page
- **Form fields**: Name, Email, "What's your biggest fitness challenge?" (short textarea). Styled with the design system — dark inputs, accent border on focus, floating labels
- **Submit button**: Full-width on mobile, "Join the Waitlist — Limited Founding Spots"
- **Below form**: Small text: "No commitment required. No spam. Just early access + founding member pricing."
- **Disclaimer**: "This is fitness coaching and general nutrition guidance, not medical advice." in text-tertiary, text-xs

### 9. Footer
- Minimal. Logo, copyright, and links: Privacy, Terms, Instagram icon
- "© 2026 Kairo Coaching. All rights reserved."
- Subtle top border

---

## Mobile-First Requirements (Critical)

**This site will be viewed primarily on mobile via Instagram link-in-bio.** Every design decision must prioritize the mobile experience.

- Design at **375px width first**, then scale up to desktop (1440px)
- Touch targets: minimum 44×44px
- No hover-dependent interactions on mobile — everything must work with tap
- Font sizes: body text minimum 16px on mobile (prevents iOS zoom)
- Form inputs: minimum 16px font-size (prevents iOS auto-zoom)
- Hero section: must look stunning at 375×812 (iPhone viewport). The headline + subhead + CTA should all be visible without scrolling
- Test the hamburger menu interaction carefully — it should feel native-app quality
- Horizontal scroll carousels should have momentum scrolling (`-webkit-overflow-scrolling: touch`, `scroll-snap-type: x mandatory`)
- Buttons: full-width on mobile, auto-width on desktop
- Bottom safe area padding on iOS: `env(safe-area-inset-bottom)`

---

## Technical Requirements

- **Stack**: Use the existing Next.js + React + TypeScript setup in `app/kairo-web/`
- **Styling**: Tailwind CSS with custom CSS variables defined in a globals.css. Use Tailwind for layout/spacing utilities but define the design tokens as CSS custom properties
- **Fonts**: Load Cabinet Grotesk from Fontshare CDN and Inter from Google Fonts via `next/font` for performance
- **Animations**: Use Framer Motion for scroll-triggered reveals and complex animations. Use CSS transitions for simple hover states
- **No external UI libraries** (no shadcn, no Chakra, no MUI) — everything is custom-built to match the design system exactly
- **Accessibility**: Proper semantic HTML, ARIA labels on interactive elements, focus-visible styles, reduced-motion media query that disables animations
- **Performance**: Lazy load below-fold content, optimize images, minimize JS bundle. Target Lighthouse score 95+
- **SEO**: Proper meta tags, Open Graph tags for social sharing, semantic heading hierarchy (single H1, logical H2/H3 structure)

---

## File Structure
```
app/kairo-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          (root layout with fonts, metadata)
│   │   ├── page.tsx            (main page composing all sections)
│   │   └── globals.css         (CSS variables, base styles, font imports)
│   ├── components/
│   │   ├── Navigation.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Pricing.tsx
│   │   ├── About.tsx
│   │   ├── FAQ.tsx
│   │   ├── Apply.tsx           (waitlist form)
│   │   ├── Footer.tsx
│   │   └── ui/
│   │       ├── Button.tsx      (reusable button with variants)
│   │       ├── SectionHeading.tsx
│   │       ├── ScrollReveal.tsx (Framer Motion scroll wrapper)
│   │       └── GradientOrb.tsx (background decoration)
│   └── lib/
│       └── animations.ts       (shared Framer Motion variants)
```

---

## What NOT To Do

- ❌ Don't use stock photos or placeholder images from Unsplash — use styled empty frames with text labels
- ❌ Don't use gradients on text (except very sparingly for one decorative moment)
- ❌ Don't make it look like every other fitness site — no neon green on black with a muscular person flexing
- ❌ Don't use more than 2 font families
- ❌ Don't over-animate — motion should enhance, not distract. If in doubt, do less
- ❌ Don't use carousels that auto-play without user control
- ❌ Don't put content behind unnecessary interactions (no "click to reveal" on essential info)
- ❌ Don't use low-contrast text — maintain WCAG AA minimum
- ❌ Don't use `px` for font sizes — use `rem`
- ❌ Don't forget the mobile experience is the PRIMARY experience

---

## Quality Checklist (Verify Before Submitting)

- [ ] Site looks premium and intentional on iPhone 14/15 (375px width)
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Navigation works flawlessly on mobile (menu open/close, smooth scroll to sections)
- [ ] Form inputs don't trigger unwanted iOS zoom (min 16px font-size)
- [ ] CTA buttons are always reachable and obvious
- [ ] Color contrast passes WCAG AA on all text
- [ ] Page loads fast — no layout shift, fonts load smoothly
- [ ] Scroll behavior is smooth and performant (no jank)
- [ ] Every section tells a story and has a clear purpose
- [ ] The overall impression is: "This doesn't look like it was made by AI"