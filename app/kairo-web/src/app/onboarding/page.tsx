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
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="animate-scale-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl mb-6">
              🎯
            </div>
            <h1 className="text-3xl font-bold tracking-tight">All set!</h1>
            <p className="mt-4 text-[var(--foreground-secondary)] leading-relaxed">
              Thanks for filling out your info. We&apos;ll use this to build your
              first plan — expect it within 48 hours.
            </p>
            <Link
              href="/"
              className="mt-10 btn-primary inline-flex"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="animate-fade-in-up">
          <span className="badge bg-amber-100 text-amber-800 mb-4 inline-block">Setup</span>
          <h1 className="text-3xl font-bold tracking-tight">Tell us about yourself</h1>
          <p className="mt-3 text-[var(--foreground-secondary)]">
            This helps us build a plan that fits your life. Everything is optional.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 space-y-8">
          {/* Email — identity check */}
          <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <label htmlFor="ob-email" className="block text-sm font-semibold text-[var(--foreground)]">
              Email (used to sign up)
            </label>
            <input
              id="ob-email"
              type="email"
              className="input-base"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Goal */}
          <fieldset className="space-y-3 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <legend className="text-sm font-semibold text-[var(--foreground)]">
              Primary goal{" "}
              <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                    goal === g.value
                      ? "border-amber-400 bg-amber-500 text-neutral-950 shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-secondary)] hover:border-amber-300"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Days per week */}
          <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <label htmlFor="ob-days" className="block text-sm font-semibold text-[var(--foreground)]">
              Training days per week{" "}
              <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </label>
            <input
              id="ob-days"
              type="range"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="text-sm text-[var(--foreground-secondary)]">
              <span className="font-semibold text-amber-600">{daysPerWeek}</span> days
            </p>
          </div>

          {/* Minutes per session */}
          <fieldset className="space-y-3 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
            <legend className="text-sm font-semibold text-[var(--foreground)]">
              Time per session{" "}
              <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutesPerSession(m)}
                  className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                    minutesPerSession === m
                      ? "border-amber-400 bg-amber-500 text-neutral-950 shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-secondary)] hover:border-amber-300"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>

          {/* Injuries / limitations */}
          <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <label htmlFor="ob-injuries" className="block text-sm font-semibold text-[var(--foreground)]">
              Injuries or limitations{" "}
              <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              id="ob-injuries"
              className="input-base"
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
            className="btn-primary w-full"
          >
            {loading ? "Saving…" : "Submit"}
          </button>

          <p className="text-xs text-[var(--foreground-muted)] text-center">
            All fields are optional — you can always update later.
          </p>
        </form>
      </div>
    </main>
  );
}
