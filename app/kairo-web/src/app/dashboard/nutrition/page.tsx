"use client";

import { useEffect, useState } from "react";
import { Apple } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

interface MacroTarget {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fatsMin?: number | null;
  stepsTarget?: number | null;
  hydrationTarget?: number | null;
  effectiveDate?: string;
}

interface StatPillProps {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}

function StatPill({ label, value, unit, accent }: StatPillProps) {
  return (
    <div style={{
      background: accent ? "rgba(224,255,79,0.07)" : "var(--bg-secondary)",
      border: `1px solid ${accent ? "rgba(224,255,79,0.2)" : "var(--border-subtle)"}`,
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}>
      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-display)", color: accent ? "var(--accent-primary)" : "var(--text-primary)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {value}
        <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-tertiary)", marginLeft: "4px" }}>{unit}</span>
      </p>
    </div>
  );
}

export default function NutritionPage() {
  const { member } = useAuth();
  const [macro, setMacro] = useState<MacroTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member?.email) return;
    fetch(`/api/macro?email=${encodeURIComponent(member.email)}`)
      .then((r) => r.ok ? r.json() : {})
      .then((d) => setMacro(d.macro ?? d.macros?.[0] ?? null))
      .catch(() => setMacro(null))
      .finally(() => setLoading(false));
  }, [member?.email]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Nutrition" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="stat" height="80px" />)}
        </div>
      </div>
    );
  }

  if (!macro) {
    return (
      <div>
        <PageHeader title="Nutrition" />
        <EmptyState
          icon={Apple}
          title="Nutrition guidance coming soon"
          description="Your coach will set your targets here after your first check-in."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nutrition" subtitle={macro.effectiveDate ? `Updated ${new Date(macro.effectiveDate).toLocaleDateString()}` : undefined} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        {macro.calories != null && <StatPill label="Calories" value={macro.calories.toString()} unit="kcal" accent />}
        {macro.protein != null && <StatPill label="Protein" value={macro.protein.toString()} unit="g" />}
        {macro.carbs != null && <StatPill label="Carbs" value={macro.carbs.toString()} unit="g" />}
        {macro.fatsMin != null && <StatPill label="Fats" value={macro.fatsMin.toString()} unit="g" />}
        {macro.stepsTarget != null && <StatPill label="Steps" value={macro.stepsTarget.toLocaleString()} unit="/ day" />}
        {macro.hydrationTarget != null && <StatPill label="Water" value={macro.hydrationTarget.toString()} unit="L" />}
      </div>

      <Card>
        <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", lineHeight: 1.6 }}>
          These are your daily targets set by your coach. Aim to hit these consistently, not perfectly. Protein is the most important one to prioritize.
        </p>
      </Card>

      {/* TODO: Add nutrition guide library when guide endpoint is built */}
    </div>
  );
}
