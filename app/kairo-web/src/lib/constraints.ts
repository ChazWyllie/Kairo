/**
 * Constraint types for plan generation.
 *
 * NOTE: The full validateConstraints() function with Zod validation
 * is added in PR10 (constraints engine). This file provides the
 * type definitions used by the plan generator.
 */

export type ConstraintInput = {
  timeAvailable: number;
  equipment: string;
  goal: string;
  experience?: string;
  travelMode?: boolean;
  highStress?: boolean;
  lowSleep?: boolean;
  injuryLimitation?: string;
  noJumping?: boolean;
};

export type NormalizedConstraints = {
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
  optional: {
    injuryLimitation: string | null;
    noJumping: boolean;
  };
};

export type ConstraintResult =
  | { success: true; normalized: NormalizedConstraints }
  | { success: false; errors: string[] };
