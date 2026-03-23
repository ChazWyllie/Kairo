/**
 * GET /api/nurture/unsubscribe?email=<email>
 *
 * One-click unsubscribe from nurture drip sequence.
 * Sets nurtureOptedOut=true on the Lead record.
 *
 * Returns a simple HTML confirmation page (this is a browser link from emails).
 * No auth required — unsubscribe links must work without login.
 *
 * Security: only modifies the nurtureOptedOut flag, no other data.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const parsed = querySchema.safeParse({
    email: req.nextUrl.searchParams.get("email"),
  });

  if (!parsed.success) {
    return new NextResponse(
      `<html><body><h2>Invalid unsubscribe link</h2><p>Please check the link in your email.</p></body></html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  const { email } = parsed.data;

  try {
    // Update the lead — if they exist. If not, still show success
    // (don't leak whether an email exists in our system).
    await prisma.lead.updateMany({
      where: { email },
      data: { nurtureOptedOut: true },
    });

    return new NextResponse(
      `<html>
        <head><title>Unsubscribed | Kairo Fitness</title></head>
        <body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; text-align: center;">
          <h2>You've been unsubscribed</h2>
          <p>You won't receive any more coaching tips from us.</p>
          <p style="color: #737373; font-size: 14px;">If this was a mistake, just apply again and you'll be re-enrolled.</p>
        </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error(
      "[unsubscribe] Error:",
      error instanceof Error ? error.message : "unknown"
    );
    return new NextResponse(
      `<html><body><h2>Something went wrong</h2><p>Please try again later.</p></body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
