import { apiClient } from "./apiClient";

const BFF_ADMIN = "/bff/admin";
const ADMIN = "/admin";

function queryString(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
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
  getMerchants: (params) => apiClient.get(`${BFF_ADMIN}/merchants${queryString(params)}`),
  getAuditLog: (params) => apiClient.get(`${BFF_ADMIN}/audit${queryString(params)}`),
  getPlatformStats: () => apiClient.get(`${ADMIN}/stats`),
  getPlatformMerchants: (params) => apiClient.get(`${ADMIN}/merchants${queryString(params)}`),
  getMerchantDetail: (id) => apiClient.get(`${ADMIN}/merchants/${id}`),
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
  inviteUser: (id, payload) => apiClient.post(`${ADMIN}/users/${id}/invite`, payload),
  assignRoles: (id, payload) => apiClient.post(`${ADMIN}/users/${id}/roles`, payload),
  approveUser: (id) => apiClient.post(`${ADMIN}/users/${id}/approve`),
  rejectUser: (id) => apiClient.post(`${ADMIN}/users/${id}/reject`),
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
  // Analytics reports — live requires tenantId
  getRevenueReport: (params) => apiClient.get(`/analytics/reports/revenue${queryString(params)}`),
  getUserAnalytics: (params) => apiClient.get(`/analytics/reports/users${queryString(params)}`),
  getBookingAnalytics: (params) => apiClient.get(`/analytics/reports/bookings${queryString(params)}`),
  getSavedReports: (params) => apiClient.get(`/analytics/reports/saved${queryString(params)}`),
  createReport: (payload) => apiClient.post(`/app/analytics/reports`, payload),
  getReport: (id, params) => apiClient.get(`/analytics/reports/${id}${queryString(params)}`),
  updateReport: (id, payload) => apiClient.post(`/app/analytics/reports/${id}`, payload),
  deleteReport: (id, params) => apiClient.delete(`/app/analytics/reports/${id}${queryString(params)}`),
};

export default businessDashboardApi;
