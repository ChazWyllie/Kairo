import { describe, it, expect } from "vitest";
import { validateConstraints } from "./constraints";
import type { ConstraintInput } from "./constraints";

// ── Helpers ──

function validInput(overrides: Partial<ConstraintInput> = {}): ConstraintInput {
  return {
    timeAvailable: 30,
    equipment: "full_gym",
    context: { travelMode: false, highStress: false, lowSleep: false },
    preferences: { goal: "fat_loss", experience: "intermediate" },
    ...overrides,
  };
}

// ────────────────────────────────────────────────
//  1. Valid input
// ────────────────────────────────────────────────

describe("validateConstraints — valid input", () => {
  it("accepts a fully valid input and returns valid: true", () => {
    const result = validateConstraints(validInput());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns normalized shape matching input when all fields provided", () => {
    const input = validInput();
    const result = validateConstraints(input);
    expect(result.normalized).toEqual({
      ...input,
      optional: { injuryLimitation: null, noJumping: false },
    });
  });

  it.each([15, 20, 30, 45, 60] as const)(
    "accepts timeAvailable = %d",
    (time) => {
      const result = validateConstraints(validInput({ timeAvailable: time }));
      expect(result.valid).toBe(true);
    }
  );

  it.each(["none", "hotel", "dumbbells", "full_gym"] as const)(
    "accepts equipment = %s",
    (eq) => {
      const result = validateConstraints(validInput({ equipment: eq }));
      expect(result.valid).toBe(true);
    }
  );

  it.each(["fat_loss", "muscle", "maintenance"] as const)(
    "accepts goal = %s",
    (goal) => {
      const result = validateConstraints(
        validInput({ preferences: { goal, experience: "beginner" } })
      );
      expect(result.valid).toBe(true);
    }
  );

  it.each(["beginner", "intermediate"] as const)(
    "accepts experience = %s",
    (exp) => {
      const result = validateConstraints(
        validInput({ preferences: { goal: "muscle", experience: exp } })
      );
      expect(result.valid).toBe(true);
    }
  );
});

// ────────────────────────────────────────────────
//  2. Missing required fields
// ────────────────────────────────────────────────

