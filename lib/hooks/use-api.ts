"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

// ---------------------------------------------------------------------------
// useApiQuery
// ---------------------------------------------------------------------------

interface QueryOptions {
  /** Skip the fetch when false (default: true). */
  enabled?: boolean;
  /** Re-fetch when any of these values change (same semantics as useEffect deps). */
  deps?: unknown[];
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useApiQuery<T>(
  url: string,
  options: QueryOptions = {}
): QueryResult<T> {
  const { enabled = true, deps = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const counter = useRef(0);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    const id = ++counter.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(url);
      if (id === counter.current) setData(result);
    } catch (err) {
      if (id === counter.current) setError(err as Error);
    } finally {
      if (id === counter.current) setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, ...deps]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, error, isLoading, refetch: fetch };
}

// ---------------------------------------------------------------------------
// useApiMutation
// ---------------------------------------------------------------------------

type HttpMethod = "POST" | "PATCH" | "PUT" | "DELETE";

interface MutationResult<T> {
  mutate: (body?: unknown) => Promise<T>;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  reset: () => void;
}

export function useApiMutation<T = unknown>(
  url: string,
  method: HttpMethod = "POST"
): MutationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (body?: unknown): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        let result: T;
        if (method === "POST") result = await api.post<T>(url, body);
        else if (method === "PATCH") result = await api.patch<T>(url, body);
        else if (method === "PUT") result = await api.put<T>(url, body);
        else result = await api.delete<T>(url);
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { mutate, data, error, isLoading, reset };
}
