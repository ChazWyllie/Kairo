Kairo Landing Page Redesign -- Claude Code Prompt

Project Overview
Redesign and rebuild the Kairo fitness app landing page as a production-grade Next.js site. Kairo is a fitness app that adapts daily workout and nutrition plans based on real-life constraints (time, travel, stress, sleep). The site must feel like it belongs alongside products like Apple Fitness, Linear, and Nike Training Club -- premium, sharp, athletic, and trusted.
The existing site lives at: https://chazwyllie.github.io/Kairo/landing/index.html
Use it as a reference for content and copy only. The design should be rebuilt from scratch.

Tech Stack

Framework: Next.js 14+ with App Router
Styling: Tailwind CSS v3 with a custom design token layer (CSS variables)
Animations: Framer Motion for scroll-triggered reveals, page transitions, and phone mockup interactions
Fonts: Load via next/font -- use a pairing such as Geist (headings, UI labels) + Satoshi or DM Sans (body, subtext). Avoid Inter, Roboto, Arial, and Space Grotesk entirely.
Icons: Lucide React
No em dashes anywhere in the codebase or copy -- use a double hyphen (--) or restructure the sentence instead


Site Structure
Build the following pages with a shared layout (navbar + footer):
RoutePage/Landing page (main focus)/how-it-worksExpanded explanation of the three-step flow/featuresDeep dive into Today, Log, and Insights screens/waitlistDedicated waitlist signup page
All pages share the same navbar and footer. Sub-pages can be minimal -- clean, single-section pages are fine. The landing page is the primary deliverable.

Visual Identity
Palette
css--bg-primary: #0a0a0a;        /* near-black base */
--bg-secondary: #111111;       /* card/surface layer */
--bg-elevated: #1a1a1a;        /* elevated panels */
--border: rgba(255,255,255,0.07);
--text-primary: #f5f5f5;
--text-secondary: #888888;
--text-muted: #444444;
--accent: #22c55e;             /* Kairo green -- primary CTA, highlights */
--accent-glow: rgba(34,197,94,0.15);
--accent-dim: #16a34a;
--destructive: #ef4444;        /* only for "missed" states in mockups */
Tone
The design should balance three references simultaneously:

Apple: Generous whitespace, precise typography, cinematic product photography feel
Linear / Vercel: Dark surfaces, razor-sharp borders, subtle grid textures, developer confidence
Nike / Whoop: Athletic urgency, bold headline weight, performance credibility

The result should feel like a premium fitness tool built by engineers who care about design -- not a generic wellness app.
Do Not Use

Purple gradients
Bubbly card shadows
Pastel tones
Stock fitness photography placeholders
Rounded pill buttons everywhere (one CTA can be pill-shaped, others should use sharp or 6px radius)


Typography Rules

Hero headline: 72--96px, weight 800--900, tight letter-spacing (-0.03em to -0.04em), line-height 1.05
Section headings: 40--52px, weight 700
Body text: 16--18px, weight 400, line-height 1.65
UI labels/caps: 11--12px, weight 600, letter-spacing 0.1em, uppercase
Never use em dashes in any text content -- rewrite sentences if needed


Landing Page Sections
Build the landing page as a single scrolling page with the following sections in order:
1. Navbar

Fixed, with backdrop blur (backdrop-blur-md, bg-black/60)
Left: K logomark in accent green + Kairo wordmark
Right: Nav links (How It Works, Features, Waitlist) + a primary CTA button (Get Early Access)
Mobile: hamburger menu with a slide-down drawer
Thin 1px border on the bottom using --border

2. Hero Section
Layout: Full viewport height. Large headline on the left, animated phone mockup on the right.
Headline (use this copy exactly):
Fitness that adapts
when life happens.
Subheadline:
Tell Kairo your constraints. Get a plan that fits today --
not the perfect version of your week that never shows up.
CTAs: Two buttons -- Get Early Access (filled, accent green) and See How It Works (ghost/outlined)
Background: Dark base with a subtle radial gradient glow in accent green positioned behind the phone mockup. Add a very fine dot-grid or noise texture overlay at 3--5% opacity to add depth.
Phone mockup: A single phone frame showing the "Today" screen (see mockup content below). On load, animate it in from the right with a slight upward float. It should continuously and gently float (CSS keyframe, 3s ease-in-out, 6px vertical travel).
Scroll indicator: A small animated chevron or line pulse at the bottom center.
3. Social Proof Bar
A thin full-width strip between the hero and the next section:
Trusted by early testers in 12+ countries   --   Built for real schedules, not ideal ones   --   Adapting plans daily since 2025
Use a marquee/ticker scroll animation (CSS or Framer). Muted text color, small caps style.
4. How It Works
Headline: Three steps. Zero friction.
Layout: Three cards in a horizontal row on desktop, stacked on mobile. Each card has:

