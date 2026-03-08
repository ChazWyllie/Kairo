"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

/**
 * Extended onboarding form — collects full intake after sign-up.
 * Linked from the welcome email. Identified by email (no auth in MVP).
 *
 * Multi-step: Basics → Training → Nutrition → Lifestyle → Commitment
 * All fields optional except email (identity check).
 */

const GOALS = [
  { value: "fat_loss", label: "Fat Loss" },
  { value: "muscle", label: "Build Muscle" },
  { value: "maintenance", label: "Stay Consistent" },
] as const;

const TIME_OPTIONS = [15, 20, 30, 45, 60] as const;

const GYM_ACCESS = [
  { value: "none", label: "No equipment" },
  { value: "hotel", label: "Hotel gym" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "full_gym", label: "Full gym" },
] as const;

const APPETITE_LEVELS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
] as const;

const STRESS_LEVELS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
] as const;

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (desk job)" },
  { value: "light", label: "Light (some walking)" },
  { value: "moderate", label: "Moderate (on feet)" },
  { value: "active", label: "Active (physical job)" },
] as const;

type OnboardingStep = "basics" | "training" | "nutrition" | "lifestyle" | "commitment";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("basics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Identity
  const [email, setEmail] = useState("");

  // Basics (Phase 4)
  const [fullName, setFullName] = useState("");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [minutesPerSession, setMinutesPerSession] = useState<number>(30);
  const [injuries, setInjuries] = useState("");

  // Extended — personal
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [timezone, setTimezone] = useState("");

  // Training
  const [yearsTraining, setYearsTraining] = useState("");
  const [currentSplit, setCurrentSplit] = useState("");
  const [favoriteLifts, setFavoriteLifts] = useState("");
  const [weakBodyParts, setWeakBodyParts] = useState("");
  const [equipmentAccess, setEquipmentAccess] = useState("");

  // Nutrition
  const [currentCalories, setCurrentCalories] = useState("");
  const [proteinIntake, setProteinIntake] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("");
  const [foodsEnjoy, setFoodsEnjoy] = useState("");
  const [foodsAvoid, setFoodsAvoid] = useState("");
  const [appetiteLevel, setAppetiteLevel] = useState("");
  const [weekendEating, setWeekendEating] = useState("");
  const [alcoholIntake, setAlcoholIntake] = useState("");
  const [supplements, setSupplements] = useState("");

  // Lifestyle
  const [avgSleep, setAvgSleep] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [stepCount, setStepCount] = useState("");
  const [jobActivityLevel, setJobActivityLevel] = useState("");
  const [travelFrequency, setTravelFrequency] = useState("");

  // Commitment
  const [fallOffCause, setFallOffCause] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [success90Days, setSuccess90Days] = useState("");

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/onboarding" } });
  }, []);

  const steps: OnboardingStep[] = ["basics", "training", "nutrition", "lifestyle", "commitment"];
  const currentIdx = steps.indexOf(step);
  const progress = ((currentIdx + 1) / steps.length) * 100;

  function goNext() {
    const nextIdx = currentIdx + 1;
    if (nextIdx < steps.length) setStep(steps[nextIdx]);
  }
  function goBack() {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(steps[prevIdx]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter the email you used to sign up.");
      setStep("basics");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        email,
        goal: goal || undefined,
        daysPerWeek,
        minutesPerSession,
        injuries: injuries.trim() || undefined,
      };

      // Extended fields — only include if filled
      if (fullName.trim()) body.fullName = fullName.trim();
      if (age) body.age = parseInt(age, 10);
      if (height.trim()) body.height = height.trim();
      if (currentWeight.trim()) body.currentWeight = currentWeight.trim();
      if (timezone.trim()) body.timezone = timezone.trim();
      if (yearsTraining) body.yearsTraining = parseInt(yearsTraining, 10);
      if (currentSplit.trim()) body.currentSplit = currentSplit.trim();
      if (favoriteLifts.trim()) body.favoriteLifts = favoriteLifts.trim();
      if (weakBodyParts.trim()) body.weakBodyParts = weakBodyParts.trim();
      if (equipmentAccess) body.equipmentAccess = equipmentAccess;
      if (currentCalories) body.currentCalories = parseInt(currentCalories, 10);
      if (proteinIntake) body.proteinIntake = parseInt(proteinIntake, 10);
      if (mealsPerDay) body.mealsPerDay = parseInt(mealsPerDay, 10);
      if (foodsEnjoy.trim()) body.foodsEnjoy = foodsEnjoy.trim();
      if (foodsAvoid.trim()) body.foodsAvoid = foodsAvoid.trim();
      if (appetiteLevel) body.appetiteLevel = appetiteLevel;
      if (weekendEating.trim()) body.weekendEating = weekendEating.trim();
      if (alcoholIntake.trim()) body.alcoholIntake = alcoholIntake.trim();
      if (supplements.trim()) body.supplements = supplements.trim();
      if (avgSleep) body.avgSleep = parseFloat(avgSleep);
      if (stressLevel) body.stressLevel = stressLevel;
      if (stepCount) body.stepCount = parseInt(stepCount, 10);
      if (jobActivityLevel) body.jobActivityLevel = jobActivityLevel;
      if (travelFrequency.trim()) body.travelFrequency = travelFrequency.trim();
      if (fallOffCause.trim()) body.fallOffCause = fallOffCause.trim();
      if (supportNeeded.trim()) body.supportNeeded = supportNeeded.trim();
      if (success90Days.trim()) body.success90Days = success90Days.trim();

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
            first plan. Expect it within 48 hours.
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

  // ── Shared input class ──
  const inputClass = "w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900";

  // ── Pill button helper ──
  function PillSelect({
    options,
    value,
    onChange,
  }: {
    options: readonly { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              value === o.value
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Tell us about yourself</h1>
        <p className="mt-2 text-neutral-600">
          This helps us build a plan that fits your life. Everything is optional
          except your email.
        </p>

        {/* Progress bar */}
        <div className="mt-6 mb-8">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>
              {step === "basics" && "Basics"}
              {step === "training" && "Training"}
              {step === "nutrition" && "Nutrition"}
              {step === "lifestyle" && "Lifestyle"}
              {step === "commitment" && "Commitment"}
            </span>
            <span>{currentIdx + 1} / {steps.length}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-black transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {/* ── Step 1: Basics ── */}
          {step === "basics" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="ob-email" className="block text-sm font-medium">
                  Email (used to sign up) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ob-email"
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="ob-name" className="block text-sm font-medium">
                  Full name <span className="text-neutral-400">(optional)</span>
                </label>
                <input
                  id="ob-name"
                  type="text"
                  className={inputClass}
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ob-age" className="block text-sm font-medium">Age</label>
                  <input id="ob-age" type="number" min={13} max={120} className={inputClass}
                    value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-height" className="block text-sm font-medium">Height</label>
                  <input id="ob-height" type="text" className={inputClass}
                    value={height} onChange={(e) => setHeight(e.target.value)} placeholder="5'10&quot;" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-weight" className="block text-sm font-medium">Weight</label>
                  <input id="ob-weight" type="text" className={inputClass}
                    value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="180 lbs" />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Primary goal <span className="text-neutral-400">(optional)</span>
                </legend>
                <PillSelect options={GOALS} value={goal} onChange={setGoal} />
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="ob-days" className="block text-sm font-medium">
                  Training days per week
                </label>
                <input id="ob-days" type="range" min={1} max={7} value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))} className="w-full accent-black" />
                <p className="text-sm text-neutral-600">{daysPerWeek} days</p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Time per session</legend>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((m) => (
                    <button key={m} type="button" onClick={() => setMinutesPerSession(m)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        minutesPerSession === m
                          ? "border-black bg-black text-white"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                      }`}
                    >{m} min</button>
                  ))}
                </div>
              </fieldset>

              <button type="button" onClick={goNext}
                className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium">
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Training ── */}
          {step === "training" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Training Details</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ob-years" className="block text-sm font-medium">Years training</label>
                  <input id="ob-years" type="number" min={0} max={50} className={inputClass}
                    value={yearsTraining} onChange={(e) => setYearsTraining(e.target.value)} placeholder="3" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-split" className="block text-sm font-medium">Current split</label>
                  <input id="ob-split" type="text" className={inputClass}
                    value={currentSplit} onChange={(e) => setCurrentSplit(e.target.value)} placeholder="PPL, Upper/Lower" />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="ob-lifts" className="block text-sm font-medium">Favorite lifts</label>
                <input id="ob-lifts" type="text" className={inputClass}
                  value={favoriteLifts} onChange={(e) => setFavoriteLifts(e.target.value)} placeholder="Squat, bench, deadlift" />
              </div>

              <div className="space-y-1">
                <label htmlFor="ob-weak" className="block text-sm font-medium">Weak body parts</label>
                <input id="ob-weak" type="text" className={inputClass}
                  value={weakBodyParts} onChange={(e) => setWeakBodyParts(e.target.value)} placeholder="Shoulders, calves" />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Equipment access</legend>
                <PillSelect options={GYM_ACCESS} value={equipmentAccess} onChange={setEquipmentAccess} />
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="ob-injuries" className="block text-sm font-medium">
                  Injuries or limitations
                </label>
                <textarea id="ob-injuries" className={inputClass} rows={2}
                  placeholder="e.g., Bad left knee, no jumping"
                  value={injuries} onChange={(e) => setInjuries(e.target.value)} maxLength={500} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium">
                  ← Back
                </button>
                <button type="button" onClick={goNext}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Nutrition ── */}
          {step === "nutrition" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Nutrition</h2>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ob-cals" className="block text-sm font-medium">Calories</label>
                  <input id="ob-cals" type="number" min={500} max={10000} className={inputClass}
                    value={currentCalories} onChange={(e) => setCurrentCalories(e.target.value)} placeholder="2200" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-protein" className="block text-sm font-medium">Protein (g)</label>
                  <input id="ob-protein" type="number" min={0} max={500} className={inputClass}
                    value={proteinIntake} onChange={(e) => setProteinIntake(e.target.value)} placeholder="160" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-meals" className="block text-sm font-medium">Meals/day</label>
                  <input id="ob-meals" type="number" min={1} max={10} className={inputClass}
                    value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} placeholder="3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ob-enjoy" className="block text-sm font-medium">Foods you enjoy</label>
                  <input id="ob-enjoy" type="text" className={inputClass}
                    value={foodsEnjoy} onChange={(e) => setFoodsEnjoy(e.target.value)} placeholder="Chicken, rice, eggs" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-avoid" className="block text-sm font-medium">Foods you avoid</label>
                  <input id="ob-avoid" type="text" className={inputClass}
                    value={foodsAvoid} onChange={(e) => setFoodsAvoid(e.target.value)} placeholder="Dairy, shellfish" />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Appetite level</legend>
                <PillSelect options={APPETITE_LEVELS} value={appetiteLevel} onChange={setAppetiteLevel} />
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="ob-weekend" className="block text-sm font-medium">Weekend eating patterns</label>
                <input id="ob-weekend" type="text" className={inputClass}
                  value={weekendEating} onChange={(e) => setWeekendEating(e.target.value)}
                  placeholder="Usually eat out Sat/Sun" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ob-alcohol" className="block text-sm font-medium">Alcohol intake</label>
                  <input id="ob-alcohol" type="text" className={inputClass}
                    value={alcoholIntake} onChange={(e) => setAlcoholIntake(e.target.value)} placeholder="Social weekends" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-supps" className="block text-sm font-medium">Supplements</label>
                  <input id="ob-supps" type="text" className={inputClass}
                    value={supplements} onChange={(e) => setSupplements(e.target.value)} placeholder="Creatine, whey" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium">
                  ← Back
                </button>
                <button type="button" onClick={goNext}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Lifestyle ── */}
          {step === "lifestyle" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Lifestyle & Recovery</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ob-sleep" className="block text-sm font-medium">Avg sleep (hours)</label>
                  <input id="ob-sleep" type="number" min={0} max={24} step={0.5} className={inputClass}
                    value={avgSleep} onChange={(e) => setAvgSleep(e.target.value)} placeholder="7.5" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-steps" className="block text-sm font-medium">Daily step count</label>
                  <input id="ob-steps" type="number" min={0} max={100000} className={inputClass}
                    value={stepCount} onChange={(e) => setStepCount(e.target.value)} placeholder="8000" />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Stress level</legend>
                <PillSelect options={STRESS_LEVELS} value={stressLevel} onChange={setStressLevel} />
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Job activity level</legend>
                <PillSelect options={ACTIVITY_LEVELS} value={jobActivityLevel} onChange={setJobActivityLevel} />
              </fieldset>

              <div className="space-y-1">
                <label htmlFor="ob-travel" className="block text-sm font-medium">Travel frequency</label>
                <input id="ob-travel" type="text" className={inputClass}
                  value={travelFrequency} onChange={(e) => setTravelFrequency(e.target.value)}
                  placeholder="1-2x per month" />
              </div>

              <div className="space-y-1">
                <label htmlFor="ob-tz" className="block text-sm font-medium">Timezone</label>
                <input id="ob-tz" type="text" className={inputClass}
                  value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="EST / PST / GMT" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium">
                  ← Back
                </button>
                <button type="button" onClick={goNext}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Commitment ── */}
          {step === "commitment" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Commitment & Goals</h2>

              <div className="space-y-1">
                <label htmlFor="ob-falloff" className="block text-sm font-medium">
                  What usually causes you to fall off?
                </label>
                <textarea id="ob-falloff" className={inputClass} rows={2}
                  value={fallOffCause} onChange={(e) => setFallOffCause(e.target.value)}
                  placeholder="Travel, busy schedule, lack of motivation" maxLength={1000} />
              </div>

              <div className="space-y-1">
                <label htmlFor="ob-support" className="block text-sm font-medium">
                  What support do you need most from a coach?
                </label>
                <textarea id="ob-support" className={inputClass} rows={2}
                  value={supportNeeded} onChange={(e) => setSupportNeeded(e.target.value)}
                  placeholder="Accountability, programming, nutrition guidance" maxLength={1000} />
              </div>

              <div className="space-y-1">
                <label htmlFor="ob-90days" className="block text-sm font-medium">
                  What does success look like in 90 days?
                </label>
                <textarea id="ob-90days" className={inputClass} rows={2}
                  value={success90Days} onChange={(e) => setSuccess90Days(e.target.value)}
                  placeholder="Lose 15 lbs, hit gym 4x/week consistently" maxLength={1000} />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={goBack}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700 font-medium">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-white font-medium transition-opacity disabled:opacity-60">
                  {loading ? "Saving…" : "Submit"}
                </button>
              </div>

              <p className="text-xs text-neutral-500 text-center">
                All fields are optional. You can always update later.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
