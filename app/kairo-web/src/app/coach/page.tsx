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
  lastCheckIn: string | null;
  daysSinceCheckIn: number | null;
  adherence7d: number;
  adherence30d: number;
  currentStreak: number;
  recentCheckIns: {
    date: string;
    workout: boolean;
    meals: number;
    water: boolean;
    steps: boolean;
  }[];
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
  const { portfolio, clients } = state.data;
  const atRiskClients = clients.filter((c) => c.status === "at_risk");
  const needsAttentionClients = clients.filter((c) => c.status === "needs_attention");
  const onTrackClients = clients.filter((c) => c.status === "on_track");

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
                />
              ))}
            </div>
          </section>
        )}

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
}: {
  client: ClientHealth;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusConfig = getStatusConfig(client.status);

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
            </p>
          </div>
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

          {/* Recent check-ins mini timeline */}
          {client.recentCheckIns.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">Recent check-ins:</p>
              <div className="flex gap-1">
                {client.recentCheckIns.map((ci, i) => (
                  <div
                    key={i}
                    className={`h-6 w-6 rounded text-[10px] flex items-center justify-center ${
                      ci.workout
                        ? "bg-green-100 text-green-800"
                        : "bg-neutral-100 text-neutral-400"
                    }`}
                    title={`${new Date(ci.date).toLocaleDateString()} — ${ci.workout ? "Workout ✓" : "No workout"}`}
                  >
                    {ci.workout ? "✓" : "·"}
                  </div>
                ))}
              </div>
            </div>
          )}
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
