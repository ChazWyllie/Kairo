/**
 * Kairo Design Token System
 *
 * Follows ui-designer.md principles:
 * - Primitive tokens → semantic tokens → component tokens
 * - 60-75% neutrals, 15-25% brand primary, 5-10% semantic
 * - 4/8pt spacing rhythm
 * - WCAG 2.1 AA contrast (4.5:1 text, 3:1 UI)
 *
 * These tokens are used as Tailwind class references.
 * When we move to CSS custom properties, this becomes the
 * single source of truth for light/dark/high-contrast modes.
 */

// ── Primitive Palette ──

export const palette = {
  black: "#000000",
  white: "#FFFFFF",
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
    800: "#166534",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#f59e0b",
    600: "#d97706",
    800: "#92400e",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626",
    800: "#991b1b",
  },
} as const;

// ── Semantic Tokens ──

export const semantic = {
  // Status colors — used for member/coach health indicators
  status: {
    onTrack: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", dot: "bg-green-500" },
    needsReview: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
    urgent: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", dot: "bg-red-500" },
  },

  // Membership status
  memberStatus: {
    active: { bg: "bg-green-100", text: "text-green-800" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    canceled: { bg: "bg-red-100", text: "text-red-800" },
  },
} as const;

// ── Spacing Scale (4/8pt rhythm) ──

export const spacing = {
  xs: "4px",   // 0.25rem
  sm: "8px",   // 0.5rem
  md: "12px",  // 0.75rem
  lg: "16px",  // 1rem
  xl: "24px",  // 1.5rem
  "2xl": "32px", // 2rem
  "3xl": "48px", // 3rem
  "4xl": "64px", // 4rem
} as const;

// ── Component Tokens ──

export const components = {
  card: {
    base: "rounded-2xl border border-neutral-200 p-6",
    highlighted: "rounded-2xl border-2 border-black p-6",
    status: {
      success: "rounded-2xl border border-green-200 bg-green-50 p-6",
      warning: "rounded-2xl border border-yellow-200 bg-yellow-50 p-6",
      error: "rounded-2xl border border-red-200 bg-red-50 p-6",
    },
  },
  button: {
    primary: "rounded-xl bg-black px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60",
    secondary: "rounded-xl border border-neutral-300 px-6 py-3 text-neutral-700 font-medium hover:border-neutral-500 transition-colors",
    ghost: "text-sm font-medium text-neutral-500 hover:text-black transition-colors",
  },
  badge: {
    base: "inline-block rounded-full px-3 py-1 text-xs font-medium",
  },
  input: {
    base: "w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-black focus:ring-1 focus:ring-black",
  },
  stat: {
    container: "rounded-2xl border border-neutral-200 p-4 text-center",
    value: "text-3xl font-bold",
    label: "mt-1 text-sm text-neutral-500",
  },
} as const;

// ── Dashboard-specific tokens ──

export const dashboard = {
  /** Member dashboard: action-first, motivational language */
  member: {
    todayCard: "rounded-2xl border-2 border-black p-6",
    progressBlock: "rounded-2xl border border-neutral-200 p-6",
    coachConnection: "rounded-2xl border border-neutral-200 p-6",
  },

  /** Coach dashboard: exception-first, triage-oriented */
  coach: {
    attentionQueue: "rounded-2xl border-2 border-red-200 bg-red-50 p-6",
    todaysOps: "rounded-2xl border border-neutral-200 p-6",
    clientHealth: "rounded-2xl border border-neutral-200 p-4",
    portfolioStat: "rounded-2xl border border-neutral-200 p-4 text-center",
  },
} as const;
