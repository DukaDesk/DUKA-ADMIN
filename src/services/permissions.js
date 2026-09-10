const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  admin: ["dashboard:read", "merchants:read", "merchants:manage", "marketplace:read", "audit:read", "subscriptions:read", "users:read", "users:manage"],
  finance: ["dashboard:read", "merchants:read", "subscriptions:read", "subscriptions:manage", "audit:read", "users:read", "merchants:email:read", "users:email:read"],
  investor: ["dashboard:read", "merchants:read", "marketplace:read", "audit:read", "subscriptions:read", "users:read"],
  marketing: ["dashboard:read", "marketplace:read", "marketplace:manage"],
  hr: ["dashboard:read", "users:read", "users:manage", "audit:read"],
  moderator: ["dashboard:read", "marketplace:read", "audit:read"],
  support: ["dashboard:read", "merchants:read"],
  analyst: ["dashboard:read", "audit:read", "subscriptions:read"],
};

export const PAGE_PERMISSIONS = {
  dashboard: "dashboard:read",
  merchants: "merchants:read",
  marketplace: "marketplace:read",
  audit: "audit:read",
  subscriptions: "subscriptions:read",
  settings: "settings:manage",
  "pending-admins": "users:manage",
  users: "users:read",
};

function normalizeRole(role) {
  const raw = String(role || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
  if (raw === "superadmin") return "super_admin";
  if (raw === "administrator") return "admin";
  if (raw === "investors") return "investor";
  if (Array.isArray(role) && role[0]) return normalizeRole(role[0]);
  return raw;
}

export function isInvestor(admin) {
  return normalizeRole(admin?.role) === "investor";
}
export function canViewEmail(admin) {
  if (isInvestor(admin)) return false;
  return canPerform(admin, "users:email:read") || canPerform(admin, "merchants:email:read") || normalizeRole(admin?.role) === "super_admin" || normalizeRole(admin?.role) === "finance";
}

export function canPerform(admin, permission) {
  const normalized = normalizeRole(admin?.role || admin?.roles?.[0]);
  // fallback: any authenticated user can at least read dashboard — prevents "No navigation" for legacy/missing role
  if (!ROLE_PERMISSIONS[normalized] && permission === "dashboard:read" && admin?.email) return true;
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canAccessPage(admin, page) {
  // dashboard is the safe fallback for any logged-in admin (prevents empty sidebar)
  if (page === "dashboard" && admin?.email) {
    const normalized = normalizeRole(admin?.role || admin?.roles?.[0]);
    if (!ROLE_PERMISSIONS[normalized]) return true;
  }
  return Boolean(PAGE_PERMISSIONS[page] && canPerform(admin, PAGE_PERMISSIONS[page]));
}

export function getDefaultPage(admin) {
  return Object.keys(PAGE_PERMISSIONS).find((page) => canAccessPage(admin, page)) || null;
}
