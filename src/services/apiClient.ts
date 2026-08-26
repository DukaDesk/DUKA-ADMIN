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
        try {
          errorData = await response.json();
          message = (errorData as { message?: string }).message || message;
        } catch {
          // No JSON body
        }
        const error = new Error(Array.isArray(message) ? message.join(", ") : message) as ApiError;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      if (response.status === 204) return null as T;
      return (await response.json()) as T;
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