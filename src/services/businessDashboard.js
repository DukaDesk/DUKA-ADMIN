import { apiClient, USE_MOCK } from "./apiClient";

const BFF_ADMIN = "/bff/admin";
const ADMIN = "/admin";

function queryString(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function paginate(data, page = 1, limit = 10) {
  const start = (page - 1) * limit;
  return {
    data: data.slice(start, start + limit),
    total: data.length,
    page,
    limit,
    totalPages: Math.ceil(data.length / limit),
  };
}

function filterData(data, params) {
  let result = [...data];
  if (params.search) {
    const search = params.search.toLowerCase();
    result = result.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(search))
    );
  }
  if (params.status) {
    result = result.filter((item) => item.status === params.status);
  }
  if (params.plan) {
    result = result.filter((item) => item.plan === params.plan);
  }
  if (params.category) {
    result = result.filter((item) => item.category === params.category);
  }
  if (params.action) {
    result = result.filter((item) => item.action === params.action);
  }
  if (params.from) {
    result = result.filter((item) => new Date(item.timestamp) >= new Date(params.from));
  }
  if (params.to) {
    const to = new Date(params.to);
    to.setHours(23, 59, 59, 999);
    result = result.filter((item) => new Date(item.timestamp) <= to);
  }
  if (params.sort) {
    result.sort((a, b) => {
      const aVal = a[params.sort];
      const bVal = b[params.sort];
      if (aVal < bVal) return params.order === "desc" ? 1 : -1;
      if (aVal > bVal) return params.order === "desc" ? -1 : 1;
      return 0;
    });
  }
  return result;
}

const MOCK_MERCHANTS = Array.from({ length: 47 }, (_, i) => ({
  id: `mer_${String(i + 1).padStart(3, "0")}`,
  name: [`Acme Corp`, `Globex Inc`, `Wayne Enterprises`, `Stark Industries`, `Umbrella Corp`, `Cyberdyne Systems`, `Weyland-Yutani`, `Tyrell Corp`, `Massive Dynamic`, `Initech`, `Soylent Corp`, `Oscorp`, `LexCorp`, `Wayne Tech`, `Pied Piper`, `Hooli`, `Raviga`, `Brawndo`, `Dunder Mifflin`, `Vandelay Industries`][i % 20] + ` ${i + 1}`,
  email: `merchant${i + 1}@example.com`,
  status: ["active", "pending", "suspended", "rejected"][i % 4],
  plan: ["free", "starter", "professional", "enterprise"][i % 4],
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  merchantId: `mer_${String(i + 1).padStart(3, "0")}`,
}));

const MOCK_MARKETPLACE = Array.from({ length: 32 }, (_, i) => ({
  id: `lst_${String(i + 1).padStart(3, "0")}`,
  name: [`Payment Gateway`, `Booking System`, `Inventory Manager`, `Analytics Dashboard`, `Email Marketing`, `CRM Integration`, `Loyalty Program`, `Multi-vendor Marketplace`, `Subscription Billing`, `POS Integration`, `WhatsApp Business`, `SMS Notifications`, `Review Manager`, `Affiliate Tracker`, `Gift Cards`, `Flash Sales`, `Product Bundles`, `Wishlist`, `Compare Products`, `Recently Viewed`][i % 20],
  slug: `plugin-${i + 1}`,
  category: ["ecommerce", "booking", "payments", "marketing", "analytics", "productivity"][i % 6],
  merchantName: MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].name,
  status: ["published", "draft", "pending_review", "rejected", "archived"][i % 5],
  downloads: Math.floor(Math.random() * 5000),
  rating: Number((3 + Math.random() * 2).toFixed(1)),
  featured: i < 3,
  createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
}));

