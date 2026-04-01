import { isValidEmail } from "@/lib/validation";

export const APPLY_STEPS = ["info", "training", "goals", "review"] as const;

export type ApplyStep = (typeof APPLY_STEPS)[number];

export interface ApplyFlowValues {
  email: string;
  fullName: string;
  goal: string;
  trainingExperience: string;
}

export type ApplyFieldErrors = Record<string, string>;

export function validateApplyStep(step: ApplyStep, values: ApplyFlowValues): ApplyFieldErrors {
  const errors: ApplyFieldErrors = {};

  if (step === "info") {
    if (!values.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!values.email.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(values.email)) {
      errors.email = "Please enter a valid email.";
    }
  }

  if (step === "training" && !values.trainingExperience) {
    errors.trainingExperience = "Please select your experience level.";
  }

  if (step === "goals" && !values.goal) {
    errors.goal = "Please select a goal.";
  }

  return errors;
}

export function getNextApplyStep(step: ApplyStep): ApplyStep | null {
  const currentIndex = APPLY_STEPS.indexOf(step);
  if (currentIndex === -1 || currentIndex === APPLY_STEPS.length - 1) {
    return null;
  }

  return APPLY_STEPS[currentIndex + 1];
}

export function getPreviousApplyStep(step: ApplyStep): ApplyStep | null {
  const currentIndex = APPLY_STEPS.indexOf(step);
  if (currentIndex <= 0) {
    return null;
  }

  return APPLY_STEPS[currentIndex - 1];
}

export function validateApplySubmission(values: ApplyFlowValues): {
  errors: ApplyFieldErrors;
  firstInvalidStep: ApplyStep | null;
} {
  const infoErrors = validateApplyStep("info", values);
  if (Object.keys(infoErrors).length > 0) {
    return { errors: infoErrors, firstInvalidStep: "info" };
  }

  const trainingErrors = validateApplyStep("training", values);
  if (Object.keys(trainingErrors).length > 0) {
    return { errors: trainingErrors, firstInvalidStep: "training" };
  }

  const goalErrors = validateApplyStep("goals", values);
  if (Object.keys(goalErrors).length > 0) {
    return { errors: goalErrors, firstInvalidStep: "goals" };
  }

  return { errors: {}, firstInvalidStep: null };
}