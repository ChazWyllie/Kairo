# Kairo -- Website Update Prompt for Claude Code

> **Copy this entire file into your Claude Code session.**
> Before making any changes, read the full existing codebase. The site is already built and live at kairo.business. The backend is wired. The design system ("Dark Precision") stays exactly the same. You are making targeted changes -- NOT rebuilding from scratch.

---

## What This Update Does

The Kairo website currently sells coaching subscriptions across 4 tiers. We're restructuring to a proven fitness creator business model with two product types:

1. **Coaching** (UPDATED) -- monthly subscriptions collapsed from 4 tiers to 2: 1:1 Standard ($149/mo) and 1:1 Premium ($350/mo). Application-based. This is the core business.
2. **Templates** (NEW, COMING SOON) -- one-time digital product purchases ($15-$39). Low-friction entry point. No account required. Marked as "Coming Soon" until products are ready.

The long-term goal is: Instagram follower buys a $15-$39 template, then the post-purchase email sequence converts them to a $149-$350/mo coaching subscriber. For now, coaching is front and center while templates are teased.

**Keep everything that works**: the Dark Precision design system, animations, layout patterns, component architecture, Chaz's about section, testimonial structure, overall aesthetic. **Only change what's listed below.**

---

## Summary of Changes

```
KEEP AS-IS:
  ✓ Design system (colors, fonts, spacing, animations, motion)
  ✓ Navigation component (update links only)
  ✓ Hero section layout and animation (update copy + CTAs only)
  ✓ Testimonials section (keep structure, update 1-2 quotes to mention templates)
  ✓ About / Coach section (untouched -- Chaz's bio is perfect)
  ✓ Footer component (update links only)
  ✓ All existing UI components (Button, ScrollReveal, etc.)
  ✓ Mobile-first approach, frosted glass nav, scroll animations

ADD:
  + Template Shop section (new section, AFTER coaching, with "Coming Soon" state)
  + ProductCard component (for individual template products)
  + BundleCard component (special treatment for the bundle)
  + GuaranteeBadge component (30-day money-back guarantee)
  + Post-purchase success page (/purchase/success) -- ready for when templates launch

CHANGE:
  ~ Hero CTAs -- primary points to coaching, secondary mentions templates
  ~ Hero trust strip -- update pricing reference to $149/month
  ~ Navigation links -- add "Coaching" and "Templates" links
  ~ How It Works -- add tab toggle (coaching default, templates second)
  ~ Pricing section -- collapse from 4 tiers to 2 coaching tiers: 1:1 Standard ($149) + 1:1 Premium ($350)
  ~ FAQ -- update questions for new product lineup + add template questions
  ~ Final CTA section -- dual-path (coaching primary + templates coming soon)
  ~ Footer links -- add Coaching, Templates

REMOVE:
  - Foundation tier ($44)
  - Performance tier ($206)
  - Monthly/Annual toggle (simplify -- show monthly only, founding price)
  - "From $49/month" references anywhere on the page
```

---

## Detailed Changes

### 1. Navigation -- UPDATE LINKS ONLY

**Current**: How It Works | Results | Pricing | FAQ + Sign In + Apply Now

**Change to**: Coaching | Templates | Results | About | FAQ + Sign In + Apply Now

- "Coaching" -- scrolls to `#coaching` section
- "Templates" -- scrolls to `#templates` section
- "Results" -- scrolls to `#testimonials` (keep existing)
- "About" -- scrolls to `#about`
- "FAQ" -- scrolls to `#faq` (keep existing)
- **"Apply Now" button** stays as the primary CTA -- links to `/apply` (coaching is the primary revenue driver)
- "Sign In" stays as-is -- `/login`

---

### 2. Hero Section -- UPDATE COPY & CTAs ONLY

Keep the layout, animation, gradient orb, and structure exactly as they are. Only change these elements:

**Rotating words above headline**: Keep the animation. Change words to: `Accountability` | `Adaptable Plans` | `Real Results` (keep existing words, they work for coaching)

**Headline**: Keep "Coaching that adapts to your real life." -- no change needed.

**Subheadline**: Change to:
> "Personalized fitness and nutrition coaching that flexes with your schedule, stress, and energy. Plus training guides you can start on your own."

