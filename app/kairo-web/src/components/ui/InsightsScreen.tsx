"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DURATIONS = [4000, 3500];

function StatsView() {
  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Insights</div>
        <div style={{ fontSize: "7px", color: "#666" }}>This Week</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { value: "12", label: "Day Streak" },
          { value: "85%", label: "Adherence" },
          { value: "4", label: "Workouts" },
        ].map((stat) => (
          <div key={stat.label} style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "8px",
            padding: "7px 4px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "6px", color: "#666", marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Adherence bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span style={{ fontSize: "7px", color: "#666" }}>Weekly adherence</span>
          <span style={{ fontSize: "7px", fontWeight: 600, color: "var(--accent-primary)" }}>85%</span>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
          <div style={{
            height: "100%",
            width: "85%",
            background: "var(--accent-primary)",
            borderRadius: "2px",
          }} />
        </div>
      </div>

      {/* Smart nudge card */}
      <div style={{
        background: "rgba(224,255,79,0.06)",
        border: "1px solid rgba(224,255,79,0.2)",
        borderRadius: "8px",
        padding: "8px",
      }}>
        <div style={{ fontSize: "7px", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Smart Nudge
        </div>
        <div style={{ fontSize: "8px", fontWeight: 600, color: "#f5f5f5", marginBottom: "3px" }}>
          Add 30g protein tonight
        </div>
        <div style={{ fontSize: "7px", color: "#888", marginBottom: "6px" }}>
          You&apos;re 32g short of your daily target.
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button style={{
            flex: 1,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "5px",
            padding: "4px",
            fontSize: "7px",
            color: "#888",
            cursor: "default",
          }}>
            Dismiss
          </button>
          <button style={{
            flex: 1,
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "5px",
            padding: "4px",
            fontSize: "7px",
            fontWeight: 700,
            color: "#0a0a0a",
            cursor: "default",
          }}>
            Do it
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklySummaryView() {
  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Insights</div>
        <div style={{ fontSize: "7px", color: "#666" }}>Weekly Summary</div>
      </div>

      {/* Summary card */}
      <div style={{
        background: "rgba(224,255,79,0.08)",
        border: "1px solid rgba(224,255,79,0.2)",
        borderRadius: "10px",
        padding: "10px",
      }}>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5", marginBottom: "6px" }}>
          Great week so far
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { label: "Workouts", value: "4 / 5" },
            { label: "Avg protein", value: "145g" },
            { label: "Water goal", value: "3 days" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "7.5px", color: "#888" }}>{row.label}</span>
              <span style={{ fontSize: "7.5px", fontWeight: 600, color: "#f5f5f5" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow preview */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "8px",
        padding: "8px",
      }}>
        <div style={{ fontSize: "7px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
          Tomorrow
        </div>
        <div style={{ fontSize: "8px", fontWeight: 600, color: "#f5f5f5", marginBottom: "2px" }}>
          45-min Gym Strength
        </div>
        <div style={{ fontSize: "7px", color: "#888", marginBottom: "6px" }}>
          Upper body -- 165g protein target
        </div>
        <button style={{
          background: "transparent",
          border: "none",
          padding: 0,
          fontSize: "7.5px",
          fontWeight: 600,
          color: "var(--accent-primary)",
          cursor: "default",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
        }}>
          View full plan
        </button>
      </div>
    </div>
  );
}

/**
 * Insights screen -- loops through 2 states.
 * State 0: Stats overview with smart nudge card
 * State 1: Weekly summary + tomorrow preview
 */
export default function InsightsScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % 2),
      DURATIONS[index]
    );
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div style={{ height: "100%", background: "#0a0a0a", overflow: "hidden" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ height: "100%" }}
        >
          {index === 0 && <StatsView />}
          {index === 1 && <WeeklySummaryView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
