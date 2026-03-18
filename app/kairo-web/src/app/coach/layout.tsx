"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, ClipboardList, Settings } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import DashboardShell from "@/components/layout/DashboardShell";
import { ToastProvider } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { TabItem } from "@/components/layout/BottomTabBar";

const COACH_TABS: TabItem[] = [
  { icon: LayoutDashboard, label: "Overview",  href: "/coach" },
  { icon: Users,           label: "Clients",   href: "/coach/clients" },
  { icon: FileText,        label: "Content",   href: "/coach/content" },
  { icon: ClipboardList,   label: "Waitlist",  href: "/coach/waitlist" },
  { icon: Settings,        label: "Settings",  href: "/coach/settings" },
];

function CoachGuard({ children }: { children: ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (role !== "coach") {
      router.replace(role === "member" ? "/dashboard" : "/login");
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <DashboardShell tabs={COACH_TABS}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardShell>
    );
  }

  if (role !== "coach") return null;

  return <DashboardShell tabs={COACH_TABS}>{children}</DashboardShell>;
}

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <CoachGuard>{children}</CoachGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
