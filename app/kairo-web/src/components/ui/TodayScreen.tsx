"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhoneBottomNav from "./PhoneBottomNav";

const DURATIONS = [5000, 4000, 3500];

const MACROS = [
  { label: "Protein", value: "160g", pct: 72 },
  { label: "Meals left", value: "2", pct: 40 },
  { label: "Water", value: "3.0L", pct: 60 },
];

const TRAVEL_WORKOUTS = [
  { name: "20-min Hotel Circuit", sub: "No equipment", tag: "Bodyweight", selected: true },
  { name: "15-min Stretch + Core", sub: "Recovery", tag: "Recovery", selected: false },
  { name: "30-min HIIT Walk", sub: "Outdoor or treadmill", tag: "Outdoor", selected: false },
];

const CONSTRAINTS = [
  { label: "Traveling", on: true },
  { label: "Low sleep", on: false },
  { label: "Short on time", on: true },
  { label: "No equipment", on: false },
];

function MacroBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: "14px", fontWeight: 800, color: "#f5f5f5", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "6px", color: "#555", marginTop: "3px" }}>{label}</div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden", marginTop: "5px" }}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: "var(--accent-primary)", borderRadius: "2px" }}
        />
      </div>
    </div>
  );
}

function DefaultView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "7px", color: "#555" }}>Mon Mar 17</div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#f5f5f5", lineHeight: 1.1 }}>Good morning.</div>
      </div>

      {/* Mood card */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "11px",
        padding: "8px",
      }}>
        <div style={{ fontSize: "6px", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          How are you feeling?
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["Tired", "Okay", "Ready", "Fired up"].map((mood) => {
            const active = mood === "Ready";
            return (
              <div key={mood} style={{
                flex: 1,
                height: "28px",
                borderRadius: "8px",
                background: active ? "rgba(224,255,79,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(224,255,79,0.4)" : "rgba(255,255,255,0.07)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "7px",
                fontWeight: active ? 700 : 400,
                color: active ? "var(--accent-primary)" : "#555",
                cursor: "default",
              }}>
                {mood}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI nudge */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "11px",
        padding: "9px 10px",
        display: "flex",
        gap: "7px",
        alignItems: "flex-start",
      }}>
        <motion.div
          animate={{ opacity: [1, 0.35, 1], scale: [1, 0.85, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--accent-primary)",
            flexShrink: 0,
            marginTop: "2px",
          }}
        />
        <div style={{ fontSize: "8px", color: "#aaa", lineHeight: 1.5 }}>
          {"You're "}
          <strong style={{ color: "var(--accent-primary)", fontWeight: 700 }}>22g short on protein</strong>
          {" from yesterday. Today's meals adjusted."}
        </div>
      </div>

      {/* Workout label */}
      <div style={{ fontSize: "6px", color: "#444", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Workout Options
      </div>

      {/* Selected card */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(224,255,79,0.35)",
        borderLeft: "2px solid var(--accent-primary)",
        borderRadius: "0 10px 10px 0",
        padding: "7px 9px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#f5f5f5" }}>30-min Push Day</div>
            <div style={{ fontSize: "7.5px", color: "#555", marginTop: "2px" }}>Full gym, Upper body</div>
          </div>
          <span style={{
            fontSize: "6px",
            fontWeight: 700,
            color: "var(--accent-primary)",
            background: "rgba(224,255,79,0.12)",
            borderRadius: "4px",
            padding: "1px 5px",
          }}>Selected</span>
        </div>
      </div>

      {/* Alt card */}
      <div style={{
        background: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "7px 9px",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "#888" }}>45-min Full Body</div>
        <div style={{ fontSize: "7px", color: "#555", marginTop: "2px" }}>Moderate intensity</div>
      </div>

      {/* Macro card */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "11px",
        padding: "10px",
      }}>
        <div style={{ fontSize: "6px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Nutrition Today
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {MACROS.map((m) => (
            <MacroBar key={m.label} {...m} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <button style={{
        width: "100%",
        background: "var(--accent-primary)",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "10px",
        padding: "9px",
        fontSize: "9px",
        fontWeight: 800,
        cursor: "default",
        boxShadow: "0 0 16px var(--accent-glow)",
      }}>
        Start Workout
      </button>
    </div>
  );
}

function TravelView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#f5f5f5", lineHeight: 1.1 }}>Today</span>
          <span style={{
            fontSize: "7px",
            fontWeight: 600,
            color: "var(--accent-primary)",
            background: "rgba(224,255,79,0.15)",
            border: "1px solid rgba(224,255,79,0.3)",
            borderRadius: "6px",
            padding: "2px 7px",
          }}>Travel Mode ON</span>
        </div>
        <div style={{ fontSize: "7px", color: "#555", marginTop: "3px" }}>Hotel room, Bodyweight only</div>
      </div>

      {/* Workout label */}
      <div style={{ fontSize: "6px", color: "#444", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Workout Options
      </div>

      {/* Workout options */}
      {TRAVEL_WORKOUTS.map((w) => (
        <div key={w.name} style={{
          background: w.selected ? "#111" : "#0e0e0e",
          border: `1px solid ${w.selected ? "rgba(224,255,79,0.35)" : "rgba(255,255,255,0.07)"}`,
          borderLeft: `2px solid ${w.selected ? "var(--accent-primary)" : "transparent"}`,
          borderRadius: "0 10px 10px 0",
          padding: "7px 9px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: w.selected ? 600 : 500, color: w.selected ? "#f5f5f5" : "#888" }}>
                {w.name}
              </div>
              <div style={{ fontSize: "7px", color: "#555", marginTop: "2px" }}>{w.sub}</div>
            </div>
            <span style={{
              fontSize: "6px",
              fontWeight: 600,
              color: w.selected ? "var(--accent-primary)" : "#555",
              background: w.selected ? "rgba(224,255,79,0.12)" : "rgba(255,255,255,0.05)",
              borderRadius: "4px",
              padding: "1px 5px",
            }}>{w.tag}</span>
          </div>
        </div>
      ))}

      {/* Single protein bar */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "11px",
        padding: "10px",
      }}>
        <div style={{ fontSize: "6px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          Nutrition (travel)
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "7px", color: "#666" }}>Protein</span>
          <span style={{ fontSize: "7px", fontWeight: 600, color: "var(--accent-primary)" }}>100 / 140g</span>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "71%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ height: "100%", background: "var(--accent-primary)", borderRadius: "2px" }}
          />
        </div>
      </div>

      <button style={{
        width: "100%",
        background: "var(--accent-primary)",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "10px",
        padding: "9px",
        fontSize: "9px",
        fontWeight: 800,
        cursor: "default",
        boxShadow: "0 0 16px var(--accent-glow)",
      }}>
        Start Workout
      </button>
    </div>
  );
}

function PickerView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f5f5f5", lineHeight: 1.2 }}>Today: Set your day</div>
        <div style={{ fontSize: "7px", color: "#555", marginTop: "2px" }}>Takes 10 seconds</div>
      </div>

      {/* Energy selector */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "11px",
        padding: "8px",
      }}>
        <div style={{ fontSize: "6px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          Energy
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["Low", "Mid", "High"].map((level) => {
            const active = level === "Mid";
            return (
              <div key={level} style={{
                flex: 1,
                height: "26px",
                borderRadius: "7px",
                background: active ? "var(--accent-primary)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.1)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: active ? 700 : 500,
                color: active ? "#0a0a0a" : "#555",
                cursor: "default",
              }}>
                {level}
              </div>
            );
          })}
        </div>
      </div>

      {/* Constraints */}
      <div style={{ fontSize: "6px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Constraints
      </div>
      {CONSTRAINTS.map((item) => (
        <div key={item.label} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: item.on ? "rgba(224,255,79,0.07)" : "#111",
          border: `1px solid ${item.on ? "rgba(224,255,79,0.22)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: "10px",
          padding: "7px 9px",
        }}>
          <span style={{ fontSize: "8px", fontWeight: 500, color: item.on ? "#f5f5f5" : "#666" }}>
            {item.label}
          </span>
          <div style={{
            width: "24px",
            height: "13px",
            borderRadius: "7px",
            background: item.on ? "var(--accent-primary)" : "#333",
            position: "relative",
            flexShrink: 0,
          }}>
            <div style={{
              position: "absolute",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#fff",
              top: "2px",
              left: item.on ? "13px" : "2px",
              transition: "left 0.2s ease",
            }} />
          </div>
        </div>
      ))}

      {/* CTA */}
      <button style={{
        width: "100%",
        background: "var(--accent-primary)",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "10px",
        padding: "9px",
        fontSize: "9px",
        fontWeight: 800,
        cursor: "default",
        boxShadow: "0 0 16px var(--accent-glow)",
      }}>
        Generate Plan
      </button>
    </div>
  );
}

/**
 * Today screen -- loops through 3 states using AnimatePresence.
 * State 0: Default command center (mood, AI nudge, workout cards, macros)
 * State 1: Travel mode active (bodyweight options, travel context)
 * State 2: Constraint picker (energy selector + toggles)
 */
export default function TodayScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % 3),
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
            {index === 0 && <DefaultView />}
            {index === 1 && <TravelView />}
            {index === 2 && <PickerView />}
          </motion.div>
        </AnimatePresence>
      </div>
      <PhoneBottomNav active="today" />
    </div>
  );
}
