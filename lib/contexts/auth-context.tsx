"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser, Client } from "@/lib/types";

interface AuthContextValue {
  user: SessionUser | null;
  client: Client | null;
  assignedClients: { id: string; cugName: string; cugCode: string | null }[];
  activeClientId: string | null;
  setActiveClientId: (id: string) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [assignedClients, setAssignedClients] = useState<{ id: string; cugName: string; cugCode: string | null }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setClient(data.client);
        setAssignedClients(data.assignedClients || []);
        // Set active client: user's own client, or HCLT001, or first assigned
        const clients = data.assignedClients || [];
        const cisco = clients.find((c: { cugCode: string | null }) => c.cugCode === "HCLHEALTHCARE");
        const defaultClientId =
          data.user.clientId ||
          cisco?.id ||
          clients[0]?.id ||
          null;
        setActiveClientId(defaultClientId);
      })
      .catch(() => {
        // Not authenticated — will be redirected by middleware
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setClient(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, client, assignedClients, activeClientId, setActiveClientId, loading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
