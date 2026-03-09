import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCoachAuth } from "@/lib/auth";
import { stripe } from "@/services/stripe";

/**
 * GET /api/coach (Authorization: Bearer COACH_SECRET)
 *
 * Coach dashboard API — exception-first data for the coach portal.
 * Returns portfolio stats + per-client health with triage flags.
 *
 * Per dashboard_prompt.md:
 * - "Who needs me right now?" — flag missed workouts, overdue check-ins
 * - 7/30-day training adherence per client
 * - Portfolio: active count, at-risk count, average adherence, total leads
 *
 * Security:
 * - Protected by COACH_SECRET env var (shared secret for MVP)
 * - No member IDs or Stripe IDs in response
 * - No PII logged
 *
 * Post-MVP: Replace shared secret with proper admin auth.
 */

interface ClientHealth {
  email: string;
  planTier: string | null;
  billingInterval: string | null;
  goal: string | null;
  daysPerWeek: number | null;
  onboarded: boolean;
  memberSince: string;
  status: "on_track" | "needs_attention" | "at_risk";
  paymentStatus: "active" | "past_due" | "canceled" | "unknown";
  lastCheckIn: string | null;
  daysSinceCheckIn: number | null;
  adherence7d: number;
  adherence30d: number;
  currentStreak: number;
  recentCheckIns: {
    id: string;
    date: string;
    workout: boolean;
    meals: number;
    water: boolean;
    steps: boolean;
    avgWeight: number | null;
    waist: number | null;
    workoutsCompleted: number | null;
    calorieAdherence: number | null;
    proteinAdherence: number | null;
    sleepAverage: number | null;
    energyScore: number | null;
    stressScore: number | null;
    recoveryScore: number | null;
    biggestWin: string | null;
    biggestStruggle: string | null;
    helpNeeded: string | null;
    coachStatus: string | null;
    coachResponse: string | null;
  }[];
  activeProgram: {
    name: string;
    primaryGoal: string | null;
    split: string | null;
    daysPerWeek: number | null;
    status: string;
    nextUpdateDate: string | null;
  } | null;
  activeMacro: {
    calories: number;
    protein: number;
    fatsMin: number | null;
    carbs: number | null;
    stepsTarget: number | null;
    effectiveDate: string;
  } | null;
}

interface PortfolioStats {
  activeClients: number;
  atRiskCount: number;
  needsAttentionCount: number;
  averageAdherence7d: number;
  totalLeads: number;
}

