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
 * Section order follows quiz-first funnel research:
 * hero (quiz CTA) → social-proof → how-it-works → pricing → trust
 *
 * Design: dark hero with brand amber accents, modern glass cards,
 * subtle animations, mobile-first layout.
 */
export default function HomePage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  return (
    <main className="min-h-screen">
      {/* ─── Hero — Dark, immersive, single CTA ─── */}
      <section className="relative overflow-hidden bg-gradient-hero">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
          {/* Logo / Wordmark */}
          <div className="animate-fade-in mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Now accepting new members
            </span>
          </div>

          <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-white">
            {hero.headline.split(".")[0]}.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
              {hero.headline.split(".")[1]?.trim() ?? "You stay consistent."}
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Link
              href="/quiz"
              onClick={() => track({ name: "cta_click", properties: { location: "hero" } })}
              className="group relative rounded-2xl bg-amber-500 px-8 py-4 text-lg font-semibold text-neutral-950 transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5"
            >
              {hero.cta}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#pricing"
              className="text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              Or compare plans ↓
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12 animate-fade-in" style={{ animationDelay: "400ms" }}>
            {[
              { value: "500+", label: "Active Members" },
              { value: "4.9★", label: "Avg Rating" },
              { value: "92%", label: "Retention Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="relative py-20 bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 animate-fade-in-up">
            <span className="badge bg-amber-100 text-amber-800 mb-4 inline-block">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              Real results from real people
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 stagger-children">
            {socialProof.testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="card-elevated group animate-fade-in-up"
              >
                {/* Quote icon */}
                <span className="text-3xl leading-none text-amber-400/40 font-serif">&ldquo;</span>
                <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed mt-2">
                  {t.text}
                </p>
                <footer className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[var(--foreground)]">{t.name}</div>
                    {t.role && (
                      <div className="text-xs text-[var(--foreground-muted)]">{t.role}</div>
                    )}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 bg-[var(--background-secondary)]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-14 animate-fade-in-up">
            <span className="badge bg-amber-100 text-amber-800 mb-4 inline-block">3 Simple Steps</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              How Kairo works
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 stagger-children">
            {howItWorks.steps.map((step, i) => (
              <div key={step.title} className="card-elevated flex flex-col items-center text-center animate-fade-in-up">
                {/* Step number with brand gradient */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 text-lg font-bold mb-5 shadow-lg">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{step.title}</h3>
                <p className="mt-3 text-sm text-[var(--foreground-secondary)] leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Link
              href="/quiz"
              onClick={() => track({ name: "cta_click", properties: { location: "how-it-works" } })}
              className="btn-primary text-base"
            >
              Find your plan →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 bg-[var(--background)]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-3 mb-12 animate-fade-in-up">
            <span className="badge bg-amber-100 text-amber-800 inline-block">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">{pricingSection.headline}</h2>
            <p className="text-[var(--foreground-secondary)] max-w-lg mx-auto">{pricingSection.subtitle}</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span
              className={`text-sm font-medium transition-colors ${billingInterval === "monthly" ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() =>
                setBillingInterval((prev) => (prev === "monthly" ? "annual" : "monthly"))
              }
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ backgroundColor: billingInterval === "annual" ? "#f59e0b" : "var(--neutral-300, #d4d4d8)" }}
              aria-label="Toggle annual billing"
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white transition-transform shadow-sm"
                style={{
                  transform: billingInterval === "annual" ? "translateX(24px)" : "translateX(4px)",
                }}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${billingInterval === "annual" ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}
            >
              Annual
            </span>
            {billingInterval === "annual" && (
              <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                Save ~17%
              </span>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
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
      <section className="py-16 bg-[var(--background-secondary)]">
        <div className="mx-auto max-w-3xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 stagger-children">
            {trust.items.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-[var(--foreground-secondary)] animate-fade-in">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA Banner ─── */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to train smarter?
          </h2>
          <p className="mt-4 text-white/60 max-w-md mx-auto">
            Take the 60-second quiz and get your personalized plan today.
          </p>
          <div className="mt-8">
            <Link
              href="/quiz"
              onClick={() => track({ name: "cta_click", properties: { location: "final_cta" } })}
              className="group inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-lg font-semibold text-neutral-950 transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5"
            >
              Take the Quiz
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Disclaimer + Footer ─── */}
      <footer className="bg-[var(--background)] border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl bg-[var(--background-secondary)] p-5 text-sm text-[var(--foreground-secondary)] text-center mb-8">
            <p className="font-medium text-[var(--foreground)]">Note:</p>
            <p>This is fitness coaching and general nutrition guidance — not medical advice.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--foreground-muted)]">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">K</span>
              <span>© {new Date().getFullYear()} Kairo Coaching</span>
            </div>
            <a href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
              My Dashboard →
            </a>
          </div>
        </div>
      </footer>
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
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 animate-fade-in-up ${
        highlighted
          ? "border-amber-400 bg-[var(--surface)] shadow-lg glow-brand scale-[1.02] z-10"
          : "border-[var(--border)] bg-[var(--surface)] shadow-card hover:shadow-card-hover hover:-translate-y-1"
      }`}
    >
      {highlighted && (
        <span className="mb-3 self-start rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-semibold text-neutral-950">
          Most Popular
        </span>
      )}

      <h2 className="text-xl font-bold text-[var(--foreground)]">{plan.name}</h2>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{plan.tagline}</p>

      <div className="mt-4">
        <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">${perMonth}</span>
        <span className="text-[var(--foreground-muted)]">/mo</span>
        {billingInterval === "annual" && (
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            ${price}/yr — billed annually
          </p>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5 text-sm text-[var(--foreground-secondary)]">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5 items-start">
            <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px]">✓</span>
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
          className={`mt-6 w-full rounded-xl px-4 py-3.5 font-semibold transition-all ${
            highlighted
              ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              : "border border-[var(--border-strong)] text-[var(--foreground)] hover:border-amber-400 hover:text-amber-600"
          }`}
        >
          Get Started →
        </button>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            className="input-base text-sm"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
            required
          />
          <input
            type="tel"
            className="input-base text-sm"
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
            className="w-full rounded-xl bg-amber-500 px-4 py-3.5 text-neutral-950 font-semibold text-sm transition-all hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting to Stripe…" : "Start Subscription →"}
          </button>
          <p className="text-xs text-[var(--foreground-muted)] text-center">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </form>
      )}
    </div>
  );
}
