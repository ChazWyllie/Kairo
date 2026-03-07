import { env } from "@/lib/env";
import {
  getNurtureEmail,
  type NurtureContext,
} from "@/lib/nurture-emails";

interface AdminNotification {
  memberEmail: string;
  stripeCustomerId: string;
  stripeSubId: string;
}

interface AdminCancellationNotification {
  stripeSubId: string;
}

interface WelcomeEmail {
  memberEmail: string;
}

/**
 * Send admin notification when a new member activates.
 * Uses Resend in production; logs in development.
 *
 * Never logs PII beyond what's needed for debugging.
 */
export async function notifyAdmin(data: AdminNotification): Promise<void> {
  const { memberEmail, stripeCustomerId, stripeSubId } = data;

  // In development or when Resend isn't configured, log and return
  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Admin notification:", {
      to: env.ADMIN_NOTIFY_EMAIL,
      subject: "New Kairo member activated",
      memberEmail,
    });
    return;
  }

  // Dynamic import to avoid loading Resend when not needed
  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: env.ADMIN_NOTIFY_EMAIL,
    subject: "🎉 New Kairo member activated",
    html: `
      <h2>New Member Activated</h2>
      <p><strong>Email:</strong> ${memberEmail}</p>
      <p><strong>Customer:</strong> ${stripeCustomerId}</p>
      <p><strong>Subscription:</strong> ${stripeSubId}</p>
      <p>Time: ${new Date().toISOString()}</p>
    `,
  });
}

/**
 * Notify admin when a member cancels their subscription.
 * Fire-and-forget — failures should not disrupt webhook processing.
 */
export async function notifyAdminCancellation(
  data: AdminCancellationNotification
): Promise<void> {
  const { stripeSubId } = data;

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Cancellation notification:", {
      to: env.ADMIN_NOTIFY_EMAIL,
      subject: "Member canceled",
      stripeSubId,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: env.ADMIN_NOTIFY_EMAIL,
    subject: "⚠️ Kairo member canceled",
    html: `
      <h2>Member Canceled</h2>
      <p><strong>Subscription:</strong> ${stripeSubId}</p>
      <p>Time: ${new Date().toISOString()}</p>
    `,
  });
}

/**
 * Send welcome email to a new member with next steps.
 * Fire-and-forget — failures should not disrupt webhook processing.
 */
export async function sendWelcomeEmail(data: WelcomeEmail): Promise<void> {
  const { memberEmail } = data;

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Welcome email:", {
      to: memberEmail,
      subject: "Welcome to Kairo Coaching",
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: memberEmail,
    subject: "Welcome to Kairo Coaching 🏋️",
    html: `
      <h2>Welcome to Kairo Coaching!</h2>
      <p>Thanks for joining — your membership is now active.</p>
      <h3>What happens next:</h3>
      <ol>
        <li><strong>Fill out your onboarding form</strong> — tell us your goals, schedule, and any limitations so we can build your plan.</li>
        <li><strong>Receive your first plan</strong> — personalized training + nutrition targets within 48 hours.</li>
        <li><strong>Weekly check-in</strong> — every week, send a quick update and we'll adjust your plan.</li>
      </ol>
      <p>Questions? Just reply to this email.</p>
      <p>— Kairo Coaching</p>
    `,
  });
}

// ── Quiz Welcome Email ──

interface QuizWelcomeEmail {
  email: string;
  recommendedTier: string;
}

/**
 * Send a welcome email after quiz completion with recommended tier info.
 * Fire-and-forget — failures should not disrupt quiz submission.
 *
 * In development or when Resend isn't configured, logs to console.
 */
export async function sendQuizWelcomeEmail(
  data: QuizWelcomeEmail
): Promise<void> {
  const { email, recommendedTier } = data;

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Quiz welcome email:", {
      to: email,
      subject: "Your Kairo recommendation is ready",
      recommendedTier,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  const tierNames: Record<string, string> = {
    foundation: "Foundation",
    coaching: "Coaching",
    performance: "Performance",
    vip: "VIP Elite",
  };

  const tierName = tierNames[recommendedTier] ?? "Foundation";

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Your Kairo recommendation is ready 🎯",
    html: `
      <h2>Your personalized plan is ready</h2>
      <p>Based on your quiz answers, we recommend the <strong>${tierName}</strong> plan.</p>
      <p>This plan is tailored to match your goals, experience level, and training schedule.</p>
      <p><a href="${env.APP_URL}/quiz/result?tier=${recommendedTier}">View your recommendation →</a></p>
      <p>Questions? Just reply to this email.</p>
      <p>— Kairo Coaching</p>
    `,
  });
}

// ── Nurture Drip Email ──

interface NurtureEmailParams {
  email: string;
  step: number;
  recommendedTier: string | null;
  goal: string | null;
}

/**
 * Send a nurture drip email to a quiz lead.
 *
 * Returns true if the email was sent (or stubbed), false if the step
 * is invalid (e.g. step 5 doesn't exist). Caller should update
 * lastNurtureStep only when this returns true.
 *
 * Fire-and-forget — failures should not crash the nurture batch.
 */
export async function sendNurtureEmail(
  data: NurtureEmailParams
): Promise<boolean> {
  const { email, step, recommendedTier, goal } = data;

  const ctx: NurtureContext = {
    email,
    recommendedTier,
    goal,
    appUrl: env.APP_URL,
  };

  const content = getNurtureEmail(step, ctx);
  if (!content) return false;

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Nurture email:", {
      to: email,
      step,
      subject: content.subject,
    });
    return true;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: content.subject,
    html: content.html,
  });

  return true;
}
