"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { semantic, components, dashboard } from "@/lib/design-tokens";

/**
 * Coach Dashboard — exception-first design per dashboard_prompt.md
 *
 * Primary question: "Who needs me right now?"
 * Layout: Auth → Portfolio Stats → Attention Queue → Client Health → Today's Ops
 *
 * Key principles:
 * - Exception-driven: surface risk early, flag drops
 * - Sorted by urgency: at_risk → needs_attention → on_track
 * - Color for status only (green/amber/red)
 * - No decoration, command-center density
 * - Protected by COACH_SECRET (shared secret for MVP)
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

interface ApplicationInfo {
  id: string;
  email: string;
  fullName: string;
  goal: string;
  preferredTier: string | null;
  trainingExperience: string | null;
  gymAccess: string | null;
  whyNow: string | null;
  biggestObstacle: string | null;
  status: string;
  convertedToMember: boolean;
  createdAt: string;
  approvedAt: string | null;
}

interface PortfolioStats {
  activeClients: number;
  atRiskCount: number;
  needsAttentionCount: number;
  averageAdherence7d: number;
  totalLeads: number;
}

interface CoachData {
  portfolio: PortfolioStats;
  clients: ClientHealth[];
  applications: ApplicationInfo[];
}

type CoachState =
  | { phase: "auth" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "dashboard"; data: CoachData };

export default function CoachPage() {
  const [state, setState] = useState<CoachState>({ phase: "auth" });
  const [secret, setSecret] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/coach" } });

    // Auto-load if secret is in URL
    const params = new URLSearchParams(window.location.search);
    const urlSecret = params.get("secret");
    if (urlSecret) {
      setSecret(urlSecret);
      loadCoachData(urlSecret);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCoachData = useCallback(async (coachSecret: string) => {
    setState({ phase: "loading" });

    try {
      const res = await fetch(`/api/coach?secret=${encodeURIComponent(coachSecret)}`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          throw new Error("Invalid coach secret.");
        }
        throw new Error(data?.error?.message ?? "Failed to load coach data");
      }

      const data: CoachData = await res.json();
      setState({ phase: "dashboard", data });
      track({ name: "coach_dashboard_loaded", properties: { clients: data.portfolio.activeClients } });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, []);

  function onAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) return;
    loadCoachData(secret.trim());
  }

  // ── Auth screen ──
  if (state.phase === "auth" || state.phase === "error") {
    return (
      <main className="min-h-screen bg-neutral-50 text-black">
        <div className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-2xl font-semibold text-center">Coach Portal</h1>
          <p className="mt-2 text-center text-neutral-500 text-sm">
            Enter your coach secret to access the dashboard.
          </p>

          <form onSubmit={onAuth} className="mt-8 space-y-4">
            <input
              type="password"
              className={components.input.base}
              placeholder="Coach secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              aria-label="Coach secret"
              autoComplete="off"
            />

            {state.phase === "error" && (
              <p className="text-sm text-red-600" role="alert">
                {state.message}
              </p>
            )}

            <button type="submit" className={`w-full ${components.button.primary}`}>
              Access Dashboard
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
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-neutral-200 rounded-xl w-48" />
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-64 bg-neutral-200 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  const { portfolio, clients, applications } = state.data;
  const atRiskClients = clients.filter((c) => c.status === "at_risk");
  const needsAttentionClients = clients.filter((c) => c.status === "needs_attention");
  const onTrackClients = clients.filter((c) => c.status === "on_track");
  const pendingApps = applications.filter((a) => a.status === "pending");
  const processedApps = applications.filter((a) => a.status !== "pending");

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Coach Dashboard</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => loadCoachData(secret)}
            className={components.button.secondary}
            aria-label="Refresh data"
          >
            ↻ Refresh
          </button>
        </header>

        {/* ── PORTFOLIO STATS ── */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className={dashboard.coach.portfolioStat}>
            <p className={components.stat.value}>{portfolio.activeClients}</p>
            <p className={components.stat.label}>Active clients</p>
          </div>
          <div className={`${dashboard.coach.portfolioStat} ${portfolio.atRiskCount > 0 ? "!border-red-200 !bg-red-50" : ""}`}>
            <p className={`${components.stat.value} ${portfolio.atRiskCount > 0 ? "text-red-600" : ""}`}>
              {portfolio.atRiskCount}
            </p>
            <p className={components.stat.label}>At risk</p>
          </div>
          <div className={`${dashboard.coach.portfolioStat} ${portfolio.needsAttentionCount > 0 ? "!border-amber-200 !bg-amber-50" : ""}`}>
            <p className={`${components.stat.value} ${portfolio.needsAttentionCount > 0 ? "text-amber-600" : ""}`}>
              {portfolio.needsAttentionCount}
            </p>
            <p className={components.stat.label}>Needs attention</p>
          </div>
          <div className={dashboard.coach.portfolioStat}>
            <p className={components.stat.value}>{portfolio.averageAdherence7d}%</p>
            <p className={components.stat.label}>Avg adherence (7d)</p>
          </div>
          <div className={dashboard.coach.portfolioStat}>
            <p className={components.stat.value}>{portfolio.totalLeads}</p>
            <p className={components.stat.label}>Total leads</p>
          </div>
        </section>

        {/* ── ATTENTION QUEUE — exception-first ── */}
        {(atRiskClients.length > 0 || needsAttentionClients.length > 0) && (
          <section>
            <h2 className="text-lg font-semibold mb-3">⚠️ Needs Attention</h2>
            <div className="space-y-2">
              {atRiskClients.map((client) => (
                <ClientCard
                  key={client.email}
                  client={client}
                  expanded={expandedClient === client.email}
                  onToggle={() =>
                    setExpandedClient(expandedClient === client.email ? null : client.email)
                  }
                  coachSecret={secret}
                  onRefresh={() => loadCoachData(secret)}
                />
              ))}
              {needsAttentionClients.map((client) => (
                <ClientCard
                  key={client.email}
                  client={client}
                  expanded={expandedClient === client.email}
                  onToggle={() =>
                    setExpandedClient(expandedClient === client.email ? null : client.email)
                  }
                  coachSecret={secret}
                  onRefresh={() => loadCoachData(secret)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {atRiskClients.length === 0 && needsAttentionClients.length === 0 && clients.length > 0 && (
          <section className={components.card.status.success}>
            <p className="text-center text-green-800 font-medium">
              ✅ All clients on track — no interventions needed right now.
            </p>
          </section>
        )}

        {clients.length === 0 && (
          <section className={components.card.base}>
            <p className="text-center text-neutral-500">
              No active clients yet. Once members subscribe, they&apos;ll appear here.
            </p>
          </section>
        )}

        {/* ── ALL CLIENTS — full roster ── */}
        {onTrackClients.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">
              ✅ On Track ({onTrackClients.length})
            </h2>
            <div className="space-y-2">
              {onTrackClients.map((client) => (
                <ClientCard
                  key={client.email}
                  client={client}
                  expanded={expandedClient === client.email}
                  onToggle={() =>
                    setExpandedClient(expandedClient === client.email ? null : client.email)
                  }
                  coachSecret={secret}
                  onRefresh={() => loadCoachData(secret)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── APPLICATIONS — review & approve/reject ── */}
        <ApplicationsSection
          pendingApps={pendingApps}
          processedApps={processedApps}
          coachSecret={secret}
          onRefresh={() => loadCoachData(secret)}
        />

        {/* ── TEMPLATES — quick-access coach scripts ── */}
        <TemplatesSection coachSecret={secret} />

        {/* ── Navigation ── */}
        <nav className="flex gap-4 text-sm pb-8">
          <Link href="/" className={components.button.ghost}>
            ← Home
          </Link>
        </nav>
      </div>
    </main>
  );
}

// ── Client Card Component ──

function ClientCard({
  client,
  expanded,
  onToggle,
  coachSecret,
  onRefresh,
}: {
  client: ClientHealth;
  expanded: boolean;
  onToggle: () => void;
  coachSecret: string;
  onRefresh: () => void;
}) {
  const statusConfig = getStatusConfig(client.status);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageMessage, setTriageMessage] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null);
  const [showTemplateHelper, setShowTemplateHelper] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

  async function handleCancelClient() {
    if (!confirm(`Cancel membership for ${client.email}? They'll keep access until end of billing period.`)) return;
    setCancelLoading(true);
    setCancelMsg(null);
    try {
      const res = await fetch(`/api/coach/cancel-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email, secret: coachSecret }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to cancel");
      }
      setCancelMsg("Cancelled — access until end of billing period.");
      onRefresh();
    } catch (err) {
      setCancelMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleTriage(checkInId: string, coachStatus: "green" | "yellow" | "red") {
    setTriageLoading(true);
    setTriageMessage(null);

    try {
      const res = await fetch(`/api/checkin/respond?secret=${encodeURIComponent(coachSecret)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInId,
          coachStatus,
          coachResponse: responseText.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to triage");
      }

      setTriageMessage(`Triaged as ${coachStatus}`);
      setResponseText("");
      setSelectedCheckIn(null);
      onRefresh();
    } catch (err) {
      setTriageMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setTriageLoading(false);
    }
  }

  return (
    <div className={`${dashboard.coach.clientHealth} ${statusConfig.borderClass}`}>
      {/* Summary row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotClass}`} />
          <div>
            <p className="text-sm font-medium">{client.email}</p>
            <p className="text-xs text-neutral-500">
              {client.planTier ?? "—"} · {client.goal ?? "no goal set"}
              {client.daysPerWeek ? ` · ${client.daysPerWeek}×/wk` : ""}
              {" · "}
              <span className="text-neutral-400">
                since {new Date(client.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </p>
          </div>
          {client.paymentStatus === "past_due" && (
            <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5">
              ⚠️ Past due
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs text-neutral-500">7d</p>
            <p className={`text-sm font-semibold ${getAdherenceColor(client.adherence7d)}`}>
              {client.adherence7d}%
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Streak</p>
            <p className="text-sm font-semibold">{client.currentStreak}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Last</p>
            <p className="text-sm font-semibold">
              {client.daysSinceCheckIn !== null
                ? client.daysSinceCheckIn === 0
                  ? "Today"
                  : `${client.daysSinceCheckIn}d ago`
                : "Never"}
            </p>
          </div>
          <span className="text-neutral-400 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3">
          {/* Status banner */}
          <div className={`rounded-lg px-3 py-2 ${statusConfig.bgClass}`}>
            <p className={`text-xs font-medium ${statusConfig.textClass}`}>
              {statusConfig.label}
            </p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-4 gap-3">
            <MetricChip label="7d adherence" value={`${client.adherence7d}%`} />
            <MetricChip label="30d adherence" value={`${client.adherence30d}%`} />
            <MetricChip label="Streak" value={`${client.currentStreak} days`} />
            <MetricChip
              label="Member since"
              value={new Date(client.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            />
          </div>

          {/* Onboarding status */}
          {!client.onboarded && (
            <p className="text-xs text-amber-600 font-medium">
              ⚠ Not yet onboarded
            </p>
          )}

          {/* Active program + macros summary */}
          {(client.activeProgram || client.activeMacro) && (
            <div className="grid grid-cols-2 gap-3">
              {client.activeProgram && (
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Program</p>
                  <p className="text-sm font-medium">{client.activeProgram.name}</p>
                  <div className="mt-1 text-xs text-neutral-500 space-y-0.5">
                    {client.activeProgram.primaryGoal && (
                      <p className="capitalize">{client.activeProgram.primaryGoal.replace("_", " ")}</p>
                    )}
                    {client.activeProgram.split && (
                      <p className="capitalize">{client.activeProgram.split.replace("_", " / ")}</p>
                    )}
                    {client.activeProgram.daysPerWeek && (
                      <p>{client.activeProgram.daysPerWeek}×/week</p>
                    )}
                    {client.activeProgram.nextUpdateDate && (
                      <p>Update: {new Date(client.activeProgram.nextUpdateDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    )}
                  </div>
                </div>
              )}
              {client.activeMacro && (
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Macros</p>
                  <p className="text-sm font-medium">{client.activeMacro.calories} cal · {client.activeMacro.protein}g P</p>
                  <div className="mt-1 text-xs text-neutral-500 space-y-0.5">
                    {client.activeMacro.fatsMin && <p>{client.activeMacro.fatsMin}g F min</p>}
                    {client.activeMacro.carbs && <p>{client.activeMacro.carbs}g C</p>}
                    {client.activeMacro.stepsTarget && <p>{client.activeMacro.stepsTarget.toLocaleString()} steps</p>}
                    <p className="text-neutral-400">Since {new Date(client.activeMacro.effectiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent check-ins with triage */}
          {client.recentCheckIns.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 mb-2 font-medium">Recent check-ins:</p>
              <div className="space-y-2">
                {client.recentCheckIns.map((ci) => (
                  <div
                    key={ci.id}
                    className={`rounded-lg border p-3 text-sm ${
                      ci.coachStatus === "green"
                        ? "border-green-200 bg-green-50"
                        : ci.coachStatus === "yellow"
                          ? "border-amber-200 bg-amber-50"
                          : ci.coachStatus === "red"
                            ? "border-red-200 bg-red-50"
                            : "border-neutral-200 bg-neutral-50"
                    }`}
                  >
                    {/* Check-in header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {new Date(ci.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex gap-1 text-xs">
                          {ci.workout && <span>💪</span>}
                          {ci.meals > 0 && <span>🍽️{ci.meals}</span>}
                          {ci.water && <span>💧</span>}
                          {ci.steps && <span>🚶</span>}
                        </div>
                      </div>
                      {ci.coachStatus ? (
                        <span className={`text-xs font-medium ${
                          ci.coachStatus === "green" ? "text-green-700"
                            : ci.coachStatus === "yellow" ? "text-amber-700"
                              : "text-red-700"
                        }`}>
                          {ci.coachStatus.toUpperCase()}
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedCheckIn(selectedCheckIn === ci.id ? null : ci.id)}
                          className="text-xs text-neutral-500 hover:text-black underline"
                        >
                          Triage
                        </button>
                      )}
                    </div>

                    {/* Enhanced data row */}
                    {(ci.avgWeight || ci.sleepAverage || ci.energyScore || ci.recoveryScore) && (
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
                        {ci.avgWeight && <span>⚖️ {ci.avgWeight} lbs</span>}
                        {ci.sleepAverage && <span>😴 {ci.sleepAverage}h</span>}
                        {ci.energyScore && <span>⚡ Energy: {ci.energyScore}/10</span>}
                        {ci.recoveryScore && <span>💤 Recovery: {ci.recoveryScore}/10</span>}
                        {ci.stressScore && <span>🧠 Stress: {ci.stressScore}/10</span>}
                        {ci.calorieAdherence && <span>🔥 Cal: {ci.calorieAdherence}/10</span>}
                        {ci.proteinAdherence && <span>🥩 Pro: {ci.proteinAdherence}/10</span>}
                      </div>
                    )}

                    {/* Reflection */}
                    {(ci.biggestWin || ci.biggestStruggle || ci.helpNeeded) && (
                      <div className="mt-1 space-y-0.5 text-xs">
                        {ci.biggestWin && (
                          <p className="text-green-700">🏆 {ci.biggestWin}</p>
                        )}
                        {ci.biggestStruggle && (
                          <p className="text-amber-700">⚡ {ci.biggestStruggle}</p>
                        )}
                        {ci.helpNeeded && (
                          <p className="text-neutral-700">❓ {ci.helpNeeded}</p>
                        )}
                      </div>
                    )}

                    {/* Coach response (if already triaged) */}
                    {ci.coachResponse && (
                      <div className="mt-2 rounded bg-white px-2 py-1 border border-neutral-200">
                        <p className="text-xs text-neutral-500">Your response:</p>
                        <p className="text-xs text-neutral-700">{ci.coachResponse}</p>
                      </div>
                    )}

                    {/* Triage controls */}
                    {selectedCheckIn === ci.id && !ci.coachStatus && (
                      <div className="mt-2 space-y-2 pt-2 border-t border-neutral-200">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              if (!showTemplateHelper) {
                                setResponseText(
                                  `Win: \n\nData: \n\nDecision: \n\nFocus: `
                                );
                              }
                              setShowTemplateHelper(!showTemplateHelper);
                            }}
                            className="text-xs text-neutral-400 hover:text-black underline"
                          >
                            {showTemplateHelper ? "Free-form" : "Use template (Win/Data/Decision/Focus)"}
                          </button>
                        </div>
                        <textarea
                          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                          placeholder="Coach response (optional)…"
                          rows={2}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          maxLength={5000}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTriage(ci.id, "green")}
                            disabled={triageLoading}
                            className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            ✅ Green
                          </button>
                          <button
                            onClick={() => handleTriage(ci.id, "yellow")}
                            disabled={triageLoading}
                            className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs text-white font-medium hover:bg-amber-600 disabled:opacity-50"
                          >
                            ⚠️ Yellow
                          </button>
                          <button
                            onClick={() => handleTriage(ci.id, "red")}
                            disabled={triageLoading}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            🔴 Red
                          </button>
                        </div>
                        {triageMessage && (
                          <p className="text-xs text-neutral-500">{triageMessage}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel membership action */}
          <div className="pt-3 border-t border-neutral-200">
            {cancelMsg && (
              <p className={`text-xs mb-2 ${cancelMsg.includes("Cancelled") ? "text-green-600" : "text-red-600"}`}>
                {cancelMsg}
              </p>
            )}
            <button
              onClick={handleCancelClient}
              disabled={cancelLoading}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelLoading ? "Cancelling…" : "Cancel membership"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Metric Chip ──

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

// ── Status Helpers ──

function getStatusConfig(status: ClientHealth["status"]) {
  switch (status) {
    case "at_risk":
      return {
        dotClass: semantic.status.urgent.dot,
        bgClass: `${semantic.status.urgent.bg}`,
        borderClass: `!border-red-200`,
        textClass: semantic.status.urgent.text,
        label: "At risk — low adherence or 7+ days since last check-in",
      };
    case "needs_attention":
      return {
        dotClass: semantic.status.needsReview.dot,
        bgClass: `${semantic.status.needsReview.bg}`,
        borderClass: `!border-amber-200`,
        textClass: semantic.status.needsReview.text,
        label: "Needs attention — 3+ days since last check-in or new member",
      };
    case "on_track":
    default:
      return {
        dotClass: semantic.status.onTrack.dot,
        bgClass: `${semantic.status.onTrack.bg}`,
        borderClass: "",
        textClass: semantic.status.onTrack.text,
        label: "On track",
      };
  }
}

function getAdherenceColor(adherence: number): string {
  if (adherence < 30) return "text-red-600";
  if (adherence < 60) return "text-amber-600";
  return "text-green-600";
}

// ── Applications Section ──

function ApplicationsSection({
  pendingApps,
  processedApps,
  coachSecret,
  onRefresh,
}: {
  pendingApps: ApplicationInfo[];
  processedApps: ApplicationInfo[];
  coachSecret: string;
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [showProcessed, setShowProcessed] = useState(false);

  async function handleAction(email: string, status: "approved" | "rejected") {
    setActionLoading(email);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/application?secret=${encodeURIComponent(coachSecret)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to update application");
      }
      setActionMessage(`${status === "approved" ? "Approved" : "Rejected"} — ${email}`);
      onRefresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(null);
    }
  }

  const goalLabels: Record<string, string> = {
    fat_loss: "Fat Loss",
    muscle: "Muscle Gain",
    maintenance: "Maintenance",
  };
  const tierLabels: Record<string, string> = {
    foundation: "Foundation ($49)",
    coaching: "Coaching ($129)",
    performance: "Performance ($229)",
    vip: "VIP Elite ($349)",
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        📋 Applications{pendingApps.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
            {pendingApps.length} pending
          </span>
        )}
      </h2>

      {actionMessage && (
        <p className="text-sm text-neutral-600 bg-neutral-100 rounded-lg px-3 py-2">
          {actionMessage}
        </p>
      )}

      {pendingApps.length === 0 && processedApps.length === 0 && (
        <div className={components.card.base}>
          <p className="text-center text-neutral-500 text-sm">
            No applications yet. Share your /apply page to start receiving leads.
          </p>
        </div>
      )}

      {/* Pending applications */}
      {pendingApps.map((app) => (
        <div
          key={app.id}
          className="rounded-2xl border-2 border-amber-200 bg-white p-4"
        >
          <button
            onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div>
                <p className="text-sm font-medium">{app.fullName}</p>
                <p className="text-xs text-neutral-500">
                  {app.email} · {goalLabels[app.goal] ?? app.goal}
                  {app.preferredTier ? ` · ${tierLabels[app.preferredTier] ?? app.preferredTier}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">
                {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="text-neutral-400 text-xs">{expandedApp === app.id ? "▲" : "▼"}</span>
            </div>
          </button>

          {expandedApp === app.id && (
            <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {app.trainingExperience && (
                  <div>
                    <p className="text-xs text-neutral-500">Experience</p>
                    <p className="capitalize">{app.trainingExperience}</p>
                  </div>
                )}
                {app.gymAccess && (
                  <div>
                    <p className="text-xs text-neutral-500">Gym access</p>
                    <p className="capitalize">{app.gymAccess.replace("_", " ")}</p>
                  </div>
                )}
              </div>
              {app.whyNow && (
                <div>
                  <p className="text-xs text-neutral-500">Why now?</p>
                  <p className="text-sm">{app.whyNow}</p>
                </div>
              )}
              {app.biggestObstacle && (
                <div>
                  <p className="text-xs text-neutral-500">Biggest obstacle</p>
                  <p className="text-sm">{app.biggestObstacle}</p>
                </div>
              )}

              {/* Approve / Reject buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleAction(app.email, "approved")}
                  disabled={actionLoading === app.email}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === app.email ? "…" : "✅ Approve"}
                </button>
                <button
                  onClick={() => handleAction(app.email, "rejected")}
                  disabled={actionLoading === app.email}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === app.email ? "…" : "❌ Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Processed applications (collapsible) */}
      {processedApps.length > 0 && (
        <div>
          <button
            onClick={() => setShowProcessed(!showProcessed)}
            className="text-xs text-neutral-500 hover:text-black underline"
          >
            {showProcessed ? "Hide" : "Show"} {processedApps.length} processed application{processedApps.length !== 1 ? "s" : ""}
          </button>
          {showProcessed && (
            <div className="mt-2 space-y-2">
              {processedApps.map((app) => (
                <div
                  key={app.id}
                  className={`rounded-xl border p-3 ${
                    app.status === "approved"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{app.fullName}</p>
                      <p className="text-xs text-neutral-500">{app.email}</p>
                    </div>
                    <span className={`text-xs font-medium ${
                      app.status === "approved" ? "text-green-700" : "text-red-700"
                    }`}>
                      {app.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                      {app.status === "approved" && (
                        <span className={`ml-1 ${app.convertedToMember ? "text-green-600" : "text-amber-500"}`}>
                          {app.convertedToMember ? "· Subscribed ✓" : "· Awaiting payment ⏳"}
                        </span>
                      )}
                      {app.approvedAt && (
                        <span className="text-neutral-400 ml-1">
                          {new Date(app.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Templates Section ──

interface Template {
  id: string;
  name: string;
  category: string;
  subject?: string;
  body: string;
  variables: string[];
}

function TemplatesSection({ coachSecret }: { coachSecret: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadTemplates() {
    if (templates.length > 0) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?secret=${encodeURIComponent(coachSecret)}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
        setExpanded(true);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const categoryLabels: Record<string, string> = {
    lead: "Lead Management",
    onboarding: "Onboarding",
    checkin: "Check-In",
    review: "Reviews",
    retention: "Retention",
  };

  return (
    <section className="pb-8">
      <button
        onClick={loadTemplates}
        className="w-full text-left flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
      >
        <div>
          <h2 className="text-lg font-semibold">📝 Message Templates</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pre-built scripts for leads, reviews, check-ins, and retention
          </p>
        </div>
        <span className="text-neutral-400 text-sm">
          {loading ? "Loading…" : expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && templates.length > 0 && (
        <div className="mt-3 space-y-4">
          {Object.entries(categoryLabels).map(([cat, label]) => {
            const catTemplates = templates.filter((t) => t.category === cat);
            if (catTemplates.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  {label}
                </h3>
                <div className="space-y-2">
                  {catTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          {t.subject && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Subject: {t.subject}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => copyToClipboard(t.body, t.id)}
                          className="text-xs text-neutral-500 hover:text-black border border-neutral-200 rounded-lg px-2 py-1 transition-colors"
                        >
                          {copiedId === t.id ? "✅ Copied" : "📋 Copy"}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-neutral-700 whitespace-pre-line bg-neutral-50 rounded-lg p-3">
                        {t.body}
                      </p>
                      {t.variables.length > 0 && (
                        <p className="mt-2 text-xs text-neutral-400">
                          Variables: {t.variables.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
