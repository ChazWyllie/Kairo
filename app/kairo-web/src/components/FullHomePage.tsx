"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { PLANS, type PlanDisplay } from "@/lib/stripe-prices";
import {
  LANDING_SECTIONS,
  type HeroSection,
  type SocialProofSection,
  type PricingSection,
  type TrustSection,
} from "@/lib/landing-config";

const CardNav = dynamic(() => import("@/components/CardNav"), { ssr: false });

const NAV_ITEMS = [
  {
    label: "Programs",
    bgColor: "#0D0716",
    textColor: "#fff",
    links: [
      { label: "Apply Now", href: "/apply", ariaLabel: "Apply for coaching" },
    ],
  },
  {
    label: "Pricing",
    bgColor: "#170D27",
    textColor: "#fff",
    links: [
      { label: "Compare Plans", href: "#pricing", ariaLabel: "Compare pricing plans" },
      { label: "What's Included", href: "#pricing", ariaLabel: "See what's included" },
    ],
  },
  {
    label: "About",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [
      { label: "Why Kairo", href: "#trust", ariaLabel: "Why choose Kairo" },
      { label: "Results", href: "#social-proof", ariaLabel: "Client results" },
    ],
  },
];

// Helpers to pull typed sections
const hero = LANDING_SECTIONS.find((s) => s.id === "hero") as HeroSection;
const socialProof = LANDING_SECTIONS.find((s) => s.id === "social-proof") as SocialProofSection;
const pricingSection = LANDING_SECTIONS.find((s) => s.id === "pricing") as PricingSection;
const trust = LANDING_SECTIONS.find((s) => s.id === "trust") as TrustSection;

/**
 * Full homepage — hero, social proof, pricing, trust, footer.
 *
 * Extracted from page.tsx so the waitlist landing page can replace it
 * during pre-launch. Swap back by importing this component into page.tsx.
 *
 * Section order follows apply-first funnel:
 * hero (apply CTA) -> social-proof -> pricing -> trust
 */
export default function FullHomePage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  return (
    <main className="relative min-h-screen bg-white text-black">
      {/* Card Nav */}
      <CardNav
        logoText="Kairo"
        items={NAV_ITEMS}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ctaHref="/login"
        ctaLabel="Sign In"
      />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-28 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          {hero.headline}
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
          {hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/apply"
            onClick={() => track({ name: "cta_click", properties: { location: "hero" } })}
            className="rounded-xl bg-black px-8 py-4 text-lg font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            {hero.cta}
          </Link>
          <a
            href="#pricing"
            onClick={() => track({ name: "cta_click", properties: { location: "hero_pricing" } })}
            className="rounded-xl border border-neutral-300 px-8 py-4 text-lg font-semibold text-black hover:border-neutral-500 transition-colors"
          >
            Compare Plans
          </a>
        </div>
      </section>

      {/* Social Proof */}
      <section id="social-proof" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold mb-10">
            Real results from real people
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {socialProof.testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100"
              >
                <p className="text-neutral-700 text-sm leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <footer className="mt-4 text-sm">
                  <span className="font-semibold text-black">{t.name}</span>
                  {t.role && (
                    <span className="text-neutral-400"> &middot; {t.role}</span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-semibold">{pricingSection.headline}</h2>
            <p className="text-neutral-600">{pricingSection.subtitle}</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8" role="group" aria-label="Billing interval">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              aria-pressed={billingInterval === "monthly"}
              className={`text-sm font-medium transition-colors ${billingInterval === "monthly" ? "text-black" : "text-neutral-400 hover:text-neutral-700"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() =>
                setBillingInterval((prev) => (prev === "monthly" ? "annual" : "monthly"))
              }
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ backgroundColor: billingInterval === "annual" ? "#000" : "#d4d4d4" }}
              aria-label="Toggle annual billing"
              aria-pressed={billingInterval === "annual"}
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
                style={{
                  transform: billingInterval === "annual" ? "translateX(24px)" : "translateX(4px)",
                }}
              />
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("annual")}
              aria-pressed={billingInterval === "annual"}
              className={`text-sm font-medium transition-colors ${billingInterval === "annual" ? "text-black" : "text-neutral-400 hover:text-neutral-700"}`}
            >
              Annual
            </button>
            {billingInterval === "annual" && (
              <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Save ~17%
              </span>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.tier}
                plan={plan}
                billingInterval={billingInterval}
                highlighted={plan.tier === "coaching"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {trust.items.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-neutral-600">
                <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer + Footer */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 text-center">
          <p className="font-medium">Note:</p>
          <p>This is fitness coaching and general nutrition guidance, not medical advice.</p>
        </div>
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Kairo Coaching. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

function PricingCard({
  plan,
  billingInterval,
  highlighted,
}: {
  plan: PlanDisplay;
  billingInterval: "monthly" | "annual";
  highlighted?: boolean;
}) {
  const price =
    billingInterval === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const perMonth =
    billingInterval === "annual"
      ? Math.round(plan.annualPrice / 12)
      : plan.monthlyPrice;

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
        highlighted
          ? "border-black ring-2 ring-black"
          : "border-neutral-200"
      }`}
    >
      {highlighted && (
        <span className="mb-3 self-start rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
          Most Popular
        </span>
      )}

      <h2 className="text-xl font-semibold">{plan.name}</h2>
      <p className="mt-1 text-sm text-neutral-500">{plan.tagline}</p>

      <div className="mt-3">
        <span className="text-3xl font-bold">${perMonth}</span>
        <span className="text-neutral-500">/mo</span>
        {billingInterval === "annual" && (
          <p className="mt-1 text-xs text-neutral-500">
            ${price}/yr, billed annually
          </p>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-700">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-green-600 shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
