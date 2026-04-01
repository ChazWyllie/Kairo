# Kairo Coaching — Dashboard Design Prompt for Claude Code

> **Copy this entire file into your Claude Code session as the prompt.**
> Before starting, read the full codebase with `find . -type f -not -path '*/node_modules/*' -not -path '*/.next/*'` to understand the existing structure, backend API routes, database models, and the website design system already in place. **The backend is already built and wired** — your job is to build the frontend that consumes the existing API endpoints and renders them beautifully.

---

## Role & Standards

You are a senior frontend engineer and product designer building the **authenticated dashboard experience** for Kairo Coaching. This is the app that clients log into after subscribing and the admin panel the coach uses to manage their business.

Your work should feel like a native mobile app — snappy, intuitive, and premium. Think of the quality bar set by apps like Linear, Notion, or the Stripe Dashboard — not a generic admin template. Every interaction should feel intentional and smooth.

This dashboard is a **companion to the Kairo marketing website** (already built). It shares the same design system ("Dark Precision") and must feel like the same product — not a different app bolted on.

---

## Brand & Product Context

**Kairo Fitness** is an adaptive fitness and nutrition coaching business for busy professionals (25–40). Communication happens via WhatsApp. The dashboard exists to:

1. **For clients**: Access workout templates, nutrition guides, manage their subscription, leave reviews, and submit feature suggestions
2. **For the coach**: Manage clients, create/assign workout templates and nutrition guides, view revenue stats, and handle waitlist signups

The dashboard is **intentionally lightweight for v1**. It is NOT trying to replace WhatsApp for messaging or be a full workout-tracking app. It's a clean member portal and coach admin panel.

---

## Design System — "Dark Precision" (Inherited from Website)

**Use the exact same design tokens as the marketing site.** The dashboard should feel like you logged into the same product — consistent, seamless, premium.

### Color System
```
--bg-primary:        #0A0A0A    (near-black base — main background)
--bg-secondary:      #111111    (elevated surfaces — cards, sidebar, modals)
--bg-tertiary:       #1A1A1A    (input fields, hover states, nested cards)
--border-subtle:     #222222    (dividers, card borders, table rows)
--border-hover:      #333333    (interactive border states)

--text-primary:      #F5F5F5    (headlines, primary content, names)
--text-secondary:    #A0A0A0    (body copy, descriptions, secondary info)
--text-tertiary:     #666666    (captions, metadata, timestamps, labels)

--accent-primary:    #E0FF4F    (electric lime — active tabs, primary CTAs, status badges)
--accent-glow:       rgba(224, 255, 79, 0.15)  (subtle glow behind active elements)
--accent-secondary:  #4FFFE0    (teal — secondary indicators, links, info badges)

--status-success:    #4ADE80    (green — active subscriptions, completed items)
--status-warning:    #FBBF24    (amber — pending states, attention needed)
--status-error:      #F87171    (red — cancelled, overdue, destructive actions)

--gradient-accent:   linear-gradient(135deg, #E0FF4F 0%, #4FFFE0 100%)  (premium badge highlight, used very sparingly)
```

### Typography
```
--font-display:      'Cabinet Grotesk', sans-serif;  (page titles, section headers, stats)
--font-body:         'Inter', sans-serif;             (everything else — UI, body, labels)

Dashboard-specific sizes:
--text-xs:           0.75rem / 1.5;    (timestamps, metadata)
--text-sm:           0.875rem / 1.6;   (labels, captions, table data)
--text-base:         1rem / 1.7;       (body text, descriptions)
--text-lg:           1.125rem / 1.5;   (card titles, list item titles)
--text-xl:           1.25rem / 1.4;    (section headers)
--text-2xl:          1.5rem / 1.3;     (page titles)
--text-3xl:          2rem / 1.2;       (large stat numbers)

Letter-spacing: -0.02em for headers, 0.05em for uppercase labels
```

### Spacing & Layout
```
--space-1: 4px     --space-2: 8px     --space-3: 12px    --space-4: 16px
--space-5: 24px    --space-6: 32px    --space-7: 48px    --space-8: 64px

Dashboard content max-width: 680px (mobile-optimized, centered on desktop)
Content padding: 16px (mobile) / 24px (tablet) / 32px (desktop)
Card padding: 16px (mobile) / 20px (desktop)
Card gap: 12px
Border radius: 12px (cards), 8px (buttons, inputs), 9999px (pills/badges)
```

