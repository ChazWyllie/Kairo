import { env } from "@/lib/env";

interface AdminNotification {
  memberEmail: string;
  stripeCustomerId: string;
  stripeSubId: string;
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
