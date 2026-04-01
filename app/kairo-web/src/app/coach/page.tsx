"use client";

import { useState, useEffect, useCallback } from "react";
import { track } from "@/lib/analytics";
import Card from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";

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
  phone: string | null;
  age: number | null;
  height: string | null;
  currentWeight: string | null;
  goal: string;
  whyNow: string | null;
  trainingExperience: string | null;
  trainingFrequency: string | null;
  gymAccess: string | null;
  injuryHistory: string | null;
  nutritionStruggles: string | null;
  biggestObstacle: string | null;
  helpWithMost: string | null;
  preferredTier: string | null;
  readyForStructure: boolean;
  budgetComfort: string | null;
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
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "dashboard"; data: CoachData };

export default function CoachPage() {
  const [state, setState] = useState<CoachState>({ phase: "loading" });
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const loadCoachData = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/coach", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to load coach data");
      }
      const data: CoachData = await res.json();
      setState({ phase: "dashboard", data });
      track({ name: "coach_dashboard_loaded", properties: { clients: data.portfolio.activeClients } });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }, []);

  useEffect(() => {
    track({ name: "page_view", properties: { path: "/coach" } });
    loadCoachData();
  }, [loadCoachData]);

  if (state.phase === "loading") {
    return (
      <div>
        <PageHeader title="Overview" />
        <SkeletonCard /><br /><SkeletonCard /><br /><SkeletonCard />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div>
        <PageHeader title="Overview" />
        <Card>
          <p style={{ color: "var(--status-error)", fontSize: "0.875rem", marginBottom: "12px" }}>{state.message}</p>
          <button
            onClick={loadCoachData}
            style={{ padding: "10px 16px", background: "var(--accent-primary)", color: "var(--bg-primary)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  const { portfolio, clients, applications } = state.data;
  const atRiskClients = clients.filter((c) => c.status === "at_risk");
  const needsAttentionClients = clients.filter((c) => c.status === "needs_attention");
  const onTrackClients = clients.filter((c) => c.status === "on_track");
  const pendingApps = applications.filter((a) => a.status === "pending");
  const processedApps = applications.filter((a) => a.status !== "pending");

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        action={
          <button
            onClick={() => loadCoachData()}
            style={{ padding: "8px 14px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "0.875rem", cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
        }
      />

      {/* Portfolio stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }}>
        <StatCard value={portfolio.activeClients} label="Active clients" />
        <StatCard value={portfolio.atRiskCount} label="At risk" urgent={portfolio.atRiskCount > 0} />
        <StatCard value={portfolio.needsAttentionCount} label="Needs attention" warn={portfolio.needsAttentionCount > 0} />
        <StatCard value={`${portfolio.averageAdherence7d}%`} label="Avg adherence (7d)" />
        <StatCard value={portfolio.totalLeads} label="Total leads" />
      </div>

      {/* Attention queue */}
      {(atRiskClients.length > 0 || needsAttentionClients.length > 0) && (
        <section style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Needs Attention
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...atRiskClients, ...needsAttentionClients].map((client) => (
              <ClientCard
                key={client.email}
                client={client}
                expanded={expandedClient === client.email}
                onToggle={() => setExpandedClient(expandedClient === client.email ? null : client.email)}
                onRefresh={loadCoachData}
              />
            ))}
          </div>
        </section>
      )}

      {/* All clear */}
      {atRiskClients.length === 0 && needsAttentionClients.length === 0 && clients.length > 0 && (
        <Card style={{ marginBottom: "16px", borderColor: "var(--status-success)" }}>
          <p style={{ textAlign: "center", color: "var(--status-success)", fontWeight: 500, margin: 0 }}>
            All clients on track. No interventions needed.
          </p>
        </Card>
      )}

      {clients.length === 0 && (
        <Card style={{ marginBottom: "16px" }}>
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem", margin: 0 }}>
            No active clients yet. Once members subscribe, they&apos;ll appear here.
          </p>
        </Card>
      )}

      {/* On-track clients */}
      {onTrackClients.length > 0 && (
        <section style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            On Track ({onTrackClients.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {onTrackClients.map((client) => (
              <ClientCard
                key={client.email}
                client={client}
                expanded={expandedClient === client.email}
                onToggle={() => setExpandedClient(expandedClient === client.email ? null : client.email)}
                onRefresh={loadCoachData}
              />
            ))}
          </div>
        </section>
      )}

      {/* Applications */}
      <ApplicationsSection pendingApps={pendingApps} processedApps={processedApps} onRefresh={loadCoachData} />

      {/* Launch email */}
      <LaunchEmailSection />

      {/* Templates */}
      <TemplatesSection />
    </div>
  );
}

// ── Stat Card ──

function StatCard({ value, label, urgent, warn }: { value: string | number; label: string; urgent?: boolean; warn?: boolean }) {
  return (
    <div style={{
      background: urgent ? "rgba(248,113,113,0.08)" : warn ? "rgba(251,191,36,0.08)" : "var(--bg-secondary)",
      border: `1px solid ${urgent ? "rgba(248,113,113,0.3)" : warn ? "rgba(251,191,36,0.3)" : "var(--border-subtle)"}`,
      borderRadius: "12px", padding: "14px", textAlign: "center",
    }}>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: urgent ? "var(--status-error)" : warn ? "var(--status-warning)" : "var(--text-primary)", margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>{label}</p>
    </div>
  );
}

// ── Client Card ──

function ClientCard({ client, expanded, onToggle, onRefresh }: {
  client: ClientHealth; expanded: boolean; onToggle: () => void; onRefresh: () => void;
}) {
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageMessage, setTriageMessage] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null);
  const [showTemplateHelper, setShowTemplateHelper] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

  const statusDotColor = client.status === "at_risk" ? "var(--status-error)"
    : client.status === "needs_attention" ? "var(--status-warning)"
    : "var(--status-success)";

  const adherenceColor = client.adherence7d < 30 ? "var(--status-error)"
    : client.adherence7d < 60 ? "var(--status-warning)"
    : "var(--status-success)";

  async function handleCancelClient() {
    if (!confirm(`Cancel membership for ${client.email}? They'll keep access until end of billing period.`)) return;
    setCancelLoading(true);
    setCancelMsg(null);
    try {
      const res = await fetch("/api/coach/cancel-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to cancel");
      }
      setCancelMsg("Cancelled. Access until end of billing period.");
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
      const res = await fetch("/api/checkin/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInId, coachStatus, coachResponse: responseText.trim() || undefined }),
        credentials: "include",
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
    <Card style={{
      borderLeft: `2px solid ${statusDotColor}`,
    }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
        aria-expanded={expanded}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ height: "8px", width: "8px", borderRadius: "50%", background: statusDotColor, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>{client.email}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
              {client.planTier ?? "…"} · {client.goal ?? "no goal"}
              {client.daysPerWeek ? ` · ${client.daysPerWeek}×/wk` : ""}
            </p>
          </div>
          {client.paymentStatus === "past_due" && (
            <Badge variant="status" value="past_due" />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>7d</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: adherenceColor, margin: 0 }}>{client.adherence7d}%</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>Last</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {client.daysSinceCheckIn !== null ? (client.daysSinceCheckIn === 0 ? "Today" : `${client.daysSinceCheckIn}d`) : "Never"}
            </p>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "14px" }}>
            {[
              { label: "7d", value: `${client.adherence7d}%` },
              { label: "30d", value: `${client.adherence30d}%` },
              { label: "Streak", value: `${client.currentStreak}d` },
              { label: "Since", value: new Date(client.memberSince).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "8px", padding: "8px" }}>
                <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {!client.onboarded && (
            <p style={{ fontSize: "0.75rem", color: "var(--status-warning)", marginBottom: "10px" }}>Not yet onboarded</p>
          )}

          {/* Program + macros */}
          {(client.activeProgram || client.activeMacro) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {client.activeProgram && (
                <div style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "10px" }}>
                  <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Program</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>{client.activeProgram.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
                    {[client.activeProgram.split, client.activeProgram.daysPerWeek ? `${client.activeProgram.daysPerWeek}×/wk` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}
              {client.activeMacro && (
                <div style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "10px" }}>
                  <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Macros</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>{client.activeMacro.calories} cal · {client.activeMacro.protein}g P</p>
                  {client.activeMacro.fatsMin && <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>{client.activeMacro.fatsMin}g F min</p>}
                </div>
              )}
            </div>
          )}

          {/* Recent check-ins with triage */}
          {client.recentCheckIns.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Recent check-ins</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {client.recentCheckIns.map((ci) => (
                  <div key={ci.id} style={{
                    border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "10px",
                    background: ci.coachStatus === "green" ? "rgba(74,222,128,0.06)"
                      : ci.coachStatus === "yellow" ? "rgba(251,191,36,0.06)"
                      : ci.coachStatus === "red" ? "rgba(248,113,113,0.06)"
                      : "var(--bg-tertiary)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
                          {new Date(ci.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                          {ci.workout ? "💪" : ""}{ci.meals > 0 ? `🍽️${ci.meals}` : ""}{ci.water ? "💧" : ""}{ci.steps ? "🚶" : ""}
                        </span>
                      </div>
                      {ci.coachStatus ? (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: ci.coachStatus === "green" ? "var(--status-success)" : ci.coachStatus === "yellow" ? "var(--status-warning)" : "var(--status-error)" }}>
                          {ci.coachStatus.toUpperCase()}
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedCheckIn(selectedCheckIn === ci.id ? null : ci.id)}
                          style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Triage
                        </button>
                      )}
                    </div>

                    {(ci.biggestWin || ci.biggestStruggle || ci.helpNeeded) && (
                      <div style={{ marginTop: "6px", fontSize: "0.75rem" }}>
                        {ci.biggestWin && <p style={{ color: "var(--status-success)", margin: "0 0 2px" }}>🏆 {ci.biggestWin}</p>}
                        {ci.biggestStruggle && <p style={{ color: "var(--status-warning)", margin: "0 0 2px" }}>⚡ {ci.biggestStruggle}</p>}
                        {ci.helpNeeded && <p style={{ color: "var(--text-secondary)", margin: 0 }}>❓ {ci.helpNeeded}</p>}
                      </div>
                    )}

                    {ci.coachResponse && (
                      <div style={{ marginTop: "6px", background: "var(--bg-secondary)", borderRadius: "6px", padding: "6px 8px" }}>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>Your response:</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{ci.coachResponse}</p>
                      </div>
                    )}

                    {selectedCheckIn === ci.id && !ci.coachStatus && (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
                        <button
                          onClick={() => {
                            if (!showTemplateHelper) setResponseText("Win: \n\nData: \n\nDecision: \n\nFocus: ");
                            setShowTemplateHelper(!showTemplateHelper);
                          }}
                          style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", marginBottom: "6px", textDecoration: "underline" }}
                        >
                          {showTemplateHelper ? "Free-form" : "Use template"}
                        </button>
                        <textarea
                          placeholder="Coach response (optional)…"
                          rows={2}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          maxLength={5000}
                          style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-hover)", borderRadius: "8px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "14px", boxSizing: "border-box", resize: "vertical", outline: "none", marginBottom: "8px" }}
                        />
                        <div style={{ display: "flex", gap: "6px" }}>
                          {(["green", "yellow", "red"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleTriage(ci.id, status)}
                              disabled={triageLoading}
                              style={{
                                flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: triageLoading ? "not-allowed" : "pointer",
                                background: status === "green" ? "rgba(74,222,128,0.15)" : status === "yellow" ? "rgba(251,191,36,0.15)" : "rgba(248,113,113,0.15)",
                                color: status === "green" ? "var(--status-success)" : status === "yellow" ? "var(--status-warning)" : "var(--status-error)",
                                fontWeight: 600, fontSize: "0.8125rem", opacity: triageLoading ? 0.7 : 1,
                              }}
                            >
                              {status === "green" ? "Green" : status === "yellow" ? "Yellow" : "Red"}
                            </button>
                          ))}
                        </div>
                        {triageMessage && <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "6px" }}>{triageMessage}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel action */}
          <div style={{ paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
            {cancelMsg && <p style={{ fontSize: "0.75rem", color: cancelMsg.includes("Cancelled") ? "var(--status-success)" : "var(--status-error)", marginBottom: "6px" }}>{cancelMsg}</p>}
            <button
              onClick={handleCancelClient}
              disabled={cancelLoading}
              style={{ width: "100%", padding: "8px", background: "none", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "8px", color: "var(--status-error)", fontSize: "0.8125rem", cursor: cancelLoading ? "not-allowed" : "pointer", opacity: cancelLoading ? 0.7 : 1 }}
            >
              {cancelLoading ? "Cancelling…" : "Cancel membership"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Applications Section ──

function ApplicationsSection({ pendingApps, processedApps, onRefresh }: {
  pendingApps: ApplicationInfo[]; processedApps: ApplicationInfo[]; onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [showProcessed, setShowProcessed] = useState(false);

  async function handleAction(email: string, status: "approved" | "rejected") {
    setActionLoading(email);
    setActionMessage(null);
    try {
      const res = await fetch("/api/application", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to update application");
      }
      setActionMessage(`${status === "approved" ? "Approved" : "Rejected"}: ${email}`);
      onRefresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(null);
    }
  }

  const goalLabels: Record<string, string> = { fat_loss: "Fat Loss", muscle: "Muscle Gain", maintenance: "Maintenance" };
  const tierLabels: Record<string, string> = { foundation: "Foundation ($49)", coaching: "Coaching ($129)", performance: "Performance ($229)", vip: "VIP Elite ($349)" };

  return (
    <section style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        Applications{pendingApps.length > 0 && ` · ${pendingApps.length} pending`}
      </p>

      {actionMessage && (
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", background: "var(--bg-tertiary)", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>{actionMessage}</p>
      )}

      {pendingApps.length === 0 && processedApps.length === 0 && (
        <Card><p style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem", margin: 0 }}>No applications yet.</p></Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {pendingApps.map((app) => (
          <Card key={app.id} accentBorder style={{ borderLeft: "2px solid var(--status-warning)" }}>
            <button
              onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
            >
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>{app.fullName}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
                  {app.email} · {goalLabels[app.goal] ?? app.goal}
                  {app.preferredTier ? ` · ${tierLabels[app.preferredTier] ?? app.preferredTier}` : ""}
                </p>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{expandedApp === app.id ? "▲" : "▼"}</span>
            </button>

            {expandedApp === app.id && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <AppField label="Phone" value={app.phone} />
                  <AppField label="Age" value={app.age != null ? String(app.age) : null} />
                  <AppField label="Height" value={app.height} />
                  <AppField label="Weight" value={app.currentWeight} />
                  <AppField label="Experience" value={app.trainingExperience} />
                  <AppField label="Frequency" value={app.trainingFrequency} />
                </div>
                {app.whyNow && <AppField label="Why now" value={app.whyNow} full />}
                {app.biggestObstacle && <AppField label="Biggest obstacle" value={app.biggestObstacle} full />}
                {app.injuryHistory && <AppField label="Injuries" value={app.injuryHistory} full />}

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => handleAction(app.email, "approved")}
                    disabled={actionLoading === app.email}
                    style={{ flex: 1, padding: "10px", background: "rgba(74,222,128,0.15)", border: "none", borderRadius: "8px", color: "var(--status-success)", fontWeight: 600, cursor: actionLoading === app.email ? "not-allowed" : "pointer", opacity: actionLoading === app.email ? 0.7 : 1 }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(app.email, "rejected")}
                    disabled={actionLoading === app.email}
                    style={{ flex: 1, padding: "10px", background: "none", border: "1px solid var(--border-hover)", borderRadius: "8px", color: "var(--text-secondary)", fontWeight: 500, cursor: actionLoading === app.email ? "not-allowed" : "pointer", opacity: actionLoading === app.email ? 0.7 : 1 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {processedApps.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => setShowProcessed(!showProcessed)}
            style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            {showProcessed ? "Hide" : "Show"} {processedApps.length} processed
          </button>
          {showProcessed && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              {processedApps.map((app) => (
                <Card key={app.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontWeight: 500, color: "var(--text-secondary)", margin: "0 0 2px" }}>{app.fullName}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>{app.email}</p>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: app.status === "approved" ? "var(--status-success)" : "var(--status-error)" }}>
                      {app.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AppField({ label, value, full }: { label: string; value: string | null | undefined; full?: boolean }) {
  if (!value) return null;
  return (
    <div style={full ? { gridColumn: "1 / -1" } : {}}>
      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>{value}</p>
    </div>
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

function TemplatesSection() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadTemplates() {
    if (templates.length > 0) { setExpanded(!expanded); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/templates", { credentials: "include" });
      if (res.ok) { const data = await res.json(); setTemplates(data.templates ?? []); setExpanded(true); }
    } catch { /* non-fatal */ } finally { setLoading(false); }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
  }

  const categoryLabels: Record<string, string> = { lead: "Lead Management", onboarding: "Onboarding", checkin: "Check-In", review: "Reviews", retention: "Retention" };

  return (
    <Card style={{ marginBottom: "16px" }}>
      <button
        onClick={loadTemplates}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>Message Templates</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", margin: 0 }}>Pre-built scripts for leads, reviews, check-ins, and retention</p>
        </div>
        <span style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginLeft: "12px" }}>{loading ? "…" : expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && templates.length > 0 && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
          {Object.entries(categoryLabels).map(([cat, label]) => {
            const catTemplates = templates.filter((t) => t.category === cat);
            if (catTemplates.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {catTemplates.map((t) => (
                    <div key={t.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <p style={{ fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>{t.name}</p>
                        <button
                          onClick={() => copyToClipboard(t.body, t.id)}
                          style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "4px 8px", background: "none", cursor: "pointer" }}
                        >
                          {copiedId === t.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", background: "var(--bg-tertiary)", borderRadius: "6px", padding: "8px", whiteSpace: "pre-line", margin: 0 }}>{t.body}</p>
                      {t.variables.length > 0 && <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "6px", marginBottom: 0 }}>Variables: {t.variables.join(", ")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Launch Email Section ──

type LaunchEmailResult = { sent: number; skipped: number };
type LaunchEmailState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; result: LaunchEmailResult }
  | { phase: "error"; message: string };

function LaunchEmailSection() {
  const [state, setState] = useState<LaunchEmailState>({ phase: "idle" });

  async function handleSend() {
    if (!confirm("Send launch announcement to all waitlist signups? This cannot be undone.")) return;
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/coach/launch-email", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to send launch emails");
      setState({ phase: "success", result: data as LaunchEmailResult });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }

  return (
    <Card style={{ marginBottom: "16px" }}>
      <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>Launch Email</p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
        Send the Kairo launch announcement to all waitlist signups (Applications + Leads, deduplicated). Founding members receive a reminder that their 10% discount is active.
      </p>
      {state.phase === "success" && (
        <p style={{ fontSize: "0.875rem", color: "var(--status-success)", marginBottom: "10px" }}>
          Sent {state.result.sent} email{state.result.sent !== 1 ? "s" : ""}.
          {state.result.skipped > 0 ? ` ${state.result.skipped} skipped.` : ""}
        </p>
      )}
      {state.phase === "error" && (
        <p style={{ fontSize: "0.875rem", color: "var(--status-error)", marginBottom: "10px" }} role="alert">{state.message}</p>
      )}
      <button
        onClick={handleSend}
        disabled={state.phase === "loading"}
        style={{ padding: "10px 20px", background: "var(--accent-primary)", color: "var(--bg-primary)", border: "none", borderRadius: "8px", fontWeight: 700, cursor: state.phase === "loading" ? "not-allowed" : "pointer", opacity: state.phase === "loading" ? 0.7 : 1 }}
      >
        {state.phase === "loading" ? "Sending…" : "Send Launch Email"}
      </button>
    </Card>
  );
}