---

## Authentication

### Login Screen
- Clean, centered card on the dark background
- Kairo wordmark logo at top ("KAIRO" in Cabinet Grotesk, bold, letter-spaced)
- Email input + Password input (dark inputs with --bg-tertiary background, accent border on focus)
- "Sign In" primary button (accent color)
- "Forgot password?" link below in text-tertiary
- No social logins for v1
- After login, route to Client Dashboard or Coach Dashboard based on user role

### Role-Based Routing
- `role: "client"` → Client Dashboard at `/dashboard`
- `role: "coach"` → Coach Dashboard at `/coach`
- Coach can also view any client's dashboard for support purposes

---

## Mobile Navigation — Bottom Tab Bar

Since this is primarily used on mobile, use a **bottom tab bar** (iOS/Android native app pattern). This is the most thumb-friendly and familiar pattern for mobile-first dashboards.

### Client Tab Bar (5 tabs)
```
[Home]  [Workouts]  [Nutrition]  [Account]  [More]
```
- **Home**: Dashboard overview (greeting, current plan summary, quick links)
- **Workouts**: Workout templates & training guides
- **Nutrition**: Nutrition guides & resources
- **Account**: Subscription management, plan details
- **More**: Reviews, suggestions, support info

### Coach Tab Bar (5 tabs)
```
[Overview]  [Clients]  [Content]  [Waitlist]  [Settings]
```
- **Overview**: Revenue stats, active clients count, recent activity
- **Clients**: Client list with status & progress
- **Content**: Workout template builder + nutrition guide builder
- **Waitlist**: New signups pending approval

### Tab Bar Design
- Fixed to bottom of viewport
- Background: --bg-secondary with `backdrop-filter: blur(12px)` and subtle top border (--border-subtle)
- Icons: Lucide React icons, 20px, --text-tertiary when inactive
- Active tab: icon + label in --accent-primary, with a subtle glow dot above the icon
- Labels: text-xs, shown below icons
- Height: 56px + `env(safe-area-inset-bottom)` for iOS
- On desktop (>768px): Convert to a left sidebar navigation instead of bottom tabs

### Desktop Sidebar (>768px)
- Width: 240px, fixed left
- Same items as the tab bar but displayed vertically with icon + label
- Kairo logo at top of sidebar
- Active item: left accent border + --bg-tertiary background
- Collapsible to icon-only (56px width) with a toggle

---

## Client Dashboard — Screens

### 1. Home Tab (`/dashboard`)
The landing screen when a client logs in. It should feel welcoming and useful — not overwhelming.

**Layout (top to bottom):**

1. **Greeting Header**
   - "Good morning, {firstName}." (time-aware: morning/afternoon/evening)
   - Subtitle: Current plan name + status badge (e.g., "Coaching Plan · Active" with a green dot)
   - Keep it warm and personal

2. **Quick Actions Row**
   - Horizontal scroll of compact action cards (pill-shaped or small cards):
     - "View Workouts" → Workouts tab
     - "Nutrition Guide" → Nutrition tab
     - "Message Coach" → Opens WhatsApp link (external)
   - Styled as outlined pills with subtle border, icon + label

3. **Current Plan Summary Card**
   - Dark card (--bg-secondary), rounded-lg
   - Shows: Plan name, price/month, founding price, renewal date
   - "Manage Subscription" button → redirects to Stripe Customer Portal
   - Subtle accent border on left edge of card

4. **Recent Updates Feed** (optional, for future use)
   - Empty state for now: "No updates yet. Your coach will post here soon."
   - Designed as a vertical list of cards (future: coach can push announcements)

**Animation**: Stagger fade-up on entry, 80ms delay between sections

### 2. Workouts Tab (`/dashboard/workouts`)
A clean library of workout templates assigned to the client.

**Layout:**

1. **Page Header**: "Your Workouts" — text-2xl, Cabinet Grotesk
2. **Filter/Sort Bar** (optional): Tabs for "All", "This Week", "Saved" — horizontal scroll pills
3. **Template Cards** — vertical list of cards:
   - Each card shows:
     - Workout name (e.g., "Upper Body — Push Focus") in text-lg bold
     - Tag pills: muscle group, duration, difficulty (e.g., "Chest · 45 min · Intermediate")
     - Date assigned in text-tertiary
   - Tap card → expands to full workout detail view

