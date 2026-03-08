"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { PLANS, type PlanConfig } from "@/lib/stripe-prices";
import {
  LANDING_SECTIONS,
  type HeroSection,
  type SocialProofSection,
  type HowItWorksSection,
  type PricingSection,
  type TrustSection,
} from "@/lib/landing-config";

// ── Helpers to pull typed sections ──
const hero = LANDING_SECTIONS.find((s) => s.id === "hero") as HeroSection;
const socialProof = LANDING_SECTIONS.find((s) => s.id === "social-proof") as SocialProofSection;
const howItWorks = LANDING_SECTIONS.find((s) => s.id === "how-it-works") as HowItWorksSection;
const pricingSection = LANDING_SECTIONS.find((s) => s.id === "pricing") as PricingSection;
const trust = LANDING_SECTIONS.find((s) => s.id === "trust") as TrustSection;

/**
 * Public landing page — Instagram bio link destination.
 *
 * Section order follows apply-first funnel:
 * hero (apply CTA) → social-proof → how-it-works → pricing → trust
 */
export default function HomePage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* ─── Top Bar ─── */}
      <nav className="mx-auto max-w-6xl px-6 pt-5 flex justify-end">
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* ─── Hero ─── */}
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-16 text-center">
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
        <p className="mt-3 text-sm text-neutral-500">
          Not sure yet? <a href="#pricing" className="underline hover:text-black">Compare plans</a>
        </p>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="bg-neutral-50 py-16">
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
                    <span className="text-neutral-400"> · {t.role}</span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-semibold mb-12">
            How Kairo works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {howItWorks.steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white text-lg font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/apply"
              onClick={() => track({ name: "cta_click", properties: { location: "how-it-works" } })}
              className="inline-block rounded-xl bg-black px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Apply Now →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-semibold">{pricingSection.headline}</h2>
            <p className="text-neutral-600">{pricingSection.subtitle}</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span
              className={`text-sm font-medium ${billingInterval === "monthly" ? "text-black" : "text-neutral-400"}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() =>
                setBillingInterval((prev) => (prev === "monthly" ? "annual" : "monthly"))
              }
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ backgroundColor: billingInterval === "annual" ? "#000" : "#d4d4d4" }}
              aria-label="Toggle annual billing"
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
                style={{
                  transform: billingInterval === "annual" ? "translateX(24px)" : "translateX(4px)",
                }}
              />
            </button>
            <span
              className={`text-sm font-medium ${billingInterval === "annual" ? "text-black" : "text-neutral-400"}`}
            >
              Annual
            </span>
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

      {/* ─── Trust ─── */}
      <section className="py-12">
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

      {/* ─── Disclaimer + Footer ─── */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 text-center">
          <p className="font-medium">Note:</p>
          <p>This is fitness coaching and general nutrition guidance, not medical advice.</p>
        </div>
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} Kairo Coaching. All rights reserved.</p>
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
  plan: PlanConfig;
  billingInterval: "monthly" | "annual";
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceId =
    billingInterval === "monthly" ? plan.monthlyPriceId : plan.annualPriceId;
  const price =
    billingInterval === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const perMonth =
    billingInterval === "annual"
      ? Math.round(plan.annualPrice / 12)
      : plan.monthlyPrice;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    track({
      name: "checkout_started",
      properties: {
        tier: plan.tier,
        interval: billingInterval,
        hasPhone: !!phone.trim(),
      },
    });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: phone.trim() || undefined,
          planId: priceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to start checkout.");

      window.location.href = data.url;
      return; // Don't reset loading — we're leaving the page
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      track({ name: "checkout_error", properties: { error: msg, tier: plan.tier } });
      setError(msg);
      setLoading(false);
    }
  }

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

      {/* CTA / Form */}
      {!expanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            track({ name: "cta_click", properties: { tier: plan.tier, location: "pricing_card" } });
          }}
          className={`mt-6 w-full rounded-xl px-4 py-3 font-medium transition-opacity ${
            highlighted
              ? "bg-black text-white"
              : "border border-neutral-300 text-black hover:border-neutral-500"
          }`}
        >
          Get Started →
        </button>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
            required
          />
          <input
            type="tel"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium text-sm transition-opacity disabled:opacity-60"
          >
            {loading ? "Redirecting to Stripe…" : "Start Subscription →"}
          </button>
          <p className="text-xs text-neutral-500 text-center">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </form>
      )}
    </div>
  );
}