**Primary CTA**: Change from "Start Your Transformation" to:
> **"Apply for Coaching"** -- scrolls to `#coaching`

**Secondary CTA**: Change from "See how it works ↓" to:
> **"Or browse our guides"** -- scrolls to `#templates`

**Trust strip**: Change from "Personalized Plans / Adapts Daily / From $49/month / No Commitment Required" to:
> "Personalized Plans / Adapts Weekly / From $149/month / Cancel Anytime"

---

### 3. How It Works -- UPDATE CONTENT

Keep the 01/02/03 step layout, timeline connector, and scroll animations. Update the content to cover both paths.

**Section heading**: Keep "Simple by design."

**Add a tab toggle** at the top of the section: two pills/tabs -- **"Coaching"** | **"Templates"** -- that switch which 3-step flow is displayed. Default to "Coaching" selected.

**Coaching path (default view):**
1. **"Apply and share your reality"** -- Keep existing copy (it's good)
2. **"Get your personalized plan"** -- Keep existing copy
3. **"Check in. It adapts."** -- Keep existing copy

**Templates path:**
1. **"Choose your guide"** -- "Pick the workout, nutrition, or supplement guide that fits your goals. Or grab the complete bundle and save."
2. **"Checkout in 30 seconds"** -- "Pay securely with Stripe. No account needed. Your guide arrives in your inbox instantly."
3. **"Start seeing results"** -- "Follow the evidence-based plan. Ready for personalized support? Upgrade to coaching anytime."

Tab switch should animate with a crossfade (200ms). Active tab gets the accent underline/highlight.

---

### 4. Template Shop -- NEW SECTION

**Insert this section after the Coaching section and before the Testimonials/Results section.**

Anchor: `id="templates"`

**Section heading**: "Training & Nutrition Guides"
**Subtext**: "Evidence-based templates built for real results. Instant download after purchase. No account required."

#### Coming Soon Overlay

**The entire template shop section should be in a "Coming Soon" state.** Product cards are visible but not purchasable:

- Display all 4 product cards as designed below, but apply a subtle visual treatment to indicate they are not yet available:
  - Reduce card opacity to ~0.7
  - Disable all "Buy Now" buttons (greyed out, `cursor: not-allowed`, no hover effect)
  - Replace "Buy Now" button text with **"Coming Soon"**
- Add a **"Coming Soon" banner** centered above the product grid:
  - Pill-shaped badge using --accent-secondary (#4FFFE0) background with dark text
  - Text: "Coming Soon"
  - Below it: "Join the waitlist to get early access and founding pricing." in text-sm, --text-secondary
  - Optional: small email capture input + "Notify Me" button (if easy to wire to your backend, otherwise just a link to `/apply`)
- When templates are ready to launch, simply remove the overlay, restore opacity, and enable the buttons

#### Product Grid

4 products displayed in a responsive grid:
- Mobile (375px): single column, cards stacked vertically
- Tablet (768px): 2×2 grid
- Desktop (1200px+): 4 across in a single row

#### Individual Product Cards (3 cards)

Use the same card style as the existing site (--bg-secondary, rounded-lg, subtle border, same hover effects). Each card contains:

**Product mockup area** (top of card):
- A styled rectangle placeholder (aspect ratio ~3:4) with a subtle gradient background (--bg-tertiary) and centered text: "Guide Preview" -- style this like a premium placeholder, not a broken image. Use an icon (📖 or a Lucide book icon) above the text.
- Mark as `{/* PLACEHOLDER: replace with real product mockup image */}`

**Card body:**
- **Category badge**: Small pill at top -- "Workout", "Nutrition", or "Supplements" -- using existing Badge component style
- **Product title**: text-lg, bold, --text-primary. e.g., "12-Week Strength Program"
- **Short description**: 1 line, text-sm, --text-secondary. e.g., "Complete periodized program with gym & home variations."
- **Price block**:
  - Original price crossed out: ~~$29~~ in --text-tertiary with `line-through`
  - Current price: **$19** in text-2xl, --text-primary, font-bold
  - "Founding Price" label in text-xs, --status-warning (#FBBF24) color
- **3 benefit lines** with accent-colored checkmarks (✓):
  - Keep these to exactly 1 line each, text-sm
  - Example for Workout: "✓ Progressive overload built in" / "✓ Gym & home variations" / "✓ Video exercise demos included"
- **"Buy Now $19" button**: Full-width, accent color (--accent-primary), bold. Uses existing Button component primary variant. On click --> creates Stripe Checkout session (mode: "payment") and redirects.

**The three individual products:**

| Card | Category | Title | Description | Price | Benefits |
|------|----------|-------|-------------|-------|----------|
| 1 | Workout | 12-Week Strength Program | Complete periodized program with gym & home variations. | ~~$29~~ --> $19 | Progressive overload built in · Gym & home variations · Exercise video demos |
| 2 | Nutrition | The Macro Guide for Busy People | Practical nutrition system with flexible meal frameworks. | ~~$29~~ --> $19 | Personalized macro calculations · Grocery lists included · Meal prep strategies |
| 3 | Supplements | The Evidence-Based Supplement Guide | What works, what doesn't, and exactly how to use it. | ~~$25~~ --> $15 | Research-backed recommendations · Dosing protocols · Brand suggestions |

#### Bundle Card (Special Treatment)

The 4th card is the **Complete Bundle** and should be visually differentiated from the individual cards:

- **"Best Value" badge**: Use the gradient accent (`linear-gradient(135deg, #E0FF4F 0%, #4FFFE0 100%)`) as the badge background with dark text. Position at top-right corner of card, slightly overlapping the edge.
- **Card border**: Use a subtle gradient border (1px, same gradient-accent) instead of the standard --border-subtle. This makes it visually pop without being garish.
- **On desktop**: Same size as other cards in the row. On mobile: consider placing it first in the stack order (before individual cards) since it's the best deal.

**Bundle card content:**
- Category badge: "Complete Bundle"
- Title: "The Complete Guide Bundle"
- Description: "All 3 guides: workout, nutrition, and supplements. Everything you need."
- Savings callout: "Save $14" in accent color, text-sm, bold. Placed between description and price
- Price: ~~$59~~ --> **$39**
- Founding Price label
- Benefit lines: "✓ 12-Week Strength Program" / "✓ Macro Guide for Busy People" / "✓ Supplement Guide" (list what's included rather than features)
- **"Buy Now $39" button**: Same accent style

#### Below the Grid

**Guarantee badge**: Centered below the product grid. Shield icon + "30-Day Money-Back Guarantee. Not satisfied? Full refund, no questions asked." in text-sm, --text-secondary. Build this as a small, elegant inline element, not a giant banner.

**Micro-testimonials** (optional): 1-2 short quotes below the guarantee. e.g., *"The meal prep guide alone saved me 5 hours a week." -- Sarah K.* Use --text-tertiary for attribution. Mark as placeholders.

---

### 5. Testimonials -- MINOR UPDATE

Keep the section exactly as-is (layout, carousel, animation, cards). Make these small content tweaks:

- **Update 1 testimonial** to reference templates: Change one of the existing quotes to something like: *"Started with the nutrition guide, upgraded to coaching after 3 weeks. Best $19 I ever spent."* -- keep the same card structure and styling.
- Keep the other 2 testimonials as-is (they're good for coaching).
- **Update the trust bar** below: "Trusted by professionals in tech, finance & healthcare" --> Keep as-is, it works.

---

### 6. Coaching Section -- REPLACE PRICING

**This replaces the entire current pricing section.** Remove all 4 existing tier cards, the monthly/annual toggle, and the section heading.

Anchor: `id="coaching"`

**New section heading**: "Ready for personalized coaching?"
**Subtext**: "Templates get you started. Coaching gets you there. Two plans, zero fluff."

**Layout**: Two cards side by side on desktop, stacked on mobile. Use the same card component style as the old pricing cards, but only two.

#### 1:1 Standard Card (Highlighted)

- **"Most Popular" badge** -- accent pill at top of card (same style as the current "Most Popular" badge on the Coaching tier -- reuse that component)
- **Title**: "1:1 Standard" in text-2xl, Cabinet Grotesk
- **Tagline**: "Custom programming, nutrition guidance, and ongoing coach support." in text-sm, --text-secondary
- **Price block**:
  - ~~$199/mo~~ crossed out in --text-tertiary
  - **$149/mo** large, bold
  - "Founding member pricing" label
- **Feature list** (accent checkmarks, same style as current):
  - Custom workout programming tailored to your goals
  - Personalized nutrition guidance with macro targets
  - Weekly or bi-weekly check-ins with your coach
  - Direct WhatsApp messaging access
  - Video form reviews (2 per month)
  - Monthly progress report
- **CTA**: "Apply for 1:1 Standard" --> scrolls to `#apply`
- **Card treatment**: Subtle accent border or glow to distinguish as the recommended option (reuse whatever highlighting the current "Coaching" card has)

#### 1:1 Premium Card

- **Title**: "1:1 Premium" in text-2xl
- **Tagline**: "Full personalization with weekly video calls and daily access to your coach." in text-sm, --text-secondary
- **Price block**:
  - ~~$450/mo~~ crossed out
  - **$350/mo** large, bold
  - "Founding member pricing" label
- **Feature list**:
  - Everything in 1:1 Standard, plus:
  - Weekly video check-ins with your coach
  - Daily WhatsApp messaging (unlimited text and video)
  - Detailed form reviews and technique feedback
  - Advanced programming and peaking protocols
  - Competition and photoshoot prep
  - Priority scheduling (book any time)
- **CTA**: "Apply for 1:1 Premium" --> scrolls to `#apply`
- **Card treatment**: Standard card (no highlight), or subtle gradient border for a premium feel. No "Most Popular" badge.

**Below the cards**: "All coaching includes a 7-day satisfaction guarantee. Upgrade or cancel anytime." in text-sm, --text-tertiary, centered.

**Remove**: The monthly/annual toggle. Show monthly pricing only with founding prices.

---

### 7. About / Coach Section -- NO CHANGES

Keep Chaz's bio, photo, credential pills, and layout exactly as they are. This section is solid.

---

### 8. FAQ Section -- UPDATE QUESTIONS

Keep the accordion component, styling, and animation exactly as they are. Replace the question list with:

1. **"What format are the guides in?"**
   --> "All guides are delivered as PDF downloads that work on any device. They're designed to be followed on your phone at the gym. You'll receive the download link instantly via email after purchase. No account needed."

2. **"How is coaching different from the templates?"**
   --> "Templates are pre-built programs that work great on their own. Coaching is fully personalized. Your workouts, nutrition, and progression are built specifically for you and adjusted bi-weekly based on your feedback and real-life circumstances. Think of templates as the starting point, coaching as the ongoing system."

3. **"What if I buy a template and then want coaching?"**
   --> "Many of our coaching clients started with templates. Your coaching program will be built fresh around your specific goals, not based on the template. The template is yours to keep either way."

4. **"What if I miss a day?"** (KEEP existing answer -- it's great)

5. **"Do I need a gym membership?"** (KEEP existing answer -- it's great)

6. **"What does the nutrition coaching include?"** (KEEP existing answer -- it's great)

7. **"Can I cancel coaching anytime?"**
   --> "Yes, no questions asked. No contracts, no minimum commitment, no cancellation fees. Cancel directly from your account anytime. Your founding member pricing locks in for as long as you stay subscribed."

8. **"Is there a money-back guarantee?"** (NEW)
   --> "Yes. Templates come with a 30-day money-back guarantee (full refund if you're not satisfied). Coaching includes a 7-day satisfaction guarantee."

9. **"Is this medical advice?"** (KEEP existing answer -- it's great)

---

### 9. Final CTA Section -- UPDATE TO DUAL PATH

**Current**: Single path pointing to waitlist/apply form.

**Change to**: Two side-by-side paths (stacked on mobile).

Keep the section heading: **"Ready to stop starting over?"**

**Left path -- Coaching (primary):**
- "Get a plan built for your life."
- Button: "Apply for Coaching" -- `/apply` (existing apply page)
- Subtext: "Founding spots available. Cancel anytime."

**Right path -- Templates (coming soon):**
- "Start with a guide on your own."
- Button: "Coming Soon" -- disabled/greyed out (or "Get Notified" linking to email capture)
- Subtext: "Training, nutrition, and supplement guides dropping soon."

Keep the existing disclaimer at the bottom: "This is fitness coaching and general nutrition guidance, not medical advice."

---

### 10. Footer -- UPDATE LINKS

**Change links to**: Coaching | Templates | About | FAQ | Apply

Add an Instagram icon/link if not already present.

Keep everything else (logo, copyright, layout).

---

### 11. Post-Purchase Success Page -- NEW PAGE

**Route**: `/purchase/success`

This page shows after someone completes a template purchase via Stripe Checkout. Stripe will redirect here with a `session_id` query parameter.

**Content:**
- Kairo logo at top
- Checkmark icon with accent color (animated -- scale in with a subtle bounce)
- **Heading**: "You're in. Check your inbox."
- **Subtext**: "Your guide is on its way to {email}. Check your spam folder if you don't see it within a few minutes."
- **Download troubleshooting**: "Didn't receive it? Email support@kairo.business"
- **Coaching upsell card** (the conversion bridge):
  - Subtle card (--bg-secondary) below the confirmation
  - "Want personalized coaching that adapts to your life?"
  - "Template buyers get priority access to founding member pricing."
  - Button: "Learn About Coaching -->" --> scrolls to `/#coaching` or links to coaching section
- **Back to home**: "← Back to Kairo" link at bottom

Match the existing Dark Precision design system. This page should feel polished, not like an afterthought.

---

### 12. Stripe Checkout Integration -- Templates

For each "Buy Now" button on template product cards:

```
Button click
  --> Call API route to create Stripe Checkout Session
  --> Parameters:
      mode: "payment" (one-time, NOT subscription)
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }]
      customer_email: (not pre-filled, Stripe collects it)
      success_url: "https://kairo.business/purchase/success?session_id={CHECKOUT_SESSION_ID}"
      cancel_url: "https://kairo.business/#templates"
      payment_method_types: ["card"]  (Apple Pay/Google Pay auto-enabled)
  --> Redirect to Stripe Checkout hosted page
```

**Create a product catalog file** at `lib/products.ts` (or wherever the project keeps constants):

```typescript
export const TEMPLATE_PRODUCTS = {
  workout: {
    name: "12-Week Strength Program",
    price: 19,
    originalPrice: 29,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_WORKOUT_PRICE_ID,
    category: "Workout",
  },
  nutrition: {
    name: "The Macro Guide for Busy People",
    price: 19,
    originalPrice: 29,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_NUTRITION_PRICE_ID,
    category: "Nutrition",
  },
  supplements: {
    name: "The Evidence-Based Supplement Guide",
    price: 15,
    originalPrice: 25,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SUPPLEMENTS_PRICE_ID,
    category: "Supplements",
  },
  bundle: {
    name: "The Complete Guide Bundle",
    price: 39,
    originalPrice: 59,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BUNDLE_PRICE_ID,
    category: "Bundle",
    savings: 14,
  },
} as const;

export const COACHING_TIERS = {
  standard: {
    name: "1:1 Standard",
    price: 149,
    originalPrice: 199,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID,
    features: [
      "Custom workout programming tailored to your goals",
      "Personalized nutrition guidance with macro targets",
      "Weekly or bi-weekly check-ins with your coach",
      "Direct WhatsApp messaging access",
      "Video form reviews (2 per month)",
      "Monthly progress report",
    ],
    highlighted: true,
  },
  premium: {
    name: "1:1 Premium",
    price: 350,
    originalPrice: 450,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    features: [
      "Everything in 1:1 Standard, plus:",
      "Weekly video check-ins with your coach",
      "Daily WhatsApp messaging (unlimited text and video)",
      "Detailed form reviews and technique feedback",
      "Advanced programming and peaking protocols",
      "Competition and photoshoot prep",
      "Priority scheduling (book any time)",
    ],
    highlighted: false,
  },
} as const;
```

**Note**: The actual Stripe Price IDs need to be created in the Stripe Dashboard and added to `.env`. The Stripe products should be created as one-time prices, not recurring. Enable Apple Pay and Google Pay in Stripe Dashboard settings.

---

## New/Modified Files

```
MODIFY (existing files):
  ~ components/Navigation.tsx     --> update nav links
  ~ components/Hero.tsx           --> update CTAs, trust strip, subheadline
  ~ components/HowItWorks.tsx     --> add tab toggle for templates/coaching paths
  ~ components/Testimonials.tsx   --> update 1 quote to mention templates
  ~ components/FAQ.tsx            --> update question list
  ~ components/Footer.tsx         --> update links
  ~ app/page.tsx                  --> add TemplateShop section, replace pricing, update final CTA

CREATE (new files):
  + components/TemplateShop.tsx         --> template shop section wrapper
  + components/ProductCard.tsx          --> individual product card
  + components/BundleCard.tsx           --> bundle card with special styling
  + components/GuaranteeBadge.tsx       --> 30-day guarantee element
  + components/CoachingSection.tsx      --> new 2-tier coaching section
  + components/CoachingCard.tsx         --> individual coaching tier card
  + components/FinalCTA.tsx             --> dual-path CTA (or modify existing)
  + components/PurchaseSuccess.tsx      --> success page content
  + app/purchase/success/page.tsx       --> success page route
  + lib/products.ts                     --> product catalog with Stripe price IDs
  + app/api/checkout/route.ts           --> API route for Stripe Checkout session (if not existing)

REMOVE / DEPRECATE:
  - Old 4-tier pricing component (or the data that feeds it)
  - Monthly/Annual toggle component
  - References to Foundation ($44) and Performance ($206) tiers
  - "From $49/month" copy anywhere in the codebase
```

---

## Section Order on Page (Final)

```
1. Navigation (sticky)
2. Hero
3. How It Works (with coaching/templates tab toggle)
4. Coaching (2 tiers: 1:1 Standard + 1:1 Premium) -- REPLACES old 4-tier pricing
5. Template Shop (Coming Soon) -- NEW
6. Testimonials (minor update)
7. About / Coach (no change)
8. FAQ (updated questions)
9. Final CTA (dual-path)
10. Footer
```

---

## What NOT To Do

- Do not rebuild the design system -- use exactly what exists
- Do not change the About/Coach section -- it's done
- Do not change the animation system -- it's done
- Do not add a cart -- every product gets a direct "Buy Now" --> Stripe Checkout
- Do not force account creation for template purchases
- Do not keep any of the 4 old tiers -- only 1:1 Standard ($149) and 1:1 Premium ($350) remain
- Do not break existing mobile responsiveness -- test at 375px after every change
- Do not change the `/apply` page or `/login` page -- those stay as-is
- Do not change existing component styling -- new components should match the established patterns
- **NEVER use em-dashes (the long dash character) in any copy, headlines, descriptions, or UI text anywhere on the site.** Em-dashes are a well-known AI writing tell and will make the site feel generated. Use commas, periods, semicolons, or restructure sentences instead. This applies to ALL text you write or modify -- including button labels, FAQ answers, section headings, descriptions, placeholder text, and code comments.

---

## Quality Checklist

- [ ] Navigation now includes "Templates" and "Coaching" links that smooth-scroll correctly
- [ ] Hero CTA says "Apply for Coaching" and links to coaching section
- [ ] Template shop shows 4 products with "Coming Soon" overlay and disabled buttons
- [ ] Template shop shows 4 products (3 individual + 1 bundle) with correct prices
- [ ] Bundle card has "Best Value" gradient badge and gradient border
- [ ] Every "Buy Now" button triggers Stripe Checkout (one-time payment mode)
- [ ] Coaching section shows exactly 2 tiers: 1:1 Standard at $149 and 1:1 Premium at $350
- [ ] "Most Popular" badge is on the 1:1 Standard card
- [ ] Old 4-tier pricing is completely gone (no Foundation, no Performance)
- [ ] Monthly/Annual toggle is removed
- [ ] FAQ includes new template questions alongside updated coaching questions
- [ ] 30-day guarantee badge appears below template products
- [ ] Final CTA has two clear paths: templates and coaching
- [ ] `/purchase/success` page exists with coaching upsell
- [ ] All founding/original prices show as crossed out
- [ ] Everything still looks and works perfectly at 375px mobile
- [ ] No regressions: About section, testimonial carousel, and animations all still work
- [ ] Zero em-dashes anywhere in the site copy