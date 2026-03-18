"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

export default function CoachSettingsPage() {
  const { member } = useAuth();
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [signOutLoading, setSignOutLoading] = useState(false);

  // TODO: Persist whatsapp to coach profile endpoint when built

  async function signOut() {
    setSignOutLoading(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <section style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Profile
        </p>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Email</p>
              <p style={{ color: "var(--text-primary)", margin: 0 }}>{member?.email ?? "coach"}</p>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                WhatsApp Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 234 567 8900"
                style={{
                  width: "100%",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-hover)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "var(--text-primary)",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                Used to pre-fill WhatsApp links on client profiles.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <button
        type="button"
        onClick={signOut}
        disabled={signOutLoading}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid var(--border-hover)",
          borderRadius: "8px",
          background: "none",
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {signOutLoading ? "Signing out..." : "Sign Out"}
      </button>
    </div>
  );
}
