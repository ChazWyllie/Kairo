/**
 * Client-safe pricing display data.
 *
 * No env var imports — safe for "use client" components.
 * For Stripe price IDs and server-only utilities, use stripe-server.ts.
 *
 * Current coaching model (marketing site + new signups):
 *   1:1 Standard  ($149/mo | annual available) — Custom programming, nutrition, weekly check-ins
 *   1:1 Premium   ($350/mo | annual available) — Everything in Standard + weekly video calls, daily access
 *
 * Legacy tiers (kept for existing member dashboard "Compare Plans" accordion):
 *   Foundation  ($49/mo)  — Templates + async check-ins
 *   Coaching    ($129/mo) — Personalized programming + 24h response
 *   Performance ($229/mo) — Video reviews + weekly calls
 *   VIP Elite   ($349/mo) — Daily access + priority everything
 */

export type PlanTier = "foundation" | "coaching" | "performance" | "vip" | "standard" | "premium";
export type BillingInterval = "monthly" | "annual";

export interface PlanDisplay {
  tier: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

/** @deprecated Use PlanDisplay instead */
export type PlanConfig = PlanDisplay;

export const PLANS: PlanDisplay[] = [
  {
    tier: "standard",
    name: "1:1 Standard",
    tagline: "Custom programming, nutrition guidance, and ongoing coach support.",
    monthlyPrice: 149,
    annualPrice: 1490,
    features: [
      "Custom workout programming tailored to your goals",
      "Personalized nutrition guidance with macro targets",
      "Weekly or bi-weekly check-ins with your coach",
      "Direct WhatsApp messaging access",
      "Video form reviews (2 per month)",
      "Monthly progress report",
    ],
  },
  {
    tier: "premium",
    name: "1:1 Premium",
    tagline: "Full personalization with weekly video calls and daily access to your coach.",
    monthlyPrice: 350,
    annualPrice: 3500,
    features: [
      "Everything in 1:1 Standard, plus:",
      "Weekly video check-ins with your coach",
      "Daily WhatsApp messaging (unlimited text and video)",
      "Detailed form reviews and technique feedback",
      "Priority scheduling (book any time)",
    ],
  },
  {
    tier: "foundation",
    name: "Foundation",
    tagline: "Training and nutrition templates with direct WhatsApp access.",
    monthlyPrice: 49,
    annualPrice: 490,
    features: [
      "Monthly training template (updated to your progress)",
      "Nutrition targets and simple meal guidance",
      "Direct WhatsApp access to your coach",
      "Weekly check-ins and progress adjustments",
      "Quarterly performance reviews",
    ],
  },
  {
    tier: "coaching",
    name: "Coaching",
    tagline: "Everything in Foundation, plus fully personalized 1-on-1 coaching.",
    monthlyPrice: 129,
    annualPrice: 1290,
    features: [
      "Everything in Foundation",
      "Custom periodized workout program built around your goals",
      "Bi-weekly check-ins with your coach",
      "Personalized nutrition coaching with macro targets",
      "Video form reviews (2 per month)",
      "Monthly progress report",
    ],
  },
  {
    tier: "performance",
    name: "Performance",
    tagline: "A high-touch plan for serious results.",
    monthlyPrice: 229,
    annualPrice: 2290,
    features: [
      "Weekly 30-min 1-on-1 calls with your coach",
      "Unlimited form critique videos",
      "Priority messaging with your coach",
      "Advanced programming & peaking protocols",
      "Everything in Coaching included",
    ],
  },
  {
    tier: "vip",
    name: "VIP Elite",
    tagline: "The ultimate 1:1 experience with unlimited access.",
    monthlyPrice: 349,
    annualPrice: 3490,
    features: [
      "Everything in Performance, plus:",
      "Daily messaging access (unlimited text/video)",
      "Weekly 60-min 1-on-1 calls",
      "Competition & photoshoot prep",
      "Priority scheduling (book any time)",
      "Quarterly deep-dive progress reviews",
    ],
  },
];
