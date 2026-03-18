"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { PLANS } from "@/lib/stripe-prices";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import PageHeader from "@/components/layout/PageHeader";

interface CheckIn {
  id: string;
  date: string;
  workout: boolean;
  meals: number;
  water: boolean;
  steps: boolean;
  note: string | null;
  avgWeight: number | null;
  waist: number | null;
  photoSubmitted: boolean | null;
  workoutsCompleted: number | null;
  stepsAverage: number | null;
  calorieAdherence: number | null;
  proteinAdherence: number | null;
  sleepAverage: number | null;
  energyScore: number | null;
  hungerScore: number | null;
  stressScore: number | null;
  digestionScore: number | null;
  recoveryScore: number | null;
  painNotes: string | null;
  biggestWin: string | null;
  biggestStruggle: string | null;
  helpNeeded: string | null;
  coachStatus: string | null;
  coachResponse: string | null;
  createdAt: string;
}

interface Review {
  id: string;
  type: string;
  dueDate: string | null;
  completedDate: string | null;
  summary: string | null;
  actionItems: string | null;
  loomLink: string | null;
  followUpNeeded: boolean;
  createdAt: string;
}

interface ProgramBlock {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  primaryGoal: string | null;
  split: string | null;
  daysPerWeek: number | null;
  progressionModel: string | null;
  deloadPlanned: boolean;
  deloadWeek: number | null;
  keyExercises: string | null;
  workoutNotes: string | null;
  cardioTarget: string | null;
  stepsTarget: number | null;
  adjustmentsMade: string | null;
  adjustmentReason: string | null;
  nextUpdateDate: string | null;
  createdAt: string;
}

interface MacroTarget {
  id: string;
  status: string;
  effectiveDate: string;
  calories: number;
  protein: number;
  fatsMin: number | null;
  carbs: number | null;
  stepsTarget: number | null;
  hydrationTarget: string | null;
  adjustmentReason: string | null;
  previousCalories: number | null;
  previousProtein: number | null;
  createdAt: string;
}

interface Stats {
  currentStreak: number;
  weeklyWorkouts: number;
  weeklyAdherence: number;
}

type DataState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; checkIns: CheckIn[]; stats: Stats; reviews: Review[]; programs: ProgramBlock[]; macros: MacroTarget[] };