A large step number (01, 02, 03) in muted green, very large (120px+), used as a decorative background element
Icon (Lucide)
Title
Description
A small time/effort badge

Steps (use this content):
#TitleDescriptionBadge01Set your constraintsHow much time do you have? 15, 30, 45 minutes? Traveling? Stressed? Low sleep? Toggle it on.Takes 10 seconds02Get today's planReceive 2--3 workout options that fit your constraints, plus a protein target and meal suggestions.Personalized daily03Log in 30 secCheck off workout, meals, water, steps. Missed something? Tap "I missed" -- no guilt, no reset. Tomorrow adjusts.Auto-adapts
Cards should animate in with a staggered Framer Motion entrance on scroll (each card 100ms offset).
5. App Showcase (Phone Mockups -- Primary Feature Section)
This is the centerpiece section of the page. It must be exceptional.
Headline: Designed for your real life
Subheadline: Three screens. Everything you need, nothing you don't.
Layout: Three phone frames displayed side by side on desktop. On mobile, display as a horizontally scrollable carousel. Each phone frame should be a realistic device outline (black frame, rounded corners, notch or Dynamic Island, subtle inner shadow).
Each phone loops through its own content autonomously using Framer Motion AnimatePresence -- simulating a real user interacting with the screen. The transitions should feel like actual app navigation: screens slide in from the right, content fades and updates, buttons have press states.
Phone 1 -- "Today" Screen
Loop through these three states with smooth transitions (3s per state, 400ms transition):
State A: Default day
Header: "Today -- Mon Mar 17"
Workout Options:
  [Selected] 30-min Push Day -- Full gym -- Upper body
  45-min Full Body -- Moderate intensity
  [Swap button]
Nutrition:
  Protein: 160g target
  Meals remaining: 2
  Water: 3.0L
[Start Workout button -- accent green]
State B: Travel mode active
Header: "Today -- Travel Mode ON"
Workout Options:
  [Selected] 20-min Hotel Circuit -- Bodyweight -- No equipment
  15-min Stretch and Core -- Recovery
  30-min HIIT Walk -- Outdoor or treadmill
Nutrition:
  Protein: 140g (adjusted for travel)
[Start Workout button]
State C: Constraint picker open
Header: "Today -- Set your day"
Toggles (animated on/off states):
  [ON]  Traveling
  [OFF] Low sleep
  [ON]  Short on time
  [OFF] No equipment
[Generate Plan button -- green, pulsing]
Phone 2 -- "Log" Screen
Loop through these two states:
State A: Active logging
Title: "Quick Log -- 30 sec"
Checklist items with animated checkmarks appearing:
  [x] Workout completed
  [x] Meal 1 -- Breakfast
  [ ] Meal 2 -- Lunch
  [ ] Meal 3 -- Dinner
  [ ] Water target (3.0L)
  [ ] Steps (8,000+)
