import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireMemberOrCoachAuth } from "@/lib/auth";
import { checkoutLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session for the authenticated member.
 * Returns { url } for client-side redirect.
 *
 * Auth: member session cookie or coach Bearer token.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkoutLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const { email } = parsed.data;

  const auth = await requireMemberOrCoachAuth(request, email);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({
    where: { email },
    select: { stripeCustomerId: true },
  });

  if (!member?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Complete your subscription first." },
      { status: 404 }
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${env.APP_URL}/dashboard/account`,
  });

  return NextResponse.json({ url: session.url });
}