4. **Workout Detail View** (when a card is tapped):
   - Full-screen slide-in from right (mobile) or modal (desktop)
   - Exercise list with:
     - Exercise name
     - Sets × Reps (or time)
     - Rest period
     - Optional coach notes
   - Styled as a clean list with subtle dividers between exercises
   - "Back" button or swipe-to-close

5. **Empty State** (no workouts assigned yet):
   - Centered illustration placeholder + "No workouts assigned yet. Your coach is building your plan!"
   - Subtle, not sad — encouraging tone

### 3. Nutrition Tab (`/dashboard/nutrition`)
A resource library for nutrition guidance.

**Layout:**

1. **Page Header**: "Nutrition Guides" — text-2xl
2. **Guide Cards** — vertical list:
   - Each card:
     - Guide title (e.g., "Protein 101: How Much You Actually Need")
     - Brief description (1–2 lines)
     - Category tag pill (e.g., "Basics", "Meal Prep", "Macros")
     - Read time estimate ("5 min read")
   - Tap → full guide view

3. **Guide Detail View**:
   - Article-style layout: title, content with proper heading hierarchy
   - Clean typography, good line-height, comfortable reading on mobile
   - Support for structured content: headings, paragraphs, bullet lists, bold text
   - Optional: simple macro target display (daily protein/cal/water targets in a highlighted card at top)

4. **Empty State**: "Guides coming soon! Your coach is preparing personalized nutrition resources."

### 4. Account Tab (`/dashboard/account`)
Subscription management and account settings.

**Layout:**

1. **Profile Section**
   - Name, email displayed (not editable for v1 — just display)
   - Small avatar circle with initials (auto-generated from name, accent background)

2. **Subscription Card** (the most important element)
   - Current plan name + tier badge (e.g., "Coaching" with "Most Popular" pill)
   - Price: "$116/mo" with founding price crossed out "$129/mo"
   - Status: "Active" green badge or "Cancelled" red badge
   - Next billing date
   - **"Manage Subscription" button** → Stripe Customer Portal (handles upgrade, downgrade, cancel, payment method update)
   - Note below button: "You can upgrade, downgrade, or cancel anytime." in text-tertiary

3. **Plan Comparison** (expandable/collapsible)
   - "Compare Plans" accordion that shows all 4 tiers:

   **Foundation** — $44/mo (founding: $49)
   - Monthly training template (updated to progress)
   - Nutrition targets and simple meal guidance
   - Direct WhatsApp access to coach
   - Weekly check-ins and progress adjustments
   - Quarterly performance reviews

   **Coaching** — $116/mo (founding: $129) — "Most Popular" badge
   - Everything in Foundation
   - Custom periodized workout program built around goals
   - Bi-weekly check-ins with coach
   - Personalized nutrition coaching with macro targets
   - Video form reviews (2 per month)
   - Monthly progress report

   **Performance** — $206/mo (founding: $229)
   - Weekly 30-min 1-on-1 calls with coach
   - Unlimited form critique videos
   - Priority messaging with coach
   - Advanced programming & peaking protocols
   - Everything in Coaching included

   **VIP Elite** — $314/mo (founding: $349)
   - Everything in Performance, plus:
   - Daily messaging access (unlimited text/video)
   - Weekly 60-min 1-on-1 calls
   - Competition & photoshoot prep
   - Priority scheduling (book any time)
   - Quarterly deep-dive progress reviews

   - Each tier is a compact card in a vertical stack
   - Current plan highlighted with accent border
   - "Upgrade" or "Downgrade" labels on other plans → redirect to Stripe

4. **Account Actions**
   - "Sign Out" button (outlined, not destructive red — just neutral)
   - "Delete Account" link in text-tertiary at very bottom (opens confirmation modal)

### 5. More Tab (`/dashboard/more`)
Secondary features — reviews, suggestions, and info.

**Layout:**

1. **Section: Leave a Review**
   - Star rating (1–5 stars, tappable, accent color when selected)
   - Text area: "Tell others about your experience..."
   - Submit button
   - After submitting: "Thank you! Your review helps us grow." confirmation with a subtle checkmark animation
   - If already reviewed: show their review with an "Edit" option

2. **Section: Suggestions**
   - "Help us improve Kairo"
   - Text area: "What feature or improvement would you love to see?"
   - Optional: category select (Workouts, Nutrition, App Experience, Other)
   - Submit button
   - After submitting: "Thanks for the feedback! We read every suggestion."

