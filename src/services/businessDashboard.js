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

function normalizeUser(user) {
  if (!user || typeof user !== "object") return user;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—";
  const role = user.roles?.find((assignment) => assignment.tenantId == null)?.role?.name
    || user.roles?.[0]?.role?.name
    || user.role;
  return { ...user, name, role };
}

function normalizeUsersResponse(response) {
  if (Array.isArray(response)) return response.map(normalizeUser);
  if (!response || typeof response !== "object") return response;
  if (Array.isArray(response.users)) {
    return { ...response, users: response.users.map(normalizeUser) };
  }
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeUser) };
  }
  if (response.data && typeof response.data === "object" && Array.isArray(response.data.users)) {
    return { ...response, data: { ...response.data, users: response.data.users.map(normalizeUser) } };
  }
  return response;
}

function normalizeUserResponse(response) {
  if (!response || typeof response !== "object") return response;
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return { ...response, data: normalizeUser(response.data) };
  }
  return normalizeUser(response);
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
  // Two-stage approval: stage-1 verification + stage-2 app review
  verifyMerchant: (merchantId) => apiClient.post(`${ADMIN}/merchants/${merchantId}/verify`),
  rejectCredentials: (merchantId, payload) => {
    const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : payload ? { reason: String(payload) } : {};
    return apiClient.post(`${ADMIN}/merchants/${merchantId}/verify-reject`, body);
  },
  getCompliance: (merchantId) => apiClient.get(`${ADMIN}/merchants/${merchantId}/compliance`),
  getMerchantReview: (merchantId) => apiClient.get(`${ADMIN}/merchants/${merchantId}/review`),
  getMerchantAppReview: (merchantId) => apiClient.get(`${ADMIN}/merchants/${merchantId}/apps/review`),
  getMerchantPreview: (merchantId) => apiClient.get(`${ADMIN}/merchants/${merchantId}/preview`),
  approveApp: (merchantId) => apiClient.post(`${ADMIN}/merchants/${merchantId}/apps/approve`),
  rejectApp: (merchantId, payload) => {
    const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : payload ? { reason: String(payload) } : {};
    return apiClient.post(`${ADMIN}/merchants/${merchantId}/apps/reject`, body);
  },
  rejectMerchant: (merchantId, payload) => {
    const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : payload ? { reason: String(payload) } : {};
    if (body.reason && !body.comment) body.comment = body.reason;
    if (body.comment && !body.reason) body.reason = body.comment;
    if (body.reason && !body.rejectionReason) body.rejectionReason = body.reason;
    return apiClient.post(`${ADMIN}/merchants/${merchantId}/reject`, body);
  },
  // Quotas — live swagger uses {merchantId}
  getQuota: (merchantId) => apiClient.get(`${ADMIN}/quotas/${merchantId}`),
  updateQuota: (merchantId, payload) => apiClient.put(`${ADMIN}/quotas/${merchantId}`, payload),
  // Settings
  getSettings: (category) => apiClient.get(`${ADMIN}/settings${queryString({ category })}`),
  getSetting: (key) => apiClient.get(`${ADMIN}/settings/${key}`),
  updateSetting: (key, value) => apiClient.put(`${ADMIN}/settings/${key}`, { value }),
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
  // Users — role=platform_admin restricts the directory to global platform roles.
  // live swagger uses UserStatus enum PENDING/ACTIVE (accepts both pending/PENDING after backend fix)
  // No mock fallback — errors propagate to EnhancedRemoteTablePage error banner
  getUsers: async (params) => {
    const liveParams = params?.status ? { ...params, status: String(params.status).toUpperCase() } : params;
    return normalizeUsersResponse(await apiClient.get(`${ADMIN}/users${queryString(liveParams)}`, { retry: 0 }));
  },
  getUser: async (id) => normalizeUserResponse(await apiClient.get(`${ADMIN}/users/${id}`)),
  getMerchantUsers: async (merchantId, params) => {
    const liveParams = params?.status ? { ...params, status: String(params.status).toUpperCase() } : params;
    return normalizeUsersResponse(await apiClient.get(`${ADMIN}/users/merchant/${merchantId}${queryString(liveParams)}`, { retry: 0 }));
  },
  // deprecated alias (was tenant)
  getTenantUsers: async (merchantId, params) => {
    const liveParams = params?.status ? { ...params, status: String(params.status).toUpperCase() } : params;
    return normalizeUsersResponse(await apiClient.get(`${ADMIN}/users/merchant/${merchantId}${queryString(liveParams)}`, { retry: 0 }));
  },
  // Admin invites — invite-only signup (single-use token bound to email + role)
  createInvite: (payload) => apiClient.post(`${ADMIN}/invites`, payload),
  listInvites: (params) => apiClient.get(`${ADMIN}/invites${queryString(params || {})}`),
  revokeInvite: (id) => apiClient.delete(`${ADMIN}/invites/${id}`),
  validateInvite: (token) => apiClient.get(`/auth/invites/validate${queryString({ token })}`, { retry: 0 }),
  // Admin users — role assignment and approval
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
  getMaintenanceWindows: (params) => apiClient.get(`${ADMIN}/maintenance${queryString(params)}`),
  getPolicies: (params) => apiClient.get(`${ADMIN}/policies${queryString(params)}`),
  // Governed policy lifecycle — draft → in_review → published → archived
  createPolicy: (payload) => apiClient.post(`${ADMIN}/policies`, payload),
  updatePolicy: (id, payload) => apiClient.put(`${ADMIN}/policies/${id}`, payload),
  submitPolicy: (id) => apiClient.post(`${ADMIN}/policies/${id}/submit`),
  publishPolicy: (id) => apiClient.post(`${ADMIN}/policies/${id}/publish`),
  archivePolicy: (id) => apiClient.post(`${ADMIN}/policies/${id}/archive`),
  // Support tickets — canonical case/task workflow (assignment + escalation, audited)
  getSupportTickets: (params) => apiClient.get(`${ADMIN}/support-tickets${queryString({ page: 1, limit: 20, ...params })}`),
  getSupportTicket: (id) => apiClient.get(`${ADMIN}/support-tickets/${id}`),
  createSupportTicket: (payload) => apiClient.post(`${ADMIN}/support-tickets`, payload),
  assignSupportTicket: (id, assigneeId) => apiClient.post(`${ADMIN}/support-tickets/${id}/assign`, { assigneeId }),
  escalateSupportTicket: (id, note) => apiClient.post(`${ADMIN}/support-tickets/${id}/escalate`, { note }),
  resolveSupportTicket: (id, resolution) => apiClient.post(`${ADMIN}/support-tickets/${id}/resolve`, { resolution }),
  commentSupportTicket: (id, message) => apiClient.post(`${ADMIN}/support-tickets/${id}/comments`, { message }),
  // Operational reports/exports — server-enforced scope, audited
  exportReport: async (report, params) => {
    const res = await apiClient.get(`${ADMIN}/reports/${report}/export${queryString(params)}`);
    return res?.data ?? res;
  },
  getAlerts: (params) => apiClient.get(`${ADMIN}/alerts${queryString(params)}`),
  // Analytics reports — live requires tenantId
  getRevenueReport: (params) => apiClient.get(`/analytics/reports/revenue${queryString(params)}`),
  getUserAnalytics: (params) => apiClient.get(`/analytics/reports/users${queryString(params)}`),
  getSavedReports: (params) => apiClient.get(`/analytics/reports/saved${queryString(params)}`),
  createReport: (payload) => apiClient.post(`/app/analytics/reports`, payload),
  getReport: (id, params) => apiClient.get(`/analytics/reports/${id}${queryString(params)}`),
  updateReport: (id, payload) => apiClient.post(`/app/analytics/reports/${id}`, payload),
  deleteReport: (id, params) => apiClient.delete(`/app/analytics/reports/${id}${queryString(params)}`),
  // Marketing — integrations are a provider catalogue; campaigns remain tenant-scoped.
  sendCampaign: (payload) => apiClient.post(`/app/notifications/campaigns`, payload),
  getIntegrations: () => apiClient.get(`/app/integrations/available`),
  // Infra overview — live via /infra/overview
  getInfraOverview: () => apiClient.get(`/infra/overview`),
  getEnvironments: (params) => apiClient.get(`/infra/environments${queryString(params)}`),
};

export default businessDashboardApi;
