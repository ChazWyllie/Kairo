"use client";

import { useState, useEffect } from "react";
import { track } from "@/lib/analytics";
import { PLANS, type PlanConfig } from "@/lib/stripe-prices";

/**
 * Public landing page — Instagram bio link destination.
 * Shows 4 pricing tiers with monthly/annual toggle.
 * Each card has its own inline checkout form.
 */
export default function HomePage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">Kairo Coaching</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Simple, structured fitness coaching — built for consistency.
            Choose the plan that fits your goals.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
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
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              billingInterval={billingInterval}
              highlighted={plan.tier === "coaching"}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 mx-auto max-w-2xl rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 text-center">
          <p className="font-medium">Note:</p>
          <p>This is fitness coaching and general nutrition guidance — not medical advice.</p>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} Kairo Coaching. All rights reserved.</p>
          <a href="/dashboard" className="hover:text-black transition-colors">
            My Dashboard →
          </a>
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

      <div className="mt-3">
        <span className="text-3xl font-bold">${perMonth}</span>
        <span className="text-neutral-500">/mo</span>
        {billingInterval === "annual" && (
          <p className="mt-1 text-xs text-neutral-500">
            ${price}/yr — billed annually
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
