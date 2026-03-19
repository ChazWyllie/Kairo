/**
 * Landing page section configuration.
 *
 * Centralizes all copy and structure for the landing page.
 * Component layer reads from here — no hardcoded strings in TSX.
 *
 * Sections (in order): hero → social-proof → how-it-works → pricing → trust
 */

// ── Section Types ──

export interface HeroSection {
  id: "hero";
  headline: string;
  subtitle: string;
  cta: string;
}

export interface Testimonial {
  name: string;
  text: string;
  role?: string;
}

export interface SocialProofSection {
  id: "social-proof";
  testimonials: Testimonial[];
}

export interface Step {
  title: string;
  description: string;
}

export interface HowItWorksSection {
  id: "how-it-works";
  steps: [Step, Step, Step];
}

export interface PricingSection {
  id: "pricing";
  headline: string;
  subtitle: string;
}

export interface TrustSection {
  id: "trust";
  items: string[];
}

export type LandingSection =
  | HeroSection
  | SocialProofSection
  | HowItWorksSection
  | PricingSection
  | TrustSection;

// ── Section Data ──

export const LANDING_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    headline: "Your plan adapts. You stay consistent.",
    subtitle:
      "Expert fitness coaching that fits your real life, not a rigid 12-week program that breaks when you miss a day.",
    cta: "Apply Now",
  },
  {
    id: "social-proof",
    testimonials: [
      {
        name: "Jordan M.",
        text: "I've tried dozens of programs. Kairo is the first one that actually adapts when my schedule changes. 12-day streak and counting.",
        role: "Marketing Manager",
      },
      {
        name: "Priya S.",
        text: "The daily protein targets alone were worth it. Down 8 lbs in 6 weeks without feeling like I'm dieting.",
        role: "Software Engineer",
      },
      {
        name: "Marcus T.",
        text: "Started with the nutrition guide, upgraded to coaching after 3 weeks. Best $19 I ever spent.",
        role: "Sales Director",
      },
    ],
  },
  {
    id: "how-it-works",
    steps: [
      {
        title: "Set your constraints",
        description:
          "Time, equipment, travel, stress: tell us what's real today.",
      },
      {
        title: "Get today's plan",
        description:
          "2 to 3 workout options plus protein targets, built for your day.",
      },
      {
        title: "Log in 30 seconds",
        description:
          "Quick checklist. Tomorrow's plan auto-adjusts based on what happened.",
      },
    ],
  },
  {
    id: "pricing",
    headline: "Choose the level of support that fits your life",
    subtitle:
      "All plans include a personalized fitness plan. Upgrade anytime.",
  },
  {
    id: "trust",
    items: [
      "Cancel anytime. No contracts, no commitments.",
      "Secure payments powered by Stripe",
      "30-day money-back guarantee",
      "Your data stays private. We never sell your information.",
    ],
  },
];
