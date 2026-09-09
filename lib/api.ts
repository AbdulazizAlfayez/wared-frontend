/**
 * Central API client for the Django REST Framework backend.
 *
 * - Always sends credentials (httpOnly cookies for JWT auth)
 * - Reads csrftoken cookie and sends it as X-CSRFToken on mutating requests
 * - Sends Accept-Language based on localStorage "lang" key
 * - Silently refreshes access token on 401 and retries once
 * - Redirects to /auth if refresh also fails
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function getLocale(): string {
  if (typeof localStorage === "undefined") return "en";
  return localStorage.getItem("lang") || "en";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": getLocale(),
  };

  if (MUTATING_METHODS.has(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) headers["X-CSRFToken"] = csrf;
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 403 → check for ban/suspension and redirect to restricted page
  if (res.status === 403) {
    let detail = "";
    try { detail = (await res.json())?.detail ?? ""; } catch { /* ignore */ }
    if (typeof window !== "undefined") {
      const msg = typeof detail === "string" ? detail : "";
      if (msg.includes("permanently banned")) {
        const reason = msg.replace("Your account has been permanently banned:", "").trim();
        window.location.href = `/account-restricted?type=banned&reason=${encodeURIComponent(reason)}`;
      } else if (msg.includes("temporarily suspended")) {
        const untilMatch = msg.match(/until ([^:]+):/);
        const reasonMatch = msg.match(/\d+ UTC: (.+)$/);
        const until  = untilMatch?.[1]?.trim() ?? "";
        const reason = reasonMatch?.[1]?.trim() ?? "";
        window.location.href = `/account-restricted?type=suspended&until=${encodeURIComponent(until)}&reason=${encodeURIComponent(reason)}`;
      }
    }
    const err = new Error(typeof detail === "string" ? detail : "Forbidden") as Error & { status: number; detail: unknown };
    err.status = 403;
    err.detail = detail;
    throw err;
  }

  // 401 → try a silent token refresh once, then retry
  if (res.status === 401 && !isRetry) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return request<T>(method, path, body, true);
    }
    // Refresh failed — send to login
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin";
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = res.statusText;
    }
    const err = new Error(
      typeof detail === "object" && detail !== null
        ? JSON.stringify(detail)
        : String(detail)
    ) as Error & { status: number; detail: unknown };
    err.status = res.status;
    err.detail = detail;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

async function silentRefresh(): Promise<boolean> {
  try {
    const csrf = getCookie("csrftoken");
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRFToken": csrf } : {}),
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Call once on app mount to initialize the CSRF cookie. */
export async function fetchCSRFToken(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/auth/csrf/`, {
      credentials: "include",
    });
  } catch {
    // Best-effort; cookie will be set by the server on first mutating request
  }
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>("GET", path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, body);
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PATCH", path, body);
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PUT", path, body);
  },
  delete<T = void>(path: string): Promise<T> {
    return request<T>("DELETE", path);
  },
};
