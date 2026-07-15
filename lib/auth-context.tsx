"use client";

/**
 * Auth context — cookie-based JWT auth against the Django backend.
 *
 * On mount:
 *   1. fetchCSRFToken() — ensures csrftoken cookie is present
 *   2. GET /api/me/ — reads the httpOnly access_token cookie to hydrate user
 *
 * Provides: user, isAuthenticated, isLoading, role, login, register, logout, refreshUser
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, fetchCSRFToken } from "./api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Shape returned by GET /api/me/
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: "user" | "dealer" | "admin" | "importer";
  avatar_url: string | null;
  bio: string;
  city_obj: number | null;
  city_name: string | null;
  show_phone: boolean;
  show_email: boolean;
  date_joined: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password2: string;
  phone?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: AuthUser["role"] | null;
  login: (email: string, password: string) => Promise<{ requiresVerification: boolean }>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use raw fetch so a 401 never triggers the api.ts redirect-to-signin logic.
  // Unauthenticated users should simply get user=null, not a forced redirect.
  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${BASE_URL}/api/me/`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      return res.json() as Promise<AuthUser>;
    } catch {
      return null;
    }
  }, []);

  // On mount: initialize CSRF cookie then check session via /api/me/
  // Timeout after 5s so the site never hangs if the backend is down.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await Promise.race([
          fetchCSRFToken(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]);
        if (cancelled) return;
        const me = await Promise.race([
          fetchMe(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
        if (!cancelled) setUser(me);
      } catch {
        // Backend unreachable — continue as unauthenticated
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      // Use raw fetch to prevent api.ts from intercepting 401→redirect
      const res = await fetch(`${BASE_URL}/api/auth/login/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* ignore */ }
        const err = new Error(
          JSON.stringify(body)
        ) as Error & { status: number; code?: string };
        err.status = res.status;
        err.code = typeof body.code === "string" ? body.code : undefined;
        throw err;
      }
      const me = await fetchMe();
      setUser(me);
      return { requiresVerification: me ? !me.is_email_verified : false };
    },
    [fetchMe]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      await api.post("/api/auth/register/", data);
      const me = await fetchMe();
      setUser(me);
      return { requiresVerification: me ? !me.is_email_verified : false };
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout/");
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        role: user?.role ?? null,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Utility — extract a human-readable error string from a backend error throw
// ---------------------------------------------------------------------------

type ApiErrorBody = Record<string, string | string[]>;

export function parseApiError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const body = JSON.parse(raw) as ApiErrorBody;
    // Backend uses "error" key for simple messages, "detail" for DRF standard
    if (typeof body.error === "string") return body.error;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.non_field_errors)) return String(body.non_field_errors[0]);
    // Field-level errors — return the first one
    for (const val of Object.values(body)) {
      if (typeof val === "string") return val;
      if (Array.isArray(val) && val.length > 0) return String(val[0]);
    }
  } catch {
    // Not JSON
  }
  return fallback;
}
