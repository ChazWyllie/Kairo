"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

// State durations in ms
const DURATIONS = [3500, 3000, 2500];

function DefaultView() {
  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5", letterSpacing: "0.02em" }}>
          Today -- Mon Mar 17
        </span>
        <span style={{ fontSize: "7px", color: "var(--accent-primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Kairo
        </span>
      </div>

      {/* Workout options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ fontSize: "7px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
          Workout Options
        </div>
        {/* Selected option */}
        <div style={{
          background: "rgba(224,255,79,0.12)",
          border: "1px solid rgba(224,255,79,0.35)",
          borderRadius: "8px",
          padding: "7px 8px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "8px", fontWeight: 600, color: "#f5f5f5" }}>30-min Push Day</span>
            <span style={{ fontSize: "7px", color: "var(--accent-primary)", fontWeight: 700 }}>Selected</span>
          </div>
          <span style={{ fontSize: "7px", color: "#888" }}>Full gym -- Upper body</span>
        </div>
        {/* Alternate option */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "7px 8px",
        }}>
          <span style={{ fontSize: "8px", fontWeight: 500, color: "#a0a0a0" }}>45-min Full Body</span>
          <div style={{ fontSize: "7px", color: "#666" }}>Moderate intensity</div>
        </div>
      </div>

      {/* Nutrition */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ fontSize: "7px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
          Nutrition
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { label: "Protein", value: "160g" },
            { label: "Meals left", value: "2" },
            { label: "Water", value: "3.0L" },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "5px 4px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>{stat.value}</div>
              <div style={{ fontSize: "6px", color: "#666" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button style={{
        width: "100%",
        background: "var(--accent-primary)",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "8px",
        padding: "8px",
        fontSize: "8px",
        fontWeight: 700,
        cursor: "default",
      }}>
        Start Workout
      </button>
    </div>
  );
}

function TravelView() {
  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Today</span>
        <span style={{
          fontSize: "7px",
          background: "rgba(224,255,79,0.15)",
          color: "var(--accent-primary)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontWeight: 600,
        }}>
          Travel Mode ON
        </span>
      </div>

      {/* Travel workout options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ fontSize: "7px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
          Workout Options
        </div>
        <div style={{
          background: "rgba(224,255,79,0.12)",
          border: "1px solid rgba(224,255,79,0.35)",
          borderRadius: "8px",
          padding: "7px 8px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "8px", fontWeight: 600, color: "#f5f5f5" }}>20-min Hotel Circuit</span>
            <span style={{ fontSize: "7px", color: "var(--accent-primary)", fontWeight: 700 }}>Selected</span>
          </div>
          <span style={{ fontSize: "7px", color: "#888" }}>Bodyweight -- No equipment</span>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "7px 8px",
        }}>
          <span style={{ fontSize: "8px", color: "#a0a0a0" }}>15-min Stretch and Core</span>
          <div style={{ fontSize: "7px", color: "#666" }}>Recovery</div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "7px 8px",
        }}>
          <span style={{ fontSize: "8px", color: "#a0a0a0" }}>30-min HIIT Walk</span>
          <div style={{ fontSize: "7px", color: "#666" }}>Outdoor or treadmill</div>
        </div>
      </div>

      {/* Nutrition adjusted */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: "8px",
        padding: "7px 8px",
      }}>
        <div style={{ fontSize: "7px", color: "#666", marginBottom: "3px" }}>Nutrition (travel adjusted)</div>
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Protein: 140g</span>
      </div>

      <button style={{
        width: "100%",
        background: "var(--accent-primary)",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "8px",
        padding: "8px",
        fontSize: "8px",
        fontWeight: 700,
        cursor: "default",
      }}>
        Start Workout
      </button>
    </div>
  );
}

function PickerView() {
  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Today -- Set your day</div>
        <div style={{ fontSize: "7px", color: "#666", marginTop: "2px" }}>Takes 10 seconds</div>
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {[
          { label: "Traveling", on: true },
          { label: "Low sleep", on: false },
          { label: "Short on time", on: true },
          { label: "No equipment", on: false },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: item.on ? "rgba(224,255,79,0.08)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${item.on ? "rgba(224,255,79,0.25)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: "8px",
            padding: "7px 8px",
          }}>
            <span style={{ fontSize: "8px", fontWeight: 500, color: item.on ? "#f5f5f5" : "#666" }}>
              {item.label}
            </span>
            {/* Toggle pill */}
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
      </div>

      {/* Generate CTA */}
      <button style={{
        width: "100%",
        background: "var(--accent-primary)",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "8px",
        padding: "9px",
        fontSize: "8px",
        fontWeight: 700,
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
 * State 0: Default day view
 * State 1: Travel mode active
 * State 2: Constraint picker
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
          {index === 0 && <DefaultView />}
          {index === 1 && <TravelView />}
          {index === 2 && <PickerView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
