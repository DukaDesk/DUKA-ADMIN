import {
  admin,
  dashboard,
  users as mockUsers,
  merchants as mockMerchants,
  apps as mockApps,
  checkItems,
  reports as mockReports,
  revenue,
  waitlist as mockWaitlist,
  settings,
} from "./mockData";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function paginate(list, query = {}) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const start = (page - 1) * limit;
  const total = list.length;
  return {
    data: list.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function match(query, item) {
  if (!query || typeof query !== "object") return true;
  return Object.entries(query).every(([key, val]) => {
    if (val === undefined || val === null || val === "") return true;
    if (key === "search") {
      return Object.values(item).some(
        (v) => String(v).toLowerCase().includes(String(val).toLowerCase())
      );
    }
    return String(item[key]).toLowerCase() === String(val).toLowerCase();
  });
}

function filter(list, query) {
  const { search, page, limit, ...filters } = query;
  let filtered = list.filter((item) => match(filters, item));
  if (search) filtered = filtered.filter((item) => match({ search }, item));
  return { filtered, meta: { total: filtered.length } };
}

const handlers = {
  "POST /auth/login": async (body) => {
    await delay(600);
    if (!body?.email || !body?.password) {
      return { status: 400, body: { error: "Email and password are required" } };
    }
    return {
      body: {
        token: "mock_jwt_token_" + Date.now(),
        admin: { ...admin, email: body.email },
      },
    };
  },

  "GET /auth/me": async () => {
    await delay(200);
    return { body: { admin } };
  },

  "GET /dashboard": async () => {
    await delay(300);
    return { body: { dashboard } };
  },

  "GET /users": async (query) => {
    await delay(350);
    const { filtered } = filter(mockUsers, query);
    return { body: paginate(filtered, query) };
  },

  "GET /users/:id": async (_, params) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return { status: 404, body: { error: "User not found" } };
    return { body: { user } };
  },

  "PUT /users/:id": async (body, params) => {
    await delay(300);
    const idx = mockUsers.findIndex((u) => u.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "User not found" } };
    mockUsers[idx] = { ...mockUsers[idx], ...body };
    return { body: { user: mockUsers[idx] } };
  },

  "PUT /users/:id/status": async (body, params) => {
    await delay(300);
    const idx = mockUsers.findIndex((u) => u.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "User not found" } };
    mockUsers[idx].status = body.status;
    return { body: { user: mockUsers[idx] } };
  },

  "GET /merchants": async (query) => {
    await delay(350);
    const { filtered } = filter(mockMerchants, query);
    return { body: paginate(filtered, query) };
  },

  "GET /merchants/:id": async (_, params) => {
    await delay(200);
    const merchant = mockMerchants.find((m) => m.id === params.id);
    if (!merchant) return { status: 404, body: { error: "Merchant not found" } };
    return { body: { merchant } };
  },

  "PUT /merchants/:id": async (body, params) => {
    await delay(300);
    const idx = mockMerchants.findIndex((m) => m.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "Merchant not found" } };
    mockMerchants[idx] = { ...mockMerchants[idx], ...body };
    return { body: { merchant: mockMerchants[idx] } };
  },

  "GET /apps": async (query) => {
    await delay(350);
    const { filtered } = filter(mockApps, query);
    return { body: { ...paginate(filtered, query), checkItems } };
  },

  "GET /apps/:id": async (_, params) => {
    await delay(200);
    const app = mockApps.find((a) => a.id === params.id);
    if (!app) return { status: 404, body: { error: "App not found" } };
    return { body: { app, checkItems } };
  },

  "PUT /apps/:id/status": async (body, params) => {
    await delay(300);
    const idx = mockApps.findIndex((a) => a.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "App not found" } };
    mockApps[idx].status = body.status;
    return { body: { app: mockApps[idx] } };
  },

  "GET /reports": async (query) => {
    await delay(350);
    const { filtered } = filter(mockReports, query);
    return { body: paginate(filtered, query) };
  },

  "GET /reports/:id": async (_, params) => {
    await delay(200);
    const report = mockReports.find((r) => r.id === params.id);
    if (!report) return { status: 404, body: { error: "Report not found" } };
    return { body: { report } };
  },

  "PUT /reports/:id/status": async (body, params) => {
    await delay(300);
    const idx = mockReports.findIndex((r) => r.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "Report not found" } };
    mockReports[idx].status = body.status;
    mockReports[idx].assigned = body.assigned || mockReports[idx].assigned;
    return { body: { report: mockReports[idx] } };
  },

  "GET /revenue": async () => {
    await delay(300);
    return { body: { revenue } };
  },

  "GET /waitlist": async (query) => {
    await delay(350);
    const { filtered } = filter(mockWaitlist, query);
    return { body: paginate(filtered, query) };
  },

  "POST /waitlist/:id/invite": async (_, params) => {
    await delay(400);
    const idx = mockWaitlist.findIndex((w) => w.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "Entry not found" } };
    mockWaitlist[idx].status = "Invited";
    return { body: { entry: mockWaitlist[idx] } };
  },

  "DELETE /waitlist/:id": async (_, params) => {
    await delay(300);
    const idx = mockWaitlist.findIndex((w) => w.id === params.id);
    if (idx === -1) return { status: 404, body: { error: "Entry not found" } };
    mockWaitlist.splice(idx, 1);
    return { body: { success: true } };
  },

  "GET /settings": async () => {
    await delay(200);
    return { body: { settings: { ...settings } } };
  },

  "PUT /settings": async (body) => {
    await delay(300);
    Object.assign(settings, body);
    return { body: { settings: { ...settings } } };
  },

  "GET /notifications": async () => {
    await delay(200);
    const { notifications } = await import("./mockData");
    return { body: { notifications } };
  },
};

function parsePath(pattern, url) {
  const patternParts = pattern.split("/");
  const urlParts = url.split("?")[0].split("/");
  if (patternParts.length !== urlParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }
  const query = {};
  const qs = url.split("?")[1];
  if (qs) {
    qs.split("&").forEach((p) => {
      const [k, v] = p.split("=");
      query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
  }
  return { params, query };
}

export async function mockRequest(method, url, body) {
  const key = `${method} ${url.split("?")[0].replace(/\/+$/, "")}`;
  const handler = handlers[key];
  if (handler) {
    return handler(body, {});
  }
  for (const [pattern, handler] of Object.entries(handlers)) {
    const [pMethod, pPath] = pattern.split(" ");
    if (pMethod !== method) continue;
    const result = parsePath(pPath, url);
    if (result) {
      return handler(body, result.params, result.query);
    }
  }
  return { status: 404, body: { error: `No mock handler for ${method} ${url}` } };
}

export default async function mockApi(method, url, body) {
  const response = await mockRequest(method, url, body);
  await delay(100);
  if (response.status && response.status >= 400) {
    const err = new Error(response.body?.error || "Mock API error");
    err.status = response.status;
    throw err;
  }
  return response.body;
}
