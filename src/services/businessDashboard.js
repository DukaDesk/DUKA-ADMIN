/**
 * KB Strict: Business Dashboard service per UI-0003 (Foundation and Shell), SEC-0002 (RBAC), FEAT-0002 (Tenant Lifecycle), API-0002 (Tenant Management)
 * Administration domain per ARCHITECTURE/domains/administration.md owns: Platform Configuration, Audit Logs, Monitoring, Feature Flags, System Health
 * Merchant is a separate portal (Site Builder) — distinct from Tenant App (mobile). Correlation via BFF when merchant has tenantId/slug is good-practice.
 */
import { apiClient } from "./apiClient";

const BFF_ADMIN = "/bff/admin";
const ADMIN = "/admin";

function queryString(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
}

function normalizeMerchantStatus(status) {
  if (status === undefined || status === null || status === "") return undefined;
  const s = String(status).toLowerCase();
  if (s === "active") return "published";
  if (s === "pending") return "draft";
  if (s === "suspended") return "suspended";
  if (s === "published" || s === "draft") return s;
  return s;
}

export const businessDashboardApi = {
  // Overview / BFF — live only, errors propagate to UI error states
  getOverview: () => apiClient.get(`${BFF_ADMIN}/overview`),
  getBffAnalytics: (params) => apiClient.get(`${BFF_ADMIN}/analytics${queryString(params)}`),
  getBffRevenue: (params) => apiClient.get(`${BFF_ADMIN}/revenue${queryString(params)}`),
  getMerchantAnalytics: (merchantId, params) => apiClient.get(`${BFF_ADMIN}/merchants/${merchantId}/analytics${queryString(params)}`),
  // Tenant App (mobile) — distinct from merchant (site-builder portal).
  // KB §29 BFF Tenant Dashboard still uses /bff/tenant/:id/* paths (live swagger).
  getTenantSummary: (tenantId) => apiClient.get(`/bff/tenant/${tenantId}/summary`),
  getTenantAnalytics: (tenantId, params) => apiClient.get(`/bff/tenant/${tenantId}/analytics${queryString(params)}`),
  getTenantIntegrations: (tenantId) => apiClient.get(`/bff/tenant/${tenantId}/integrations`),
  getMobileManifest: (slug) => apiClient.get(`/bff/mobile/tenant/${slug}/manifest`),
  getPublishedDefinition: (merchantId, params) => apiClient.get(`/merchants/${merchantId}/definition${queryString(params)}`),
  getMerchants: (params) => {
    const normalized = params?.status ? { ...params, status: normalizeMerchantStatus(params.status) } : params;
    return apiClient.get(`${BFF_ADMIN}/merchants${queryString(normalized)}`);
  },
  // KB API-0002 strict tenant lifecycle — live backend mirrors merchants as tenants
  getTenants: (params) => {
    const normalized = params?.status ? { ...params, status: normalizeMerchantStatus(params.status) } : params;
    return apiClient.get(`${ADMIN}/merchants${queryString(normalized)}`);
  },
  createTenant: (payload) => apiClient.post(`${ADMIN}/merchants`, payload),
  getTenant: (id) => apiClient.get(`${ADMIN}/merchants/${id}`),
  updateTenantById: (id, patch) => apiClient.put(`${ADMIN}/merchants/${id}`, patch),
  suspendTenant: (id) => apiClient.post(`${ADMIN}/merchants/${id}/suspend`),
  getMyTenants: (params) => {
    const normalized = params?.status ? { ...params, status: normalizeMerchantStatus(params.status) } : params;
    return apiClient.get(`/tenants${queryString(normalized)}`).catch(() => apiClient.get(`${BFF_ADMIN}/merchants${queryString(normalized)}`));
  },
  getAuditLog: (params) => apiClient.get(`${BFF_ADMIN}/audit${queryString(params)}`),
  getPlatformStats: () => apiClient.get(`${ADMIN}/stats`),
  getPlatformMerchants: (params) => {
    const normalized = params?.status ? { ...params, status: normalizeMerchantStatus(params.status) } : params;
    return apiClient.get(`${ADMIN}/merchants${queryString(normalized)}`);
  },
  getMerchantDetail: (id) => apiClient.get(`${ADMIN}/merchants/${id}`),
  // Merchant is a separate portal (Site Builder) — this enriches it with correlated Tenant App (mobile) data when available.
  // Good-practice correlation: fetch tenant summary/analytics/manifest via BFF when merchant has tenantId/slug.
  getMerchantEnriched: async (id) => {
    const merchantRes = await apiClient.get(`${ADMIN}/merchants/${id}`);
    const merchant = merchantRes?.data || merchantRes?.merchant || merchantRes?.tenant || merchantRes;
    const tenantId = merchant?.tenantId || merchant?.tenant_id || merchant?.tenant?.id || null;
    const slug = merchant?.slug || merchant?.tenantSlug || null;
    let tenantSummary = null;
    let tenantAnalytics = null;
    let mobileManifest = null;
    let publishedDefinition = null;
    let quota = null;
    const tasks = [];
    if (tenantId) {
      tasks.push(
        apiClient.get(`/bff/tenant/${tenantId}/summary`).then((r) => { tenantSummary = r?.data || r; }).catch(() => {}),
        apiClient.get(`/bff/tenant/${tenantId}/analytics`).then((r) => { tenantAnalytics = r?.data || r; }).catch(() => {}),
        apiClient.get(`/bff/tenant/${tenantId}/integrations`).then((r) => { tenantAnalytics = tenantAnalytics || {}; tenantAnalytics.integrations = r?.data || r; }).catch(() => {})
      );
    }
    if (slug) {
      tasks.push(apiClient.get(`/bff/mobile/tenant/${slug}/manifest`).then((r) => { mobileManifest = r?.data || r; }).catch(() => {}));
    }
    tasks.push(
      apiClient.get(`/merchants/${id}/definition`).then((r) => { publishedDefinition = r?.data || r; }).catch(() => {}),
      apiClient.get(`${ADMIN}/quotas/${id}`).then((r) => { quota = r?.quota || r?.data || r; }).catch(() => {})
    );
    await Promise.allSettled(tasks);
    return { merchant, tenantSummary, tenantAnalytics, mobileManifest, publishedDefinition, quota };
  },
  // deprecated aliases
  getTenantDetail: (id) => apiClient.get(`${ADMIN}/merchants/${id}`),
  updateMerchant: (id, patch) => apiClient.put(`${ADMIN}/merchants/${id}`, patch),
  updateTenant: (id, patch) => apiClient.put(`${ADMIN}/merchants/${id}`, patch),
  deleteMerchant: (id) => apiClient.delete(`${ADMIN}/merchants/${id}`),
  deleteTenant: (id) => apiClient.delete(`${ADMIN}/merchants/${id}`),
  cleanupDeactivated: () => apiClient.post(`${ADMIN}/cleanup-deactivated`),
  getMerchantSettings: (merchantId, params) => apiClient.get(`${ADMIN}/merchants/${merchantId}/settings${queryString(params)}`),
  getTenantSettings: (merchantId, params) => apiClient.get(`${ADMIN}/merchants/${merchantId}/settings${queryString(params)}`),
  updateMerchantSetting: (merchantId, key, value) => apiClient.put(`${ADMIN}/merchants/${merchantId}/settings/${key}`, value),
  updateTenantSetting: (merchantId, key, value) => apiClient.put(`${ADMIN}/merchants/${merchantId}/settings/${key}`, value),
  approveMerchant: (merchantId) => apiClient.post(`${ADMIN}/merchants/${merchantId}/approve`),
  suspendMerchant: (merchantId) => apiClient.post(`${ADMIN}/merchants/${merchantId}/suspend`),
  // Quotas — live swagger uses {merchantId}
  getQuota: (merchantId) => apiClient.get(`${ADMIN}/quotas/${merchantId}`),
  updateQuota: (merchantId, payload) => apiClient.put(`${ADMIN}/quotas/${merchantId}`, payload),
  // Settings
  getSettings: (category) => apiClient.get(`${ADMIN}/settings${queryString({ category })}`),
  getSetting: (key) => apiClient.get(`${ADMIN}/settings/${key}`),
  updateSetting: (key, value) => apiClient.put(`${ADMIN}/settings/${key}`, value),
  deleteSetting: (key) => apiClient.delete(`${ADMIN}/settings/${key}`),
  // Marketplace
  getMarketplaceListings: (params) => apiClient.get(`/marketplace/listings/all${queryString({ page: 1, limit: 10, ...params })}`),
  getSubscriptions: (params) => apiClient.get(`${ADMIN}/subscriptions${queryString({ page: 1, limit: 10, ...params })}`),
  getPlans: () => apiClient.get(`${ADMIN}/plans`),
  getPlan: (id) => apiClient.get(`${ADMIN}/plans/${id}`),
  createPlan: (payload) => apiClient.post(`${ADMIN}/plans`, payload),
  updatePlan: (id, payload) => apiClient.put(`${ADMIN}/plans/${id}`, payload),
  deletePlan: (id) => apiClient.delete(`${ADMIN}/plans/${id}`),
  updateSubscription: (id, payload) => apiClient.put(`${ADMIN}/subscriptions/${id}`, payload),
  // Feature flags
  getFeatureFlags: () => apiClient.get(`${ADMIN}/feature-flags`),
  getFeatureFlag: (key) => apiClient.get(`${ADMIN}/feature-flags/${key}`),
  createFeatureFlag: (payload) => apiClient.post(`${ADMIN}/feature-flags`, payload),
  updateFeatureFlag: (key, payload) => apiClient.put(`${ADMIN}/feature-flags/${key}`, payload),
  deleteFeatureFlag: (key) => apiClient.delete(`${ADMIN}/feature-flags/${key}`),
  // Announcements — live requires page+limit, active requires type
  getAnnouncements: (params) => apiClient.get(`${ADMIN}/announcements${queryString({ page: 1, limit: 20, ...params })}`),
  getActiveAnnouncements: (params) => apiClient.get(`${ADMIN}/announcements/active${queryString({ type: "info", ...params })}`),
  createAnnouncement: (payload) => apiClient.post(`${ADMIN}/announcements`, payload),
  updateAnnouncement: (id, payload) => apiClient.put(`${ADMIN}/announcements/${id}`, payload),
  deleteAnnouncement: (id) => apiClient.delete(`${ADMIN}/announcements/${id}`),
  // Users — live swagger uses UserStatus enum PENDING/ACTIVE (accepts both pending/PENDING after backend fix)
  // No mock fallback — errors propagate to EnhancedRemoteTablePage error banner
  getUsers: (params) => {
    const liveParams = params?.status ? { ...params, status: String(params.status).toUpperCase() } : params;
    return apiClient.get(`${ADMIN}/users${queryString(liveParams)}`, { retry: 0 });
  },
  getUser: (id) => apiClient.get(`${ADMIN}/users/${id}`),
  getMerchantUsers: (merchantId, params) => {
    const liveParams = params?.status ? { ...params, status: String(params.status).toUpperCase() } : params;
    return apiClient.get(`${ADMIN}/users/merchant/${merchantId}${queryString(liveParams)}`, { retry: 0 });
  },
  // deprecated alias (was tenant)
  getTenantUsers: (merchantId, params) => {
    const liveParams = params?.status ? { ...params, status: String(params.status).toUpperCase() } : params;
    return apiClient.get(`${ADMIN}/users/merchant/${merchantId}${queryString(liveParams)}`, { retry: 0 });
  },
  // Admin users — create for invite fallback when user not found
  createUser: (payload) => apiClient.post(`${ADMIN}/users`, payload),
  inviteUser: (id, payload) => apiClient.post(`${ADMIN}/users/${id}/invite`, payload),
  assignRoles: (id, payload) => apiClient.post(`${ADMIN}/users/${id}/roles`, payload),
  approveUser: (id) => apiClient.post(`${ADMIN}/users/${id}/approve`),
  rejectUser: (id, payload) => {
    // payload: { reason, comment, rejectionReason } — always send reason/comment so backend validation passes
    const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : payload ? { reason: String(payload) } : {};
    if (body.reason && !body.comment) body.comment = body.reason;
    if (body.comment && !body.reason) body.reason = body.comment;
    if (body.reason && !body.rejectionReason) body.rejectionReason = body.reason;
    return apiClient.post(`${ADMIN}/users/${id}/reject`, body);
  },
  removeUser: (id, merchantId) => apiClient.delete(`${ADMIN}/users/${id}${queryString({ tenantId: merchantId })}`),
  // Marketplace detail / moderation
  getListing: (slug) => apiClient.get(`/marketplace/listings/${slug}`),
  updateListing: (slug, payload) => apiClient.put(`/marketplace/listings/${slug}`, payload),
  deleteListing: (slug) => apiClient.delete(`/marketplace/listings/${slug}`),
  recordDownload: (slug) => apiClient.post(`/marketplace/listings/${slug}/download`),
  getMarketplaceStats: () => apiClient.get(`/marketplace/stats`),
  // Health / Infra — GET /health is public live, infra needs tenantId/service/limit
  getHealth: () => apiClient.get(`/health`),
  getInfraHealth: (params) => apiClient.get(`/infra/status${queryString(params)}`),
  getHealthHistory: (params) => apiClient.get(`/infra/health/history${queryString(params)}`),
  // Administration domain — KB: Platform Operations, Maintenance Windows, Policies (graceful 404 -> empty, not banner; 500 logged)
  getMaintenanceWindows: (params) => apiClient.get(`${ADMIN}/maintenance${queryString(params)}`).catch((e) => {
    if (e?.status === 404 || String(e?.message).includes("not available")) return { data: [] };
    console.warn("[businessDashboard] maintenance fallback", e?.requestId, e?.message);
    return apiClient.get(`/infra/maintenance${queryString(params)}`).catch((e2) => {
      if (e2?.status === 404 || String(e2?.message).includes("not available")) return { data: [] };
      console.warn("[businessDashboard] infra/maintenance fallback failed", e2?.requestId);
      return { data: [], meta: { emptyReason: "unavailable", requestId: e2?.requestId } };
    });
  }),
  createMaintenanceWindow: (payload) => apiClient.post(`${ADMIN}/maintenance`, payload),
  updateMaintenanceWindow: (id, payload) => apiClient.put(`${ADMIN}/maintenance/${id}`, payload),
  deleteMaintenanceWindow: (id) => apiClient.delete(`${ADMIN}/maintenance/${id}`),
  getPolicies: (params) => apiClient.get(`${ADMIN}/policies${queryString(params)}`).catch((e) => {
    if (e?.status === 404 || String(e?.message).includes("not available")) return { data: [] };
    return apiClient.get(`${ADMIN}/settings${queryString({ category: "policy", ...params })}`).catch((e2) => {
      if (e2?.status === 404) return { data: [] };
      console.warn("[businessDashboard] policies fallback failed", e2?.requestId);
      return { data: [], meta: { emptyReason: "unavailable", requestId: e2?.requestId } };
    });
  }),
  getAlerts: (params) => apiClient.get(`${ADMIN}/alerts${queryString(params)}`).catch((e) => {
    if (e?.status === 404) return { data: [] };
    return apiClient.get(`/infra/alerts${queryString(params)}`).catch((e2) => {
      if (e2?.status === 404) return { data: [] };
      console.warn("[businessDashboard] alerts fallback failed", e2?.requestId);
      return { data: [] };
    });
  }),
  // Commerce — Orders (BD-ORD): live via Tenant Self-Service App tier (auto-tenant) and merchant drill-down
  getOrders: (params) => apiClient.get(`/app/commerce/orders${queryString(params)}`).catch(() => apiClient.get(`/merchants/${params?.merchantId || 'all'}/orders${queryString(params)}`).catch(() => ({ data: [] }))),
  getOrder: (id) => apiClient.get(`/orders/${id}`).catch(() => apiClient.get(`/app/commerce/orders/${id}`)),
  updateOrderStatus: (id, payload) => apiClient.post(`/app/commerce/orders/${id}/status`, payload),
  // Commerce — Products (BD-PROD) + Inventory (BD-INV)
  getProducts: (params) => apiClient.get(`/app/commerce/products${queryString(params)}`),
  getProduct: (id) => apiClient.get(`/products/${id}`),
  updateProduct: (id, payload) => apiClient.put(`/app/commerce/products/${id}`, payload),
  deleteProduct: (id) => apiClient.delete(`/app/commerce/products/${id}`),
  adjustStock: (id, payload) => apiClient.post(`/app/commerce/products/${id}/adjust-stock`, payload),
  getCategories: (params) => apiClient.get(`/app/commerce/categories${queryString(params)}`).catch(() => apiClient.get(`/merchants/${params?.merchantId || 'all'}/categories${queryString(params)}`).catch(() => ({ data: [] }))),
  // Customers (BD-CUST) — tenant users with customer role
  getCustomers: (params) => apiClient.get(`${ADMIN}/users${queryString({ ...params, role: 'customer' })}`, { retry: 0 }).catch(() => apiClient.get(`${ADMIN}/users${queryString(params)}`, { retry: 0 })),
  // Analytics reports — live requires tenantId
  getRevenueReport: (params) => apiClient.get(`/analytics/reports/revenue${queryString(params)}`),
  getUserAnalytics: (params) => apiClient.get(`/analytics/reports/users${queryString(params)}`),
  getBookingAnalytics: (params) => apiClient.get(`/analytics/reports/bookings${queryString(params)}`),
  getSavedReports: (params) => apiClient.get(`/analytics/reports/saved${queryString(params)}`),
  createReport: (payload) => apiClient.post(`/app/analytics/reports`, payload),
  getReport: (id, params) => apiClient.get(`/analytics/reports/${id}${queryString(params)}`),
  updateReport: (id, payload) => apiClient.post(`/app/analytics/reports/${id}`, payload),
  deleteReport: (id, params) => apiClient.delete(`/app/analytics/reports/${id}${queryString(params)}`),
  // Marketing (BD-MKT) — campaigns + integrations live
  getCampaigns: (params) => apiClient.get(`/app/notifications/campaigns${queryString(params)}`).catch(() => apiClient.get(`/app/notifications/templates${queryString(params)}`).catch(() => ({ data: [] }))),
  sendCampaign: (payload) => apiClient.post(`/app/notifications/campaigns`, payload),
  getIntegrations: (params) => apiClient.get(`/app/integrations/available${queryString(params)}`).catch(() => apiClient.get(`/merchants/${params?.merchantId || 'all'}/integrations${queryString(params)}`).catch(() => ({ data: [] }))),
  // Infra overview — live via /infra/overview
  getInfraOverview: () => apiClient.get(`/infra/overview`).catch(() => ({ data: null })),
  getEnvironments: (params) => apiClient.get(`/infra/environments${queryString(params)}`).catch(() => ({ data: [] })),
};

export default businessDashboardApi;