Progress bar: 33% filled, accent green
State B: "I Missed" flow
Title: "Missed today?"
Subtitle: "No guilt. No reset."
Body: "Tap below and tomorrow's plan automatically adjusts to keep you on track."
[I missed -- ghost button with red border]
[I'm still going -- accent green button]
Animate the checklist items checking themselves off one by one in State A (150ms between each check). This should loop -- all items check, progress bar fills, then reset and loop again.
Phone 3 -- "Insights" Screen
Loop through these two states:
State A: Stats overview
Title: "Insights -- This Week"
Stats row:
  12 -- Day Streak
  85% -- Adherence
  4 -- Workouts
Smart nudge card:
  "Add 30g protein tonight"
  "You're 32g short of your daily target."
  [Dismiss] [Do it]
State B: Weekly summary
Weekly Summary card:
  "Great week so far"
  4/5 workouts
  Avg 145g protein
  3 days hit water goal
Tomorrow preview:
  "45-min Gym Strength -- Upper body -- 165g protein target"
[View full plan -- text link, green]
All three phones should be slightly staggered in their loop timing (Phone 1 starts at 0s, Phone 2 at 1s, Phone 3 at 2s) so they never all transition simultaneously.
Phones should have a very subtle perspective tilt on desktop (Phone 1 tilted -5deg, Phone 2 straight, Phone 3 tilted +5deg) with a slight drop shadow and green glow behind each.
6. Differentiation Statement
A bold full-width cinematic statement section, no cards, just typography and texture:
Unlike rigid 12-week programs
that break when you miss a day,
Kairo adapts your plan daily.
Because consistency beats perfection.
Style: 52--64px headline on dark background. The words adapts your plan daily should be highlighted in accent green. Subtle background gradient or grain overlay. Animate words in on scroll using a Framer stagger reveal (each word slides up 20px and fades in, 60ms offset per word).
7. Waitlist Section
Headline: Get early access
Subheadline: Join the waitlist. Be the first to try the fitness app that works around your schedule.
Form: A single email input + submit button. Inline layout on desktop, stacked on mobile.

Input: dark fill, accent green focus ring, placeholder your@email.com
Button: Join Waitlist in accent green
On submit: replace the form with a success state -- a green checkmark icon + You're on the list. We'll be in touch.
The form should NOT be wired to a backend -- just handle the UI state transition with React state
Add a subtle line below: No spam. Unsubscribe anytime. in muted text

8. Footer
Three-column layout on desktop, stacked on mobile:

Col 1: Kairo logo + one-line description: Fitness that fits your real life.
Col 2: Links -- How It Works, Features, Waitlist
Col 3: Links -- Privacy, Terms, Contact (all href="#" for now)
Bottom bar: 2026 Kairo. All rights reserved. -- centered, muted


Motion and Animation System
Use Framer Motion throughout. Key animations:
ElementAnimationPage loadStaggered hero content fade-up (headline, subheadline, CTAs, phone -- 80ms offset each)Section entrancewhileInView with initial={{ opacity: 0, y: 32 }} and viewport={{ once: true, margin: "-80px" }}Phone floatCSS keyframes, 3s ease-in-out, -6px to 6px Y, infinitePhone screen transitionsFramer AnimatePresence with x: 20 to 0 + opacityChecklist itemsSequential delay (index * 150ms) for check animationsMarquee barCSS @keyframes marquee infinite scrollCTA button hoverwhileHover={{ scale: 1.03 }}, subtle green glow shadowWord-by-word revealstaggerChildren: 0.06 on container, each word slides up 20px

Component Architecture
Suggested file structure:
/app
  layout.tsx           -- shared font loading, metadata
  page.tsx             -- landing page (composes all sections)
  /how-it-works
    page.tsx
  /features
    page.tsx
  /waitlist
    page.tsx
/components
  /ui
    Button.tsx
    Badge.tsx
    PhoneFrame.tsx     -- reusable phone frame shell
  /sections
    Navbar.tsx
    Hero.tsx
    SocialProofBar.tsx
    HowItWorks.tsx
    AppShowcase.tsx    -- the three-phone section
    DifferentiationStatement.tsx
    WaitlistSection.tsx
    Footer.tsx
  /mockups
    TodayScreen.tsx
    LogScreen.tsx
    InsightsScreen.tsx
/lib
  constants.ts         -- copy, nav links, feature data
/styles
  globals.css          -- CSS variables, base reset, marquee keyframes

Copy Rules

Never use em dashes anywhere in the codebase or rendered text
Use -- (double hyphen) in code comments and data files where a dash separator is needed
Restructure sentences to avoid needing em dashes in user-facing copy
Tone: confident, direct, human -- not hype, not clinical
Avoid words like: "supercharge", "revolutionize", "seamlessly", "game-changer"


Quality Checklist
Before finishing, verify:

 No em dashes anywhere in rendered text or JSX copy
 All three phone mockups loop independently with smooth AnimatePresence transitions
 Checklist in Log screen auto-checks items sequentially in a loop
 Navbar is sticky with blur on scroll
 All four routes render without errors
 Waitlist form shows success state on submit (no backend required)
 Fully responsive -- tested at 375px, 768px, 1280px, 1440px
 Dark theme consistent across all pages
 No Inter, Roboto, Arial, or Space Grotesk fonts used
 Framer Motion whileInView used on all major sections
 Green accent glow applied to phone mockup section background
 Footer links present on all sub-pages


Reference Content
Pull all copy from the existing site: https://chazwyllie.github.io/Kairo/landing/index.html
Do not copy any styles, layout, or component structure from the existing site. Content only.

Prompt written for Claude Code. Feed this file directly as your opening message.