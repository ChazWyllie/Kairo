"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface Application {
  email: string;
  fullName?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  biggestObstacle?: string;
  preferredTier?: string;
}

export default function CoachWaitlistPage() {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/coach", { credentials: "include" })
      .then((r) => r.ok ? r.json() : {})
      .then((d: { pendingApps?: Application[]; processedApps?: Application[] }) => {
        const pending = d.pendingApps ?? [];
        const processed = d.processedApps ?? [];
        setApps([...pending, ...processed]);
      })
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(email: string, status: "approved" | "rejected") {
    setActing((a) => ({ ...a, [email]: true }));
    try {
      const res = await fetch("/api/application", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
      if (!res.ok) throw new Error();
      setApps((prev) => prev.map((a) => a.email === email ? { ...a, status } : a));
      toast(status === "approved" ? "Application approved." : "Application declined.", "success");
    } catch {
      toast("Failed to update application.", "error");
    } finally {
      setActing((a) => ({ ...a, [email]: false }));
    }
  }

  const pending = apps.filter((a) => a.status === "pending");
  const processed = apps.filter((a) => a.status !== "pending");

  if (loading) {
    return (
      <div>
        <PageHeader title="Waitlist" />
        <SkeletonCard /><br /><SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Waitlist"
        subtitle={`${pending.length} pending · ${apps.length} total`}
      />

      {pending.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No pending applications"
          description="Share your apply link to get more signups!"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {pending.map((app) => (
            <Card key={app.email} accentBorder>
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>
                  {app.fullName ?? app.email}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", margin: "0 0 8px" }}>
                  {app.email}
                  {app.createdAt && ` · ${new Date(app.createdAt).toLocaleDateString()}`}
                  {app.preferredTier && ` · interested in ${app.preferredTier}`}
                </p>
                {app.biggestObstacle && (
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", background: "var(--bg-tertiary)", borderRadius: "6px", padding: "8px 10px", margin: 0 }}>
                    "{app.biggestObstacle}"
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => updateStatus(app.email, "approved")}
                  disabled={acting[app.email]}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--accent-primary)",
                    color: "var(--bg-primary)",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    cursor: acting[app.email] ? "not-allowed" : "pointer",
                    opacity: acting[app.email] ? 0.7 : 1,
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(app.email, "rejected")}
                  disabled={acting[app.email]}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "none",
                    border: "1px solid var(--border-hover)",
                    borderRadius: "8px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    cursor: acting[app.email] ? "not-allowed" : "pointer",
                    opacity: acting[app.email] ? 0.7 : 1,
                  }}
                >
                  Decline
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <details>
          <summary style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", cursor: "pointer", marginBottom: "10px", userSelect: "none" }}>
            Processed ({processed.length})
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {processed.map((app) => (
              <Card key={app.email}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 500, color: "var(--text-secondary)", margin: "0 0 2px" }}>{app.fullName ?? app.email}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>{app.email}</p>
                  </div>
                  <span style={{
                    fontSize: "0.75rem", padding: "2px 10px", borderRadius: "9999px",
                    background: app.status === "approved" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                    color: app.status === "approved" ? "var(--status-success)" : "var(--status-error)",
                  }}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
