"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import {
  APPLY_STEPS,
  getNextApplyStep,
  getPreviousApplyStep,
  validateApplyStep,
  validateApplySubmission,
  type ApplyStep,
} from "@/lib/apply-flow";

/**
 * Application form — pre-payment screening.
 *
 * Flow: /apply → submit → pending review → coach approves → payment link sent
 *
 * Required: email, fullName, goal
 * Everything else is optional but helps coach qualify the lead.
 */

const GOALS = [
  { value: "fat_loss", label: "Fat Loss" },
  { value: "muscle", label: "Build Muscle" },
  { value: "maintenance", label: "Stay Consistent" },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner (0-1 years)" },
  { value: "intermediate", label: "Intermediate (1-3 years)" },
  { value: "advanced", label: "Advanced (3+ years)" },
] as const;

const GYM_ACCESS = [
  { value: "none", label: "No equipment" },
  { value: "hotel", label: "Hotel gym" },
  { value: "dumbbells", label: "Dumbbells at home" },
  { value: "full_gym", label: "Full gym" },
] as const;

const TIERS = [
  { value: "foundation", label: "Foundation · $49/mo", desc: "Templates + async check-ins" },
  { value: "coaching", label: "Coaching · $129/mo", desc: "Personalized programming + priority support" },
  { value: "performance", label: "Performance · $229/mo", desc: "Video reviews + weekly calls" },
  { value: "vip", label: "VIP Elite · $349/mo", desc: "Daily access + priority everything" },
] as const;