const MOCK_SUBSCRIPTIONS = Array.from({ length: 28 }, (_, i) => ({
  id: `sub_${String(i + 1).padStart(3, "0")}`,
  merchantName: MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].name,
  planName: ["Free", "Starter", "Professional", "Enterprise"][i % 4],
  plan: ["free", "starter", "professional", "enterprise"][i % 4],
  interval: ["monthly", "yearly"][i % 2],
  status: ["active", "past_due", "canceled", "trialing", "paused", "incomplete"][i % 6],
  amount: [0, 2900, 7900, 19900][i % 4],
  currency: "NGN",
  currentPeriodEnd: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  trialEnd: i % 3 === 0 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
}));

const MOCK_PLANS = [
  { id: "plan_free", name: "Free", price: 0, interval: "monthly", features: ["Up to 10 products", "Basic analytics", "Community support"], limits: { products: 10, orders: 100 }, trialDays: 0 },
  { id: "plan_starter", name: "Starter", price: 2900, interval: "monthly", features: ["Up to 100 products", "Advanced analytics", "Email support", "Custom domain"], limits: { products: 100, orders: 1000 }, trialDays: 14 },
  { id: "plan_professional", name: "Professional", price: 7900, interval: "monthly", features: ["Unlimited products", "Advanced analytics", "Priority support", "Custom domain", "API access"], limits: { products: -1, orders: 10000 }, trialDays: 14 },
  { id: "plan_enterprise", name: "Enterprise", price: 19900, interval: "monthly", features: ["Everything in Professional", "Dedicated support", "SLA guarantee", "Custom integrations", "White-label"], limits: { products: -1, orders: -1 }, trialDays: 30 },
];

const MOCK_FEATURE_FLAGS = [
  { key: "new_dashboard", enabled: true, description: "Enable new dashboard UI" },
  { key: "marketplace_v2", enabled: false, description: "New marketplace experience" },
  { key: "ai_recommendations", enabled: true, description: "AI-powered product recommendations" },
  { key: "advanced_analytics", enabled: false, description: "Advanced analytics module" },
  { key: "multi_currency", enabled: true, description: "Multi-currency support" },
  { key: "webhooks_v2", enabled: false, description: "New webhook system" },
  { key: "sso_saml", enabled: true, description: "SAML SSO integration" },
  { key: "audit_log_export", enabled: false, description: "Export audit logs to CSV" },
];

const MOCK_SETTINGS = {
  two_factor_auth: true,
  auto_approve_apps: false,
  email_alerts: true,
  slack_alerts: false,
  maintenance_mode: false,
  registration_enabled: true,
  max_file_upload_mb: 50,
  session_timeout_minutes: 60,
  password_min_length: 8,
  api_rate_limit: 1000,
};

const MOCK_AUDIT = Array.from({ length: 156 }, (_, i) => {
  const actions = [
    "tenant.approve", "tenant.suspend", "tenant.create", "tenant.update",
    "user.invite", "user.role_assign", "plan.create", "plan.update",
    "marketplace.approve", "marketplace.reject", "settings.update", "login", "logout"
  ];
  const admins = ["superadmin@dukadesk.com", "operator@dukadesk.com", "support@dukadesk.com"];
  const targetTypes = ["tenant", "user", "plan", "listing", "settings"];
  const action = actions[Math.floor(Math.random() * actions.length)];
  return {
    id: `aud_${String(i + 1).padStart(4, "0")}`,
    timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    adminEmail: admins[Math.floor(Math.random() * admins.length)],
    action,
    targetType: targetTypes[Math.floor(Math.random() * targetTypes.length)],
    targetId: `res_${Math.floor(Math.random() * 1000)}`,
    metadata: { ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, userAgent: "Mozilla/5.0" },
  };
});

const MOCK_OVERVIEW = {
  totalMerchants: 47,
  activeMerchants: 38,
  pendingMerchants: 5,
  suspendedMerchants: 4,
  totalRevenue: 12450000,
  monthlyRevenue: 3200000,
  totalSubscriptions: 28,
  activeSubscriptions: 22,
  totalMarketplaceListings: 32,
  publishedListings: 18,
  totalUsers: 124,
  platformUptime: 99.97,
};

