import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCoachAuth, requireMemberOrCoachAuth } from "@/lib/auth";
import { sendReviewDelivered } from "@/services/email";

/**
 * Review API — coach reviews for members.
 *
 * POST   /api/review  — create a review (Authorization: Bearer COACH_SECRET)
 * GET    /api/review?email=   — get reviews for a member (public by email)
 * PATCH  /api/review  — update a review (Authorization: Bearer COACH_SECRET)
 *
 * Review types: weekly, monthly, custom
 *
 * Security:
 * - POST/PATCH require COACH_SECRET
 * - Zod validation on all inputs
 * - No PII logged
 */

const REVIEW_TYPES = ["weekly", "monthly", "custom"] as const;

const CreateReviewSchema = z.object({
  email: z.string().email("A valid member email is required"),
  type: z.enum(REVIEW_TYPES),
  dueDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  summary: z.string().max(5000).optional(),
  actionItems: z.string().max(5000).optional(), // JSON stringified array
  loomLink: z.string().url().max(2000).optional(),
  followUpNeeded: z.boolean().default(false),
});

const PatchReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  completedDate: z.string().datetime().optional(),
  summary: z.string().max(5000).optional(),
  actionItems: z.string().max(5000).optional(),
  loomLink: z.string().url().max(2000).optional(),
  followUpNeeded: z.boolean().optional(),
});

// ── Auth helper ──
function checkCoachAuth(request: NextRequest): boolean {
  return requireCoachAuth(request);
}

// ── POST — Create a review ──

export async function POST(request: NextRequest) {
  if (!checkCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid review data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, type, ...fields } = parsed.data;

    // Resolve member by email
    const member = await prisma.member.findUnique({ where: { email } });
    if (!member) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No member found for this email" } },
        { status: 404 }
      );
    }

    const review = await prisma.review.create({
      data: {
        memberId: member.id,
        type,
        dueDate: fields.dueDate ? new Date(fields.dueDate) : null,
        completedDate: fields.completedDate ? new Date(fields.completedDate) : null,
        summary: fields.summary ?? null,
        actionItems: fields.actionItems ?? null,
        loomLink: fields.loomLink ?? null,
        followUpNeeded: fields.followUpNeeded,
      },
    });

    console.log("[review] Created:", { id: review.id, type });

    return NextResponse.json(
      {
        review: {
          id: review.id,
          type: review.type,
          dueDate: review.dueDate,
          completedDate: review.completedDate,
          summary: review.summary,
          actionItems: review.actionItems,
          loomLink: review.loomLink,
          followUpNeeded: review.followUpNeeded,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown review error";
    console.error("[review] Error:", message);

    return NextResponse.json(
      { error: { code: "REVIEW_ERROR", message: "Failed to create review" } },
      { status: 500 }
    );
  }
}

// ── GET — Get reviews for a member ──

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Email query parameter is required" } },
      { status: 400 }
    );
  }
  // ── Auth: require session cookie (email match) or coach Bearer token ──
  const auth = await requireMemberOrCoachAuth(request, email);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  try {
    const member = await prisma.member.findUnique({ where: { email } });
    if (!member) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No member found for this email" } },
        { status: 404 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        type: r.type,
        dueDate: r.dueDate,
        completedDate: r.completedDate,
        summary: r.summary,
        actionItems: r.actionItems,
        loomLink: r.loomLink,
        followUpNeeded: r.followUpNeeded,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown review error";
    console.error("[review] GET error:", message);

    return NextResponse.json(
      { error: { code: "REVIEW_ERROR", message: "Failed to fetch reviews" } },
      { status: 500 }
    );
  }
}

// ── PATCH — Update a review ──

export async function PATCH(request: NextRequest) {
  if (!checkCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = PatchReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { reviewId, ...fields } = parsed.data;

    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Review not found" } },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (fields.completedDate !== undefined)
      updateData.completedDate = new Date(fields.completedDate);
    if (fields.summary !== undefined) updateData.summary = fields.summary;
    if (fields.actionItems !== undefined) updateData.actionItems = fields.actionItems;
    if (fields.loomLink !== undefined) updateData.loomLink = fields.loomLink;
    if (fields.followUpNeeded !== undefined) updateData.followUpNeeded = fields.followUpNeeded;

    await prisma.review.update({ where: { id: reviewId }, data: updateData });

    // Send review delivery email when a review is completed with a summary
    if (fields.completedDate && (fields.summary || existing.summary)) {
      const member = await prisma.member.findUnique({
        where: { id: existing.memberId },
        select: { email: true, fullName: true },
      });

      if (member) {
        sendReviewDelivered({
          email: member.email,
          fullName: member.fullName ?? "there",
          reviewType: existing.type ?? "custom",
          summary: fields.summary ?? existing.summary ?? "",
          loomLink: fields.loomLink ?? existing.loomLink ?? undefined,
        }).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Unknown email error";
          console.error("[review] Email send error:", msg);
        });
      }
    }

    console.log("[review] Updated:", { id: reviewId });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown review error";
    console.error("[review] PATCH error:", message);

    return NextResponse.json(
      { error: { code: "REVIEW_ERROR", message: "Failed to update review" } },
      { status: 500 }
    );
  }
}
