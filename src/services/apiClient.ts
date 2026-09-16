const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_PREFIX = (import.meta.env.VITE_API_PREFIX || "/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "admin_token";

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
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
  requestId?: string;
}

function friendlyFromRaw(raw: string, status?: number): string {
  if (!raw) return "Request failed";
  if (raw.includes("prisma") || raw.includes("Unknown field")) return "Service temporarily unavailable. Please try again.";
  if (raw.includes("Cannot GET")) return "This feature is not available yet.";
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
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
  if (!error.status) return true;
  return error.status >= 500 || error.status === 429 || error.status === 0;
}

export async function request<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  config: RequestConfig = {}
): Promise<T> {
  const { params, retry = 3, retryDelay = 1000, ...fetchOptions } = config;
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

      if (!response.ok) {
        let message = "API request failed";
        let errorData: unknown;
        const rid = response.headers.get("x-railway-request-id") || response.headers.get("x-request-id") || response.headers.get("request-id") || "";
        try {
          errorData = await response.json();
          const body = errorData as { message?: string | string[]; errors?: string[]; error?: string; success?: boolean };
          const raw = (Array.isArray(body.message) ? body.message.join(", ") : body.message) || body.errors?.join(", ") || body.error || message;
          message = friendlyFromRaw(raw, response.status);
          if (rid) message = `${message} (Ref: ${rid.slice(0, 8)})`;
        } catch {
          // No JSON body
        }
        const error = new Error(Array.isArray(message) ? message.join(", ") : message) as ApiError;
        error.status = response.status;
        error.data = errorData;
        (error as ApiError).requestId = rid || undefined;
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