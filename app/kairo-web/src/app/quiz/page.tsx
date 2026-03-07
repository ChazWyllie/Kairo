"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

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

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);

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
    if (!/\S+@\S+\.\S+/.test(email)) {
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
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 h-1.5">
        <div
          className="h-1.5 bg-black transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <p className="text-xs text-neutral-400 mb-6 text-center">
            {step + 1} of {TOTAL_STEPS}
          </p>

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
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Your plan is ready! 🎯</h2>
                <p className="mt-2 text-neutral-600">
                  Enter your email to see your personalized recommendation.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                  className="w-full rounded-xl bg-black px-6 py-3.5 text-white font-semibold text-base transition-opacity disabled:opacity-60"
                >
                  {loading ? "Loading…" : "See My Recommendation →"}
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
              className="mt-6 text-sm text-neutral-400 hover:text-black transition-colors mx-auto block"
            >
              ← Back
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">{question}</h2>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-all ${
              selected === opt.value
                ? "border-black bg-neutral-50 ring-1 ring-black"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
