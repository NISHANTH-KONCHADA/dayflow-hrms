"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUserById } from "@/lib/mock";
import { clearSession, getStoredUserId, login as mockLogin } from "@/lib/mock/auth";
import type { User } from "@/lib/types";

type LoginResult = { user: User } | { error: string };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedUserId = getStoredUserId();
      const restoredUser = storedUserId ? await getUserById(storedUserId) : undefined;
      if (!cancelled) {
        setUser(restoredUser ?? null);
        setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(identifier: string, password: string): Promise<LoginResult> {
    const result = await mockLogin(identifier, password);
    if ("user" in result) {
      setUser(result.user);
    }
    return result;
  }

  function logout() {
    clearSession();
    setUser(null);
    window.location.assign("/sign-in");
  }

  async function refreshUser() {
    if (!user) return;
    const refreshed = await getUserById(user.id);
    setUser(refreshed ?? null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
