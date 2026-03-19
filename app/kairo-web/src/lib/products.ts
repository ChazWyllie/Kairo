/**
 * Product catalog for Kairo Fitness.
 *
 * TEMPLATE_PRODUCTS: one-time digital downloads ($15-$39).
 * Stripe Price IDs are injected via env vars — create them as one-time prices
 * in the Stripe Dashboard, then add to .env.local:
 *   NEXT_PUBLIC_STRIPE_WORKOUT_PRICE_ID=price_xxx
 *   NEXT_PUBLIC_STRIPE_NUTRITION_PRICE_ID=price_xxx
 *   NEXT_PUBLIC_STRIPE_SUPPLEMENTS_PRICE_ID=price_xxx
 *   NEXT_PUBLIC_STRIPE_BUNDLE_PRICE_ID=price_xxx
 *
 * COACHING_TIERS: monthly subscriptions (application-based).
 * Server-side price IDs are in stripe-server.ts.
 */

export const TEMPLATE_PRODUCTS = {
  workout: {
    name: "12-Week Strength Program",
    price: 19,
    originalPrice: 29,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_WORKOUT_PRICE_ID,
    category: "Workout",
    description: "Complete periodized program with gym and home variations.",
    benefits: [
      "Progressive overload built in",
      "Gym and home variations",
      "Exercise video demos",
    ],
  },
  nutrition: {
    name: "The Macro Guide for Busy People",
    price: 19,
    originalPrice: 29,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_NUTRITION_PRICE_ID,
    category: "Nutrition",
    description: "Practical nutrition system with flexible meal frameworks.",
    benefits: [
      "Personalized macro calculations",
      "Grocery lists included",
      "Meal prep strategies",
    ],
  },
  supplements: {
    name: "The Evidence-Based Supplement Guide",
    price: 15,
    originalPrice: 25,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SUPPLEMENTS_PRICE_ID,
    category: "Supplements",
    description: "What works, what doesn't, and exactly how to use it.",
    benefits: [
      "Research-backed recommendations",
      "Dosing protocols",
      "Brand suggestions",
    ],
  },
  bundle: {
    name: "The Complete Guide Bundle",
    price: 39,
    originalPrice: 59,
    savings: 14,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BUNDLE_PRICE_ID,
    category: "Bundle",
    description: "All 3 guides: workout, nutrition, and supplements. Everything you need.",
    benefits: [
      "12-Week Strength Program",
      "Macro Guide for Busy People",
      "Supplement Guide",
    ],
  },
} as const;

export type TemplateProductKey = keyof typeof TEMPLATE_PRODUCTS;

export const COACHING_TIERS = {
  standard: {
    name: "1:1 Standard",
    price: 149,
    originalPrice: 199,
    tagline: "Custom programming, nutrition guidance, and ongoing coach support.",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Custom workout programming tailored to your goals",
      "Personalized nutrition guidance with macro targets",
      "Weekly or bi-weekly check-ins with your coach",
      "Direct WhatsApp messaging access",
      "Video form reviews (2 per month)",
      "Monthly progress report",
    ],
  },
  premium: {
    name: "1:1 Premium",
    price: 350,
    originalPrice: 450,
    tagline: "Full personalization with weekly video calls and daily access to your coach.",
    highlighted: false,
    badge: null,
    features: [
      "Everything in 1:1 Standard, plus:",
      "Weekly video check-ins with your coach",
      "Daily WhatsApp messaging (unlimited text and video)",
      "Detailed form reviews and technique feedback",
      "Advanced programming and peaking protocols",
      "Competition and photoshoot prep",
      "Priority scheduling (book any time)",
    ],
  },
} as const;
