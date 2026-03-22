"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhoneBottomNav from "./PhoneBottomNav";

const DURATIONS = [5000, 4500];

const STREAKS = [
  { label: "Workout", value: "11d", hot: true },
  { label: "Water", value: "7d", hot: false },
  { label: "Protein", value: "5d", hot: false },
];

const BODY_STATS = [
  { val: "183", unit: "lbs", label: "Weight", change: "-2.4 lbs" },
  { val: "17.2", unit: "%", label: "Body fat", change: "-0.8%" },
];

const METRICS = [
  {
    name: "Body Weight",
    val: "183 lbs",
    change: "-2.4 lbs",
    positive: true,
    sparks: [18, 22, 16, 14, 12, 10],
    activeFrom: 2,
  },
  {
    name: "Avg Protein",
    val: "148g",
    change: "+12g",
    positive: true,
    sparks: [12, 14, 18, 20, 22, 22],
    activeFrom: 2,
  },
  {
    name: "Avg Sleep",
    val: "6.2 hrs",
    change: "-0.3h",
    positive: false,
    sparks: [20, 22, 14, 12, 16, 13],
    activeFrom: -1,
  },
];

function Sparkline({ sparks, activeFrom }: { sparks: number[]; activeFrom: number }) {
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
      {sparks.map((h, i) => (
        <div
          key={i}
          style={{
            width: "4px",
            height: `${h}px`,
            borderRadius: "2px",
            background: i >= activeFrom && activeFrom >= 0 ? "var(--accent-primary)" : "#202020",
          }}
        />
      ))}
    </div>
  );
}

function StatsView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
      {/* Header */}
      <div style={{ fontSize: "18px", fontWeight: 800, color: "#f5f5f5", lineHeight: 1.1 }}>Insights</div>

      {/* AI summary card */}
      <div style={{
        background: "rgba(202,255,76,0.06)",
        border: "1px solid rgba(202,255,76,0.18)",
        borderRadius: "12px",
        padding: "10px",
      }}>
        <div style={{
          fontSize: "6px",
          color: "var(--accent-primary)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          marginBottom: "5px",
        }}>
          AI Weekly Summary
        </div>
        <div style={{ fontSize: "8.5px", color: "#aaa", lineHeight: 1.5 }}>
          Strong week. You hit 4/5 workouts and averaged 151g protein daily. Sleep consistency was your main limiter at 6.2 hrs average.
        </div>
      </div>

      {/* Weekly score row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Conic circle */}
        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "conic-gradient(var(--accent-primary) 82%, rgba(255,255,255,0.07) 0%)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>82</span>
            <span style={{ fontSize: "6px", color: "#555" }}>/ 100</span>
          </div>
        </div>
        {/* Text */}
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f5f5f5", marginBottom: "3px" }}>Great week so far</div>
          <div style={{ fontSize: "7.5px", color: "#555", lineHeight: 1.5 }}>
            Workouts 4/5 · Protein 148g · Sleep 6.2h
          </div>
        </div>
      </div>

      {/* Streaks label */}
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5", marginTop: "2px" }}>Streaks</div>

      {/* Streak cards */}
      <div style={{ display: "flex", gap: "5px" }}>
        {STREAKS.map((s) => (
          <div key={s.label} style={{
            flex: 1,
            background: s.hot ? "rgba(224,255,79,0.05)" : "#111",
            border: s.hot ? "1px solid rgba(224,255,79,0.25)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "11px",
            padding: "8px 6px",
            textAlign: "center",
            boxShadow: s.hot ? "0 0 10px var(--accent-glow)" : "none",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "6.5px", color: "#555", marginTop: "3px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#f5f5f5", lineHeight: 1.1 }}>Insights</div>
        <div style={{ fontSize: "8px", color: "#555", marginTop: "2px" }}>Body Metrics</div>
      </div>

      {/* Body stats row */}
      <div style={{ display: "flex", gap: "7px" }}>
        {BODY_STATS.map((s) => (
          <div key={s.label} style={{
            flex: 1,
            background: "#111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "11px",
            padding: "10px 9px",
          }}>
            <div>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#f5f5f5" }}>{s.val}</span>
              <span style={{ fontSize: "9px", color: "#555", marginLeft: "2px" }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: "7px", color: "#555", marginTop: "3px" }}>{s.label}</div>
            <div style={{ fontSize: "7px", color: "var(--accent-primary)", marginTop: "2px" }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* AI observation */}
      <div style={{
        background: "rgba(202,255,76,0.06)",
        border: "1px solid rgba(202,255,76,0.18)",
        borderRadius: "12px",
        padding: "10px",
      }}>
        <div style={{
          fontSize: "6px",
          color: "var(--accent-primary)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          marginBottom: "5px",
        }}>
          AI Observation
        </div>
        <div style={{ fontSize: "8.5px", color: "#aaa", lineHeight: 1.5 }}>
          Consistent downward trend over 6 weeks. At this rate you will hit your goal by late May. Strength metrics suggest muscle is being preserved.
        </div>
      </div>

      {/* Metrics label */}
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Metrics</div>

      {/* Metric rows */}
      {METRICS.map((m) => (
        <div key={m.name} style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          padding: "9px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "9px", color: "#aaa", fontWeight: 500, marginBottom: "3px" }}>{m.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#f5f5f5" }}>{m.val}</span>
              <span style={{ fontSize: "7px", color: m.positive ? "var(--accent-primary)" : "#888" }}>{m.change}</span>
            </div>
          </div>
          <Sparkline sparks={m.sparks} activeFrom={m.activeFrom} />
        </div>
      ))}
    </div>
  );
}

/**
 * Insights screen -- loops through 2 states.
 * State 0: AI summary + weekly score circle + streak cards
 * State 1: Body stats + AI observation + metric rows with sparklines
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
    <div style={{ height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ padding: "12px" }}
          >
            {index === 0 && <StatsView />}
            {index === 1 && <MetricsView />}
          </motion.div>
        </AnimatePresence>
      </div>
      <PhoneBottomNav active="me" />
    </div>
  );
}