const MOCK_PLATFORM_STATS = {
  ...MOCK_OVERVIEW,
  apiRequests24h: 1245000,
  errorRate: 0.12,
  avgResponseTime: 145,
  storageUsedGB: 245,
  bandwidthUsedTB: 12.3,
};

function mockResponse(data, total) {
  return Promise.resolve({ data, total, page: 1, limit: 10, totalPages: Math.ceil((total || data.length) / 10) });
}

async function mockCall(fn, mockData, params = {}) {
  if (!USE_MOCK) return fn();
  await delay();
  let data = mockData;
  let total = mockData.length;
  if (params && (params.page || params.limit || params.search || params.status || params.plan || params.category || params.action || params.from || params.to || params.sort)) {
    data = filterData(mockData, params);
    total = data.length;
    data = paginate(data, params.page, params.limit).data;
  }
  return mockResponse(data, total);
}

const MOCK_USERS = Array.from({ length: 24 }, (_, i) => ({
  id: `usr_${String(i + 1).padStart(3, "0")}`,
  email: `user${i + 1}@example.com`,
  name: `User ${i + 1}`,
  role: ["admin", "support", "moderator", "analyst"][i % 4],
  status: ["active", "pending", "suspended"][i % 3],
  tenantId: MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].id,
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
}));

const MOCK_ANNOUNCEMENTS = [
  { id: "ann_001", title: "Scheduled maintenance", message: "Downtime July 1", type: "info", active: true, createdAt: new Date().toISOString() },
  { id: "ann_002", title: "New feature: AI recommendations", message: "Try AI now", type: "success", active: true, createdAt: new Date().toISOString() },
];

