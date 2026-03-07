"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { PLANS } from "@/lib/stripe-prices";
import { isValidEmail } from "@/lib/validation";
import { semantic, components, dashboard } from "@/lib/design-tokens";

/**
 * Member Dashboard — action-first design per dashboard_prompt.md
 *
 * Primary question: "What do I do today?"
 * Layout: Today Card → Progress Block → Coach Connection → Profile → History
 *
 * Key principles:
 * - One clear primary action (check-in or view today's plan)
 * - No raw compliance scores as hero metric
 * - Progress language, not grading language
 * - Color for status only (green/amber/red)
 * - FR-8: Quick Logging ≤ 30 seconds
 * - FR-10: Insights — streak, weekly adherence, workouts this week
 */

interface MemberProfile {
  email: string;
  status: string;
  planTier: string | null;
  billingInterval: string | null;
  goal: string | null;
  daysPerWeek: number | null;
  minutesPerSession: number | null;
  injuries: string | null;
  onboardedAt: string | null;
  createdAt: string;
}

interface CheckIn {
  id: string;
  date: string;
  workout: boolean;
  meals: number;
  water: boolean;
  steps: boolean;
  note: string | null;
  createdAt: string;
}

interface Stats {
  currentStreak: number;
  weeklyWorkouts: number;
  weeklyAdherence: number;
}

