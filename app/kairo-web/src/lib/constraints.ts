import { z } from "zod/v4";
import { escapeHtml } from "./sanitize";

// ── Types ──

const TimeAvailable = z.union([
  z.literal(15),
  z.literal(20),
  z.literal(30),
  z.literal(45),
  z.literal(60),
]);

const Equipment = z.enum(["none", "hotel", "dumbbells", "full_gym"]);

const Goal = z.enum(["fat_loss", "muscle", "maintenance"]);

const Experience = z.enum(["beginner", "intermediate"]);

const ContextSchema = z
  .object({
    travelMode: z.boolean().default(false),
    highStress: z.boolean().default(false),
    lowSleep: z.boolean().default(false),
  })
  .default({ travelMode: false, highStress: false, lowSleep: false });

const PreferencesSchema = z.object({
  goal: Goal,
  experience: Experience,
});

const OptionalSchema = z
  .object({
    injuryLimitation: z
      .string()
      .trim()
      .transform((val) => escapeHtml(val))
      .transform((val) => (val.length > 200 ? val.slice(0, 200) : val))
      .nullable()
      .default(null),
    noJumping: z.boolean().default(false),
  })
  .default({ injuryLimitation: null, noJumping: false });

const ConstraintInputSchema = z.object({
  timeAvailable: TimeAvailable,
  equipment: Equipment,
  context: ContextSchema,
  preferences: PreferencesSchema,
  optional: OptionalSchema,
});

export type ConstraintInput = {
  timeAvailable: 15 | 20 | 30 | 45 | 60;
  equipment: "none" | "hotel" | "dumbbells" | "full_gym";
  context: {
    travelMode: boolean;
    highStress: boolean;
    lowSleep: boolean;
  };
  preferences: {
    goal: "fat_loss" | "muscle" | "maintenance";
    experience: "beginner" | "intermediate";
  };
  optional?: {
    injuryLimitation: string | null;
    noJumping: boolean;
  };
};

export type NormalizedConstraints = Required<ConstraintInput> & {
  optional: { injuryLimitation: string | null; noJumping: boolean };
};

export type ConstraintResult = {
  valid: boolean;
  normalized: NormalizedConstraints | null;
  errors: string[];
};

// ── Main function ──

export function validateConstraints(input: ConstraintInput): ConstraintResult {
  const result = ConstraintInputSchema.safeParse(input);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    return { valid: false, normalized: null, errors };
  }

  return {
    valid: true,
    normalized: result.data as NormalizedConstraints,
    errors: [],
  };
}
