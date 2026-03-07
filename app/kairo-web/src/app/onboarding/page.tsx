"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

/**
 * Onboarding form — collects training preferences after sign-up.
 * Linked from the welcome email. Identified by email (no auth in MVP).
 */

const GOALS = [
  { value: "fat_loss", label: "Fat Loss" },
  { value: "muscle", label: "Build Muscle" },
  { value: "maintenance", label: "Stay Consistent" },
] as const;

const TIME_OPTIONS = [15, 20, 30, 45, 60] as const;

export default function OnboardingPage() {
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [minutesPerSession, setMinutesPerSession] = useState<number>(30);
  const [injuries, setInjuries] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/onboarding" } });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter the email you used to sign up.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          goal: goal || undefined,
          daysPerWeek,
          minutesPerSession,
          injuries: injuries.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error?.message ?? "Failed to save onboarding data."
        );

      track({ name: "onboarding_submitted", properties: { hasGoal: !!goal } });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-3xl font-semibold">All set 🎯</h1>
          <p className="mt-4 text-neutral-700">
            Thanks for filling out your info. We&apos;ll use this to build your
            first plan — expect it within 48 hours.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-xl bg-black px-6 py-3 text-white font-medium"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Tell us about yourself</h1>
        <p className="mt-2 text-neutral-600">
          This helps us build a plan that fits your life. Everything is optional.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {/* Email — identity check */}
          <div className="space-y-1">
            <label htmlFor="ob-email" className="block text-sm font-medium">
              Email (used to sign up)
            </label>
            <input
              id="ob-email"
              type="email"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Goal */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Primary goal{" "}
              <span className="text-neutral-400">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                    goal === g.value
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Days per week */}
          <div className="space-y-1">
            <label htmlFor="ob-days" className="block text-sm font-medium">
              Training days per week{" "}
              <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="ob-days"
              type="range"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full accent-black"
            />
            <p className="text-sm text-neutral-600">{daysPerWeek} days</p>
          </div>

          {/* Minutes per session */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Time per session{" "}
              <span className="text-neutral-400">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutesPerSession(m)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                    minutesPerSession === m
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>

          {/* Injuries / limitations */}
          <div className="space-y-1">
            <label htmlFor="ob-injuries" className="block text-sm font-medium">
              Injuries or limitations{" "}
              <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="ob-injuries"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
              rows={3}
              placeholder="e.g., Bad left knee — no jumping"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              maxLength={500}
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
            className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium transition-opacity disabled:opacity-60"
          >
            {loading ? "Saving…" : "Submit"}
          </button>

          <p className="text-xs text-neutral-500 text-center">
            All fields are optional — you can always update later.
          </p>
        </form>
      </div>
    </main>
  );
}
