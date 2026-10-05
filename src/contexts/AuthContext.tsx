"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@/types/user";
import { authService } from "@/services/authService";
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
    const sync = () => {
      void refresh();
    };
    window.addEventListener("silicosis-session", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("silicosis-session", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [refresh]);
  return <AuthContext value={{ user, loading, error, refresh }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}
