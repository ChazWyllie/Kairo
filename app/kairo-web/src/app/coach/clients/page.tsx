"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { PlanTier } from "@/lib/stripe-prices";

interface ClientHealth {
  email: string;
  planTier?: string;
  status: "on_track" | "needs_attention" | "at_risk";
  paymentStatus?: string;
  memberSince?: string;
  daysSinceCheckIn?: number;
  adherence7d?: number;
  currentStreak?: number;
}

const STATUS_DOT: Record<string, string> = {
  on_track: "var(--status-success)",
  needs_attention: "var(--status-warning)",
  at_risk: "var(--status-error)",
};

const FILTERS = ["All", "foundation", "coaching", "performance", "vip", "cancelled"] as const;
type Filter = typeof FILTERS[number];

export default function CoachClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    fetch("/api/coach", { credentials: "include" })
      .then((r) => r.ok ? r.json() : { clients: [] })
      .then((d) => setClients(d.clients ?? []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch = c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ? true :
      filter === "cancelled" ? c.paymentStatus === "past_due" || c.status === "at_risk" :
      c.planTier === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div>
        <PageHeader title="Clients" />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${clients.length} active`} />

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          style={{
            width: "100%",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "10px 12px 10px 36px",
            color: "var(--text-primary)",
            fontSize: "16px",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              border: "1px solid",
              borderColor: filter === f ? "var(--accent-primary)" : "var(--border-subtle)",
              background: filter === f ? "rgba(224,255,79,0.1)" : "var(--bg-secondary)",
              color: filter === f ? "var(--accent-primary)" : "var(--text-tertiary)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No clients found" description="No clients match your search." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((client) => (
            <Card
              key={client.email}
              onClick={() => router.push(`/coach/clients/${encodeURIComponent(client.email)}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "9999px", flexShrink: 0,
                    background: STATUS_DOT[client.status] ?? "var(--text-tertiary)",
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {client.email}
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {client.planTier && <Badge variant="tier" value={client.planTier as PlanTier} />}
                      {client.memberSince && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                          Since {new Date(client.memberSince).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {client.adherence7d != null && (
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: client.adherence7d >= 70 ? "var(--status-success)" : "var(--status-warning)", margin: "0 0 2px" }}>
                      {Math.round(client.adherence7d)}%
                    </p>
                  )}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
                    {client.daysSinceCheckIn != null ? `${client.daysSinceCheckIn}d ago` : "no check-ins"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
