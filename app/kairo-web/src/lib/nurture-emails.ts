/**
 * Nurture email sequence — personalized drip content for quiz leads.
 *
 * Per deep research report:
 * - 3-5 emails over 1-2 weeks: useful content, social proof, CTA
 * - Personalize based on quiz answers (goal, tier)
 * - Educational content first, then direct offer
 *
 * Sequence:
 *   Step 0: Quiz welcome (already sent via sendQuizWelcomeEmail)
 *   Step 1: Day 1 — Quick win tip (personalized by goal)
 *   Step 2: Day 3 — Social proof + deeper value
 *   Step 3: Day 5 — Overcome objections + CTA
 *   Step 4: Day 7 — Final nudge + urgency
 *
 * Pure data — no side effects. Used by the nurture service.
 */

export interface NurtureContext {
  email: string;
  recommendedTier: string | null;
  goal: string | null; // from quiz answers
  appUrl: string;
}

export interface NurtureEmail {
  subject: string;
  html: string;
}

const TIER_NAMES: Record<string, string> = {
  foundation: "Foundation",
  coaching: "Coaching",
  performance: "Performance",
  vip: "VIP Elite",
};

function tierName(tier: string | null): string {
  return tier ? (TIER_NAMES[tier] ?? "Foundation") : "Foundation";
}

function goalContent(goal: string | null): { tip: string; angle: string } {
  switch (goal) {
    case "fat_loss":
      return {
        tip: "Start your day with 30g of protein within an hour of waking. This single habit boosts satiety, reduces cravings, and keeps your metabolism active throughout the day.",
        angle: "lose body fat and keep it off",
      };
    case "muscle":
      return {
        tip: "Focus on progressive overload: add 1 rep or 2.5 lbs to your main lifts each week. Small, consistent increases compound into massive strength gains over months.",
        angle: "build lean muscle efficiently",
      };
    default:
      return {
        tip: "Block 20 minutes on your calendar right now for tomorrow's workout. Scheduling makes you 2-3x more likely to follow through than relying on motivation alone.",
        angle: "stay consistent and build lasting habits",
      };
  }
}

/**
 * Generate the nurture email for a given step.
 *
 * Returns null for invalid steps or steps beyond the sequence.
 * Step 0 is handled by sendQuizWelcomeEmail — this covers steps 1-4.
 */
