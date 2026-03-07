"use client";

import { useState, useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Public landing page — Instagram bio link destination.
 * Collects email (and optional phone), calls /api/checkout, redirects to Stripe.
 */
export default function HomePage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    track({ name: "checkout_started", properties: { hasPhone: !!phone.trim() } });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: phone.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to start checkout.");

      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      track({ name: "checkout_error", properties: { error: msg } });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">Kairo Coaching</h1>
          <p className="text-lg text-neutral-600">
            Simple, structured fitness coaching — built for consistency.
          </p>
          <p className="text-neutral-500">
            Your plan adapts. You stay consistent.
          </p>
        </div>

        {/* Offer Card */}
        <div className="mt-10 rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Basic Membership — $50/month</h2>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-neutral-700">
            <li>Personalized training plan template (updated monthly)</li>
            <li>Nutrition targets + simple meal structure</li>
            <li>Weekly async check-in (48h response window)</li>
            <li>Accountability + adjustments based on progress</li>
          </ul>

          <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
            <p className="font-medium">Note:</p>
            <p>This is fitness coaching and general nutrition guidance — not medical advice.</p>
          </div>

          {/* Checkout Form */}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                placeholder="(optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={() => track({ name: "cta_click", properties: { location: "checkout_form" } })}
              className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium transition-opacity disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Start Subscription →"}
            </button>

            <p className="text-xs text-neutral-500 text-center">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-10 text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} Kairo Coaching. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
