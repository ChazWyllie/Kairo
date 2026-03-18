"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { isValidEmail } from "@/lib/validation";

/**
 * /quiz — 5-question stepped quiz with progress bar.
 *
 * Flow: goal → experience → daysPerWeek → minutesPerSession → challenge → email → submit
 * Posts to /api/quiz, redirects to /quiz/result on success.
 *
 * Mobile-first design (Instagram traffic is mobile-heavy).
 */

interface QuizAnswers {
  goal?: string;
  experience?: string;
  daysPerWeek?: number;
  minutesPerSession?: number;
  challenge?: string;
}

const TOTAL_STEPS = 6; // 5 questions + email capture

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track({ name: "quiz_started", properties: { source: "direct" } });
  }, []);

  const selectAnswer = useCallback(
    (key: keyof QuizAnswers, value: string | number) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      // Auto-advance after selection
      setTimeout(() => setStep((s) => s + 1), 200);
    },
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Something went wrong.");

      track({
        name: "quiz_completed",
        properties: { recommendedTier: data.recommendedTier },
      });

      router.push(`/quiz/result?tier=${data.recommendedTier}&leadId=${data.leadId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-black flex flex-col" style={{ background: "#FAFAF9" }}>
      {/* Segmented dot progress indicator */}
      <div className="w-full px-6 pt-6 pb-2 flex justify-center">
        <div
          className="flex items-center gap-2"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <React.Fragment key={i}>
              <div
                className={`rounded-full transition-all duration-300 ${
                  i < step
                    ? "h-2 w-2 bg-black"
                    : i === step
                    ? "h-2.5 w-2.5 bg-black ring-2 ring-black ring-offset-2"
                    : "h-2 w-2 bg-neutral-200"
                }`}
              />
              {i < TOTAL_STEPS - 1 && (
                <div
                  className={`h-px w-6 transition-colors duration-300 ${
                    i < step ? "bg-black" : "bg-neutral-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* ─── Step 0: Goal ─── */}
          {step === 0 && (
            <QuizStep
              question="What's your primary fitness goal?"
              options={[
                { label: "Lose fat", value: "fat_loss", emoji: "🔥" },
                { label: "Build muscle", value: "muscle", emoji: "💪" },
                { label: "Stay consistent", value: "maintenance", emoji: "✅" },
              ]}
              onSelect={(v) => selectAnswer("goal", v)}
              selected={answers.goal}
            />
          )}

          {/* ─── Step 1: Experience ─── */}
          {step === 1 && (
            <QuizStep
              question="How would you describe your experience?"
              options={[
                { label: "I'm just starting out", value: "beginner", emoji: "🌱" },
                { label: "I've been training 1–3 years", value: "intermediate", emoji: "📈" },
                { label: "I'm experienced (3+ years)", value: "advanced", emoji: "🏆" },
              ]}
              onSelect={(v) => selectAnswer("experience", v)}
              selected={answers.experience}
            />
          )}

          {/* ─── Step 2: Days per week ─── */}
          {step === 2 && (
            <QuizStep
              question="How many days per week can you train?"
              options={[
                { label: "1–2 days", value: "2", emoji: "📅" },
                { label: "3–4 days", value: "4", emoji: "📅" },
                { label: "5–6 days", value: "5", emoji: "📅" },
                { label: "Every day", value: "7", emoji: "📅" },
              ]}
              onSelect={(v) => selectAnswer("daysPerWeek", parseInt(v, 10))}
              selected={answers.daysPerWeek?.toString()}
            />
          )}

          {/* ─── Step 3: Session duration ─── */}
          {step === 3 && (
            <QuizStep
              question="How long are your typical sessions?"
              options={[
                { label: "15–20 minutes", value: "15", emoji: "⏱" },
                { label: "30–40 minutes", value: "30", emoji: "⏱" },
                { label: "45–60 minutes", value: "45", emoji: "⏱" },
                { label: "60+ minutes", value: "60", emoji: "⏱" },
              ]}
              onSelect={(v) => selectAnswer("minutesPerSession", parseInt(v, 10))}
              selected={answers.minutesPerSession?.toString()}
            />
          )}

          {/* ─── Step 4: Challenge ─── */}
          {step === 4 && (
            <QuizStep
              question="What's your biggest challenge right now?"
              options={[
                { label: "Not enough time", value: "time", emoji: "⏳" },
                { label: "Staying consistent", value: "consistency", emoji: "🔄" },
                { label: "Accountability", value: "accountability", emoji: "🤝" },
                { label: "Hit a plateau", value: "plateau", emoji: "📊" },
              ]}
              onSelect={(v) => selectAnswer("challenge", v)}
              selected={answers.challenge}
            />
          )}

          {/* ─── Step 5: Email capture ─── */}
          {step === 5 && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl animate-scale-in">
                  🎯
                </div>
                <h2 className="text-2xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                  Your plan is ready
                </h2>
                <p className="text-neutral-500 text-base">
                  Enter your email to see your personalized recommendation.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  required
                />
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-white font-semibold text-base transition-all hover:bg-neutral-800 hover:gap-3 active:scale-[0.98] disabled:opacity-60"
                >
                  <span>{loading ? "Loading…" : "See My Recommendation"}</span>
                  {!loading && (
                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                  )}
                </button>
                <p className="text-xs text-neutral-400 text-center">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>
          )}

          {/* Back button (steps 1+) */}
          {step > 0 && step < 6 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="group mt-8 flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-800 transition-colors mx-auto"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true">←</span>
              <span>Back</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Reusable option-select step ──

function QuizStep({
  question,
  options,
  onSelect,
  selected,
}: {
  question: string;
  options: { label: string; value: string; emoji: string }[];
  onSelect: (value: string) => void;
  selected?: string;
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <h2
        className="text-2xl sm:text-3xl font-bold text-center"
        style={{ letterSpacing: "-0.02em" }}
      >
        {question}
      </h2>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`group w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 ${
              selected === opt.value
                ? "border-black bg-black text-white shadow-lg"
                : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50"
            }`}
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-200 ${
                selected === opt.value
                  ? "bg-white/15"
                  : "bg-neutral-100 group-hover:bg-neutral-200"
              }`}
            >
              {opt.emoji}
            </span>
            <span className="text-base font-medium">{opt.label}</span>
            {selected === opt.value && (
              <span className="ml-auto animate-scale-in" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
