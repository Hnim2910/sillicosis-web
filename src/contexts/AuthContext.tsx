"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@/types/user";
import { authService } from "@/services/authService";
import { isSignOutEvent, SESSION_EVENT } from "@/lib/apiClient";
import { errorMessage } from "@/utils/format";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setUser(await authService.getCurrentUser());
      setError("");
    } catch (reason) {
      setError(errorMessage(reason));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    // Login, logout, profile updates and expired sessions in this tab.
    const sync = () => {
      void refresh();
    };
    // Sign-out in another tab removes the shared refresh token. Token rotation is ignored on
    // purpose: reacting to it would make tabs refresh each other in a loop.
    const syncTabs = (event: StorageEvent) => {
      if (isSignOutEvent(event)) void refresh();
    };
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", syncTabs);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", syncTabs);
    };
  }, [refresh]);
  return <AuthContext value={{ user, loading, error, refresh }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}
