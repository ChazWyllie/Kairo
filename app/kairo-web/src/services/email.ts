import { env } from "@/lib/env";
import {
  getNurtureEmail,
  type NurtureContext,
} from "@/lib/nurture-emails";
import { escapeHtml } from "@/lib/sanitize";

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
      <p><strong>Email:</strong> ${escapeHtml(memberEmail)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(stripeCustomerId)}</p>
      <p><strong>Subscription:</strong> ${escapeHtml(stripeSubId)}</p>
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
      <p><strong>Subscription:</strong> ${escapeHtml(stripeSubId)}</p>
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
      <p>Based on your quiz answers, we recommend the <strong>${escapeHtml(tierName)}</strong> plan.</p>
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

// ── Application Emails (Milestone K) ──

interface ApplicationReceivedEmail {
  email: string;
  fullName: string;
}

interface ApplicationApprovedEmail {
  email: string;
  fullName: string;
  preferredTier?: string | null;
}

interface ApplicationAdminNotification {
  applicantEmail: string;
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

/**
 * Send confirmation email when someone submits an application.
 * Fire-and-forget — failures should not block the API response.
 */
export async function sendApplicationReceived(
  data: ApplicationReceivedEmail
): Promise<void> {
  const { email, fullName } = data;
  const firstName = fullName.split(" ")[0] || "there";

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Application received:", {
      to: email,
      subject: "Application received",
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "We got your application 🎯",
    html: `
      <h2>Hey ${escapeHtml(firstName)},</h2>
      <p>Thanks for applying to Kairo Coaching — we've received your application and will review it within 24–48 hours.</p>
      <h3>What happens next:</h3>
      <ol>
        <li><strong>We review your info</strong> — to make sure we're the right fit for your goals.</li>
        <li><strong>You get an email</strong> — with your approval and a link to get started.</li>
        <li><strong>We build your plan</strong> — personalized training + nutrition within 48 hours of sign-up.</li>
      </ol>
      <p>Questions in the meantime? Just reply to this email.</p>
      <p>— Kairo Coaching</p>
    `,
  });
}

/**
 * Send approval email with a link to choose a plan and pay.
 * Includes tier recommendation if applicant expressed a preference.
 * Fire-and-forget — failures should not block the API response.
 */
export async function sendApplicationApproved(
  data: ApplicationApprovedEmail
): Promise<void> {
  const { email, fullName, preferredTier } = data;
  const firstName = fullName.split(" ")[0] || "there";

  const tierNames: Record<string, string> = {
    foundation: "Foundation",
    coaching: "Coaching",
    performance: "Performance",
    vip: "VIP Elite",
  };

  const tierNote = preferredTier && tierNames[preferredTier]
    ? `<p>Based on your application, we think the <strong>${tierNames[preferredTier]}</strong> plan is a great fit.</p>`
    : "";

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Application approved:", {
      to: email,
      subject: "You're approved!",
      preferredTier,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "You're in! Welcome to Kairo 🏋️",
    html: `
      <h2>Hey ${escapeHtml(firstName)},</h2>
      <p>Great news — your application has been approved! We're excited to work with you.</p>
      ${tierNote}
      <p><a href="${env.APP_URL}/#pricing" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Choose your plan →</a></p>
      <p>Once you sign up, you'll get a welcome email with next steps and your onboarding form.</p>
      <p>Questions? Just reply to this email.</p>
      <p>— Kairo Coaching</p>
    `,
  });
}

/**
 * Notify coach/admin when a new application is submitted.
 * Fire-and-forget — failures should not block the API response.
 */
