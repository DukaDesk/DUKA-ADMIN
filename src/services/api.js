import mockApi from "./mockApi";

const BASE_URL = import.meta.env.VITE_API_URL;
const USE_MOCK = !BASE_URL;

const tokenKey = "admin_token";

async function realRequest(endpoint, options = {}) {
  const token = localStorage.getItem(tokenKey);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = new Error("API request failed");
    error.status = res.status;
    throw error;
  }

  return res.json();
}

function parseEndpoint(endpoint) {
  const [path, qs] = endpoint.split("?");
  const query = {};
  if (qs) {
    qs.split("&").forEach((p) => {
      const [k, v] = p.split("=");
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
  }
  return { path: path.replace(/\/+$/, ""), query };
}

const request = USE_MOCK
  ? async (method, endpoint, data) => {
      const { path, query } = parseEndpoint(endpoint);
      const url = query && Object.keys(query).length > 0
        ? `${path}?${new URLSearchParams(query)}`
        : path;
      return mockApi(method, url, data);
    }
  : async (method, endpoint, data) => {
      const opts = data ? { method, body: JSON.stringify(data) } : { method };
      return realRequest(endpoint, opts);
    };

export const api = {
  get: (endpoint) => request("GET", endpoint),
  post: (endpoint, data) => request("POST", endpoint, data),
  put: (endpoint, data) => request("PUT", endpoint, data),
  delete: (endpoint) => request("DELETE", endpoint),
};

export { USE_MOCK };
export default api;