export default function ApplyPage() {
  const [step, setStep] = useState<ApplyStep>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [trainingExperience, setTrainingExperience] = useState("");
  const [trainingFrequency, setTrainingFrequency] = useState("");
  const [gymAccess, setGymAccess] = useState("");
  const [injuryHistory, setInjuryHistory] = useState("");
  const [nutritionStruggles, setNutritionStruggles] = useState("");
  const [biggestObstacle, setBiggestObstacle] = useState("");
  const [helpWithMost, setHelpWithMost] = useState("");
  const [preferredTier, setPreferredTier] = useState("");
  const [readyForStructure, setReadyForStructure] = useState(false);

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/apply" } });
  }, []);

  const currentIdx = APPLY_STEPS.indexOf(step);
  const progress = ((currentIdx + 1) / APPLY_STEPS.length) * 100;

  function goNext() {
    const errors = validateApplyStep(step, { email, fullName, goal });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please correct the highlighted fields before continuing.");
      return;
    }

    setError(null);
    const nextStep = getNextApplyStep(step);
    if (nextStep) {
      setStep(nextStep);
    }
  }

  function goBack() {
    setFieldErrors({});
    setError(null);
    const previousStep = getPreviousApplyStep(step);
    if (previousStep) {
      setStep(previousStep);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (step !== "review") {
      goNext();
      return;
    }

    const submissionValidation = validateApplySubmission({ email, fullName, goal });
    if (submissionValidation.firstInvalidStep) {
      setFieldErrors(submissionValidation.errors);
      setError("Please complete the required fields before submitting.");
      setStep(submissionValidation.firstInvalidStep);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        email,
        fullName: fullName.trim(),
        goal,
      };

      // Only include optional fields if filled
      if (phone.trim()) body.phone = phone.trim();
      if (age) body.age = parseInt(age, 10);
      if (whyNow.trim()) body.whyNow = whyNow.trim();
      if (trainingExperience) body.trainingExperience = trainingExperience;
      if (trainingFrequency.trim()) body.trainingFrequency = trainingFrequency.trim();
      if (gymAccess) body.gymAccess = gymAccess;
      if (injuryHistory.trim()) body.injuryHistory = injuryHistory.trim();
      if (nutritionStruggles.trim()) body.nutritionStruggles = nutritionStruggles.trim();
      if (biggestObstacle.trim()) body.biggestObstacle = biggestObstacle.trim();
      if (helpWithMost.trim()) body.helpWithMost = helpWithMost.trim();
      if (preferredTier) body.preferredTier = preferredTier;
      if (readyForStructure) body.readyForStructure = true;

      const res = await fetch("/api/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to submit application.");
      }

      track({ name: "application_submitted", properties: { goal, tier: preferredTier || "none" } });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Done state ──
  if (done) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl mb-4">
            ✅
          </div>
          <h1 className="text-3xl font-semibold">Application Received</h1>
          <p className="mt-4 text-neutral-600 max-w-md mx-auto">
            Thanks for applying, {fullName.split(" ")[0]}! We&apos;ll review your
            application and get back to you with the next steps.
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
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Apply for Coaching</h1>
          <p className="mt-2 text-neutral-600">
            Tell us about yourself so we can build the right plan for you.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>Step {currentIdx + 1} of {APPLY_STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-black transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {/* ── Step 1: Basic Info ── */}
          {step === "info" && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold">Basic Information</h2>

              <div className="space-y-1">
                <label htmlFor="apply-name" className={`block text-sm font-medium ${fieldErrors.fullName ? "text-red-600" : ""}`}>
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="apply-name"
                  type="text"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    fieldErrors.fullName
                      ? "border-red-500 bg-red-50 focus:border-red-600"
                      : "border-neutral-300 focus:border-neutral-900"
                  }`}
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError(null);
                    setFieldErrors((prev) => { const { fullName: _, ...rest } = prev; return rest; });
                  }}
                  required
                />
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="apply-email" className={`block text-sm font-medium ${fieldErrors.email ? "text-red-600" : ""}`}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="apply-email"
                  type="email"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    fieldErrors.email
                      ? "border-red-500 bg-red-50 focus:border-red-600"
                      : "border-neutral-300 focus:border-neutral-900"
                  }`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setFieldErrors((prev) => { const { email: _, ...rest } = prev; return rest; });
                  }}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="apply-phone" className="block text-sm font-medium">
                  Phone <span className="text-neutral-400">(optional)</span>
                </label>
                <input
                  id="apply-phone"
                  type="tel"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="apply-age" className="block text-sm font-medium">
                  Age <span className="text-neutral-400">(optional)</span>
                </label>
                <input
                  id="apply-age"
                  type="number"
                  min={13}
                  max={120}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  placeholder="28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Training Background ── */}
          {step === "training" && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold">Training Background</h2>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Training experience</legend>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <button
                      key={exp.value}
                      type="button"
                      onClick={() => setTrainingExperience(exp.value)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        trainingExperience === exp.value
                          ? "border-black bg-black text-white"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="apply-freq" className="block text-sm font-medium">
                  Current training frequency
                </label>
                <input
                  id="apply-freq"
                  type="text"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  placeholder="e.g., 3x per week, inconsistent"
                  value={trainingFrequency}
                  onChange={(e) => {
                    setTrainingFrequency(e.target.value);
                    setError(null);
                  }}
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Gym access</legend>
                <div className="flex flex-wrap gap-2">
                  {GYM_ACCESS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGymAccess(g.value)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        gymAccess === g.value
                          ? "border-black bg-black text-white"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="apply-injuries" className="block text-sm font-medium">
                  Injury history
                </label>
                <textarea
                  id="apply-injuries"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  rows={2}
                  placeholder="e.g., ACL tear 2024, chronic lower back pain"
                  value={injuryHistory}
                  onChange={(e) => {
                    setInjuryHistory(e.target.value);
                    setError(null);
                  }}
                  maxLength={1000}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Goals & Struggles ── */}
          {step === "goals" && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold">Goals & Motivation</h2>

              <fieldset className={`space-y-2 ${fieldErrors.goal ? "rounded-xl border-2 border-red-400 p-3" : ""}`}>
                <legend className={`text-sm font-medium ${fieldErrors.goal ? "text-red-600" : ""}`}>
                  Primary goal <span className="text-red-500">*</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setGoal(g.value);
                        setError(null);
                        setFieldErrors((prev) => { const { goal: _, ...rest } = prev; return rest; });
                      }}
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
                {fieldErrors.goal && (
                  <p className="text-xs text-red-600">{fieldErrors.goal}</p>
                )}
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="apply-whynow" className="block text-sm font-medium">
                  Why now? What made you decide to seek coaching?
                </label>
                <textarea
                  id="apply-whynow"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  rows={3}
                  placeholder="What's driving you to make a change right now?"
                  value={whyNow}
                  onChange={(e) => {
                    setWhyNow(e.target.value);
                    setError(null);
                  }}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="apply-nutrition" className="block text-sm font-medium">
                  Nutrition struggles
                </label>
                <textarea
                  id="apply-nutrition"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  rows={2}
                  placeholder="e.g., late night snacking, meal prep, eating out"
                  value={nutritionStruggles}
                  onChange={(e) => {
                    setNutritionStruggles(e.target.value);
                    setError(null);
                  }}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="apply-obstacle" className="block text-sm font-medium">
                  Biggest obstacle to consistency
                </label>
                <input
                  id="apply-obstacle"
                  type="text"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  placeholder="e.g., time, motivation, knowledge"
                  value={biggestObstacle}
                  onChange={(e) => {
                    setBiggestObstacle(e.target.value);
                    setError(null);
                  }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="apply-help" className="block text-sm font-medium">
                  What do you want help with most?
                </label>
                <input
                  id="apply-help"
                  type="text"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  placeholder="e.g., programming, nutrition, accountability"
                  value={helpWithMost}
                  onChange={(e) => {
                    setHelpWithMost(e.target.value);
                    setError(null);
                  }}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Tier Selection ── */}
          {step === "review" && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold">Choose Your Plan & Submit</h2>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">
                  Preferred tier <span className="text-neutral-400">(optional)</span>
                </legend>
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setPreferredTier(t.value);
                      setError(null);
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      preferredTier === t.value
                        ? "border-black bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-neutral-500">{t.desc}</p>
                  </button>
                ))}
              </fieldset>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readyForStructure}
                  onChange={(e) => {
                    setReadyForStructure(e.target.checked);
                    setError(null);
                  }}
                  className="mt-1 h-4 w-4 accent-black"
                />
                <span className="text-sm">
                  I&apos;m ready to follow a structured plan and commit to the process.
                </span>
              </label>

              {/* Summary */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm space-y-1">
                <p className="font-medium">Application Summary</p>
                <p className="text-neutral-600">
                  {fullName || "…"} · {email || "…"}
                </p>
                <p className="text-neutral-600">
                  Goal: {GOALS.find((g) => g.value === goal)?.label || "Not selected"}
                  {trainingExperience && ` · ${EXPERIENCE_LEVELS.find((e) => e.value === trainingExperience)?.label}`}
                </p>
                {preferredTier && (
                  <p className="text-neutral-600">
                    Tier: {TIERS.find((t) => t.value === preferredTier)?.label}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium transition-opacity disabled:opacity-60"
                >
                  {loading ? "Submitting…" : "Submit Application"}
                </button>
              </div>

              <p className="text-xs text-neutral-500 text-center">
                We&apos;ll review your application and reach out within 24-48 hours.
              </p>
            </div>
          )}
        </form>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