export async function GET(request: NextRequest) {
  try {
    // ── Auth: Authorization header with constant-time comparison ──
    if (!requireCoachAuth(request)) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing coach secret",
          },
        },
        { status: 401 }
      );
    }

    // ── Fetch all active members with recent check-ins ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const members = await prisma.member.findMany({
      where: { status: { in: ["active", "past_due"] } },
      include: {
        checkIns: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: "desc" },
          take: 30,
        },
        programBlocks: {
          where: { status: "active" },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        macroTargets: {
          where: { status: "active" },
          orderBy: { effectiveDate: "desc" },
          take: 1,
        },
      },
    });

    const totalLeads = await prisma.lead.count();

    // ── Fetch applications (pending first, then recent) ──
    const applications = await prisma.application.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        age: true,
        height: true,
        currentWeight: true,
        goal: true,
        whyNow: true,
        trainingExperience: true,
        trainingFrequency: true,
        gymAccess: true,
        injuryHistory: true,
        nutritionStruggles: true,
        biggestObstacle: true,
        helpWithMost: true,
        preferredTier: true,
        readyForStructure: true,
        budgetComfort: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        convertedToMember: true,
      },
    });

    // ── Build per-client health ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneDay = 24 * 60 * 60 * 1000;

    const clients: ClientHealth[] = members.map((m) => {
      const checkIns = m.checkIns;

      // Last check-in
      const lastCheckIn = checkIns.length > 0 ? checkIns[0].date : null;
      const daysSinceCheckIn = lastCheckIn
        ? Math.floor((today.getTime() - new Date(lastCheckIn).getTime()) / oneDay)
        : null;

      // 7-day adherence (workouts completed / daysPerWeek target or 7)
      const sevenDaysAgo = new Date(today.getTime() - 7 * oneDay);
      const last7 = checkIns.filter((ci) => new Date(ci.date) >= sevenDaysAgo);
      const workouts7d = last7.filter((ci) => ci.workout).length;
      const target7d = m.daysPerWeek ?? 7;
      const adherence7d = target7d > 0 ? Math.round((workouts7d / target7d) * 100) : 0;

      // 30-day adherence
      const workouts30d = checkIns.filter((ci) => ci.workout).length;
      const weeksIn30 = 4.29; // ~30/7
      const target30d = Math.round((m.daysPerWeek ?? 7) * weeksIn30);
      const adherence30d = target30d > 0 ? Math.min(100, Math.round((workouts30d / target30d) * 100)) : 0;

      // Current streak
      const currentStreak = calculateStreak(checkIns.map((ci) => ci.date));

      // Triage status
      let status: ClientHealth["status"] = "on_track";
      if (checkIns.length === 0 || (daysSinceCheckIn !== null && daysSinceCheckIn >= 3)) {
        status = "needs_attention";
      }
      if (daysSinceCheckIn !== null && daysSinceCheckIn >= 7) {
        status = "at_risk";
      }
      if (adherence7d < 30 && checkIns.length > 0) {
        status = "at_risk";
      }

      return {
        email: m.email,
        planTier: m.planTier,
        billingInterval: m.billingInterval,
        goal: m.goal,
        daysPerWeek: m.daysPerWeek,
        onboarded: !!m.onboardedAt,
        memberSince: m.createdAt.toISOString(),
        status,
        paymentStatus: (m.status === "active" ? "active" : m.status === "past_due" ? "past_due" : m.status === "canceled" ? "canceled" : "unknown") as ClientHealth["paymentStatus"],
        lastCheckIn: lastCheckIn ? new Date(lastCheckIn).toISOString() : null,
        daysSinceCheckIn,
        adherence7d,
        adherence30d,
        currentStreak,
        recentCheckIns: checkIns.slice(0, 7).map((ci) => ({
          id: ci.id,
          date: new Date(ci.date).toISOString(),
          workout: ci.workout,
          meals: ci.meals,
          water: ci.water,
          steps: ci.steps,
          avgWeight: ci.avgWeight,
          waist: ci.waist,
          workoutsCompleted: ci.workoutsCompleted,
          calorieAdherence: ci.calorieAdherence,
          proteinAdherence: ci.proteinAdherence,
          sleepAverage: ci.sleepAverage,
          energyScore: ci.energyScore,
          stressScore: ci.stressScore,
          recoveryScore: ci.recoveryScore,
          biggestWin: ci.biggestWin,
          biggestStruggle: ci.biggestStruggle,
          helpNeeded: ci.helpNeeded,
          coachStatus: ci.coachStatus,
          coachResponse: ci.coachResponse,
        })),
        activeProgram: m.programBlocks[0]
          ? {
              name: m.programBlocks[0].name,
              primaryGoal: m.programBlocks[0].primaryGoal,
              split: m.programBlocks[0].split,
              daysPerWeek: m.programBlocks[0].daysPerWeek,
              status: m.programBlocks[0].status,
              nextUpdateDate: m.programBlocks[0].nextUpdateDate?.toISOString() ?? null,
            }
          : null,
        activeMacro: m.macroTargets[0]
          ? {
              calories: m.macroTargets[0].calories,
              protein: m.macroTargets[0].protein,
              fatsMin: m.macroTargets[0].fatsMin,
              carbs: m.macroTargets[0].carbs,
              stepsTarget: m.macroTargets[0].stepsTarget,
              effectiveDate: m.macroTargets[0].effectiveDate.toISOString(),
            }
          : null,
      };
    });

    // Sort: at_risk first, then needs_attention, then on_track
    const statusOrder = { at_risk: 0, needs_attention: 1, on_track: 2 };
    clients.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    // ── Portfolio stats ──
    const atRiskCount = clients.filter((c) => c.status === "at_risk").length;
    const needsAttentionCount = clients.filter((c) => c.status === "needs_attention").length;
    const avgAdherence =
      clients.length > 0
        ? Math.round(clients.reduce((sum, c) => sum + c.adherence7d, 0) / clients.length)
        : 0;

    const portfolio: PortfolioStats = {
      activeClients: clients.length,
      atRiskCount,
      needsAttentionCount,
      averageAdherence7d: avgAdherence,
      totalLeads: totalLeads,
    };

    return NextResponse.json({
      portfolio,
      clients,
      applications: applications.map((a) => ({
        id: a.id,
        email: a.email,
        fullName: a.fullName,
        phone: a.phone,
        age: a.age,
        height: a.height,
        currentWeight: a.currentWeight,
        goal: a.goal,
        whyNow: a.whyNow,
        trainingExperience: a.trainingExperience,
        trainingFrequency: a.trainingFrequency,
        gymAccess: a.gymAccess,
        injuryHistory: a.injuryHistory,
        nutritionStruggles: a.nutritionStruggles,
        biggestObstacle: a.biggestObstacle,
        helpWithMost: a.helpWithMost,
        preferredTier: a.preferredTier,
        readyForStructure: a.readyForStructure,
        budgetComfort: a.budgetComfort,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        approvedAt: a.approvedAt?.toISOString() ?? null,
        convertedToMember: a.convertedToMember,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown coach error";
    console.error("[coach] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "COACH_ERROR",
          message: "Failed to load coach dashboard data",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate current streak from sorted check-in dates (desc).
 */
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneDay = 24 * 60 * 60 * 1000;

  const normalized = dates.map((d) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd.getTime();
  });

  const unique = [...new Set(normalized)].sort((a, b) => b - a);

  let streak = 0;
  let cursor = today.getTime();

  if (unique[0] !== cursor) {
    cursor -= oneDay;
    if (unique[0] !== cursor) return 0;
  }

  for (const dateMs of unique) {
    if (dateMs === cursor) {
      streak++;
      cursor -= oneDay;
    } else if (dateMs < cursor) {
      break;
    }
  }

  return streak;
}