export async function notifyAdminNewApplication(
  data: ApplicationAdminNotification
): Promise<void> {
  const { applicantEmail, fullName, goal } = data;

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Admin application notification:", {
      to: env.ADMIN_NOTIFY_EMAIL,
      subject: "New application",
      applicantEmail,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  const goalLabels: Record<string, string> = { fat_loss: "Fat Loss", muscle: "Muscle Gain", maintenance: "Maintenance" };
  const tierLabels: Record<string, string> = { foundation: "Foundation ($49)", coaching: "Coaching ($129)", performance: "Performance ($229)", vip: "VIP Elite ($349)" };
  const gymLabels: Record<string, string> = { none: "No equipment", hotel: "Hotel gym", dumbbells: "Dumbbells at home", full_gym: "Full gym" };
  const expLabels: Record<string, string> = { beginner: "Beginner (0-1 yrs)", intermediate: "Intermediate (1-3 yrs)", advanced: "Advanced (3+ yrs)" };

  function row(label: string, value: string | number | boolean | null | undefined): string {
    if (value == null || value === "") return "";
    const display = typeof value === "boolean" ? (value ? "Yes ✓" : "No") : escapeHtml(String(value));
    return `<tr><td style="padding:6px 12px 6px 0;color:#737373;white-space:nowrap;vertical-align:top;font-size:14px">${label}</td><td style="padding:6px 0;font-size:14px">${display}</td></tr>`;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: env.ADMIN_NOTIFY_EMAIL,
    subject: "📋 New Kairo application",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px">
        <h2 style="margin:0 0 4px">New Application</h2>
        <p style="color:#737373;margin:0 0 16px;font-size:14px">${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>

        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#a3a3a3;margin:16px 0 6px;border-bottom:1px solid #e5e5e5;padding-bottom:4px">Personal</h3>
        <table style="border-collapse:collapse">
          ${row("Name", fullName)}
          ${row("Email", data.applicantEmail)}
          ${row("Phone", data.phone)}
          ${row("Age", data.age)}
          ${row("Height", data.height)}
          ${row("Weight", data.currentWeight)}
        </table>

        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#a3a3a3;margin:16px 0 6px;border-bottom:1px solid #e5e5e5;padding-bottom:4px">Training</h3>
        <table style="border-collapse:collapse">
          ${row("Experience", data.trainingExperience ? (expLabels[data.trainingExperience] ?? data.trainingExperience) : null)}
          ${row("Frequency", data.trainingFrequency)}
          ${row("Gym access", data.gymAccess ? (gymLabels[data.gymAccess] ?? data.gymAccess) : null)}
          ${row("Injuries", data.injuryHistory)}
        </table>

        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#a3a3a3;margin:16px 0 6px;border-bottom:1px solid #e5e5e5;padding-bottom:4px">Goals &amp; Mindset</h3>
        <table style="border-collapse:collapse">
          ${row("Goal", goalLabels[goal] ?? goal)}
          ${row("Why now", data.whyNow)}
          ${row("Nutrition struggles", data.nutritionStruggles)}
          ${row("Biggest obstacle", data.biggestObstacle)}
          ${row("Wants help with", data.helpWithMost)}
        </table>

        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#a3a3a3;margin:16px 0 6px;border-bottom:1px solid #e5e5e5;padding-bottom:4px">Plan Preference</h3>
        <table style="border-collapse:collapse">
          ${row("Preferred tier", data.preferredTier ? (tierLabels[data.preferredTier] ?? data.preferredTier) : null)}
          ${row("Budget comfort", data.budgetComfort)}
          ${row("Ready for structure", data.readyForStructure)}
        </table>

        <p style="margin:20px 0 0"><a href="${env.APP_URL}/coach" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500">Review in Dashboard →</a></p>
      </div>
    `,
  });
}

// ── Review / Check-in Emails (Milestone L) ──

interface ProgramUpdatedEmail {
  email: string;
  fullName: string;
  programName: string;
  adjustmentsMade?: string | null;
}

interface ReviewDeliveredEmail {
  email: string;
  fullName: string;
  reviewType: string;
  summary: string;
  loomLink?: string | null;
}

interface CheckInReminderEmail {
  email: string;
  fullName: string;
}

/**
 * Send email when a coach completes a review.
 * Follows Script 5/6/8 from backend.md.
 */
export async function sendReviewDelivered(
  data: ReviewDeliveredEmail
): Promise<void> {
  const { email, fullName, reviewType, summary, loomLink } = data;
  const firstName = fullName.split(" ")[0] || "there";

  const typeLabels: Record<string, string> = {
    monthly: "Monthly Review",
    quarterly: "Quarterly Review",
    form_review: "Form Review",
    live_call: "Live Call Summary",
  };
  const label = typeLabels[reviewType] ?? "Review";

  const loomSection = loomLink
    ? `<p><a href="${escapeHtml(loomLink)}" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Watch your video review →</a></p>`
    : "";

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Review delivered:", {
      to: email,
      subject: label,
      hasLoom: !!loomLink,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: `Your ${label} is ready 📋`,
    html: `
      <h2>Hey ${escapeHtml(firstName)},</h2>
      <p>Your ${escapeHtml(label.toLowerCase())} is ready.</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:12px;margin:16px 0;">
        ${escapeHtml(summary)}
      </div>
      ${loomSection}
      <p>Check your <a href="${env.APP_URL}/dashboard">dashboard</a> for the full details.</p>
      <p>— Kairo Coaching</p>
    `,
  });
}

/**
 * Send email when a program is updated (adjustments made).
 * Fire-and-forget.
 */
export async function sendProgramUpdated(
  data: ProgramUpdatedEmail
): Promise<void> {
  const { email, fullName, programName, adjustmentsMade } = data;
  const firstName = fullName.split(" ")[0] || "there";

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Program updated:", {
      to: email,
      subject: "Program updated",
      programName,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: `Your program has been updated 🔄`,
    html: `
      <h2>Hey ${escapeHtml(firstName)},</h2>
      <p>Your training program <strong>${escapeHtml(programName)}</strong> has been updated.</p>
      ${adjustmentsMade ? `<div style="background:#f5f5f5;padding:16px;border-radius:12px;margin:16px 0;"><p style="margin:0;"><strong>What changed:</strong></p><p style="margin:8px 0 0;">${escapeHtml(adjustmentsMade)}</p></div>` : ""}
      <p>Check your <a href="${env.APP_URL}/dashboard">dashboard</a> for the full details.</p>
      <p>— Kairo Coaching</p>
    `,
  });
}

/**
 * Send weekly check-in reminder (Script 4 from backend.md).
 * Fire-and-forget.
 */
export async function sendCheckInReminder(
  data: CheckInReminderEmail
): Promise<void> {
  const { email, fullName } = data;
  const firstName = fullName.split(" ")[0] || "there";

  if (!env.RESEND_API_KEY) {
    console.log("[email-stub] Check-in reminder:", { to: email });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Time to check in 📝",
    html: `
      <h2>Hey ${escapeHtml(firstName)},</h2>
      <p>Just a reminder to submit your weekly check-in so we can review your progress and make any needed adjustments.</p>
      <p>The more consistent your check-ins are, the better we can coach you.</p>
      <p><a href="${env.APP_URL}/dashboard" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Submit check-in →</a></p>
      <p>— Kairo Coaching</p>
    `,
  });
}
