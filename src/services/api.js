import { apiClient, setAuthToken, getAuthToken, clearAuthToken, USE_MOCK } from "./apiClient";

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_PREFIX = (import.meta.env.VITE_API_PREFIX || "/api/v1").replace(/\/$/, "");
const tokenKey = "admin_token";

function getVersionedBaseUrl() {
  if (!BASE_URL) throw new Error("VITE_API_URL is not configured.");
  if (BASE_URL.endsWith(API_PREFIX)) return BASE_URL;
  if (BASE_URL.endsWith("/api") && API_PREFIX.startsWith("/api/")) return `${BASE_URL}${API_PREFIX.slice(4)}`;
  return `${BASE_URL}${API_PREFIX}`;
}

async function request(method, endpoint, data) {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(`${getVersionedBaseUrl()}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });

  if (!response.ok) {
    let message = "API request failed";
    try { message = (await response.json()).message || message; } catch { /* The response has no JSON error body. */ }
    const error = new Error(Array.isArray(message) ? message.join(", ") : message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (endpoint) => request("GET", endpoint),
  post: (endpoint, data) => request("POST", endpoint, data),
  put: (endpoint, data) => request("PUT", endpoint, data),
  delete: (endpoint) => request("DELETE", endpoint),
};

export { apiClient, setAuthToken, getAuthToken, clearAuthToken, USE_MOCK };
export default api;