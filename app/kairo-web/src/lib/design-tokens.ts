/**
 * Kairo Design Token System
 *
 * Follows ui-designer.md principles:
 * - Primitive tokens → semantic tokens → component tokens
 * - 60-75% neutrals, 15-25% brand primary (amber/gold), 5-10% semantic
 * - 4/8pt spacing rhythm
 * - WCAG 2.1 AA contrast (4.5:1 text, 3:1 UI)
 *
 * Brand identity: warm amber/gold — energy, motivation, confidence.
 * Visual language: modern rounded surfaces, subtle shadows, glass effects.
 */

// ── Primitive Palette ──

export const palette = {
  black: "#09090b",
  white: "#ffffff",
  neutral: {
    25: "#fcfcfd",
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
  brand: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
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
    base: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card transition-all duration-300",
    highlighted: "rounded-2xl border-2 border-amber-400 bg-[var(--surface)] p-6 shadow-card glow-brand",
    interactive: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5",
    status: {
      success: "rounded-2xl border border-green-200 bg-green-50 p-6",
      warning: "rounded-2xl border border-amber-200 bg-amber-50 p-6",
      error: "rounded-2xl border border-red-200 bg-red-50 p-6",
    },
  },
  button: {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors",
  },
  badge: {
    base: "badge",
    brand: "badge bg-amber-100 text-amber-800",
    subtle: "badge bg-[var(--background-tertiary)] text-[var(--foreground-secondary)]",
  },
  input: {
    base: "input-base",
  },
  stat: {
    container: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-card",
    value: "text-3xl font-bold tracking-tight",
    label: "mt-1 text-sm text-[var(--foreground-secondary)]",
  },
} as const;

// ── Dashboard-specific tokens ──

export const dashboard = {
  /** Member dashboard: action-first, motivational language */
  member: {
    todayCard: "rounded-2xl border-2 border-amber-400/50 bg-[var(--surface)] p-6 shadow-card glow-brand",
    progressBlock: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card",
    coachConnection: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card",
  },

  /** Coach dashboard: exception-first, triage-oriented */
  coach: {
    attentionQueue: "rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 shadow-card",
    todaysOps: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card",
    clientHealth: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card transition-all duration-300 hover:shadow-card-hover",
    portfolioStat: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-card",
  },
} as const;