3. **Section: Support & Info**
   - "About Kairo" → brief about text
   - "Terms of Service" / "Privacy Policy" links
   - App version number at bottom in text-tertiary

---

## Coach Dashboard — Screens

### 1. Overview Tab (`/coach`)
The coach's home base — a snapshot of the business at a glance.

**Layout:**

1. **Greeting**: "Welcome back, Coach." (or coach's name)

2. **Stats Grid** — 2×2 grid of stat cards:
   - **Active Clients**: number with accent color, small trend indicator (↑ or ↓ vs last month)
   - **Monthly Revenue**: dollar amount, calculated from active subscriptions
   - **Pending Waitlist**: number of unapproved signups
   - **Reviews**: average star rating + total count

   Card design: --bg-secondary, rounded-lg, stat number in text-3xl Cabinet Grotesk, label in text-xs uppercase tracked-out text-tertiary

3. **Recent Activity Feed**
   - Vertical list of recent events:
     - "Sarah K. subscribed to Coaching plan" — timestamp
     - "New waitlist signup: john@email.com" — timestamp
     - "Mike R. submitted a suggestion" — timestamp
   - Each item: icon (colored dot or small icon) + text + relative timestamp
   - "View All" link at bottom

4. **Quick Actions**
   - "Add Workout Template" button
   - "Add Nutrition Guide" button
   - Styled as outlined cards with icon + label, side by side

### 2. Clients Tab (`/coach/clients`)
Client management — see everyone, their plan, and their status.

**Layout:**

1. **Search Bar** at top: "Search clients..." with search icon
2. **Filter Pills**: "All", "Foundation", "Coaching", "Performance", "VIP Elite", "Cancelled" — horizontal scroll
3. **Client List** — vertical cards:
   - Each card shows:
     - Client name (text-lg, bold)
     - Plan tier badge (color-coded pill: Foundation=neutral, Coaching=accent, Performance=teal, VIP=gradient border)
     - Status indicator: green dot "Active" / red dot "Cancelled" / amber dot "Past Due"
     - Member since date in text-tertiary
     - Last check-in date
   - Tap → Client Detail View

4. **Client Detail View** (slide-in or sub-page):
   - Profile header: name, email, plan, status, member since
   - **Assigned Workouts**: list of templates assigned to this client, with ability to assign new ones
   - **Assigned Nutrition Guides**: list of guides assigned
   - **Notes** (simple text area for coach's private notes about this client)
   - **Actions**: "Open WhatsApp Chat" button (pre-fills client's number), "View in Stripe" link
   - **Subscription Info**: plan, price, next billing date, payment status

5. **Empty State**: "No clients yet. They'll appear here once someone subscribes!"

### 3. Content Tab (`/coach/content`)
Where the coach creates and manages workout templates and nutrition guides.

**Sub-navigation**: Two horizontal tabs at top: "Workouts" | "Nutrition"

#### Workouts Sub-tab (`/coach/content/workouts`)

1. **Template List** — vertical cards of all workout templates:
   - Template name, tags (muscle group, difficulty), date created
   - Badge showing how many clients it's assigned to
   - Tap → edit, Long press or menu → delete/duplicate

2. **"+ New Template" FAB** (floating action button) on mobile, regular button on desktop

3. **Template Builder** (full-screen on mobile, modal on desktop):
   - **Template name** input
   - **Tags**: muscle group multi-select pills, difficulty select, estimated duration
   - **Exercise List** — each exercise row:
     - Exercise name (text input)
     - Sets × Reps inputs (number inputs, compact)
     - Rest period (e.g., "90s")
     - Coach notes (optional expandable text area)
     - Drag handle for reordering (mobile: long press to reorder)
     - Delete button (small, tertiary)
   - **"+ Add Exercise"** button at bottom of list
   - **"Save Template"** primary button
   - **"Assign to Clients"** — multi-select client list to assign this template

   Design: Keep it clean and functional. Each exercise row should be a compact card. Use subtle animations when adding/removing exercises.

#### Nutrition Sub-tab (`/coach/content/nutrition`)

1. **Guide List** — same pattern as workout templates:
   - Guide title, category tag, date created
   - Assignment count badge

2. **"+ New Guide" button**

3. **Guide Builder**:
   - **Title** input
   - **Category** select: Basics, Meal Prep, Macros, Supplements, Recovery, Custom
   - **Content Editor**: Rich-ish text area supporting:
     - Headings (H2, H3)
     - Paragraphs
     - Bold, italic
     - Bullet lists
     - Keep it simple — NOT a full WYSIWYG editor. A markdown-style input with preview is ideal
   - **Optional: Macro Targets Card**
     - Toggle to include daily targets
     - Inputs: Daily calories, Protein (g), Carbs (g), Fats (g), Water (L)
     - These display as a highlighted card at the top of the guide when clients view it
   - **"Save Guide"** button
   - **"Assign to Clients"** multi-select

### 4. Waitlist Tab (`/coach/waitlist`)
Manage new signups from the marketing site.

**Layout:**

1. **Pending Signups** — list of cards:
   - Name, email, date applied
   - "Biggest fitness challenge" (their answer from the apply form)
   - Action buttons: "Approve" (accent) and "Decline" (outlined, neutral)
   - Approve → prompts to select which tier to invite them to → sends invite email (future integration)

2. **Approved / Declined** — collapsible section showing history

3. **Stats**: Total applications, conversion rate, this month vs last month

4. **Empty State**: "No pending applications. Share your link to get more signups!"

### 5. Settings Tab (`/coach/settings`)
- Profile: name, email, WhatsApp number (for pre-filling client chat links)
- Business: company name, logo upload placeholder
- "Sign Out" button
- Minimal for v1

---

## Animation & Interaction System

### Core Motion (Same as Website)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, `cubic-bezier(0.33, 1, 0.68, 1)` for transitions
- Page transitions: Fade + subtle slide (15px translateY or translateX)
- Tab switches: Crossfade, 200ms
- Card entrances: Stagger fade-up, 60ms delay between cards
- All animations respect `prefers-reduced-motion`

### Dashboard-Specific Interactions
- **Tab bar**: Active tab icon scales slightly (1 → 1.05) with a spring animation
- **Cards**: Subtle press-down effect on tap (`scale(0.98)`, 100ms) before navigating
- **Stat numbers**: Count-up animation when Overview tab loads (numbers increment from 0 to value over 800ms)
- **Star rating**: Stars fill left-to-right with a quick ripple effect on tap
- **Exercise rows**: Smooth reorder animation when dragging (use `layout` animation from Framer Motion)
- **Toast notifications**: Slide in from top, auto-dismiss after 3s, dark card with status color left border
- **Form submissions**: Button shows loading spinner → checkmark on success
- **Empty states**: Gentle fade-in with a subtle scale(0.95 → 1) on the illustration/icon

### Skeleton Loading States
Every screen must have a skeleton loading state (not a spinner). Use pulsing rectangles in --bg-tertiary that match the shape of the content they'll replace:
- Stat cards: rectangular pulse blocks
- Client cards: avatar circle + text lines
- Workout cards: title line + tag pills
- Use `animate-pulse` with --bg-tertiary to --border-subtle transition

---

## Mobile-First Requirements (Critical)

This dashboard will primarily be used on mobile via Instagram link → website → login. These are non-negotiable:

- **Design at 375px first**, scale up to desktop at 768px+ breakpoint
- **Touch targets**: minimum 44×44px on all interactive elements
- **Bottom tab bar**: fixed, always visible, respects iOS safe area (`env(safe-area-inset-bottom)`)
- **Font sizes**: minimum 16px on all inputs (prevents iOS auto-zoom)
- **Scroll performance**: Use `will-change: transform` sparingly, avoid layout thrashing
- **Full-height screens**: Use `100svh` not `100vh` (fixes mobile browser chrome issues)
- **No hover-dependent features**: Everything must work with tap only
- **Forms**: Large, comfortable inputs. Number inputs should use `inputmode="numeric"` for proper mobile keyboard
- **Back navigation**: Clear back buttons or swipe-to-go-back on detail views
- **Thumb zone**: Primary actions (CTAs, tab bar) in the bottom 60% of the screen

### Desktop Adaptations (768px+)
- Bottom tab bar → left sidebar (240px)
- Content max-width: 680px, centered with generous padding
- Cards can sit in 2-column grids where appropriate (stats, client cards)
- Modals instead of full-screen slides for detail views
- Hover states activate on desktop

---

## Technical Requirements

- **Stack**: Next.js + React + TypeScript (existing setup in `app/kairo-web/`)
- **Routing**: Use Next.js App Router with route groups:
  - `(auth)/login/page.tsx` — login screen
  - `(dashboard)/dashboard/page.tsx` — client home
  - `(dashboard)/dashboard/workouts/page.tsx` — client workouts
  - `(dashboard)/dashboard/nutrition/page.tsx` — client nutrition
  - `(dashboard)/dashboard/account/page.tsx` — client account
  - `(dashboard)/dashboard/more/page.tsx` — client reviews/suggestions
  - `(coach)/coach/page.tsx` — coach overview
  - `(coach)/coach/clients/page.tsx` — coach client list
  - `(coach)/coach/content/page.tsx` — coach content management
  - `(coach)/coach/waitlist/page.tsx` — coach waitlist
  - `(coach)/coach/settings/page.tsx` — coach settings
- **Styling**: Tailwind CSS with the design system CSS variables in globals.css
- **Animations**: Framer Motion for page transitions, scroll reveals, layout animations. CSS transitions for simple hover/focus states
- **State**: React Context for auth state and user role. No heavy state library for v1. Use the existing auth system — read how it works before building anything
- **No external UI libraries** — all components custom-built to match the design system
- **Icons**: Lucide React (consistent, clean, good set)
- **Stripe Integration**: The backend already has Stripe wired. Find the existing endpoint that creates a Stripe Customer Portal session and wire the "Manage Subscription" button to call it and redirect. Do NOT create new Stripe endpoints — use what exists
- **API Calls**: Use `fetch` or whatever HTTP client the codebase already uses. Check for existing API utility functions before writing your own
- **Accessibility**: Semantic HTML, ARIA labels, focus-visible styles, keyboard navigation for desktop, reduced-motion support

---

## File Structure

```
app/kairo-web/src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── layout.tsx          (client shell with bottom tab bar)
│   │       ├── page.tsx            (home tab)
│   │       ├── workouts/
│   │       │   ├── page.tsx        (workout list)
│   │       │   └── [id]/page.tsx   (workout detail)
│   │       ├── nutrition/
│   │       │   ├── page.tsx        (guide list)
│   │       │   └── [id]/page.tsx   (guide detail)
│   │       ├── account/
│   │       │   └── page.tsx
│   │       └── more/
│   │           └── page.tsx
│   └── (coach)/
│       └── coach/
│           ├── layout.tsx          (coach shell with bottom tab bar / sidebar)
│           ├── page.tsx            (overview)
│           ├── clients/
│           │   ├── page.tsx        (client list)
│           │   └── [id]/page.tsx   (client detail)
│           ├── content/
│           │   ├── page.tsx        (workout + nutrition tabs)
│           │   ├── workouts/
│           │   │   └── [id]/page.tsx  (template builder)
│           │   └── nutrition/
│           │       └── [id]/page.tsx  (guide builder)
│           ├── waitlist/
│           │   └── page.tsx
│           └── settings/
│               └── page.tsx
├── components/
│   ├── layout/
│   │   ├── BottomTabBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DashboardShell.tsx      (responsive: sidebar on desktop, tabs on mobile)
│   │   └── PageHeader.tsx
│   ├── ui/
│   │   ├── Button.tsx              (variants: primary, secondary, ghost, destructive)
│   │   ├── Card.tsx
│   │   ├── Badge.tsx               (plan tier badges, status badges)
│   │   ├── Input.tsx               (text, email, number, textarea)
│   │   ├── Select.tsx
│   │   ├── StarRating.tsx
│   │   ├── Accordion.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx            (loading skeleton components)
│   │   ├── EmptyState.tsx
│   │   └── Avatar.tsx              (initials-based avatar)
│   ├── dashboard/
│   │   ├── QuickActions.tsx
│   │   ├── PlanSummaryCard.tsx
│   │   ├── WorkoutCard.tsx
│   │   ├── NutritionGuideCard.tsx
│   │   ├── ReviewForm.tsx
│   │   └── SuggestionForm.tsx
│   └── coach/
│       ├── StatCard.tsx
│       ├── ClientCard.tsx
│       ├── ActivityFeed.tsx
│       ├── WorkoutTemplateBuilder.tsx
│       ├── NutritionGuideBuilder.tsx
│       ├── ExerciseRow.tsx
│       ├── ClientSelector.tsx       (multi-select for assignments)
│       └── WaitlistCard.tsx
├── lib/
│   ├── animations.ts               (shared Framer Motion variants)
│   ├── auth.tsx                     (auth context, role check hooks)
│   └── utils.ts                     (greeting generator, formatters)
└── types/
    └── index.ts                     (User, Client, Workout, Guide, etc. TypeScript types)
```

---

## Backend Integration

**The backend is already built.** Before building any UI, read the existing codebase to understand:

1. **API routes / endpoints** — find all existing API routes and use them. Do NOT create mock data or hardcode values. Wire every screen to real endpoints.
2. **Database models / schemas** — read the existing data models (User, Client, Workout, NutritionGuide, Subscription, etc.) and derive your TypeScript types from them.
3. **Auth system** — use the existing authentication setup. Read how login, session management, and role-based access are implemented and plug the frontend into it.
4. **Stripe integration** — the Stripe subscription flow is already wired. Find the existing endpoint that creates a Stripe Customer Portal session and wire the "Manage Subscription" button to it.

### Integration Rules
- **Never create mock/placeholder data** — always fetch from real API endpoints
- **Read the existing API layer first** before building any component, so you know exactly what data shape to expect
- **Match TypeScript types to the backend models** — don't invent your own interfaces. Import or mirror what already exists
- **Handle loading, error, and empty states** for every API call:
  - Loading → skeleton loading state
  - Error → toast notification with retry option
  - Empty (no data yet) → empty state with encouraging copy
- **Use the existing auth flow** — don't build a new one. Plug the login form into whatever auth system is already in place
- **Stripe portal redirect** — find the existing endpoint, call it on button click, redirect to the URL it returns
- **Forms (review, suggestion, workout builder, nutrition builder)** — POST to existing endpoints. Show loading state on submit button → success toast on completion

### Fallback Mock Data (ONLY if an endpoint doesn't exist yet)
If you discover that a specific endpoint hasn't been built yet (e.g., reviews, suggestions), create a temporary mock data file at `lib/mock-data.ts` with a `// TODO: Replace with real API call` comment on every usage. Use this data structure as reference for what the mock should look like:

- Clients: name, email, plan tier, status (active/cancelled/past_due), member_since, last_checkin
- Workouts: name, muscle_groups[], difficulty, duration_min, exercises[], assigned_to[]
- Nutrition guides: title, category, content (markdown), macro_targets (optional), assigned_to[]
- Stats: active_clients, monthly_revenue, pending_waitlist, avg_review_rating, review_count

---

## What NOT To Do

- ❌ Don't make it look like a generic admin template (no shadcn defaults, no Tailwind UI copy-paste)
- ❌ Don't use a bright/light theme — this must match the dark website aesthetic
- ❌ Don't build a messaging system — WhatsApp is the communication channel
- ❌ Don't over-engineer v1 — no real-time updates, no complex state management, no heavy editors
- ❌ Don't create mock data unless an endpoint genuinely doesn't exist yet — always wire to real APIs first
- ❌ Don't build new backend endpoints — the backend is already wired. Read it, use it
- ❌ Don't use spinners for loading — use skeleton loading states everywhere
- ❌ Don't forget mobile is PRIMARY — if it doesn't feel great at 375px, it's wrong
- ❌ Don't use different fonts or colors than the website — design system must be identical
- ❌ Don't make the coach dashboard overly complex — it should feel manageable for a solo coach
- ❌ Don't use auto-playing carousels or scroll-jacking
- ❌ Don't put destructive actions (cancel, delete) in easy-to-tap positions — always behind a confirmation

---

## Quality Checklist (Verify Before Submitting)

- [ ] Login screen looks polished and matches the Kairo brand
- [ ] Client dashboard feels like a clean, premium mobile app at 375px
- [ ] Coach dashboard is functional and not overwhelming for a solo coach
- [ ] Bottom tab bar is fixed, respects iOS safe area, has proper active states
- [ ] All screens have skeleton loading states (no spinners)
- [ ] All screens have thoughtful empty states with encouraging copy
- [ ] Subscription card clearly shows plan, price, status, and manage button
- [ ] Plan comparison shows all 4 tiers accurately with correct pricing
- [ ] Workout template builder lets you add/remove/reorder exercises smoothly
- [ ] Nutrition guide builder supports markdown-style content with preview
- [ ] Star rating interaction feels satisfying on mobile (proper touch target, visual feedback)
- [ ] Desktop sidebar navigation works and feels natural at 768px+
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Color contrast passes WCAG AA on all text elements
- [ ] Tab bar icons are consistent and recognizable
- [ ] Forms don't trigger iOS auto-zoom (16px min font-size on inputs)
- [ ] The overall impression is: "This feels like a real product, not a prototype"