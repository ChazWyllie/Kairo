import { describe, expect, it } from "vitest";

import {
  getNextApplyStep,
  getPreviousApplyStep,
  validateApplyStep,
  validateApplySubmission,
  type ApplyFlowValues,
} from "@/lib/apply-flow";

function makeValues(overrides: Partial<ApplyFlowValues> = {}): ApplyFlowValues {
  return {
    email: "member@example.com",
    fullName: "Test Member",
    goal: "fat_loss",
    trainingExperience: "intermediate",
    ...overrides,
  };
}

describe("apply-flow", () => {
  it("flags missing full name and email on the info step", () => {
    const errors = validateApplyStep(
      "info",
      makeValues({ email: "", fullName: "" })
    );

    expect(errors).toEqual({
      email: "Email is required.",
      fullName: "Full name is required.",
    });
  });

  it("flags malformed email on the info step", () => {
    const errors = validateApplyStep(
      "info",
      makeValues({ email: "bad-email" })
    );

    expect(errors.email).toBe("Please enter a valid email.");
  });

  it("flags missing training experience on the training step", () => {
    const errors = validateApplyStep("training", makeValues({ trainingExperience: "" }));

    expect(errors).toEqual({ trainingExperience: "Please select your experience level." });
  });

  it("flags missing goal on the goals step", () => {
    const errors = validateApplyStep("goals", makeValues({ goal: "" }));

    expect(errors).toEqual({ goal: "Please select a goal." });
  });

  it("returns the next and previous steps in sequence", () => {
    expect(getNextApplyStep("info")).toBe("training");
    expect(getNextApplyStep("training")).toBe("goals");
    expect(getPreviousApplyStep("review")).toBe("goals");
    expect(getPreviousApplyStep("info")).toBeNull();
  });

  it("returns the first invalid step for full submission", () => {
    const result = validateApplySubmission(
      makeValues({ email: "bad-email", goal: "" })
    );

    expect(result.firstInvalidStep).toBe("info");
    expect(result.errors.email).toBe("Please enter a valid email.");
  });

  it("allows submission when required fields are present", () => {
    const result = validateApplySubmission(makeValues());

    expect(result.firstInvalidStep).toBeNull();
    expect(result.errors).toEqual({});
  });
});