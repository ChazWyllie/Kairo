"use client";

import { useState } from "react";
import { Dumbbell, Apple, Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

type SubTab = "workouts" | "nutrition";

export default function CoachContentPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("workouts");

  const tabStyle = (t: SubTab): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    background: activeTab === t ? "var(--bg-tertiary)" : "transparent",
    color: activeTab === t ? "var(--text-primary)" : "var(--text-tertiary)",
    fontWeight: activeTab === t ? 600 : 400,
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  });

  return (
    <div>
      <PageHeader
        title="Content"
        action={
          <button
            type="button"
            disabled
            title="Template builder coming soon"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              color: "var(--text-tertiary)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "not-allowed",
            }}
          >
            <Plus size={16} />
            New
          </button>
        }
      />

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "4px",
          marginBottom: "20px",
          width: "fit-content",
        }}
      >
        <button type="button" style={tabStyle("workouts")} onClick={() => setActiveTab("workouts")}>
          Workouts
        </button>
        <button type="button" style={tabStyle("nutrition")} onClick={() => setActiveTab("nutrition")}>
          Nutrition
        </button>
      </div>

      {activeTab === "workouts" ? (
        <EmptyState
          icon={Dumbbell}
          title="Workout templates"
          description="Template builder coming soon. Assign programs directly from client profiles for now."
        />
      ) : (
        <EmptyState
          icon={Apple}
          title="Nutrition guides"
          description="Nutrition guide builder coming soon. Set macro targets from client profiles for now."
        />
      )}

      {/* TODO: Wire to template library endpoints when built */}
    </div>
  );
}
