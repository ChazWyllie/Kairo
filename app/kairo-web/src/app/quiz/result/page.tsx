"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { PLANS, type PlanConfig, type PlanTier } from "@/lib/stripe-prices";
import { isValidEmail } from "@/lib/validation";

/**
 * /quiz/result — Shows the recommended tier after quiz completion.
 *
 * Reads `tier` and `leadId` from query params (set by /quiz form).
 * Displays the recommended plan, its features, and CTA to checkout.
 * Falls back to "coaching" if tier is invalid.
 *
 * Fires `quiz_result_viewed` analytics event on mount.
 */

const VALID_TIERS: PlanTier[] = ["foundation", "coaching", "performance", "vip"];

function ResultContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier") ?? "coaching";
  const leadId = searchParams.get("leadId");

  const tier: PlanTier = VALID_TIERS.includes(tierParam as PlanTier)
    ? (tierParam as PlanTier)
    : "coaching";

  const plan: PlanConfig = PLANS.find((p) => p.tier === tier) ?? PLANS[1]; // fallback to coaching

  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  const perMonth =
    billingInterval === "annual"
      ? Math.round(plan.annualPrice / 12)
      : plan.monthlyPrice;
  const totalPrice =
    billingInterval === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const priceId =
    billingInterval === "monthly" ? plan.monthlyPriceId : plan.annualPriceId;

  useEffect(() => {
    track({ name: "quiz_result_viewed", properties: { tier } });
  }, [tier]);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
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
          ...(leadId ? { leadId } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to start checkout.");

      window.location.href = data.url;
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      track({ name: "checkout_error", properties: { error: msg, tier: plan.tier } });
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-hero text-white flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Completed progress bar */}
      <div className="w-full bg-white/10 h-1.5 relative z-10">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-500 w-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Recommendation header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl mb-4">
              ✨
            </div>
            <p className="text-sm font-medium text-amber-400 uppercase tracking-widest mb-3">
              Your Recommended Plan
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{plan.name}</h1>
            <p className="mt-3 text-lg text-white/50">{plan.tagline}</p>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl border border-amber-400/30 bg-white/5 backdrop-blur-xl p-8 shadow-lg glow-brand mb-8 animate-scale-in">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span
                className={`text-sm font-medium transition-colors ${billingInterval === "monthly" ? "text-white" : "text-white/40"}`}
              >
                Monthly
              </span>
              <button
                type="button"
                onClick={() =>
                  setBillingInterval((prev) => (prev === "monthly" ? "annual" : "monthly"))
                }
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
                style={{ backgroundColor: billingInterval === "annual" ? "#f59e0b" : "rgba(255,255,255,0.15)" }}
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
                className={`text-sm font-medium transition-colors ${billingInterval === "annual" ? "text-white" : "text-white/40"}`}
              >
                Annual
              </span>
              {billingInterval === "annual" && (
                <span className="ml-2 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                  Save ~17%
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-white tracking-tight">${perMonth}</span>
              <span className="text-white/40">/mo</span>
              {billingInterval === "annual" && (
                <p className="mt-1 text-xs text-white/40">
                  ${totalPrice}/yr — billed annually
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px]">✓</span>
                  <span className="text-white/70">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Checkout form */}
            <form onSubmit={handleCheckout} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 backdrop-blur-sm transition-all"
                inputMode="email"
                autoComplete="email"
                required
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional — for coaching texts)"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 backdrop-blur-sm transition-all"
                inputMode="tel"
                autoComplete="tel"
              />
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-500 px-6 py-3.5 text-neutral-950 font-semibold text-base transition-all hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] disabled:opacity-50"
              >
                {loading ? "Loading…" : `Start Your ${plan.name} Plan →`}
              </button>
            </form>
          </div>

          {/* Secondary CTAs */}
          <div className="text-center space-y-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              Compare all plans ↓
            </Link>
            <p className="text-xs text-white/25">
              30-day satisfaction guarantee · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QuizResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-hero flex items-center justify-center">
          <p className="text-white/40">Loading your result…</p>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
