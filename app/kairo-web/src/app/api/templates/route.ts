import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/templates?secret=COACH_SECRET
 *
 * Returns pre-built coach message templates from backend.md Section 12.
 * These are the exact scripts a coach uses for common interactions.
 *
 * Security:
 * - Protected by COACH_SECRET
 * - Templates are static — no DB needed
 */

interface MessageTemplate {
  id: string;
  name: string;
  category: "lead" | "onboarding" | "checkin" | "review" | "retention";
  subject?: string;
  body: string;
  variables: string[]; // placeholders like [Name], [Tier Name], etc.
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: "lead-auto-response",
    name: "New Lead Auto-Response",
    category: "lead",
    subject: "Application Received",
    body: `Hey [Name], I got your application and appreciate you reaching out. I'll review everything and get back to you soon with the next steps. If we move forward, I'll make sure you know exactly what to expect from coaching.`,
    variables: ["[Name]"],
  },
  {
    id: "lead-approved",
    name: "Approved Lead",
    category: "lead",
    subject: "You're In — Next Steps",
    body: `Hey [Name], after reviewing your application, I think you'd be a strong fit for coaching. Based on your goals and what support you need, I'd recommend the [Tier Name] plan. Once payment is complete, I'll send over your onboarding form and next steps so we can get started properly.`,
    variables: ["[Name]", "[Tier Name]"],
  },
  {
    id: "onboarding-sent",
    name: "Onboarding Sent",
    category: "onboarding",
    subject: "Welcome — Your Onboarding Form",
    body: `Welcome aboard. Your next step is to complete the onboarding form as thoroughly as possible. The more accurate and detailed you are, the better I can tailor your plan. Once I review it, I'll build your starting setup and send over your training and nutrition guidance.`,
    variables: [],
  },
  {
    id: "checkin-reminder",
    name: "Weekly Check-In Reminder",
    category: "checkin",
    subject: "Time to check in",
    body: `Hey [Name], just a reminder to submit your weekly check-in today so I can review your progress and make any needed adjustments. The more consistent your check-ins are, the better I can coach you.`,
    variables: ["[Name]"],
  },
  {
    id: "weekly-review",
    name: "Weekly Review Response",
    category: "review",
    subject: "Your Weekly Review",
    body: `Win:\n"[Win — e.g. Strong job getting your sessions in this week and keeping protein consistent.]"\n\nData:\n"Your average weight was [Weight], steps were [Steps], and training adherence was [Adherence]."\n\nDecision:\n"[Decision — e.g. We're keeping calories the same and pushing performance this week.]"\n\nFocus:\n"Your main focus this week is [Priority 1], [Priority 2], and [Priority 3]."`,
    variables: ["[Win]", "[Weight]", "[Steps]", "[Adherence]", "[Decision]", "[Priority 1]", "[Priority 2]", "[Priority 3]"],
  },
  {
    id: "progress-update",
    name: "Progress Update / Momentum Check",
    category: "review",
    subject: "Quick Progress Update",
    body: `Hey [Name], wanted to give you a quick update.\n\nHere's where you're at: [summary of progress]. We're [on track / slightly behind / ahead] on [goal area].\n\nNext step: [specific action]. Keep executing and trust the process.\n\nYou're moving in the right direction. Stay patient and execute.`,
    variables: ["[Name]"],
  },
  {
    id: "form-review-delivery",
    name: "Form Review Delivery",
    category: "review",
    subject: "Your Form Review is Ready",
    body: `Just sent over your form review. Main things to focus on: [Point 1], [Point 2], and [Point 3]. Apply these next session and send me another clip when ready.`,
    variables: ["[Point 1]", "[Point 2]", "[Point 3]"],
  },
  {
    id: "re-engagement",
    name: "Client Slipping / Re-engagement",
    category: "retention",
    subject: "Checking In",
    body: `Hey [Name], I wanted to check in because I noticed things have been slipping a bit. No judgment at all — I just want to help you get back on track. Let's simplify things and focus on the few actions that matter most this week.`,
    variables: ["[Name]"],
  },
  {
    id: "monthly-review",
    name: "Monthly Review",
    category: "review",
    subject: "Your Monthly Review",
    body: `This month, your biggest improvements were [Improvements]. Your main bottleneck right now is [Bottleneck]. Going into next month, our plan is to [Plan]. The goal is to keep momentum without adding unnecessary complexity.`,
    variables: ["[Improvements]", "[Bottleneck]", "[Plan]"],
  },
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret || secret !== env.COACH_SECRET) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  const category = request.nextUrl.searchParams.get("category");

  const filtered = category
    ? TEMPLATES.filter((t) => t.category === category)
    : TEMPLATES;

  return NextResponse.json({ templates: filtered });
}
