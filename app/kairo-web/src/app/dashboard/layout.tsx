"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { House, Dumbbell, Apple, User, MoreHorizontal } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import DashboardShell from "@/components/layout/DashboardShell";
import { ToastProvider } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { TabItem } from "@/components/layout/BottomTabBar";

const CLIENT_TABS: TabItem[] = [
  { icon: House,          label: "Home",      href: "/dashboard" },
  { icon: Dumbbell,       label: "Workouts",  href: "/dashboard/workouts" },
  { icon: Apple,          label: "Nutrition", href: "/dashboard/nutrition" },
  { icon: User,           label: "Account",   href: "/dashboard/account" },
  { icon: MoreHorizontal, label: "More",      href: "/dashboard/more" },
];

function ClientGuard({ children }: { children: ReactNode }) {
  const { member, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!member && role !== "coach") {
      router.replace("/login");
      return;
    }
    if (role === "coach") {
      router.replace("/coach");
    }
  }, [member, role, loading, router]);

  if (loading) {
    return (
      <DashboardShell tabs={CLIENT_TABS}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardShell>
    );
  }

  if (!member) return null;

  return <DashboardShell tabs={CLIENT_TABS}>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ClientGuard>{children}</ClientGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
