"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Accordion from "@/components/ui/Accordion";
import Modal from "@/components/ui/Modal";
import { PLANS } from "@/lib/stripe-prices";
import type { PlanTier } from "@/lib/stripe-prices";

const PLAN_MONTHLY_PRICES: Record<string, number> = {
  foundation: 49, coaching: 129, performance: 229, vip: 349,
};

function getFoundingPrice(monthlyPrice: number) {
  return Math.round(monthlyPrice * 0.9);
}

export default function AccountPage() {
  const { member, refetch } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  if (!member) return null;

  async function openBillingPortal() {
    if (!member) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast("Could not open billing portal. Please try again.", "error");
      setPortalLoading(false);
    }
  }

  async function signOut() {
    setSignOutLoading(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  const displayName = member.fullName ?? member.email;
  const currentPlan = PLANS.find((p) => p.tier === member.planTier);
  const monthlyPrice = member.planTier ? PLAN_MONTHLY_PRICES[member.planTier] : null;
  const foundingPrice = monthlyPrice ? getFoundingPrice(monthlyPrice) : null;

  return (
    <div>
      <PageHeader title="Account" />

      {/* Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
        <Avatar name={member.fullName} email={member.email} size={52} />
        <div>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>
            {displayName}
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", margin: 0 }}>
            {member.email}
          </p>
        </div>
      </div>

      {/* Subscription card */}
      <Card accentBorder style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Current Plan
            </p>
            <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
              {currentPlan?.name ?? "No active plan"}
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {member.planTier && <Badge variant="tier" value={member.planTier as PlanTier} />}
              <Badge variant="status" value={member.status} />
            </div>
          </div>
          {monthlyPrice && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {member.isFoundingMember && foundingPrice ? (
                <>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
                    ${foundingPrice}<span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-tertiary)" }}>/mo</span>
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textDecoration: "line-through", margin: 0 }}>
                    ${monthlyPrice}/mo
                  </p>
                </>
              ) : (
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
                  ${monthlyPrice}<span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-tertiary)" }}>/mo</span>
                </p>
              )}
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "2px 0 0", textTransform: "capitalize" }}>
                {member.billingInterval ?? ""}
              </p>
            </div>
          )}
        </div>

        {member.status === "active" && (
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: portalLoading ? "not-allowed" : "pointer",
              opacity: portalLoading ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {portalLoading ? "Opening..." : "Manage Subscription"}
          </button>
        )}
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "center", marginTop: "8px" }}>
          Upgrade, downgrade, or cancel anytime.
        </p>
      </Card>

      {/* Plan comparison */}
      <Accordion title="Compare Plans" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === member.planTier;
            return (
              <div
                key={plan.tier}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: isCurrent ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  background: isCurrent ? "rgba(224,255,79,0.04)" : "var(--bg-tertiary)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{plan.name}</p>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {isCurrent && <Badge variant="tier" value={plan.tier as PlanTier} />}
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
                      ${plan.monthlyPrice}/mo
                    </p>
                  </div>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Accordion>

      {/* Account actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
        <button
          type="button"
          onClick={() => setDeleteModal(true)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            padding: "8px",
            textDecoration: "underline",
          }}
        >
          Delete Account
        </button>
      </div>

      {/* Delete account modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
          To delete your account, please message your coach directly via WhatsApp and they will handle it for you.
        </p>
        <button
          type="button"
          onClick={() => setDeleteModal(false)}
          style={{
            width: "100%",
            padding: "12px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </Modal>
    </div>
  );
}