type DashboardState =
  | { phase: "identify" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "dashboard"; member: MemberProfile; checkIns: CheckIn[]; stats: Stats };

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({ phase: "identify" });
  const [email, setEmail] = useState("");

  // Check-in form state
  const [workout, setWorkout] = useState(false);
  const [meals, setMeals] = useState(0);
  const [water, setWater] = useState(false);
  const [steps, setSteps] = useState(false);
  const [note, setNote] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/dashboard" } });
  }, []);

  const loadDashboard = useCallback(async (memberEmail: string) => {
    setState({ phase: "loading" });

    try {
      const memberRes = await fetch(`/api/member?email=${encodeURIComponent(memberEmail)}`);

      if (!memberRes.ok) {
        const data = await memberRes.json().catch(() => null);
        throw new Error(data?.error?.message ?? "No account found for this email. Have you completed checkout?");
      }

      const memberData = await memberRes.json();

      let checkIns: CheckIn[] = [];
      let stats: Stats = { currentStreak: 0, weeklyWorkouts: 0, weeklyAdherence: 0 };

      if (memberData.member.status === "active") {
        try {
          const historyRes = await fetch(`/api/checkin?email=${encodeURIComponent(memberEmail)}`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            checkIns = historyData.checkIns ?? [];
            stats = historyData.stats ?? stats;
          }
        } catch {
          // Non-fatal — dashboard still loads without history
        }
      }

      setState({
        phase: "dashboard",
        member: memberData.member,
        checkIns,
        stats,
      });

      track({ name: "dashboard_loaded", properties: { status: memberData.member.status } });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, []);

  async function onIdentify(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setState({ phase: "error", message: "Please enter a valid email." });
      return;
    }
    await loadDashboard(email);
  }

  async function onCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setCheckInLoading(true);
    setCheckInMessage(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          workout,
          meals,
          water,
          steps,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Check-in failed");

      setCheckInMessage("Checked in ✅");
      track({ name: "checkin_submitted", properties: { workout } });

      // Reset form
      setWorkout(false);
      setMeals(0);
      setWater(false);
      setSteps(false);
      setNote("");

      // Refresh dashboard
      await loadDashboard(email);
    } catch (err) {
      setCheckInMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setCheckInLoading(false);
    }
  }

  // ── Identify screen ──
  if (state.phase === "identify" || state.phase === "error") {
    return (
      <main className="min-h-screen bg-neutral-50 text-black">
        <div className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
          <p className="mt-2 text-center text-neutral-500 text-sm">
            Enter your email to view your dashboard.
          </p>

          <form onSubmit={onIdentify} className="mt-8 space-y-4">
            <input
              type="email"
              className={components.input.base}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />

            {state.phase === "error" && (
              <p className="text-sm text-red-600" role="alert">
                {state.message}
              </p>
            )}

            <button type="submit" className={`w-full ${components.button.primary}`}>
              View Dashboard
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className={components.button.ghost}>
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Loading ──
  if (state.phase === "loading") {
    return (
      <main className="min-h-screen bg-neutral-50 text-black">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-neutral-200 rounded-xl w-48" />
            <div className="h-40 bg-neutral-200 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-neutral-200 rounded-2xl" />
              <div className="h-24 bg-neutral-200 rounded-2xl" />
              <div className="h-24 bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  const { member, checkIns, stats } = state;
  const hasCheckedInToday = checkIns.some((ci) => {
    const ciDate = new Date(ci.date);
    const today = new Date();
    return (
      ciDate.getFullYear() === today.getFullYear() &&
      ciDate.getMonth() === today.getMonth() &&
      ciDate.getDate() === today.getDate()
    );
  });

  const planConfig = PLANS.find((p) => p.tier === member.planTier);
  const goalLabel = member.goal === "fat_loss"
    ? "Fat Loss"
    : member.goal === "muscle"
      ? "Build Muscle"
      : member.goal
        ? "Stay Consistent"
        : null;

  // Next milestone calculation
  const totalCheckIns = checkIns.length;
  const nextMilestone = totalCheckIns < 7 ? 7
    : totalCheckIns < 14 ? 14
    : totalCheckIns < 30 ? 30
    : totalCheckIns < 60 ? 60
    : totalCheckIns < 100 ? 100
    : Math.ceil((totalCheckIns + 1) / 50) * 50;
  const milestoneProgress = Math.round((totalCheckIns / nextMilestone) * 100);

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {getGreeting()}{member.onboardedAt ? "" : " 👋"}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {member.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`${components.badge.base} ${
                member.status === "active"
                  ? `${semantic.memberStatus.active.bg} ${semantic.memberStatus.active.text}`
                  : member.status === "pending"
                    ? `${semantic.memberStatus.pending.bg} ${semantic.memberStatus.pending.text}`
                    : `${semantic.memberStatus.canceled.bg} ${semantic.memberStatus.canceled.text}`
              }`}
            >
              {member.status}
            </span>
          </div>
        </header>

        {/* ── Pending notice ── */}
        {member.status === "pending" && (
          <div className={components.card.status.warning}>
            <h2 className="text-lg font-semibold text-yellow-800">
              Payment pending
            </h2>
            <p className="mt-2 text-sm text-yellow-700">
              Complete checkout to unlock your dashboard, check-ins, and coaching.
            </p>
            <a href="/" className={`mt-4 inline-block ${components.button.primary}`}>
              Complete checkout →
            </a>
          </div>
        )}

        {/* ── Canceled notice ── */}
        {member.status === "canceled" && (
          <div className={components.card.status.error}>
            <h2 className="text-lg font-semibold text-red-800">
              Membership canceled
            </h2>
            <p className="mt-2 text-sm text-red-700">
              Re-subscribe to regain access to coaching and check-ins.
            </p>
            <a href="/" className={`mt-4 inline-block ${components.button.primary}`}>
              Re-subscribe →
            </a>
          </div>
        )}

        {/* ── TODAY CARD — Primary action area ── */}
        {member.status === "active" && !hasCheckedInToday && (
          <section className={dashboard.member.todayCard}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today&apos;s Check-In</h2>
              <span className="text-sm text-neutral-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Log what you did today. Takes &lt; 30 seconds.
            </p>

            <form onSubmit={onCheckIn} className="mt-5 space-y-4">
              {/* Activity toggles */}
              <div className="grid grid-cols-3 gap-3">
                <CheckToggle
                  emoji="💪"
                  label="Workout"
                  checked={workout}
                  onToggle={() => setWorkout(!workout)}
                />
                <CheckToggle
                  emoji="💧"
                  label="Water"
                  checked={water}
                  onToggle={() => setWater(!water)}
                />
                <CheckToggle
                  emoji="🚶"
                  label="Steps"
                  checked={steps}
                  onToggle={() => setSteps(!steps)}
                />
              </div>

              {/* Meals counter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-600">🍽️ Meals on plan:</span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMeals(n)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        meals === n
                          ? "bg-black text-white"
                          : "border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                      }`}
                      aria-label={`${n} meals`}
                      aria-pressed={meals === n}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <input
                type="text"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-black focus:bg-white"
                placeholder="Add a note… (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                aria-label="Check-in note"
              />

              {checkInMessage && (
                <p
                  className={`text-sm ${checkInMessage.includes("✅") ? "text-green-600" : "text-red-600"}`}
                  role="alert"
                >
                  {checkInMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={checkInLoading}
                className={`w-full ${components.button.primary}`}
              >
                {checkInLoading ? "Saving…" : "Log Today"}
              </button>
            </form>
          </section>
        )}

        {/* ── Checked-in today confirmation ── */}
        {member.status === "active" && hasCheckedInToday && (
          <section className={components.card.status.success}>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-800">
                Checked in today ✅
              </p>
              <p className="mt-1 text-sm text-green-600">
                Come back tomorrow to keep your streak going.
              </p>
            </div>
          </section>
        )}

        {/* ── PROGRESS BLOCK — motivational, not compliance-scoring ── */}
        {member.status === "active" && (
          <section className={dashboard.member.progressBlock}>
            <h2 className="text-lg font-semibold">Your Progress</h2>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className={components.stat.container}>
                <p className={components.stat.value}>
                  {stats.currentStreak}
                </p>
                <p className={components.stat.label}>Day streak 🔥</p>
              </div>
              <div className={components.stat.container}>
                <p className={components.stat.value}>
                  {stats.weeklyWorkouts}
                </p>
                <p className={components.stat.label}>
                  Workouts{member.daysPerWeek ? ` / ${member.daysPerWeek}` : ""}
                </p>
              </div>
              <div className={components.stat.container}>
                <p className={components.stat.value}>
                  {totalCheckIns}
                </p>
                <p className={components.stat.label}>Total check-ins</p>
              </div>
            </div>

            {/* Milestone progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{totalCheckIns} check-ins</span>
                <span>Next milestone: {nextMilestone}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-black transition-all duration-500"
                  style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── COACH CONNECTION ── */}
        {member.status === "active" && (
          <section className={dashboard.member.coachConnection}>
            <h2 className="text-lg font-semibold">Coach</h2>
            <div className="mt-3 space-y-3">
              {planConfig && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Your plan</span>
                  <span className="font-medium">
                    {planConfig.name}
                    {member.billingInterval ? ` · ${member.billingInterval}` : ""}
                  </span>
                </div>
              )}
              {goalLabel && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Goal</span>
                  <span className="font-medium">{goalLabel}</span>
                </div>
              )}
              {member.daysPerWeek && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Training schedule</span>
                  <span className="font-medium">{member.daysPerWeek}× per week</span>
                </div>
              )}
              {member.minutesPerSession && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Session length</span>
                  <span className="font-medium">{member.minutesPerSession} min</span>
                </div>
              )}
              {member.injuries && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Considerations</span>
                  <span className="font-medium">{member.injuries}</span>
                </div>
              )}
              {!member.onboardedAt && (
                <Link
                  href="/onboarding"
                  className={`block text-center ${components.button.secondary}`}
                >
                  Complete onboarding →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ── CHECK-IN HISTORY ── */}
        {member.status === "active" && (
          <section className={components.card.base}>
            <h2 className="text-lg font-semibold">Recent Check-Ins</h2>

            {checkIns.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                No check-ins yet. Start logging today!
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {checkIns.slice(0, 14).map((ci) => (
                  <div
                    key={ci.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(ci.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {ci.note && (
                        <p className="mt-0.5 text-xs text-neutral-500 italic">
                          {ci.note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 text-sm">
                      {ci.workout && <span title="Workout">💪</span>}
                      {ci.meals > 0 && (
                        <span title={`${ci.meals} meals`}>
                          🍽️{ci.meals}
                        </span>
                      )}
                      {ci.water && <span title="Water">💧</span>}
                      {ci.steps && <span title="Steps">🚶</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Navigation ── */}
        <nav className="flex gap-4 text-sm pb-8">
          <Link href="/" className={components.button.ghost}>
            ← Home
          </Link>
          {!member.onboardedAt && (
            <Link href="/onboarding" className={components.button.ghost}>
              Complete onboarding →
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}

// ── Helpers ──

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function CheckToggle({
  emoji,
  label,
  checked,
  onToggle,
}: {
  emoji: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
        checked
          ? "border-black bg-black text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
      }`}
    >
      <span className="text-lg">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