export const businessDashboardApi = {
  // Overview / BFF
  getOverview: () => mockCall(() => apiClient.get(`${BFF_ADMIN}/overview`), MOCK_OVERVIEW),
  getBffAnalytics: (params) => mockCall(() => apiClient.get(`${BFF_ADMIN}/analytics${queryString(params)}`), { revenueTrend: [2.1,2.3,2.8,3.2,3.6], userGrowth: [10,14,18,22,30] }, params),
  getBffRevenue: (params) => mockCall(() => apiClient.get(`${BFF_ADMIN}/revenue${queryString(params)}`), { total: 12450000, breakdown: MOCK_OVERVIEW }, params),
  getTenantAnalytics: (tenantId, params) => mockCall(() => apiClient.get(`${BFF_ADMIN}/tenants/${tenantId}/analytics${queryString(params)}`), { tenantId, revenueTrend: [1,2,3] }, params),
  getMerchants: (params) => mockCall(() => apiClient.get(`${BFF_ADMIN}/merchants${queryString(params)}`), MOCK_MERCHANTS, params),
  getAuditLog: (params) => mockCall(() => apiClient.get(`${BFF_ADMIN}/audit${queryString(params)}`), MOCK_AUDIT, params),
  getPlatformStats: () => mockCall(() => apiClient.get(`${ADMIN}/stats`), MOCK_PLATFORM_STATS),
  // Keep alias for backwards compat — spec is /admin/merchants === tenants (Builder separate website, overview only)
  getPlatformMerchants: (params) => mockCall(() => apiClient.get(`${ADMIN}/merchants${queryString(params)}`), MOCK_MERCHANTS, params),
  getTenantDetail: (id) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/merchants/${id}`);
    const m = MOCK_MERCHANTS.find((x) => x.id === id);
    return delay().then(() => m ? { data: m } : Promise.reject(new Error("Tenant not found")));
  },
  updateTenant: (id, patch) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/merchants/${id}`, patch);
    return delay().then(() => {
      const m = MOCK_MERCHANTS.find((x) => x.id === id);
      if (m) Object.assign(m, patch);
      return { success: true, data: m };
    });
  },
  deleteTenant: (id) => {
    if (!USE_MOCK) return apiClient.delete(`${ADMIN}/merchants/${id}`);
    return delay().then(() => {
      const idx = MOCK_MERCHANTS.findIndex((x) => x.id === id);
      if (idx !== -1) MOCK_MERCHANTS.splice(idx, 1);
      return { success: true };
    });
  },
  cleanupDeactivated: () => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/cleanup-deactivated`);
    return delay().then(() => ({ success: true }));
  },
  getTenantSettings: (tenantId, params) => mockCall(() => apiClient.get(`${ADMIN}/merchants/${tenantId}/settings${queryString(params)}`), MOCK_SETTINGS, params),
  updateTenantSetting: (tenantId, key, value) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/merchants/${tenantId}/settings/${key}`, value);
    return delay().then(() => ({ success: true, key, value }));
  },
  approveMerchant: (merchantId) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/merchants/${merchantId}/approve`);
    return delay().then(() => {
      const merchant = MOCK_MERCHANTS.find((m) => m.id === merchantId);
      if (merchant) merchant.status = "active";
      return { success: true };
    });
  },
  suspendMerchant: (merchantId) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/merchants/${merchantId}/suspend`);
    return delay().then(() => {
      const merchant = MOCK_MERCHANTS.find((m) => m.id === merchantId);
      if (merchant) merchant.status = "suspended";
      return { success: true };
    });
  },
  // Quotas
  getQuota: (tenantId) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/quotas/${tenantId}`);
    return delay().then(() => ({ tenantId, limit: 1000, used: 342 }));
  },
  updateQuota: (tenantId, payload) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/quotas/${tenantId}`, payload);
    return delay().then(() => ({ success: true, tenantId, ...payload }));
  },
  // Settings (spec: GET /admin/settings/:key, DELETE too)
  getSettings: (category) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/settings${queryString({ category })}`);
    return delay().then(() => {
      if (category) {
        const filtered = {};
        Object.entries(MOCK_SETTINGS).forEach(([k, v]) => {
          if (k.startsWith(category.replace("notifications", "email").replace("security", "two_factor"))) {
            filtered[k] = v;
          }
        });
        return { settings: filtered };
      }
      return { settings: MOCK_SETTINGS };
    });
  },
  getSetting: (key) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/settings/${key}`);
    return delay().then(() => ({ key, value: MOCK_SETTINGS[key] }));
  },
  updateSetting: (key, value) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/settings/${key}`, value);
    return delay().then(() => {
      MOCK_SETTINGS[key] = value;
      return { success: true, key, value };
    });
  },
  deleteSetting: (key) => {
    if (!USE_MOCK) return apiClient.delete(`${ADMIN}/settings/${key}`);
    return delay().then(() => {
      delete MOCK_SETTINGS[key];
      return { success: true };
    });
  },
  // Feature flags CRUD
  getMarketplaceListings: (params) => mockCall(() => apiClient.get(`/marketplace/listings/all${queryString(params)}`), MOCK_MARKETPLACE, params),
  getSubscriptions: (params) => mockCall(() => apiClient.get(`${ADMIN}/subscriptions${queryString(params)}`), MOCK_SUBSCRIPTIONS, params),
  getPlans: () => mockCall(() => apiClient.get(`${ADMIN}/plans`), MOCK_PLANS),
  getPlan: (id) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/plans/${id}`);
    const p = MOCK_PLANS.find((x) => x.id === id);
    return delay().then(() => p || Promise.reject(new Error("Plan not found")));
  },
  createPlan: (payload) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/plans`, payload);
    const p = { id: `plan_${Date.now()}`, ...payload };
    MOCK_PLANS.push(p);
    return delay().then(() => p);
  },
  updatePlan: (id, payload) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/plans/${id}`, payload);
    const p = MOCK_PLANS.find((x) => x.id === id);
    if (p) Object.assign(p, payload);
    return delay().then(() => p);
  },
  deletePlan: (id) => {
    if (!USE_MOCK) return apiClient.delete(`${ADMIN}/plans/${id}`);
    const idx = MOCK_PLANS.findIndex((x) => x.id === id);
    if (idx !== -1) MOCK_PLANS.splice(idx, 1);
    return delay().then(() => ({ success: true }));
  },
  updateSubscription: (id, payload) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/subscriptions/${id}`, payload);
    const s = MOCK_SUBSCRIPTIONS.find((x) => x.id === id);
    if (s) Object.assign(s, payload);
    return delay().then(() => ({ success: true, data: s }));
  },
  // Feature flags
  getFeatureFlags: () => mockCall(() => apiClient.get(`${ADMIN}/feature-flags`), MOCK_FEATURE_FLAGS),
  getFeatureFlag: (key) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/feature-flags/${key}`);
    const f = MOCK_FEATURE_FLAGS.find((x) => x.key === key);
    return delay().then(() => f || Promise.reject(new Error("Flag not found")));
  },
  createFeatureFlag: (payload) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/feature-flags`, payload);
    MOCK_FEATURE_FLAGS.push(payload);
    return delay().then(() => payload);
  },
  updateFeatureFlag: (key, payload) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/feature-flags/${key}`, payload);
    const f = MOCK_FEATURE_FLAGS.find((x) => x.key === key);
    if (f) Object.assign(f, payload);
    return delay().then(() => ({ success: true, data: f }));
  },
  deleteFeatureFlag: (key) => {
    if (!USE_MOCK) return apiClient.delete(`${ADMIN}/feature-flags/${key}`);
    const idx = MOCK_FEATURE_FLAGS.findIndex((x) => x.key === key);
    if (idx !== -1) MOCK_FEATURE_FLAGS.splice(idx, 1);
    return delay().then(() => ({ success: true }));
  },
  // Announcements
  getAnnouncements: (params) => mockCall(() => apiClient.get(`${ADMIN}/announcements${queryString(params)}`), MOCK_ANNOUNCEMENTS, params),
  getActiveAnnouncements: (params) => mockCall(() => apiClient.get(`${ADMIN}/announcements/active${queryString(params)}`), MOCK_ANNOUNCEMENTS.filter((a) => a.active), params),
  createAnnouncement: (payload) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/announcements`, payload);
    const a = { id: `ann_${Date.now()}`, createdAt: new Date().toISOString(), active: true, ...payload };
    MOCK_ANNOUNCEMENTS.push(a);
    return delay().then(() => a);
  },
  updateAnnouncement: (id, payload) => {
    if (!USE_MOCK) return apiClient.put(`${ADMIN}/announcements/${id}`, payload);
    const a = MOCK_ANNOUNCEMENTS.find((x) => x.id === id);
    if (a) Object.assign(a, payload);
    return delay().then(() => a);
  },
  deleteAnnouncement: (id) => {
    if (!USE_MOCK) return apiClient.delete(`${ADMIN}/announcements/${id}`);
    const idx = MOCK_ANNOUNCEMENTS.findIndex((x) => x.id === id);
    if (idx !== -1) MOCK_ANNOUNCEMENTS.splice(idx, 1);
    return delay().then(() => ({ success: true }));
  },
  // Users (admin portal - customer care)
  getUsers: (params) => mockCall(() => apiClient.get(`${ADMIN}/users${queryString(params)}`), MOCK_USERS, params),
  getUser: (id) => {
    if (!USE_MOCK) return apiClient.get(`${ADMIN}/users/${id}`);
    const u = MOCK_USERS.find((x) => x.id === id);
    return delay().then(() => u || Promise.reject(new Error("User not found")));
  },
  getTenantUsers: (tenantId, params) => mockCall(() => apiClient.get(`${ADMIN}/users/tenant/${tenantId}${queryString(params)}`), MOCK_USERS.filter((u) => u.tenantId === tenantId), params),
  inviteUser: (id, payload) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/users/${id}/invite`, payload);
    return delay().then(() => ({ success: true, id, ...payload }));
  },
  assignRoles: (id, payload) => {
    if (!USE_MOCK) return apiClient.post(`${ADMIN}/users/${id}/roles`, payload);
    const u = MOCK_USERS.find((x) => x.id === id);
    if (u && payload.roles) u.role = payload.roles[0];
    return delay().then(() => ({ success: true }));
  },
  removeUser: (id, tenantId) => {
    if (!USE_MOCK) return apiClient.delete(`${ADMIN}/users/${id}${queryString({ tenantId })}`);
    const idx = MOCK_USERS.findIndex((x) => x.id === id);
    if (idx !== -1) MOCK_USERS.splice(idx, 1);
    return delay().then(() => ({ success: true }));
  },
  // Marketplace detail / moderation
  getListing: (slug) => {
    if (!USE_MOCK) return apiClient.get(`/marketplace/listings/${slug}`);
    const l = MOCK_MARKETPLACE.find((x) => x.slug === slug);
    return delay().then(() => l || Promise.reject(new Error("Listing not found")));
  },
  updateListing: (slug, payload) => {
    if (!USE_MOCK) return apiClient.put(`/marketplace/listings/${slug}`, payload);
    const l = MOCK_MARKETPLACE.find((x) => x.slug === slug);
    if (l) Object.assign(l, payload);
    return delay().then(() => ({ success: true, data: l }));
  },
  deleteListing: (slug) => {
    if (!USE_MOCK) return apiClient.delete(`/marketplace/listings/${slug}`);
    const idx = MOCK_MARKETPLACE.findIndex((x) => x.slug === slug);
    if (idx !== -1) MOCK_MARKETPLACE.splice(idx, 1);
    return delay().then(() => ({ success: true }));
  },
  recordDownload: (slug) => {
    if (!USE_MOCK) return apiClient.post(`/marketplace/listings/${slug}/download`);
    return delay().then(() => ({ success: true }));
  },
  getMarketplaceStats: () => {
    if (!USE_MOCK) return apiClient.get(`/marketplace/stats`);
    return delay().then(() => ({ total: MOCK_MARKETPLACE.length, published: MOCK_MARKETPLACE.filter((x) => x.status === "published").length }));
  },
  // Health / Infra
  getHealth: () => {
    if (!USE_MOCK) return apiClient.get(`/health`);
    return delay().then(() => ({ status: "ok", uptime: 99.97, timestamp: new Date().toISOString() }));
  },
  getInfraHealth: (params) => mockCall(() => apiClient.get(`/infra/health${queryString(params)}`), { status: "healthy", checks: [] }, params),
  getHealthHistory: (params) => mockCall(() => apiClient.get(`/infra/health/history${queryString(params)}`), [], params),
  // Analytics reports (revenue/users/bookings/saved)
  getRevenueReport: (params) => mockCall(() => apiClient.get(`/analytics/reports/revenue${queryString(params)}`), { data: [2.1,2.3,2.8] }, params),
  getUserAnalytics: (params) => mockCall(() => apiClient.get(`/analytics/reports/users${queryString(params)}`), { data: [10,14,18] }, params),
  getBookingAnalytics: (params) => mockCall(() => apiClient.get(`/analytics/reports/bookings${queryString(params)}`), { data: [] }, params),
  getSavedReports: (params) => mockCall(() => apiClient.get(`/analytics/reports/saved${queryString(params)}`), [], params),
  createReport: (payload) => {
    if (!USE_MOCK) return apiClient.post(`/analytics/reports`, payload);
    return delay().then(() => ({ id: `rep_${Date.now()}`, ...payload }));
  },
  getReport: (id, params) => {
    if (!USE_MOCK) return apiClient.get(`/analytics/reports/${id}${queryString(params)}`);
    return delay().then(() => ({ id }));
  },
  updateReport: (id, payload) => {
    if (!USE_MOCK) return apiClient.post(`/analytics/reports/${id}`, payload);
    return delay().then(() => ({ id, ...payload }));
  },
  deleteReport: (id, params) => {
    if (!USE_MOCK) return apiClient.delete(`/analytics/reports/${id}${queryString(params)}`);
    return delay().then(() => ({ success: true }));
  },
};

export default businessDashboardApi;