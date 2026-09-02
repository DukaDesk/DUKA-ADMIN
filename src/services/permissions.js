const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  admin: ["dashboard:read", "merchants:read", "merchants:manage", "marketplace:read", "audit:read", "subscriptions:read"],
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
};

function normalizeRole(role) {
  return String(role || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
}

export function canPerform(admin, permission) {
  const permissions = ROLE_PERMISSIONS[normalizeRole(admin?.role)] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canAccessPage(admin, page) {
  return Boolean(PAGE_PERMISSIONS[page] && canPerform(admin, PAGE_PERMISSIONS[page]));
}

export function getDefaultPage(admin) {
  return Object.keys(PAGE_PERMISSIONS).find((page) => canAccessPage(admin, page)) || null;
}