describe("validateConstraints — missing required fields", () => {
  it("returns error when timeAvailable is missing", () => {
    const { timeAvailable, ...rest } = validInput();
    const result = validateConstraints(rest as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error when equipment is missing", () => {
    const { equipment, ...rest } = validInput();
    const result = validateConstraints(rest as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
  });

  it("returns error when preferences is missing", () => {
    const { preferences, ...rest } = validInput();
    const result = validateConstraints(rest as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
  });

  it("returns error when preferences.goal is missing", () => {
    const input = validInput({
      preferences: { experience: "beginner" } as ConstraintInput["preferences"],
    });
    const result = validateConstraints(input);
    expect(result.valid).toBe(false);
  });

  it("returns error when preferences.experience is missing", () => {
    const input = validInput({
      preferences: { goal: "fat_loss" } as ConstraintInput["preferences"],
    });
    const result = validateConstraints(input);
    expect(result.valid).toBe(false);
  });
});

// ────────────────────────────────────────────────
//  3. Invalid enum values
// ────────────────────────────────────────────────

describe("validateConstraints — invalid enum values", () => {
  it("rejects invalid timeAvailable value", () => {
    const result = validateConstraints(
      validInput({ timeAvailable: 25 as ConstraintInput["timeAvailable"] })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects negative timeAvailable", () => {
    const result = validateConstraints(
      validInput({ timeAvailable: -30 as ConstraintInput["timeAvailable"] })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects zero timeAvailable", () => {
    const result = validateConstraints(
      validInput({ timeAvailable: 0 as ConstraintInput["timeAvailable"] })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects invalid equipment value", () => {
    const result = validateConstraints(
      validInput({ equipment: "kettlebell" as ConstraintInput["equipment"] })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects invalid goal value", () => {
    const result = validateConstraints(
      validInput({
        preferences: {
          goal: "bulking" as ConstraintInput["preferences"]["goal"],
          experience: "beginner",
        },
      })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects invalid experience value", () => {
    const result = validateConstraints(
      validInput({
        preferences: {
          goal: "muscle",
          experience: "advanced" as ConstraintInput["preferences"]["experience"],
        },
      })
    );
    expect(result.valid).toBe(false);
  });
});

// ────────────────────────────────────────────────
//  4. Defaults for optional fields
// ────────────────────────────────────────────────

describe("validateConstraints — defaults", () => {
  it("defaults context flags to false when context is omitted", () => {
    const { context, ...rest } = validInput();
    const result = validateConstraints(rest as unknown as ConstraintInput);
    expect(result.valid).toBe(true);
    expect(result.normalized!.context).toEqual({
      travelMode: false,
      highStress: false,
      lowSleep: false,
    });
  });

  it("defaults individual missing context flags to false", () => {
    const result = validateConstraints(
      validInput({ context: {} as ConstraintInput["context"] })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.context.travelMode).toBe(false);
    expect(result.normalized!.context.highStress).toBe(false);
    expect(result.normalized!.context.lowSleep).toBe(false);
  });

  it("defaults optional to { injuryLimitation: null, noJumping: false } when omitted", () => {
    const input = validInput();
    // Don't set optional
    const result = validateConstraints(input);
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional).toEqual({
      injuryLimitation: null,
      noJumping: false,
    });
  });

  it("defaults noJumping to false when only injuryLimitation is provided", () => {
    const result = validateConstraints(
      validInput({
        optional: { injuryLimitation: "bad knee" } as ConstraintInput["optional"],
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.noJumping).toBe(false);
  });

  it("defaults injuryLimitation to null when only noJumping is provided", () => {
    const result = validateConstraints(
      validInput({
        optional: { noJumping: true } as ConstraintInput["optional"],
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation).toBeNull();
  });
});

// ────────────────────────────────────────────────
//  5. Edge cases
// ────────────────────────────────────────────────

describe("validateConstraints — edge cases", () => {
  it("rejects empty object", () => {
    const result = validateConstraints({} as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects null input", () => {
    const result = validateConstraints(null as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
  });

  it("rejects undefined input", () => {
    const result = validateConstraints(undefined as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
  });

  it("strips extra top-level fields (deny-by-default)", () => {
    const input = { ...validInput(), admin: true, role: "superuser" };
    const result = validateConstraints(input as unknown as ConstraintInput);
    expect(result.valid).toBe(true);
    expect((result.normalized as Record<string, unknown>)["admin"]).toBeUndefined();
    expect((result.normalized as Record<string, unknown>)["role"]).toBeUndefined();
  });

  it("strips extra fields inside context", () => {
    const input = validInput({
      context: {
        travelMode: true,
        highStress: false,
        lowSleep: false,
        isAdmin: true,
      } as ConstraintInput["context"],
    });
    const result = validateConstraints(input);
    expect(result.valid).toBe(true);
    expect(
      (result.normalized!.context as Record<string, unknown>)["isAdmin"]
    ).toBeUndefined();
  });

  it("rejects string 'true' for boolean fields", () => {
    const input = validInput({
      context: {
        travelMode: "true" as unknown as boolean,
        highStress: false,
        lowSleep: false,
      },
    });
    const result = validateConstraints(input);
    expect(result.valid).toBe(false);
  });

  it("rejects string number for timeAvailable", () => {
    const result = validateConstraints(
      validInput({ timeAvailable: "30" as unknown as ConstraintInput["timeAvailable"] })
    );
    expect(result.valid).toBe(false);
  });

  it("truncates injury description longer than 200 chars", () => {
    const longDesc = "x".repeat(300);
    const result = validateConstraints(
      validInput({
        optional: { injuryLimitation: longDesc, noJumping: false },
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation!.length).toBeLessThanOrEqual(200);
  });

  it("accepts injury description at exactly 200 chars", () => {
    const desc = "x".repeat(200);
    const result = validateConstraints(
      validInput({
        optional: { injuryLimitation: desc, noJumping: false },
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation).toBe(desc);
  });

  it("trims whitespace from injury description", () => {
    const result = validateConstraints(
      validInput({
        optional: { injuryLimitation: "  bad knee  ", noJumping: false },
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation).toBe("bad knee");
  });

  it("returns multiple errors for multiple invalid fields", () => {
    const result = validateConstraints({
      timeAvailable: 999,
      equipment: "laser",
      preferences: { goal: "bulking", experience: "expert" },
    } as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ────────────────────────────────────────────────
//  6. Security tests
// ────────────────────────────────────────────────

describe("validateConstraints — security", () => {
  it("sanitizes XSS in injuryLimitation", () => {
    const result = validateConstraints(
      validInput({
        optional: {
          injuryLimitation: '<script>alert("xss")</script>bad knee',
          noJumping: false,
        },
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation).not.toContain("<script>");
    expect(result.normalized!.optional!.injuryLimitation).not.toContain("</script>");
  });

  it("sanitizes HTML tags in injuryLimitation", () => {
    const result = validateConstraints(
      validInput({
        optional: {
          injuryLimitation: '<img src=x onerror=alert(1)>knee pain',
          noJumping: false,
        },
      })
    );
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation).not.toContain("<img");
  });

  it("handles SQL injection payloads safely in injuryLimitation", () => {
    const result = validateConstraints(
      validInput({
        optional: {
          injuryLimitation: "'; DROP TABLE members; --",
          noJumping: false,
        },
      })
    );
    // SQL injection strings are valid text — Prisma parameterizes queries
    // Just ensure no crash and the value is sanitized/preserved
    expect(result.valid).toBe(true);
    expect(result.normalized!.optional!.injuryLimitation).toBeDefined();
  });

  it("blocks prototype pollution via __proto__", () => {
    const malicious = JSON.parse(
      '{"timeAvailable":30,"equipment":"full_gym","context":{"travelMode":false,"highStress":false,"lowSleep":false},"preferences":{"goal":"fat_loss","experience":"intermediate"},"__proto__":{"isAdmin":true}}'
    );
    const result = validateConstraints(malicious);
    expect(result.valid).toBe(true);
    // The attack payload should NOT appear on the normalized object
    expect((result.normalized as Record<string, unknown>)["isAdmin"]).toBeUndefined();
    // The prototype itself should not be polluted
    const proto = Object.getPrototypeOf(result.normalized) as Record<string, unknown>;
    expect(proto?.isAdmin).toBeUndefined();
    // __proto__ should not be an own property with the attack value
    expect(Object.getOwnPropertyDescriptor(result.normalized, "__proto__")).toBeUndefined();
  });

  it("blocks constructor pollution", () => {
    const input = {
      ...validInput(),
      constructor: { prototype: { isAdmin: true } },
    };
    const result = validateConstraints(input as unknown as ConstraintInput);
    expect(result.valid).toBe(true);
    // The attack payload should not end up as an own property
    expect(Object.hasOwn(result.normalized as object, "constructor")).toBe(false);
  });
});

// ────────────────────────────────────────────────
//  7. Function contract / purity
// ────────────────────────────────────────────────

describe("validateConstraints — function contract", () => {
  it("does not mutate the input object", () => {
    const input = validInput({
      optional: { injuryLimitation: "  sore shoulder  ", noJumping: true },
    });
    const frozen = JSON.parse(JSON.stringify(input));
    validateConstraints(input);
    expect(input).toEqual(frozen);
  });

  it("returns a new normalized object (not same reference)", () => {
    const input = validInput();
    const result = validateConstraints(input);
    expect(result.normalized).not.toBe(input);
  });

  it("always returns { valid, normalized, errors } shape", () => {
    const valid = validateConstraints(validInput());
    expect(valid).toHaveProperty("valid");
    expect(valid).toHaveProperty("normalized");
    expect(valid).toHaveProperty("errors");

    const invalid = validateConstraints({} as unknown as ConstraintInput);
    expect(invalid).toHaveProperty("valid");
    expect(invalid).toHaveProperty("normalized");
    expect(invalid).toHaveProperty("errors");
  });

  it("sets normalized to null when input is invalid", () => {
    const result = validateConstraints({} as unknown as ConstraintInput);
    expect(result.valid).toBe(false);
    expect(result.normalized).toBeNull();
  });
});
