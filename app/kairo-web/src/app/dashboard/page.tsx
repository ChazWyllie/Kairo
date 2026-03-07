"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

/**
 * Client dashboard — member portal showing status, onboarding data,
 * check-in history, streak, and daily logging form.
 *
 * Identified by email (no auth in MVP — Stripe is identity provider).
 * FR-8: Quick Logging — ≤ 30 seconds.
 * FR-10: Insights — streak, weekly adherence, workouts this week.
 */

interface MemberProfile {
  email: string;
  status: string;
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
      // Fetch member + check-in history in parallel
      const [memberRes, historyRes] = await Promise.all([
        fetch(`/api/member?email=${encodeURIComponent(memberEmail)}`),
        fetch(`/api/checkin?email=${encodeURIComponent(memberEmail)}`),
      ]);

      if (!memberRes.ok) {
        const data = await memberRes.json();
        throw new Error(data?.error?.message ?? "Member not found");
      }

      const memberData = await memberRes.json();

      let checkIns: CheckIn[] = [];
      let stats: Stats = { currentStreak: 0, weeklyWorkouts: 0, weeklyAdherence: 0 };

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        checkIns = historyData.checkIns ?? [];
        stats = historyData.stats ?? stats;
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
    if (!/\S+@\S+\.\S+/.test(email)) {
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
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-3xl font-semibold">Your Dashboard</h1>
          <p className="mt-2 text-neutral-600">
            Enter the email you used to sign up to view your dashboard.
          </p>

          <form onSubmit={onIdentify} className="mt-6 space-y-4">
            <input
              type="email"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {state.phase === "error" && (
              <p className="text-sm text-red-600" role="alert">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium"
            >
              View Dashboard
            </button>
          </form>

          <Link
            href="/"
            className="mt-6 inline-block text-sm text-neutral-500 hover:text-black"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  // ── Loading ──
  if (state.phase === "loading") {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-neutral-600">Loading your dashboard…</p>
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

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-neutral-500">{member.email}</p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
              member.status === "active"
                ? "bg-green-100 text-green-800"
                : member.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {member.status}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-200 p-4 text-center">
            <p className="text-3xl font-bold">{stats.currentStreak}</p>
            <p className="mt-1 text-sm text-neutral-500">Day streak 🔥</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-4 text-center">
            <p className="text-3xl font-bold">{stats.weeklyWorkouts}</p>
            <p className="mt-1 text-sm text-neutral-500">Workouts this week</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-4 text-center">
            <p className="text-3xl font-bold">{stats.weeklyAdherence}%</p>
            <p className="mt-1 text-sm text-neutral-500">Weekly adherence</p>
          </div>
        </div>

        {/* Quick Check-In (FR-8) */}
        {member.status === "active" && !hasCheckedInToday && (
          <div className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Today&apos;s Check-In</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Tap what you did today. Takes &lt; 30 seconds.
            </p>

            <form onSubmit={onCheckIn} className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-3">
                <CheckToggle
                  label="💪 Workout"
                  checked={workout}
                  onToggle={() => setWorkout(!workout)}
                />
                <CheckToggle
                  label="💧 Water"
                  checked={water}
                  onToggle={() => setWater(!water)}
                />
                <CheckToggle
                  label="🚶 Steps"
                  checked={steps}
                  onToggle={() => setSteps(!steps)}
                />
              </div>

              {/* Meals counter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">🍽️ Meals:</span>
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
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Note (optional) */}
              <input
                type="text"
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-neutral-900"
                placeholder="I missed because… (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
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
                className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium transition-opacity disabled:opacity-60"
              >
                {checkInLoading ? "Saving…" : "Log Today"}
              </button>
            </form>
          </div>
        )}

        {hasCheckedInToday && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-lg font-semibold text-green-800">
              Checked in today ✅
            </p>
            <p className="mt-1 text-sm text-green-600">
              Come back tomorrow to keep your streak going.
            </p>
          </div>
        )}

        {/* Profile Summary */}
        {member.onboardedAt && (
          <div className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Your Profile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {member.goal && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Goal</dt>
                  <dd className="font-medium">
                    {member.goal === "fat_loss"
                      ? "Fat Loss"
                      : member.goal === "muscle"
                        ? "Build Muscle"
                        : "Stay Consistent"}
                  </dd>
                </div>
              )}
              {member.daysPerWeek && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Training days</dt>
                  <dd className="font-medium">{member.daysPerWeek}/week</dd>
                </div>
              )}
              {member.minutesPerSession && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Session length</dt>
                  <dd className="font-medium">{member.minutesPerSession} min</dd>
                </div>
              )}
              {member.injuries && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Limitations</dt>
                  <dd className="font-medium">{member.injuries}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Check-In History */}
        <div className="rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">Recent Check-Ins</h2>

          {checkIns.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              No check-ins yet. Start logging today!
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {checkIns.slice(0, 14).map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3"
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
        </div>

        {/* Navigation */}
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-neutral-500 hover:text-black">
            ← Home
          </Link>
          {!member.onboardedAt && (
            <Link
              href="/onboarding"
              className="text-neutral-500 hover:text-black"
            >
              Complete onboarding →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function CheckToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
        checked
          ? "border-black bg-black text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
      }`}
    >
      {label}
    </button>
  );
}
