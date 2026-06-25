const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("admin_token");

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

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;
