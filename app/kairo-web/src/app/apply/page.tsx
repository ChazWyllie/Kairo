"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { type BillingInterval } from "@/lib/stripe-prices";
import { COACHING_TIERS } from "@/lib/products";

/**
 * Application form — pre-payment screening.
 *
 * Flow: /apply -> submit -> pending review -> coach approves -> payment link sent
 *
 * Required: email, fullName, goal
 * Everything else is optional but helps coach qualify the lead.
 *
 * Accepts ?tier= param from /quiz/result to pre-select the preferred tier.
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
  { value: "standard", name: COACHING_TIERS.standard.name, desc: COACHING_TIERS.standard.tagline },
  { value: "premium", name: COACHING_TIERS.premium.name, desc: COACHING_TIERS.premium.tagline },
] as const;

const VALID_APPLY_TIERS = ["standard", "premium"] as const;

const STEP_LABELS: Record<ApplyStep, string> = {
  info: "Info",
  training: "Training",
  goals: "Goals",
  review: "Review",
};

// Shared dark input class used across all form fields
const inputClass = [
  "w-full rounded-[var(--radius-md)] border px-4 py-3 text-base outline-none",
  "transition-all duration-150",
  "placeholder:text-[var(--text-tertiary)]",
].join(" ");

const inputStyle = {
  background: "var(--bg-tertiary)",
  color: "var(--text-primary)",
  borderColor: "var(--border-hover)",
  fontSize: "16px", // prevents iOS zoom
} as const;

const inputFocusStyle = {
  borderColor: "var(--accent-primary)",
  boxShadow: "0 0 0 3px var(--accent-glow)",
} as const;

function FormInput({
  id, label, required, optional, error, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium"
        style={{ color: error ? "#f87171" : "var(--text-primary)" }}
      >
        {label}
        {required && <span className="ml-1" style={{ color: "var(--accent-primary)" }}>*</span>}
        {optional && <span className="ml-1 text-xs" style={{ color: "var(--text-tertiary)" }}>(optional)</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}

function ChoiceButton({
  selected, onClick, children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[var(--radius-sm)] border px-4 py-2.5 text-sm font-medium transition-all duration-150"
      style={{
        borderColor: selected ? "var(--accent-primary)" : "var(--border-hover)",
        background: selected ? "rgba(224,255,79,0.08)" : "var(--bg-tertiary)",
        color: selected ? "var(--accent-primary)" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function ApplyContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<ApplyStep>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    searchParams.get("interval") === "annual" ? "annual" : "monthly"
  );

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

  useEffect(() => {
    const tierParam = searchParams.get("tier");
    if (tierParam && (VALID_APPLY_TIERS as readonly string[]).includes(tierParam)) {
      setPreferredTier(tierParam);
    }
  }, [searchParams]);

  const currentIdx = APPLY_STEPS.indexOf(step);

  function getTierLabel(tier: (typeof TIERS)[number]) {
    const coachingTier = COACHING_TIERS[tier.value as keyof typeof COACHING_TIERS];
    if (!coachingTier) return tier.name;
    return `${tier.name} · $${coachingTier.price}/mo`;
  }

  function goNext() {
    const errors = validateApplyStep(step, { email, fullName, goal });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please correct the highlighted fields before continuing.");
      return;
    }
    setError(null);
    const nextStep = getNextApplyStep(step);
    if (nextStep) setStep(nextStep);
  }

  function goBack() {
    setFieldErrors({});
    setError(null);
    const previousStep = getPreviousApplyStep(step);
    if (previousStep) setStep(previousStep);
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
      const body: Record<string, unknown> = { email, fullName: fullName.trim(), goal };
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
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to submit application.");

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
    const registerUrl = `/register?email=${encodeURIComponent(email)}`;

    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="w-full max-w-lg text-center">
          {/* Confirmation mark */}
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold mb-6 animate-scale-in"
            style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
          >
            ✓
          </div>
          <h1
            className="font-display font-black text-3xl mb-3"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Application Received
          </h1>
          <p className="text-base mb-10" style={{ color: "var(--text-secondary)" }}>
            Thanks {fullName.split(" ")[0]}! We will review your application and reach out with next steps within 24 to 48 hours.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              while you wait
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          {/* Create account card */}
          <div
            className="rounded-[var(--radius-lg)] p-6 text-left"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <h2
              className="font-display font-bold text-xl mb-1"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Set Up Your Account
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Create a password so you can log in as soon as your application is approved.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href={registerUrl}
                className="w-full rounded-[var(--radius-md)] py-4 text-base font-semibold text-center transition-all duration-200 hover:-translate-y-px btn-glow block"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
              >
                Create Account
              </Link>
              <Link
                href="/"
                className="text-sm text-center transition-colors duration-150"
                style={{ color: "var(--text-tertiary)" }}
              >
                I will do this later
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Multi-step form ──
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Back to home */}
      <div className="px-5 md:px-10 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm transition-colors duration-150"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span aria-hidden="true">←</span> Back to home
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-5 py-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1
            className="font-display font-black text-3xl sm:text-4xl"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Apply for Coaching
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Tell us about yourself so we can build the right plan for you.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-2">
            {APPLY_STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === currentIdx ? "10px" : "8px",
                      height: i === currentIdx ? "10px" : "8px",
                      background: i <= currentIdx ? "var(--accent-primary)" : "var(--border-hover)",
                      boxShadow: i === currentIdx ? "0 0 8px var(--accent-glow)" : "none",
                    }}
                  />
                  <span
                    className="text-[10px] font-medium uppercase truncate transition-colors duration-200"
                    style={{
                      letterSpacing: "0.06em",
                      color: i <= currentIdx ? "var(--text-primary)" : "var(--text-tertiary)",
                    }}
                  >
                    {STEP_LABELS[s as ApplyStep]}
                  </span>
                </div>
                {i < APPLY_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mb-4 transition-colors duration-500"
                    style={{
                      background: i < currentIdx ? "var(--accent-primary)" : "var(--border-subtle)",
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {/* ── Step 1: Basic Info ── */}
          {step === "info" && (
            <div className="space-y-5 animate-slide-up">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Basic Information
              </h2>

              <FormInput id="apply-name" label="Full name" required error={fieldErrors.fullName}>
                <input
                  id="apply-name"
                  type="text"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: fieldErrors.fullName ? "#f87171" : "var(--border-hover)",
                  }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = fieldErrors.fullName ? "#f87171" : "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError(null);
                    setFieldErrors((prev) => { const { fullName: _, ...rest } = prev; return rest; });
                  }}
                  required
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.fullName}
                />
              </FormInput>

              <FormInput id="apply-email" label="Email" required error={fieldErrors.email}>
                <input
                  id="apply-email"
                  type="email"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: fieldErrors.email ? "#f87171" : "var(--border-hover)",
                  }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = fieldErrors.email ? "#f87171" : "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setFieldErrors((prev) => { const { email: _, ...rest } = prev; return rest; });
                  }}
                  required
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                />
              </FormInput>

              <FormInput id="apply-phone" label="Phone" optional>
                <input
                  id="apply-phone"
                  type="tel"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </FormInput>

              <FormInput id="apply-age" label="Age" optional>
                <input
                  id="apply-age"
                  type="number"
                  min={13}
                  max={120}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </FormInput>

              {error && <p className="text-sm" style={{ color: "#f87171" }} role="alert">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-[var(--radius-md)] py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-px btn-glow"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2: Training Background ── */}
          {step === "training" && (
            <div className="space-y-5 animate-slide-up">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Training Background
              </h2>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Training experience
                </legend>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <ChoiceButton
                      key={exp.value}
                      selected={trainingExperience === exp.value}
                      onClick={() => setTrainingExperience(exp.value)}
                    >
                      {exp.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>

              <FormInput id="apply-freq" label="Current training frequency">
                <input
                  id="apply-freq"
                  type="text"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="e.g. 3x per week, inconsistent"
                  value={trainingFrequency}
                  onChange={(e) => { setTrainingFrequency(e.target.value); setError(null); }}
                />
              </FormInput>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Gym access
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GYM_ACCESS.map((g) => (
                    <ChoiceButton
                      key={g.value}
                      selected={gymAccess === g.value}
                      onClick={() => setGymAccess(g.value)}
                    >
                      {g.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>

              <FormInput id="apply-injuries" label="Injury history">
                <textarea
                  id="apply-injuries"
                  className={inputClass}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  rows={2}
                  placeholder="e.g. ACL tear 2024, chronic lower back pain"
                  value={injuryHistory}
                  onChange={(e) => { setInjuryHistory(e.target.value); setError(null); }}
                  maxLength={1000}
                />
              </FormInput>

              {error && <p className="text-sm" style={{ color: "#f87171" }} role="alert">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-[var(--radius-md)] border py-3.5 text-base font-medium transition-all duration-150"
                  style={{ borderColor: "var(--border-hover)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-[var(--radius-md)] py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-px btn-glow"
                  style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Goals ── */}
          {step === "goals" && (
            <div className="space-y-5 animate-slide-up">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Goals and Motivation
              </h2>

              <fieldset
                className="space-y-2"
                style={fieldErrors.goal ? { borderRadius: "var(--radius-sm)", border: "1px solid #f87171", padding: "12px" } : {}}
              >
                <legend
                  className="text-sm font-medium"
                  style={{ color: fieldErrors.goal ? "#f87171" : "var(--text-primary)" }}
                >
                  Primary goal <span style={{ color: "var(--accent-primary)" }}>*</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <ChoiceButton
                      key={g.value}
                      selected={goal === g.value}
                      onClick={() => {
                        setGoal(g.value);
                        setError(null);
                        setFieldErrors((prev) => { const { goal: _, ...rest } = prev; return rest; });
                      }}
                    >
                      {g.label}
                    </ChoiceButton>
                  ))}
                </div>
                {fieldErrors.goal && <p className="text-xs" style={{ color: "#f87171" }}>{fieldErrors.goal}</p>}
              </fieldset>

              <FormInput id="apply-whynow" label="Why now? What made you decide to seek coaching?">
                <textarea
                  id="apply-whynow"
                  className={inputClass}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  rows={3}
                  placeholder="What is driving you to make a change right now?"
                  value={whyNow}
                  onChange={(e) => { setWhyNow(e.target.value); setError(null); }}
                  maxLength={1000}
                />
              </FormInput>

              <FormInput id="apply-nutrition" label="Nutrition struggles">
                <textarea
                  id="apply-nutrition"
                  className={inputClass}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  rows={2}
                  placeholder="e.g. late night snacking, meal prep, eating out"
                  value={nutritionStruggles}
                  onChange={(e) => { setNutritionStruggles(e.target.value); setError(null); }}
                  maxLength={1000}
                />
              </FormInput>

              <FormInput id="apply-obstacle" label="Biggest obstacle to consistency">
                <input
                  id="apply-obstacle"
                  type="text"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="e.g. time, motivation, knowledge"
                  value={biggestObstacle}
                  onChange={(e) => { setBiggestObstacle(e.target.value); setError(null); }}
                />
              </FormInput>

              <FormInput id="apply-help" label="What do you want help with most?">
                <input
                  id="apply-help"
                  type="text"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-hover)"; e.target.style.boxShadow = "none"; }}
                  placeholder="e.g. training structure, nutrition, accountability"
                  value={helpWithMost}
                  onChange={(e) => { setHelpWithMost(e.target.value); setError(null); }}
                />
              </FormInput>

              {error && <p className="text-sm" style={{ color: "#f87171" }} role="alert">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-[var(--radius-md)] border py-3.5 text-base font-medium transition-all duration-150"
                  style={{ borderColor: "var(--border-hover)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-[var(--radius-md)] py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-px btn-glow"
                  style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === "review" && (
            <div className="space-y-5 animate-slide-up">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Choose Your Plan
              </h2>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3" role="group" aria-label="Billing interval">
                {(["monthly", "annual"] as const).map((iv) => (
                  <button
                    key={iv}
                    type="button"
                    onClick={() => setBillingInterval(iv)}
                    aria-pressed={billingInterval === iv}
                    className="text-sm font-medium transition-colors duration-150 capitalize"
                    style={{ color: billingInterval === iv ? "var(--text-primary)" : "var(--text-tertiary)" }}
                  >
                    {iv}
                  </button>
                ))}
              </div>

              {/* Tier selection */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Preferred plan <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
                </legend>
                {TIERS.map((t) => {
                  const coachingTier = COACHING_TIERS[t.value as keyof typeof COACHING_TIERS];
                  const monthlyPrice = coachingTier ? coachingTier.price : null;
                  const displayPrice = monthlyPrice !== null && billingInterval === "annual"
                    ? Math.round(monthlyPrice * 0.9)
                    : monthlyPrice;
                  const isSelected = preferredTier === t.value;

                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setPreferredTier(t.value); setError(null); }}
                      className="w-full text-left rounded-[var(--radius-md)] border px-4 py-3.5 transition-all duration-150"
                      style={{
                        borderColor: isSelected ? "var(--accent-primary)" : "var(--border-hover)",
                        background: isSelected ? "rgba(224,255,79,0.05)" : "var(--bg-secondary)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="font-medium text-sm"
                          style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-primary)" }}
                        >
                          {t.name}
                          {displayPrice !== null && (
                            <span className="ml-2 font-normal" style={{ color: "var(--text-tertiary)" }}>
                              ${displayPrice}/mo
                            </span>
                          )}
                        </p>
                        {isSelected && (
                          <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </fieldset>

              {/* Commitment checkbox */}
              <label
                className="flex items-start gap-3 cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={readyForStructure}
                  onChange={(e) => { setReadyForStructure(e.target.checked); setError(null); }}
                  className="mt-1 h-4 w-4 shrink-0"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
                <span className="text-sm">
                  I am ready to follow a structured plan and commit to the process.
                </span>
              </label>

              {/* Summary */}
              <div
                className="rounded-[var(--radius-md)] p-4 text-sm space-y-1"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                  Application Summary
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  {fullName || "..."} · {email || "..."}
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  Goal: {GOALS.find((g) => g.value === goal)?.label || "Not selected"}
                  {trainingExperience &&
                    ` · ${EXPERIENCE_LEVELS.find((e) => e.value === trainingExperience)?.label}`}
                </p>
                {preferredTier && (
                  <p style={{ color: "var(--text-secondary)" }}>
                    Plan: {getTierLabel(TIERS.find((t) => t.value === preferredTier)!)}
                  </p>
                )}
              </div>

              {error && <p className="text-sm" style={{ color: "#f87171" }} role="alert">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-[var(--radius-md)] border py-3.5 text-base font-medium transition-all duration-150"
                  style={{ borderColor: "var(--border-hover)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-[var(--radius-md)] py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-px btn-glow disabled:opacity-60"
                  style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>

              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                We will review your application and reach out within 24 to 48 hours.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-primary)" }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>Loading...</p>
        </main>
      }
    >
      <ApplyContent />
    </Suspense>
  );
}
