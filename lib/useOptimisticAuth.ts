"use client";

/**
 * Compatibility shim — was previously Convex-optimistic auth.
 * Now delegates to useAuth (Django cookie-based auth).
 */
import { useAuth } from "./auth-context";

export function useOptimisticAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  return {
    isAuthenticated,
    isLoading,
    _actual: { isAuthenticated, isLoading, user },
  };
}