export default function DashboardPage() {
  const { member } = useAuth();
  const [data, setData] = useState<DataState>({ phase: "loading" });

  // Check-in form state
  const [workout, setWorkout] = useState(false);
  const [meals, setMeals] = useState(0);
  const [water, setWater] = useState(false);
  const [steps, setSteps] = useState(false);
  const [note, setNote] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  // Enhanced weekly fields
  const [showWeekly, setShowWeekly] = useState(false);
  const [avgWeight, setAvgWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [workoutsCompleted, setWorkoutsCompleted] = useState("");
  const [stepsAverage, setStepsAverage] = useState("");
  const [calorieAdherence, setCalorieAdherence] = useState(0);
  const [proteinAdherence, setProteinAdherence] = useState(0);
  const [sleepAverage, setSleepAverage] = useState("");
  const [energyScore, setEnergyScore] = useState(0);
  const [stressScore, setStressScore] = useState(0);
  const [recoveryScore, setRecoveryScore] = useState(0);
  const [biggestWin, setBiggestWin] = useState("");
  const [biggestStruggle, setBiggestStruggle] = useState("");
  const [helpNeeded, setHelpNeeded] = useState("");

  const loadData = useCallback(async (email: string) => {
    setData({ phase: "loading" });
    try {
      let checkIns: CheckIn[] = [];
      let stats: Stats = { currentStreak: 0, weeklyWorkouts: 0, weeklyAdherence: 0 };
      let reviews: Review[] = [];
      let programs: ProgramBlock[] = [];
      let macros: MacroTarget[] = [];

      const [historyRes, reviewsRes, programsRes, macrosRes] = await Promise.allSettled([
        fetch(`/api/checkin?email=${encodeURIComponent(email)}`),
        fetch(`/api/review?email=${encodeURIComponent(email)}`),
        fetch(`/api/program?email=${encodeURIComponent(email)}`),
        fetch(`/api/macro?email=${encodeURIComponent(email)}`),
      ]);

      if (historyRes.status === "fulfilled" && historyRes.value.ok) {
        const d = await historyRes.value.json();
        checkIns = d.checkIns ?? [];
        stats = d.stats ?? stats;
      }
      if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
        const d = await reviewsRes.value.json();
        reviews = d.reviews ?? [];
      }
      if (programsRes.status === "fulfilled" && programsRes.value.ok) {
        const d = await programsRes.value.json();
        programs = d.programs ?? [];
      }
      if (macrosRes.status === "fulfilled" && macrosRes.value.ok) {
        const d = await macrosRes.value.json();
        macros = d.macros ?? [];
      }

      setData({ phase: "ready", checkIns, stats, reviews, programs, macros });
      track({ name: "dashboard_loaded", properties: { status: member?.status } });
    } catch (err) {
      setData({ phase: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }, [member?.status]);

  useEffect(() => {
    if (member?.email && member.status === "active") {
      loadData(member.email);
    } else if (member) {
      setData({ phase: "ready", checkIns: [], stats: { currentStreak: 0, weeklyWorkouts: 0, weeklyAdherence: 0 }, reviews: [], programs: [], macros: [] });
    }
    track({ name: "page_view", properties: { path: "/dashboard" } });
  }, [member, loadData]);

  async function onCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!member?.email) return;
    setCheckInLoading(true);
    setCheckInMessage(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: member.email,
          workout,
          meals,
          water,
          steps,
          note: note.trim() || undefined,
          ...(avgWeight ? { avgWeight: parseFloat(avgWeight) } : {}),
          ...(waist ? { waist: parseFloat(waist) } : {}),
          ...(workoutsCompleted ? { workoutsCompleted: parseInt(workoutsCompleted, 10) } : {}),
          ...(stepsAverage ? { stepsAverage: parseInt(stepsAverage, 10) } : {}),
          ...(calorieAdherence > 0 ? { calorieAdherence } : {}),
          ...(proteinAdherence > 0 ? { proteinAdherence } : {}),
          ...(sleepAverage ? { sleepAverage: parseFloat(sleepAverage) } : {}),
          ...(energyScore > 0 ? { energyScore } : {}),
          ...(stressScore > 0 ? { stressScore } : {}),
          ...(recoveryScore > 0 ? { recoveryScore } : {}),
          ...(biggestWin.trim() ? { biggestWin: biggestWin.trim() } : {}),
          ...(biggestStruggle.trim() ? { biggestStruggle: biggestStruggle.trim() } : {}),
          ...(helpNeeded.trim() ? { helpNeeded: helpNeeded.trim() } : {}),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData?.error?.message ?? "Check-in failed");

      setCheckInMessage("Checked in!");
      track({ name: "checkin_submitted", properties: { workout } });

      // Reset form
      setWorkout(false); setMeals(0); setWater(false); setSteps(false); setNote("");
      setShowWeekly(false); setAvgWeight(""); setWaist(""); setWorkoutsCompleted("");
      setStepsAverage(""); setCalorieAdherence(0); setProteinAdherence(0);
      setSleepAverage(""); setEnergyScore(0); setStressScore(0); setRecoveryScore(0);
      setBiggestWin(""); setBiggestStruggle(""); setHelpNeeded("");

      await loadData(member.email);
    } catch (err) {
      setCheckInMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCheckInLoading(false);
    }
  }

  if (!member || data.phase === "loading") {
    return (
      <div>
        <PageHeader title="Home" />
        <SkeletonCard /><br /><SkeletonCard /><br /><SkeletonCard />
      </div>
    );
  }

  if (data.phase === "error") {
    return (
      <div>
        <PageHeader title="Home" />
        <Card>
          <p style={{ color: "var(--status-error)", fontSize: "0.875rem", marginBottom: "12px" }}>{data.message}</p>
          <button
            onClick={() => member?.email && loadData(member.email)}
            style={{ padding: "10px 16px", background: "var(--accent-primary)", color: "var(--bg-primary)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  const { checkIns, stats, reviews, programs, macros } = data;

  const hasCheckedInToday = checkIns.some((ci) => {
    const ciDate = new Date(ci.date);
    const today = new Date();
    return ciDate.getFullYear() === today.getFullYear() &&
      ciDate.getMonth() === today.getMonth() &&
      ciDate.getDate() === today.getDate();
  });

  const planConfig = PLANS.find((p) => p.tier === member.planTier);
  const totalCheckIns = checkIns.length;
  const nextMilestone = totalCheckIns < 7 ? 7 : totalCheckIns < 14 ? 14 : totalCheckIns < 30 ? 30 : totalCheckIns < 60 ? 60 : totalCheckIns < 100 ? 100 : Math.ceil((totalCheckIns + 1) / 50) * 50;
  const milestoneProgress = Math.round((totalCheckIns / nextMilestone) * 100);

  const activeProgram = programs.find((p) => p.status === "active") ?? programs[0];
  const activeMacro = macros.find((m) => m.status === "active");

  return (
    <div>
      <PageHeader
        title={getGreeting()}
        subtitle={member.email}
        action={<Badge variant="status" value={member.status as "active" | "canceled" | "past_due" | "pending"} />}
      />

      {/* Pending notice */}
      {member.status === "pending" && (
        <Card accentBorder style={{ marginBottom: "16px", borderLeft: "2px solid var(--status-warning)" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>Payment pending</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Complete checkout to unlock your dashboard, check-ins, and coaching.
          </p>
          <a href="/" style={{ display: "inline-block", padding: "10px 16px", background: "var(--accent-primary)", color: "var(--bg-primary)", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>
            Complete checkout
          </a>
        </Card>
      )}

      {/* Canceled notice */}
      {member.status === "canceled" && (
        <Card style={{ marginBottom: "16px", border: "1px solid var(--status-error)" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>Membership canceled</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Re-subscribe to regain access to coaching and check-ins.
          </p>
          <a href="/" style={{ display: "inline-block", padding: "10px 16px", background: "var(--accent-primary)", color: "var(--bg-primary)", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>
            Re-subscribe
          </a>
        </Card>
      )}

      {/* TODAY CARD */}
      {member.status === "active" && !hasCheckedInToday && (
        <Card accentBorder style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Today&apos;s Check-In</p>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "16px" }}>
            Log what you did today. Takes &lt; 30 seconds.
          </p>

          <form onSubmit={onCheckIn}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
              <CheckToggle emoji="💪" label="Workout" checked={workout} onToggle={() => setWorkout(!workout)} />
              <CheckToggle emoji="💧" label="Water" checked={water} onToggle={() => setWater(!water)} />
              <CheckToggle emoji="🚶" label="Steps" checked={steps} onToggle={() => setSteps(!steps)} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>🍽️ Meals on plan:</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMeals(n)}
                    aria-pressed={meals === n}
                    style={{
                      height: "36px", width: "36px", borderRadius: "8px", border: "1px solid",
                      borderColor: meals === n ? "var(--accent-primary)" : "var(--border-hover)",
                      background: meals === n ? "var(--accent-primary)" : "transparent",
                      color: meals === n ? "var(--bg-primary)" : "var(--text-secondary)",
                      fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Add a note… (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              style={{
                width: "100%", background: "var(--bg-tertiary)", border: "1px solid var(--border-hover)",
                borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
                fontSize: "16px", boxSizing: "border-box", outline: "none", marginBottom: "12px",
              }}
            />

            <button
              type="button"
              onClick={() => setShowWeekly(!showWeekly)}
              style={{ width: "100%", textAlign: "left", fontSize: "0.8125rem", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}
            >
              <span>{showWeekly ? "▼" : "▶"}</span>
              <span>Weekly details (body, recovery, reflection)</span>
            </button>

            {showWeekly && (
              <div style={{ background: "var(--bg-tertiary)", borderRadius: "10px", padding: "14px", marginBottom: "12px" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Body Data</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Avg weight (lbs)</label>
                    <input type="number" step="0.1" placeholder="185.5" value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Waist (in)</label>
                    <input type="number" step="0.1" placeholder="32.0" value={waist} onChange={(e) => setWaist(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Adherence</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Workouts completed</label>
                    <input type="number" placeholder="5" value={workoutsCompleted} onChange={(e) => setWorkoutsCompleted(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Avg daily steps</label>
                    <input type="number" placeholder="9500" value={stepsAverage} onChange={(e) => setStepsAverage(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Avg sleep (hrs)</label>
                    <input type="number" step="0.1" placeholder="7.5" value={sleepAverage} onChange={(e) => setSleepAverage(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <ScoreSelector label="Calorie adherence" value={calorieAdherence} onChange={setCalorieAdherence} />
                  <ScoreSelector label="Protein adherence" value={proteinAdherence} onChange={setProteinAdherence} />
                </div>

                <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Recovery (1–10)</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
                  <ScoreSelector label="Energy" value={energyScore} onChange={setEnergyScore} />
                  <ScoreSelector label="Stress" value={stressScore} onChange={setStressScore} />
                  <ScoreSelector label="Recovery" value={recoveryScore} onChange={setRecoveryScore} />
                </div>

                <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Reflection</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input type="text" placeholder="Biggest win this week…" value={biggestWin} onChange={(e) => setBiggestWin(e.target.value)} maxLength={1000} style={inputStyle} />
                  <input type="text" placeholder="Biggest struggle…" value={biggestStruggle} onChange={(e) => setBiggestStruggle(e.target.value)} maxLength={1000} style={inputStyle} />
                  <input type="text" placeholder="What do you need help with?" value={helpNeeded} onChange={(e) => setHelpNeeded(e.target.value)} maxLength={1000} style={inputStyle} />
                </div>
              </div>
            )}

            {checkInMessage && (
              <p style={{ fontSize: "0.875rem", color: checkInMessage.includes("Checked") ? "var(--status-success)" : "var(--status-error)", marginBottom: "10px" }} role="alert">
                {checkInMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={checkInLoading}
              style={{
                width: "100%", padding: "12px", background: "var(--accent-primary)", color: "var(--bg-primary)",
                border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.9375rem",
                cursor: checkInLoading ? "not-allowed" : "pointer", opacity: checkInLoading ? 0.7 : 1,
              }}
            >
              {checkInLoading ? "Saving…" : "Log Today"}
            </button>
          </form>
        </Card>
      )}

      {/* Checked in today */}
      {member.status === "active" && hasCheckedInToday && (
        <Card style={{ marginBottom: "16px", borderColor: "var(--status-success)" }}>
          <p style={{ textAlign: "center", fontWeight: 600, color: "var(--status-success)", margin: 0 }}>
            Checked in today
          </p>
          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
            Come back tomorrow to keep your streak going.
          </p>
        </Card>
      )}

      {/* PROGRESS BLOCK */}
      {member.status === "active" && (
        <Card style={{ marginBottom: "16px" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Your Progress</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              { value: stats.currentStreak, label: "Day streak" },
              { value: stats.weeklyWorkouts, label: member.daysPerWeek ? `Workouts / ${member.daysPerWeek}` : "Workouts" },
              { value: totalCheckIns, label: "Total check-ins" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "10px", padding: "12px 8px" }}>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>{value}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              <span>{totalCheckIns} check-ins</span>
              <span>Next milestone: {nextMilestone}</span>
            </div>
            <div style={{ height: "4px", background: "var(--bg-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--accent-primary)", borderRadius: "2px", width: `${Math.min(milestoneProgress, 100)}%`, transition: "width 0.5s ease" }} />
            </div>
          </div>
        </Card>
      )}

      {/* CURRENT PROGRAM */}
      {member.status === "active" && activeProgram && (
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Current Program</p>
            <span style={{
              fontSize: "0.75rem", padding: "2px 10px", borderRadius: "9999px",
              background: activeProgram.status === "active" ? "rgba(74,222,128,0.1)" : "var(--bg-tertiary)",
              color: activeProgram.status === "active" ? "var(--status-success)" : "var(--text-tertiary)",
            }}>
              {activeProgram.status}
            </span>
          </div>
          <p style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "12px" }}>{activeProgram.name}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            {activeProgram.primaryGoal && (
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>Goal</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0, textTransform: "capitalize" }}>{activeProgram.primaryGoal.replace("_", " ")}</p>
              </div>
            )}
            {activeProgram.split && (
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>Split</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0, textTransform: "capitalize" }}>{activeProgram.split.replace("_", " / ")}</p>
              </div>
            )}
            {activeProgram.daysPerWeek && (
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>Days/week</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>{activeProgram.daysPerWeek}×</p>
              </div>
            )}
          </div>

          {activeProgram.keyExercises && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Key Exercises</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{activeProgram.keyExercises}</p>
            </div>
          )}
          {activeProgram.workoutNotes && (
            <div style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "10px" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Coach Notes</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>{activeProgram.workoutNotes}</p>
            </div>
          )}
        </Card>
      )}

      {/* DAILY TARGETS */}
      {member.status === "active" && activeMacro && (
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Daily Targets</p>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Since {new Date(activeMacro.effectiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div style={{ background: "var(--bg-tertiary)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>{activeMacro.calories.toLocaleString()}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>Calories</p>
            </div>
            <div style={{ background: "var(--bg-tertiary)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>{activeMacro.protein}g</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>Protein</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeMacro.fatsMin && <MacroRow label="Fats (min)" value={`${activeMacro.fatsMin}g`} />}
            {activeMacro.carbs && <MacroRow label="Carbs" value={`${activeMacro.carbs}g`} />}
            {activeMacro.stepsTarget && <MacroRow label="Steps target" value={activeMacro.stepsTarget.toLocaleString()} />}
            {activeMacro.hydrationTarget && <MacroRow label="Hydration" value={activeMacro.hydrationTarget} />}
          </div>
        </Card>
      )}

      {/* COACH REVIEWS */}
      {member.status === "active" && reviews.length > 0 && (
        <Card style={{ marginBottom: "16px" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>Coach Reviews</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "capitalize" }}>
                    {review.type.replace("_", " ")} · {review.completedDate ? <span style={{ color: "var(--status-success)" }}>Completed</span> : <span style={{ color: "var(--status-warning)" }}>Upcoming</span>}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                    {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {review.summary && <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>{review.summary}</p>}
                {review.actionItems && (
                  <div style={{ marginTop: "8px" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>Action items:</p>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>{review.actionItems}</p>
                  </div>
                )}
                {review.loomLink && (
                  <a href={review.loomLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "8px", fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 500 }}>
                    Watch video review →
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CHECK-IN HISTORY */}
      {member.status === "active" && (
        <Card style={{ marginBottom: "16px" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>Recent Check-Ins</p>
          {checkIns.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>No check-ins yet. Start logging today!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {checkIns.slice(0, 14).map((ci) => (
                <div key={ci.id} style={{
                  borderRadius: "10px", padding: "12px",
                  background: ci.coachStatus === "red" ? "rgba(248,113,113,0.08)"
                    : ci.coachStatus === "yellow" ? "rgba(251,191,36,0.08)"
                    : ci.coachStatus === "green" ? "rgba(74,222,128,0.08)"
                    : "var(--bg-tertiary)",
                  border: "1px solid var(--border-subtle)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>
                        {new Date(ci.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {ci.note && <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0, fontStyle: "italic" }}>{ci.note}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                      {ci.coachStatus && (
                        <span style={{
                          height: "8px", width: "8px", borderRadius: "50%", display: "inline-block",
                          background: ci.coachStatus === "green" ? "var(--status-success)" : ci.coachStatus === "yellow" ? "var(--status-warning)" : "var(--status-error)",
                        }} />
                      )}
                      {ci.workout && <span>💪</span>}
                      {ci.meals > 0 && <span>🍽️{ci.meals}</span>}
                      {ci.water && <span>💧</span>}
                      {ci.steps && <span>🚶</span>}
                    </div>
                  </div>
                  {ci.coachResponse && (
                    <div style={{ marginTop: "8px", background: "var(--bg-secondary)", borderRadius: "6px", padding: "8px 10px" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>Coach feedback:</p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{ci.coachResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ONBOARDING CTA */}
      {member.status === "active" && !member.onboardedAt && (
        <Card accentBorder style={{ marginBottom: "16px" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>Complete your profile</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Tell your coach about your goals, schedule, and any injuries so they can build your plan.
          </p>
          <Link
            href="/onboarding"
            style={{ display: "inline-block", padding: "10px 16px", background: "var(--accent-primary)", color: "var(--bg-primary)", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}
          >
            Complete onboarding
          </Link>
        </Card>
      )}

      {/* PLAN INFO */}
      {planConfig && (
        <Card style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "10px" }}>Your Plan</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {planConfig.name}{member.billingInterval ? ` · ${member.billingInterval}` : ""}
            </p>
            <Badge variant="status" value={member.status as "active" | "canceled" | "past_due" | "pending"} />
          </div>
        </Card>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-hover)",
  borderRadius: "8px",
  padding: "8px 10px",
  color: "var(--text-primary)",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
};

function MacroRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function CheckToggle({ emoji, label, checked, onToggle }: { emoji: string; label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
        padding: "12px 8px", borderRadius: "10px", border: "1px solid",
        borderColor: checked ? "var(--accent-primary)" : "var(--border-hover)",
        background: checked ? "rgba(224,255,79,0.1)" : "transparent",
        color: checked ? "var(--accent-primary)" : "var(--text-secondary)",
        cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, transition: "all 0.15s ease",
      }}
    >
      <span style={{ fontSize: "1.25rem" }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>{label}</label>
      <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            aria-pressed={value === n}
            style={{
              height: "28px", width: "28px", borderRadius: "6px",
              border: "1px solid",
              borderColor: value === n ? "var(--accent-primary)" : "var(--border-hover)",
              background: value === n ? "var(--accent-primary)" : "transparent",
              color: value === n ? "var(--bg-primary)" : "var(--text-tertiary)",
              fontSize: "0.625rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
