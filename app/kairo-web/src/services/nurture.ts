/**
 * Nurture batch processor — finds eligible leads and sends the next drip email.
 *
 * Called by POST /api/nurture (cron endpoint). This is a pure service with
 * no HTTP concerns — accepts Prisma client and returns results.
 *
 * Eligibility rules:
 * - Lead has NOT converted (convertedAt is null)
 * - Lead has NOT opted out (nurtureOptedOut is false)
 * - Lead has not finished the sequence (lastNurtureStep < 4)
 * - Enough time has elapsed since the last email (per NURTURE_DELAY_HOURS)
 *
 * Timing baseline:
 * - Step 1 uses capturedAt + 24h (first nurture after quiz welcome)
 * - Steps 2-4 use lastNurtureAt + 48h
 */
import { prisma } from "@/lib/prisma";
import { sendNurtureEmail } from "@/services/email";
import {
  NURTURE_TOTAL_STEPS,
  NURTURE_DELAY_HOURS,
} from "@/lib/nurture-emails";

export interface NurtureResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
}

/**
 * Process nurture emails for all eligible leads.
 *
 * Processes one step per lead per invocation (cron runs frequently enough).
 * Returns counts for observability.
 */
export async function processNurtureBatch(): Promise<NurtureResult> {
  const result: NurtureResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  // Find all leads eligible for nurture
  const leads = await prisma.lead.findMany({
    where: {
      convertedAt: null,
      nurtureOptedOut: false,
      lastNurtureStep: { lt: NURTURE_TOTAL_STEPS },
    },
  });

  const now = new Date();

  for (const lead of leads) {
    result.processed++;

    const nextStep = lead.lastNurtureStep + 1;
    const delayHours = NURTURE_DELAY_HOURS[nextStep];

    if (!delayHours) {
      result.skipped++;
      continue;
    }

    // Determine the reference time for delay calculation
    // Step 1: wait from capturedAt (quiz submission time)
    // Steps 2+: wait from lastNurtureAt (last email sent time)
    const referenceTime =
      nextStep === 1
        ? lead.capturedAt
        : lead.lastNurtureAt ?? lead.capturedAt;

    const elapsed = now.getTime() - referenceTime.getTime();
    const requiredMs = delayHours * 60 * 60 * 1000;

    if (elapsed < requiredMs) {
      result.skipped++;
      continue;
    }

    // Extract goal from quiz answers
    const quizAnswers = lead.quizAnswers as Record<string, unknown> | null;
    const goal = (quizAnswers?.goal as string) ?? null;

    try {
      const sent = await sendNurtureEmail({
        email: lead.email,
        step: nextStep,
        recommendedTier: lead.recommendedTier,
        goal,
      });

      if (sent) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            lastNurtureStep: nextStep,
            lastNurtureAt: now,
          },
        });
        result.sent++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      console.error("[nurture] Error sending email:", {
        leadId: lead.id,
        step: nextStep,
        error: error instanceof Error ? error.message : "unknown",
      });
      result.errors++;
    }
  }

  return result;
}
