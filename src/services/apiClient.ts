const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_PREFIX = (import.meta.env.VITE_API_PREFIX || "/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "admin_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const ADMIN_STORAGE_KEY = "dukadesk_admin";

type RefreshResult = "refreshed" | "expired" | "unavailable";
let refreshPromise: Promise<RefreshResult> | null = null;

function getVersionedBaseUrl(): string {
  if (!BASE_URL) throw new Error("VITE_API_URL is not configured.");
  if (BASE_URL.endsWith(API_PREFIX)) return BASE_URL;
  if (BASE_URL.endsWith("/api") && API_PREFIX.startsWith("/api/")) return `${BASE_URL}${API_PREFIX.slice(4)}`;
  return `${BASE_URL}${API_PREFIX}`;
}

interface RequestConfig extends RequestInit {
  params?: Record<string, unknown>;
  retry?: number;
  retryDelay?: number;
  authRetry?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
  requestId?: string;
  retryAfterSeconds?: number;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  return undefined;
}

function friendlyFromRaw(raw: string, status?: number): string {
  if (!raw) return "Request failed";
  if (raw.includes("prisma") || raw.includes("Unknown field")) return "Service temporarily unavailable. Please try again.";
  if (raw.includes("Cannot GET")) return "This feature is not available yet.";
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 429) return "Too many requests. Please slow down and try again.";
  return raw.length > 180 ? raw.slice(0, 180) + "..." : raw;
}

function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const url = new URL(`${getVersionedBaseUrl()}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: ApiError): boolean {
  // 429 (throttled) is surfaced immediately with Retry-After guidance rather
  // than silently retried, so the operator sees the limit and can act.
  if (!error.status) return true;
  return error.status >= 500 || error.status === 0;
}

function expireSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event("admin:session-expired"));
}

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return "expired";

    try {
      const response = await fetch(`${getVersionedBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (response.status === 401 || response.status === 403) return "expired";
      if (!response.ok) {
        console.warn("[Auth] Session refresh was temporarily unavailable", response.status);
        return "unavailable";
      }

      const raw = await response.json() as {
        data?: { accessToken?: string; refreshToken?: string; user?: Record<string, unknown> };
        accessToken?: string;
        refreshToken?: string;
        user?: Record<string, unknown>;
      };
      const payload = raw.data && typeof raw.data === "object" ? raw.data : raw;
      const accessToken = payload.accessToken;
      if (!accessToken || !payload.refreshToken) return "expired";

      localStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
      try {
        const storedAdmin = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "null");
        if (storedAdmin) {
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
            ...storedAdmin,
            ...payload.user,
            token: accessToken,
          }));
        }
      } catch (error) {
        console.warn("[Auth] Could not update the persisted session profile", error);
      }
      return "refreshed";
    } catch (error) {
      console.warn("[Auth] Session refresh request failed", error);
      return "unavailable";
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function request<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  config: RequestConfig = {}
): Promise<T> {
  const defaultRetry = method.toUpperCase() === "GET" ? 3 : 0;
  const { params, retry = defaultRetry, retryDelay = 1000, authRetry = false, ...fetchOptions } = config;
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  };

  let lastError: ApiError;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const response = await fetch(buildUrl(endpoint, params), {
        method,
        headers,
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
        ...fetchOptions,
      });

      if (response.status === 401 && token && !authRetry && !endpoint.startsWith("/auth/")) {
        const refreshResult = await refreshAccessToken();
        if (refreshResult === "refreshed") {
          return request<T>(method, endpoint, data, { ...config, retry: 0, authRetry: true });
        }
        if (refreshResult === "expired") expireSession();
      }

      if (!response.ok) {
        let errorData: unknown;
        const rid = response.headers.get("x-railway-request-id") || response.headers.get("x-request-id") || response.headers.get("request-id") || "";
        const retryAfterSeconds = response.status === 429 ? parseRetryAfter(response.headers.get("retry-after")) : undefined;
        let raw = "API request failed";
        try {
          errorData = await response.json();
          const body = errorData as { message?: string | string[]; errors?: string[]; error?: string; success?: boolean };
          raw = (Array.isArray(body.message) ? body.message.join(", ") : body.message) || body.errors?.join(", ") || body.error || raw;
        } catch {
          // No JSON body
        }
        let message = friendlyFromRaw(raw, response.status);
        if (rid) message = `${message} (Ref: ${rid.slice(0, 8)})`;
        if (retryAfterSeconds != null) message = `${message} Retry in ${retryAfterSeconds}s.`;
        const error = new Error(message) as ApiError;
        error.status = response.status;
        error.data = errorData;
        error.requestId = rid || undefined;
        error.retryAfterSeconds = retryAfterSeconds;
        if (rid) console.warn("[API]", endpoint, response.status, rid);
        throw error;
      }

      if (response.status === 204) return null as T;
      const payload = (await response.json()) as unknown as { success?: boolean; message?: string; errors?: string[]; error?: string; data?: unknown };
      // Backend envelope can be 200 with success:false (wrapped by TransformInterceptor/HttpExceptionFilter)
      if (payload && typeof payload === "object" && "success" in payload && (payload as { success: boolean }).success === false) {
        const rid = response.headers.get("x-railway-request-id") || response.headers.get("x-request-id") || "";
        const body = payload as { message?: string | string[]; errors?: string[]; error?: string };
        const raw = (Array.isArray(body.message) ? body.message.join(", ") : body.message) || body.errors?.join(", ") || body.error || "Request failed";
        const friendly = friendlyFromRaw(raw, response.status);
        const message = rid ? `${friendly} (Ref: ${rid.slice(0, 8)})` : friendly;
        const error = new Error(message) as ApiError;
        error.status = response.status;
        error.data = payload;
        (error as ApiError).requestId = rid || undefined;
        if (rid) console.warn("[API envelope]", endpoint, rid, raw);
        throw error;
      }
      return payload as T;
    } catch (error) {
      lastError = error as ApiError;
      if (attempt < retry && isRetryableError(lastError)) {
        await sleep(retryDelay * Math.pow(2, attempt));
        continue;
      }
      throw error;
    }
  }

  throw lastError!;
}

/** Multipart upload helper — same auth + error semantics as request(). */
export async function uploadFile<T>(endpoint: string, file: File): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(buildUrl(endpoint), {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!response.ok) {
    let raw = "Upload failed";
    try {
      const body = (await response.json()) as { message?: string | string[] };
      raw = (Array.isArray(body.message) ? body.message.join(", ") : body.message) || raw;
    } catch {
      // No JSON body
    }
    const error = new Error(friendlyFromRaw(raw, response.status)) as ApiError;
    error.status = response.status;
    throw error;
  }
  const payload = (await response.json()) as unknown as { success?: boolean; data?: unknown } & unknown;
  if (payload && typeof payload === "object" && "success" in payload && (payload as { success: boolean }).success === false) {
    const body = payload as { message?: string | string[] };
    throw new Error(friendlyFromRaw((Array.isArray(body.message) ? body.message.join(", ") : body.message) || "Upload failed", response.status));
  }
  return payload as T;
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) => request<T>("GET", endpoint, undefined, config),
  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => request<T>("POST", endpoint, data, config),
  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => request<T>("PUT", endpoint, data, config),
  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => request<T>("PATCH", endpoint, data, config),
  delete: <T>(endpoint: string, config?: RequestConfig) => request<T>("DELETE", endpoint, undefined, config),
};

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";