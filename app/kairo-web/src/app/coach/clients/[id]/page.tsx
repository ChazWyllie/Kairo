"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { PlanTier } from "@/lib/stripe-prices";

interface CheckIn {
  id: string;
  date: string;
  workout: boolean;
  meals: number;
  water: boolean;
  coachStatus?: string;
  coachResponse?: string;
  biggestWin?: string;
  biggestStruggle?: string;
}

interface ClientDetail {
  email: string;
  planTier?: string;
  status: string;
  paymentStatus?: string;
  memberSince?: string;
  adherence7d?: number;
  adherence30d?: number;
  currentStreak?: number;
  daysSinceCheckIn?: number;
  recentCheckIns?: CheckIn[];
  activeProgram?: { name?: string; status?: string; primaryGoal?: string } | null;
  activeMacro?: { calories?: number; protein?: number } | null;
}

const COACH_STATUS_COLOR: Record<string, string> = {
  green: "var(--status-success)",
  yellow: "var(--status-warning)",
  red: "var(--status-error)",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = decodeURIComponent(params.id as string);

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/coach", { credentials: "include" })
      .then((r) => r.ok ? r.json() : { clients: [] })
      .then((d) => {
        const found = (d.clients ?? []).find((c: ClientDetail) => c.email === email);
        setClient(found ?? null);
      })
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [email]);

  async function submitResponse(checkInId: string) {
    const text = responses[checkInId];
    if (!text?.trim()) return;
    setSubmitting((s) => ({ ...s, [checkInId]: true }));
    try {
      const res = await fetch("/api/checkin/respond", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInId, response: text, email }),
      });
      if (!res.ok) throw new Error();
      toast("Response sent.", "success");
      setResponses((r) => ({ ...r, [checkInId]: "" }));
    } catch {
      toast("Failed to send response.", "error");
    } finally {
      setSubmitting((s) => ({ ...s, [checkInId]: false }));
    }
  }

  if (loading) {
    return (
      <div>
        <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <SkeletonCard /><br /><SkeletonCard />
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <p style={{ color: "var(--text-tertiary)" }}>Client not found.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: 0, fontSize: "0.875rem" }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <PageHeader title={client.email} />

      {/* Plan + status */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {client.planTier && <Badge variant="tier" value={client.planTier as PlanTier} />}
        <Badge variant="status" value={(client.paymentStatus ?? "pending") as "active" | "canceled" | "past_due" | "pending"} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {[
          { label: "7d Adherence", value: client.adherence7d != null ? `${Math.round(client.adherence7d)}%` : "–" },
          { label: "30d Adherence", value: client.adherence30d != null ? `${Math.round(client.adherence30d)}%` : "–" },
          { label: "Streak", value: client.currentStreak != null ? `${client.currentStreak}d` : "–" },
          { label: "Last Check-in", value: client.daysSinceCheckIn != null ? `${client.daysSinceCheckIn}d ago` : "–" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Program + Macro summary */}
      {(client.activeProgram || client.activeMacro) && (
        <Card style={{ marginBottom: "16px" }}>
          {client.activeProgram && (
            <div style={{ marginBottom: client.activeMacro ? "12px" : 0 }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Current Program</p>
              <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>{client.activeProgram.name ?? "Active Program"}</p>
            </div>
          )}
          {client.activeMacro && (
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Active Macros</p>
              <p style={{ color: "var(--text-primary)", margin: 0 }}>
                {client.activeMacro.calories != null ? `${client.activeMacro.calories} kcal` : ""}
                {client.activeMacro.protein != null ? ` · ${client.activeMacro.protein}g protein` : ""}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* WhatsApp */}
      <a
        href={`https://wa.me/`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          color: "var(--accent-secondary)",
          textDecoration: "none",
          fontSize: "0.9375rem",
          fontWeight: 500,
          marginBottom: "24px",
        }}
      >
        <MessageCircle size={18} />
        Open WhatsApp Chat
      </a>

      {/* Recent check-ins with triage */}
      {(client.recentCheckIns?.length ?? 0) > 0 && (
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Recent Check-ins
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {client.recentCheckIns!.map((ci) => (
              <div
                key={ci.id}
                style={{
                  borderLeft: `3px solid ${COACH_STATUS_COLOR[ci.coachStatus ?? ""] ?? "var(--border-subtle)"}`,
                  paddingLeft: "12px",
                  paddingBottom: "4px",
                }}
              >
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
                  {new Date(ci.date).toLocaleDateString()}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", margin: "0 0 8px" }}>
                  Workout: {ci.workout ? "✓" : "✗"} · Meals: {ci.meals}/3 · Water: {ci.water ? "✓" : "✗"}
                </p>
                {ci.biggestWin && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "0 0 4px" }}>Win: {ci.biggestWin}</p>}
                {ci.biggestStruggle && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "0 0 8px" }}>Struggle: {ci.biggestStruggle}</p>}
                {ci.coachResponse ? (
                  <div style={{ background: "var(--bg-tertiary)", borderRadius: "6px", padding: "8px 10px" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 2px" }}>Your response:</p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>{ci.coachResponse}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <textarea
                      value={responses[ci.id] ?? ""}
                      onChange={(e) => setResponses((r) => ({ ...r, [ci.id]: e.target.value }))}
                      placeholder="Write a response..."
                      rows={2}
                      style={{
                        flex: 1,
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-hover)",
                        borderRadius: "6px",
                        padding: "8px",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => submitResponse(ci.id)}
                      disabled={submitting[ci.id]}
                      style={{
                        padding: "8px 12px",
                        background: "var(--accent-primary)",
                        border: "none",
                        borderRadius: "6px",
                        color: "var(--bg-primary)",
                        cursor: "pointer",
                        flexShrink: 0,
                        alignSelf: "flex-end",
                      }}
                      aria-label="Send response"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
