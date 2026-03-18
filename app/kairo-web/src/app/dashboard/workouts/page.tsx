"use client";

import { useEffect, useState } from "react";
import { Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";

interface ProgramBlock {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  primaryGoal?: string;
  split?: string;
  daysPerWeek?: number;
  keyExercises?: string;
  workoutNotes?: string;
  cardioTarget?: string;
  nextUpdateDate?: string;
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: "Hypertrophy",
  strength: "Strength",
  fat_loss: "Fat Loss",
  maintenance: "Maintenance",
};

const SPLIT_LABELS: Record<string, string> = {
  fullBody: "Full Body",
  upperLower: "Upper / Lower",
  pushPullLegs: "Push Pull Legs",
  ppl4Day: "PPL 4-Day",
  custom: "Custom",
};

export default function WorkoutsPage() {
  const { member } = useAuth();
  const [programs, setPrograms] = useState<ProgramBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!member?.email) return;
    fetch(`/api/program?email=${encodeURIComponent(member.email)}`)
      .then((r) => r.ok ? r.json() : { programs: [] })
      .then((d) => setPrograms(d.programs ?? []))
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, [member?.email]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Your Workouts" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div>
        <PageHeader title="Your Workouts" />
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          description="Your coach is building your plan. Check back soon!"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Your Workouts" />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {programs.map((program) => {
          const isOpen = expanded === program.id;
          return (
            <Card
              key={program.id}
              onClick={() => setExpanded(isOpen ? null : program.id)}
              accentBorder={program.status === "active"}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
                    {program.name}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {program.primaryGoal && (
                      <span style={{
                        fontSize: "0.75rem", padding: "2px 8px", borderRadius: "9999px",
                        background: "rgba(224,255,79,0.1)", color: "var(--accent-primary)",
                      }}>
                        {GOAL_LABELS[program.primaryGoal] ?? program.primaryGoal}
                      </span>
                    )}
                    {program.split && (
                      <span style={{
                        fontSize: "0.75rem", padding: "2px 8px", borderRadius: "9999px",
                        background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                      }}>
                        {SPLIT_LABELS[program.split] ?? program.split}
                      </span>
                    )}
                    {program.daysPerWeek && (
                      <span style={{
                        fontSize: "0.75rem", padding: "2px 8px", borderRadius: "9999px",
                        background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                      }}>
                        {program.daysPerWeek}x / week
                      </span>
                    )}
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
                  : <ChevronDown size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
                }
              </div>

              {isOpen && (
                <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {program.keyExercises && (
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                        Key Exercises
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {program.keyExercises}
                      </p>
                    </div>
                  )}
                  {program.cardioTarget && (
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                        Cardio Target
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{program.cardioTarget}</p>
                    </div>
                  )}
                  {program.workoutNotes && (
                    <div style={{ padding: "12px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                        Coach Notes
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {program.workoutNotes}
                      </p>
                    </div>
                  )}
                  {program.nextUpdateDate && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      Next update: {new Date(program.nextUpdateDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
