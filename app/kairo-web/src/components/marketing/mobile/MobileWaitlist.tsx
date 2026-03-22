"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

/**
 * Waitlist email form with React state success toggle.
 * POSTs to /api/waitlist -- no backend wiring needed for the success UI.
 * Inline layout on desktop, stacked on mobile.
 */
export default function MobileWaitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="waitlist"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            Early access
          </p>
          <h2
            className="font-display font-black leading-none mb-4"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Get early access.
          </h2>
          <p
            className="text-base leading-relaxed mb-10"
            style={{ color: "var(--text-secondary)" }}
          >
            Join the waitlist. Be the first to try the fitness app that works around your schedule.
          </p>
        </motion.div>

        {/* Form or success state */}
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}
            >
              <CheckCircle
                size={40}
                style={{ color: "var(--accent-primary)" }}
                aria-hidden="true"
              />
              <p
                className="text-xl font-display font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                You&apos;re on the list.
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                We&apos;ll be in touch when early access opens.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}
            >
              <div
                className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={status === "loading"}
                  style={{
                    flex: 1,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-hover)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 16px",
                    color: "var(--text-primary)",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "var(--accent-primary)",
                    color: "var(--bg-primary)",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    opacity: status === "loading" ? 0.7 : 1,
                    transition: "opacity 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px var(--accent-glow), 0 0 60px var(--accent-glow)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  {status === "loading" ? "Joining..." : "Join Waitlist"}
                </motion.button>
              </div>

              {status === "error" && (
                <p className="text-sm" style={{ color: "#ef4444" }}>
                  Something went wrong. Try again in a moment.
                </p>
              )}

              <p className="text-xs" style={{ color: "var(--text-muted, var(--text-tertiary))" }}>
                No spam. Unsubscribe anytime.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
