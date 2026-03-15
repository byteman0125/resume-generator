import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getAuthToken, setAuthToken, clearAuthToken, getBaseUrl, setBackendIp } from "../api";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "user";
  assignedProfileId: string | null;
  active: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (serverIp: string, port: number, username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_ME_POLL_INTERVAL_MS = 20_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setTokenState(null);
    setUserState(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchMe = useCallback(async (): Promise<boolean> => {
    const t = getAuthToken();
    if (!t) return false;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        logout();
        return false;
      }
      if (!res.ok) return false;
      const data = await res.json();
      setUserState({
        id: data.id,
        username: data.username,
        role: data.role,
        assignedProfileId: data.assignedProfileId ?? null,
        active: data.active !== false,
      });
      return true;
    } catch {
      return false;
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setUserState(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const ok = await fetchMe();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, fetchMe]);

  useEffect(() => {
    if (!token || !user) return;
    pollRef.current = setInterval(() => {
      fetchMe();
    }, AUTH_ME_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [token, user, fetchMe]);

  useEffect(() => {
    const on401 = () => logout();
    window.addEventListener("auth:401", on401);
    return () => window.removeEventListener("auth:401", on401);
  }, [logout]);

  const login = useCallback(
    async (serverIp: string, port: number, username: string, password: string) => {
      const host = serverIp.trim() || "127.0.0.1";
      const base = host.includes("://") ? host.replace(/\/+$/, "") : `http://${host}:${port}`;
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Login failed");
      }
      const data = await res.json();
      const t = (data as { token?: string }).token;
      if (!t) throw new Error("No token returned");
      setBackendIp(base);
      setAuthToken(t);
      setTokenState(t);
      const ok = await fetchMe();
      if (!ok) throw new Error("Session check failed");
    },
    [fetchMe]
  );
  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    setUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
