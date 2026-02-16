You are a senior front-end engineer + UI designer. Build an internal “Landing Page Showcase” web app for [YOUR COMPANY NAME] that lets teammates browse, compare, and preview multiple fully-designed landing page concepts before choosing a brand direction.

1) Core Goal

Create a design directory that:

Shows a curated list of landing page concepts.

Lets users open a full preview of any concept.

Lets users compare concepts side-by-side (at least 2; ideally up to 3).

Makes it easy to add/edit landing pages over time as feedback comes in.

2) App Requirements (High Level)

Main Directory Screen

Dark theme by default (clean, modern, minimal).

Top bar includes: [YOUR COMPANY NAME] logo + title “Landing Page Options”.

A grid/list of clickable cards (one per landing page concept).

Each card includes: concept name, short description, tags (e.g., “Minimal”, “Bold”, “Editorial”), and a small preview thumbnail or “preview strip” section.

Basic search + filtering by tags (simple but useful).

Preview Screen

Clicking a card navigates to a route like /preview/[slug].

Shows a full, complete landing page (not a wireframe).

Include a sticky header or top utility bar with:

“Back to Directory”

“Compare” toggle / button (adds this page to compare tray)

Optional: device width toggles (Desktop / Tablet / Mobile) or a responsive preview container

Compare Mode

Provide a compare view like /compare?pages=slug1,slug2[,slug3].

Show selected landing pages side-by-side in columns (or stacked on mobile).

Ensure scroll behavior is usable (e.g., independent scroll per column or synchronized scroll—pick one and implement cleanly).

3) Landing Pages: Initial Set (Start with 3)

Create 3 distinct, fully-designed landing pages included in the directory at launch. Each should feel like a real, shippable marketing page with strong typography, layout, and section rhythm. They must be meaningfully different in style:

Concept A — Modern Minimal SaaS

Clean spacing, strong hierarchy, subtle gradients or neutrals, crisp components.

Concept B — Bold Trend-Forward

Strong visual identity: bento grids, expressive type, gradients, glass/blurs, high-contrast accents, dynamic sections.

Concept C — Editorial / Premium

Magazine-like typography, refined layout, premium feel, restrained color, elegant imagery blocks.

Each landing page should include (at minimum):

Hero with headline, subhead, primary CTA, secondary CTA

Social proof section (logos/testimonial)

Features section (3–6 items)

“How it works” or “Use cases”

Pricing or Plan comparison (can be simplified)

FAQ

Final CTA section

Footer with basic links

Use realistic placeholder copy tailored to [YOUR COMPANY NAME] (do not use generic lorem ipsum everywhere). You may invent a plausible product category if none is provided, but keep it consistent across all pages.

4) Brand Tokens + Theming

Implement a simple design-token approach so changes are easy later:

Define tokens for: primary color, accent, background, surface, text, border radius, font scale.

Apply tokens consistently across the directory UI and landing pages.

Ensure accessibility: adequate contrast, focus states, keyboard navigation.

5) Extensibility (Future Iterations)

This app will evolve based on user feedback. Structure the project so it’s easy to:

Add a new landing page by creating a single file/component and registering metadata (name, slug, tags, description).

Modify existing landing pages without breaking routing or layout.

Maintain a “Design Decision Log” (a simple markdown file is fine) that records user preferences and changes.

Example entries: preferred typography, spacing density, CTA style, color direction, section order, imagery style.

When generating new landing pages or updating existing ones, apply the accumulated preferences consistently.

6) Trend Research Behavior (When Asked for New Pages Without Direction)

If the user asks: “Make a new landing page” without giving a style direction:

First, perform quick research on current landing page design trends and propose 2–3 concept directions aligned with the existing brand tokens and the Design Decision Log.

Then implement the best-fitting concept.

If browsing is not available, approximate trends using widely observed patterns (e.g., bento grids, oversized typography, soft gradients, glassmorphism, brutalist accents, editorial layouts, micro-interactions).

7) If Brand Styling Is Not Specified: Ask These Questions First

Before finalizing visuals, if the user hasn’t provided brand direction, ask up to 7 concise questions:

What does [YOUR COMPANY NAME] do (industry + target audience)?

Brand personality: minimal / bold / playful / premium / technical?

Preferred color palette (or colors to avoid)?

Any reference sites you like (2–3 examples)?

Preferred typography vibe: modern sans / editorial serif / geometric / utilitarian?

Are you optimizing for conversions (direct response) or brand storytelling?

Any required sections (pricing, waitlist, demo, newsletter, etc.)?

8) Deliverables

Provide:

A working app with directory, preview routes, and compare mode.

Clean project structure and readable components.

A short README with: setup, run steps, how to add a new landing page, and where tokens/preferences live.

Include the initial 3 landing pages fully implemented and discoverable from the directory.

9) Quality Bar

Responsive across desktop/tablet/mobile.

Polished UI (spacing, type scale, section rhythm, consistent CTA styling).

No broken links/buttons (use placeholders if needed).

Keep the directory UI dark-themed and professional.