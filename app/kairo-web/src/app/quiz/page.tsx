"use client";

import { useState, useEffect, useCallback } from "react";
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
    <main className="min-h-screen bg-gradient-hero text-white flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[120px] pointer-events-none" />

      {/* Progress Bar */}
      <div className="w-full bg-white/10 h-1.5 relative z-10">
        <div
          className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <p className="text-xs text-white/40 mb-8 text-center font-medium tracking-wide">
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
            <div className="space-y-8 animate-fade-in-up">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl mb-5">
                  🎯
                </div>
                <h2 className="text-2xl font-bold text-white">Your plan is ready!</h2>
                <p className="mt-3 text-white/50">
                  Enter your email to see your personalized recommendation.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 backdrop-blur-sm transition-all"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  required
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
                  {loading ? "Loading…" : "See My Recommendation →"}
                </button>
                <p className="text-xs text-white/30 text-center">
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
              className="mt-8 text-sm text-white/30 hover:text-white/60 transition-colors mx-auto block"
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
    <div className="space-y-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-center text-white">{question}</h2>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left text-base font-medium transition-all backdrop-blur-sm ${
              selected === opt.value
                ? "border-amber-400 bg-amber-500/15 text-white shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                : "border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/8"
            }`}
          >
            <span className="text-xl w-8 text-center">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
