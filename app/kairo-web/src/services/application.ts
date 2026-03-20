/**
 * Application business logic — extracted from route handler.
 *
 * Pure data operations: no NextRequest/NextResponse, no HTTP concerns.
 * The route handler owns validation, auth, and response formatting.
 */
import { prisma } from "@/lib/prisma";
import {
  sendApplicationReceived,
  sendApplicationApproved,
  notifyAdminNewApplication,
} from "@/services/email";

// ── Types ──

export interface ApplicationInput {
  email: string;
  fullName: string;
  phone?: string | null;
  age?: number | null;
  height?: string | null;
  currentWeight?: string | null;
  goal: string;
  whyNow?: string | null;
  trainingExperience?: string | null;
  trainingFrequency?: string | null;
  gymAccess?: string | null;
  injuryHistory?: string | null;
  nutritionStruggles?: string | null;
  biggestObstacle?: string | null;
  helpWithMost?: string | null;
  preferredTier?: string | null;
  readyForStructure?: boolean;
  budgetComfort?: string | null;
}

export type SubmitResult =
  | { ok: true; applicationId: string }
  | { ok: false; code: "DUPLICATE" };

export type PatchResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" };

// ── Submit ──

export async function submitApplication(data: ApplicationInput): Promise<SubmitResult> {
  const { email, ...fields } = data;

  const existing = await prisma.application.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: "DUPLICATE" };
  }

  const [application] = await prisma.$transaction([
    prisma.application.create({
      data: {
        email,
        fullName: fields.fullName,
        phone: fields.phone ?? null,
        age: fields.age ?? null,
        height: fields.height ?? null,
        currentWeight: fields.currentWeight ?? null,
        goal: fields.goal,
        whyNow: fields.whyNow ?? null,
        trainingExperience: fields.trainingExperience ?? null,
        trainingFrequency: fields.trainingFrequency ?? null,
        gymAccess: fields.gymAccess ?? null,
        injuryHistory: fields.injuryHistory ?? null,
        nutritionStruggles: fields.nutritionStruggles ?? null,
        biggestObstacle: fields.biggestObstacle ?? null,
        helpWithMost: fields.helpWithMost ?? null,
        preferredTier: fields.preferredTier ?? null,
        readyForStructure: fields.readyForStructure ?? false,
        budgetComfort: fields.budgetComfort ?? null,
      },
    }),
    prisma.member.upsert({
      where: { email },
      create: {
        email,
        fullName: fields.fullName,
        status: "pending",
      },
      update: {},
    }),
  ]);

  console.log("[application] New application submitted:", { id: application.id });

  // Fire-and-forget email notifications
  sendApplicationReceived({ email, fullName: fields.fullName }).catch(
    (err) => console.error("[application] Failed to send confirmation email:", err)
  );
  notifyAdminNewApplication({
    applicantEmail: email,
    fullName: fields.fullName,
    phone: fields.phone,
    age: fields.age,
    height: fields.height,
    currentWeight: fields.currentWeight,
    goal: fields.goal,
    whyNow: fields.whyNow,
    trainingExperience: fields.trainingExperience,
    trainingFrequency: fields.trainingFrequency,
    gymAccess: fields.gymAccess,
    injuryHistory: fields.injuryHistory,
    nutritionStruggles: fields.nutritionStruggles,
    biggestObstacle: fields.biggestObstacle,
    helpWithMost: fields.helpWithMost,
    preferredTier: fields.preferredTier,
    readyForStructure: fields.readyForStructure,
    budgetComfort: fields.budgetComfort,
  }).catch((err) =>
    console.error("[application] Failed to notify admin:", err)
  );

  return { ok: true, applicationId: application.id };
}

// ── Lookup ──

export async function getApplicationByEmail(email: string) {
  return prisma.application.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      status: true,
      preferredTier: true,
      createdAt: true,
      approvedAt: true,
    },
  });
}

// ── Approve / Reject ──

export async function updateApplicationStatus(
  email: string,
  status: "approved" | "rejected"
): Promise<PatchResult> {
  const existing = await prisma.application.findUnique({ where: { email } });
  if (!existing) {
    return { ok: false, code: "NOT_FOUND" };
  }

  await prisma.application.update({
    where: { email },
    data: {
      status,
      approvedAt: status === "approved" ? new Date() : null,
    },
  });

  console.log("[application] Status updated:", { status });

  if (status === "approved") {
    sendApplicationApproved({
      email,
      fullName: existing.fullName,
      preferredTier: existing.preferredTier,
    }).catch((err) =>
      console.error("[application] Failed to send approval email:", err)
    );
  }

  return { ok: true };
}
