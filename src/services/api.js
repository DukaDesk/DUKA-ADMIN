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

function friendlyFromRaw(raw, status) {
  if (!raw) return "Request failed";
  if (String(raw).includes("prisma") || String(raw).includes("Unknown field")) return "Service temporarily unavailable. Please try again.";
  if (String(raw).includes("Cannot GET")) return "This feature is not available yet.";
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  return String(raw).length > 180 ? String(raw).slice(0, 180) + "..." : String(raw);
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
    const rid = response.headers.get("x-railway-request-id") || response.headers.get("x-request-id") || "";
    try {
      const body = await response.json();
      const raw = body.message || body.errors?.join(", ") || (Array.isArray(body.errors) ? body.errors.join(", ") : null) || message;
      if (Array.isArray(body.errors) && !body.message) message = body.errors.join(", ");
      if (Array.isArray(body.message)) message = body.message.join(", ");
      const rawMsg = body.message || body.errors?.join(", ") || body.error || message;
      const friendly = friendlyFromRaw(Array.isArray(body.message) ? body.message.join(", ") : body.message || body.errors?.join(", ") || body.error || message, response.status);
      message = rid ? `${friendly} (Ref: ${rid.slice(0, 8)})` : friendly;
      if (rid) console.warn("[API legacy]", endpoint, response.status, rid);
      const error = new Error(Array.isArray(message) ? message.join(", ") : message);
      error.status = response.status;
      error.data = body;
      error.requestId = rid || undefined;
      throw error;
    } catch (e) {
      if (e.requestId || e.status) throw e;
      /* The response has no JSON error body. */
    }
    const error = new Error(Array.isArray(message) ? message.join(", ") : message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const payload = await response.json();
  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    const rid = response.headers.get("x-railway-request-id") || "";
    const raw = payload.errors?.join(", ") || payload.message || payload.error || "Request failed";
    const friendly = friendlyFromRaw(raw, response.status);
    const message = rid ? `${friendly} (Ref: ${rid.slice(0, 8)})` : friendly;
    const error = new Error(message);
    error.status = response.status;
    error.data = payload;
    error.requestId = rid || undefined;
    if (rid) console.warn("[API legacy envelope]", endpoint, rid, raw);
    throw error;
  }
  return payload;
}

export const api = {
  get: (endpoint) => request("GET", endpoint),
  post: (endpoint, data) => request("POST", endpoint, data),
  put: (endpoint, data) => request("PUT", endpoint, data),
  delete: (endpoint) => request("DELETE", endpoint),
};

export { apiClient, setAuthToken, getAuthToken, clearAuthToken, USE_MOCK };
export default api;