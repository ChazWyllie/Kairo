"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface MemberProfile {
  email: string;
  fullName?: string | null;
  status: "pending" | "active" | "canceled" | "past_due";
  planTier?: "foundation" | "coaching" | "performance" | "vip" | null;
  billingInterval?: "monthly" | "annual" | null;
  isFoundingMember?: boolean;
  goal?: string | null;
  daysPerWeek?: number | null;
  minutesPerSession?: number | null;
  injuries?: string | null;
  onboardedAt?: string | null;
  createdAt?: string;
}

interface AuthContextValue {
  member: MemberProfile | null;
  role: "member" | "coach" | null;
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  member: null,
  role: null,
  loading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [role, setRole] = useState<"member" | "coach" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setMember(null);
        setRole(null);
        return;
      }
      const data = await res.json();
      // /api/auth/me returns { member: {...} } — derive role from cookie presence
      // The login endpoint sets a coach_session cookie for coaches; we detect role
      // by checking if member data exists (all authenticated users have it)
      setMember(data.member ?? null);
      // Role is passed back from the me endpoint if available, else default to member
      setRole(data.role ?? (data.member ? "member" : null));
    } catch {
      setMember(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ member, role, loading, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
