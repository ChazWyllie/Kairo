Best workflow for AI agents making UI
1) Start in grayscale

Have the first agent produce only:

user goal

page hierarchy

section order

CTA priority

mobile and desktop layout

component list

This matters because strong UI quality depends more on visual hierarchy, scale, balance, contrast, and consistency than on decoration. NN/g’s guidance is very aligned with this: hierarchy and restrained color use improve clarity, and in common interfaces you generally should not overload the palette.

2) Force the agent to use a design system

Your visual-design agent should work from:

Apple HIG patterns for Apple-native feel

Material 3 roles/tokens for scalable cross-platform UI

your own component library or registry

Apple explicitly recommends system colors that adapt across backgrounds, appearance modes, and accessibility settings. Material 3’s color system is built around accessible color relationships and tokenized roles instead of ad hoc hex values. Vercel’s recent guidance also emphasizes applying your design system for consistent branding when using AI UI generation.

3) Separate “design” from “critique”

Use a second agent that only reviews the design against a rubric:

hierarchy clear in 3 seconds?

one primary CTA?

spacing rhythm consistent?

surfaces and states distinct?

color used for emphasis, not noise?

contrast passes?

dark mode still readable?

components look like one family?

That evaluator-optimizer pattern is one of the clearest current recommendations for agent reliability.

Best color strategy for AI agents

The safest, most scalable strategy is:

A. Build color in layers, not one-off picks

Use:

Primitive tokens — raw palette values

Semantic tokens — bg.surface, text.primary, border.subtle, action.primary

Component tokens — button/card/input specific mappings

That hierarchy is supported by Figma’s current token/variable guidance and Material’s design-token model, and it maps well to code and theming.

B. Use color roles, not “pretty colors”

Material 3’s role-based system is the right mental model:

primary

secondary

tertiary

surface / surface container

error

outline / border

on-primary / on-surface text colors

This is much better than letting an agent invent five random brand colors. Material specifically frames colors as role assignments from tonal palettes, with tokenized contrast-aware pairings.

C. Keep the palette tight

For most product UIs:

1 dominant brand hue

1 optional accent hue

neutral grays for most surfaces/text

separate semantic colors for success/warning/error/info

NN/g warns that too many colors flatten hierarchy and make interfaces feel noisy.

D. Make accessibility non-negotiable

Your color agent should automatically enforce:

4.5:1 contrast for normal text

3:1 for large text

3:1 non-text contrast for UI components and graphical objects

do not rely on color alone to communicate meaning

Those are core WCAG requirements and should be hard checks, not suggestions.

E. Generate modes from the same token system

Have the agent output:

light

dark

high-contrast

Figma variables support modes for themes like light/dark and accessible variants, and Apple system colors are meant to adapt across appearance and accessibility contexts.

The highest-quality agent setup

I’d use five agents:

1. UX Architect

Input: feature brief
Output: sitemap, flows, layout priorities, low-fi wireframe notes

2. Design System Agent

Input: brand direction + chosen system
Output: spacing scale, typography scale, component choices, surface model

3. Color Strategist

Input: seed brand color or mood
Output:

primitive palette

semantic tokens

light/dark/high-contrast mappings

usage rules for accent and status colors

4. Accessibility Critic

Checks:

WCAG contrast

non-text contrast

no color-only meaning

focus visibility

readability on surfaces

5. UI Implementer

Turns approved tokens and component choices into code only after the critique passes

That setup reduces the usual AI UI problems: clutter, inconsistent spacing, random gradients, weak hierarchy, and inaccessible colors.

What to tell the agents

Give them constraints like this:

Design a SaaS dashboard for [target user] solving [main job to be done].

Rules:
- Start in grayscale and optimize hierarchy before color
- Use a 4/8pt spacing rhythm
- Use one primary CTA per screen
- Use a constrained palette: one brand hue, one optional accent, neutrals, semantic status colors
- Define primitive, semantic, and component tokens
- Produce light, dark, and high-contrast modes
- All body text must meet 4.5:1 contrast
- UI components and boundaries must meet 3:1 contrast
- Do not use color alone for states or errors
- Prefer platform-familiar patterns from Apple HIG / Material 3
- Output:
  1. layout rationale
  2. component inventory
  3. token JSON
  4. screen-by-screen visual notes
  5. accessibility self-critique

And for the critique agent:

Review this UI proposal like a senior product designer and accessibility reviewer.

Reject the design if:
- hierarchy is unclear
- there are multiple competing CTAs
- spacing rhythm is inconsistent
- more than one accent color is used without reason
- text or UI contrast fails WCAG
- semantic colors are mixed with brand colors
- dark mode tokens are direct inversions instead of role-based mappings
- components do not look like they belong to one system
Best practical color recipe for most apps

For a modern product UI, this is the most reliable formula:

60–75% neutrals for surfaces and layout

15–25% brand primary for CTA emphasis and key highlights

5–10% accent / semantic colors for state and attention

text mostly on neutral surfaces

brand color sparingly for importance, not decoration

That matches current usability guidance much better than “make it vibrant.” Color should guide attention and reinforce structure, not carry the whole design.