export function getNurtureEmail(
  step: number,
  ctx: NurtureContext
): NurtureEmail | null {
  const { angle } = goalContent(ctx.goal);
  const tier = tierName(ctx.recommendedTier);
  const resultUrl = `${ctx.appUrl}/quiz/result${ctx.recommendedTier ? `?tier=${ctx.recommendedTier}` : ""}`;
  const unsubUrl = `${ctx.appUrl}/api/nurture/unsubscribe?email=${encodeURIComponent(ctx.email)}`;

  switch (step) {
    // ── Day 1: Quick win tip ──
    case 1:
      return {
        subject: `One thing to ${angle.split(" ").slice(0, 3).join(" ")} this week`,
        html: `
          <h2>Here's your quick win 💡</h2>
          <p>Hi — based on your quiz, your goal is to <strong>${angle}</strong>. Here's one evidence-backed tip you can start today:</p>
          <blockquote style="border-left: 3px solid #000; padding-left: 16px; margin: 16px 0; font-style: italic;">
            ${goalContent(ctx.goal).tip}
          </blockquote>
          <p>Small changes, done consistently, create big results. That's exactly what the <strong>${tier}</strong> plan is built around.</p>
          <p><a href="${resultUrl}" style="color: #000; font-weight: bold;">View your personalized recommendation →</a></p>
          <p style="color: #737373; font-size: 12px; margin-top: 32px;">
            <a href="${unsubUrl}" style="color: #737373;">Unsubscribe</a>
          </p>
          <p>— Kairo Coaching</p>
        `,
      };

    // ── Day 3: Social proof + deeper value ──
    case 2:
      return {
        subject: "How real people are getting results with Kairo",
        html: `
          <h2>It works when you have a system</h2>
          <p>The difference between people who hit their goals and people who don't? A system that adapts to their life — not the other way around.</p>
          <p>Here's what our members say:</p>
          <blockquote style="border-left: 3px solid #000; padding-left: 16px; margin: 16px 0;">
            <p><em>"I've tried 5 apps and 3 trainers. Kairo is the first one that actually adjusted when life got busy instead of making me feel guilty."</em></p>
          </blockquote>
          <blockquote style="border-left: 3px solid #000; padding-left: 16px; margin: 16px 0;">
            <p><em>"The daily check-in takes 30 seconds. That's it. And somehow that's enough to keep me accountable."</em></p>
          </blockquote>
          <p>Your <strong>${tier}</strong> plan includes personalized coaching that adapts to your schedule, goals, and progress.</p>
          <p><a href="${resultUrl}" style="color: #000; font-weight: bold;">See what's included in your plan →</a></p>
          <p style="color: #737373; font-size: 12px; margin-top: 32px;">
            <a href="${unsubUrl}" style="color: #737373;">Unsubscribe</a>
          </p>
          <p>— Kairo Coaching</p>
        `,
      };

    // ── Day 5: Overcome objections ──
    case 3:
      return {
        subject: "The 3 things holding you back (and how to fix them)",
        html: `
          <h2>Let's be honest about what's in the way</h2>
          <p>Most people who take our quiz already know what they should be doing. The problem isn't knowledge — it's execution. Here are the 3 most common blockers:</p>
          <ol>
            <li><strong>"I don't have time."</strong> → Our plans start at 20 minutes. If you have time to scroll, you have time to train.</li>
            <li><strong>"I've tried coaching before."</strong> → Kairo isn't a PDF plan. It's adaptive coaching that changes when your life changes.</li>
            <li><strong>"Is it worth the investment?"</strong> → The ${tier} plan costs less than one personal training session, and you get support every single day.</li>
          </ol>
          <p>Your quiz results showed <strong>${tier}</strong> is the best fit. Here's everything you get:</p>
          <p><a href="${resultUrl}" style="color: #000; font-weight: bold;">Review your recommendation →</a></p>
          <p style="color: #737373; font-size: 12px; margin-top: 32px;">
            <a href="${unsubUrl}" style="color: #737373;">Unsubscribe</a>
          </p>
          <p>— Kairo Coaching</p>
        `,
      };

    // ── Day 7: Final nudge ──
    case 4:
      return {
        subject: "Last call: your plan is waiting",
        html: `
          <h2>Your personalized plan is still here</h2>
          <p>A week ago, you took the Kairo quiz and we recommended the <strong>${tier}</strong> plan based on your goals.</p>
          <p>Since then, 7 days have passed. That's 7 days of workouts, meals, and progress that could have been tracked, optimized, and guided by a coach who adapts to you.</p>
          <p>Here's what happens when you start:</p>
          <ul>
            <li>✅ Your first personalized plan within 48 hours</li>
            <li>✅ Daily 30-second check-ins to build consistency</li>
            <li>✅ A coach who adjusts when life gets in the way</li>
          </ul>
          <p>No contracts. Cancel anytime. Start today and see the difference in your first week.</p>
          <p><a href="${resultUrl}" style="color: #000; font-weight: bold;">Start your ${tier} plan →</a></p>
          <p style="color: #737373; font-size: 12px; margin-top: 32px;">
            This is the last email in this series. <a href="${unsubUrl}" style="color: #737373;">Unsubscribe</a>
          </p>
          <p>— Kairo Coaching</p>
        `,
      };

    default:
      return null;
  }
}

/** Total steps in the nurture sequence (excluding step 0 welcome). */
export const NURTURE_TOTAL_STEPS = 4;

/**
 * Minimum hours between nurture steps.
 * Step 1: Day 1 (24h after capture)
 * Step 2: Day 3 (48h after step 1)
 * Step 3: Day 5 (48h after step 2)
 * Step 4: Day 7 (48h after step 3)
 */
export const NURTURE_DELAY_HOURS: Record<number, number> = {
  1: 24,
  2: 48,
  3: 48,
  4: 48,
};
