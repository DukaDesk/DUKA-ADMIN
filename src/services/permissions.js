/**
 * KB Strict: SEC-0002 Authorization and RBAC, ROLE_CATALOG.md, PERMISSION_CATALOG.md
 * Platform roles (Administration domain): Super Admin, Platform Operator, Support Agent
 * Tenant roles are separate (Organization Owner, Tenant Owner, etc.) — not used in this admin portal.
 * Administration domain owns: Platform Configuration, Audit Logs, Monitoring, Feature Flags, System Health (see ARCHITECTURE/domains/administration.md)
 * Business Dashboard shell per UI-0003: authenticated shell, role-aware sidebar, dashboard home, user management, settings
 *
 * Strict design: Business Dashboard is for Platform roles only. Legacy aliases (admin, finance, investor, marketing, hr, moderator, analyst)
 * are kept as fallback mappings to KB roles for existing sessions — new users must use KB roles.
 */
const ROLE_PERMISSIONS = {
  // KB Platform Roles — strict
  super_admin: ["*"],
  platform_operator: [
    "dashboard:read",
    "tenant:manage", "tenant:read", "tenant:update", "tenant:suspend", "tenant:configure",
    "merchants:read", "merchants:manage",
    "marketplace:manage", "marketplace:read",
    "system:monitor",
    "audit:read",
    "subscription:read", "subscription:manage", "subscriptions:read", "subscriptions:manage",
    "users:read", "users:manage", "user:read", "user:create", "user:update", "user:invite", "role:assign",
    "settings:manage",
    "users:email:read", "merchants:email:read",
  ],
  support_agent: [
    "dashboard:read",
    "tenant:read",
    "merchants:read",
    "marketplace:read",
    "audit:read",
    "users:read",
    "support:access",
  ],
  // Legacy aliases → KB strict (do not expand — map to nearest KB equivalent for backward compat)
  admin: [], // mapped dynamically to platform_operator
  operator: [], // alias
  support: [], // alias to support_agent
  finance: [], // legacy finance → platform_operator (subscription/manage)
  investor: [], // legacy investor → support_agent (read-only)
  marketing: [], // legacy marketing → support_agent + marketplace:manage limited
  hr: [], // legacy hr → support_agent + users:manage
  moderator: [], // legacy moderator → support_agent
  analyst: [], // legacy analyst → support_agent + audit
};

function legacyToKb(role) {
  const map = {
    admin: "platform_operator",
    operator: "platform_operator",
    administrator: "platform_operator",
    platform_operator: "platform_operator",
    finance: "platform_operator",
    support: "support_agent",
    support_agent: "support_agent",
    investor: "support_agent",
    investors: "support_agent",
    marketing: "support_agent",
    hr: "support_agent",
    moderator: "support_agent",
    analyst: "support_agent",
  };
  return map[role] || role;
}

export const PAGE_PERMISSIONS = {
  dashboard: "dashboard:read",
  merchants: "merchants:read", // tenant:read alias accepted via tenant:manage
  marketplace: "marketplace:read",
  audit: "audit:read",
  subscriptions: "subscriptions:read", // subscription:read alias
  settings: "settings:manage",
  "pending-admins": "users:manage", // user:invite / role:assign alias
  users: "users:read",
};

function normalizeRole(role) {
  if (Array.isArray(role) && role[0]) return normalizeRole(role[0]);
  let raw = String(role || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
  // KB display names → canonical
  if (raw === "super_admin" || raw === "superadmin" || raw === "super-admin") return "super_admin";
  if (raw === "platform_operator" || raw === "platformoperator" || raw === "platform-operator" || raw === "platform operator") return "platform_operator";
  if (raw === "support_agent" || raw === "supportagent" || raw === "support-agent" || raw === "support agent") return "support_agent";
  // Legacy aliases
  if (raw === "administrator") return "admin";
  if (raw === "investors") return "investor";
  if (raw === "getdukadesk" || raw === "getdukadesk_admin") return "admin";
  return raw;
}

export function isInvestor(admin) {
  // KB strict: no investor role — mapped to support_agent (read-only, email masked). Keep alias for legacy sessions.
  const r = normalizeRole(admin?.role);
  return r === "investor" || r === "investors";
}
export function isSupportAgent(admin) {
  const r = normalizeRole(admin?.role);
  return r === "support_agent" || legacyToKb(r) === "support_agent";
}
export function isPlatformOperator(admin) {
  const r = normalizeRole(admin?.role);
  return r === "platform_operator" || r === "admin" || r === "finance";
}
export function canViewEmail(admin) {
  // KB: Super Admin + Platform Operator can view email; Support Agent (incl. legacy investor) masked for privacy
  const raw = normalizeRole(admin?.role);
  const kb = legacyToKb(raw);
  if (raw === "investor" || kb === "support_agent" && raw !== "support_agent" && raw === "investor") return false;
  if (kb === "support_agent" && raw === "investor") return false;
  // Support Agent (strict) is support access but email masked by default — only platform_operator/super_admin see full email
  if (kb === "support_agent") return false;
  return canPerform(admin, "users:email:read") || canPerform(admin, "merchants:email:read") || raw === "super_admin" || kb === "platform_operator" || raw === "finance" || raw === "platform_operator";
}

function permissionsFor(role) {
  const r = normalizeRole(role);
  // direct KB role
  if (ROLE_PERMISSIONS[r] && ROLE_PERMISSIONS[r].length) return ROLE_PERMISSIONS[r];
  // legacy alias → KB strict
  const kb = legacyToKb(r);
  if (ROLE_PERMISSIONS[kb] && ROLE_PERMISSIONS[kb].length) return ROLE_PERMISSIONS[kb];
  // special legacy fine-grained mappings (preserve earlier behavior but via KB)
  if (r === "admin" || r === "operator" || r === "administrator") return ROLE_PERMISSIONS.platform_operator;
  if (r === "support") return ROLE_PERMISSIONS.support_agent;
  if (r === "finance") return ROLE_PERMISSIONS.platform_operator;
  if (r === "investor" || r === "investors") return ROLE_PERMISSIONS.support_agent;
  if (r === "marketing") return ["dashboard:read", "marketplace:read", "marketplace:manage"];
  if (r === "hr") return ["dashboard:read", "users:read", "users:manage", "audit:read"];
  if (r === "moderator") return ["dashboard:read", "marketplace:read", "audit:read"];
  if (r === "analyst") return ["dashboard:read", "audit:read", "subscriptions:read", "subscription:read"];
  return [];
}

function hasPermission(permissions, needed) {
  if (permissions.includes("*")) return true;
  if (permissions.includes(needed)) return true;
  // KB alias tolerance: tenant:read satisfies merchants:read, subscription:read satisfies subscriptions:read, etc.
  const alias = {
    "merchants:read": ["tenant:read", "tenant:manage"],
    "merchants:manage": ["tenant:manage"],
    "marketplace:read": ["marketplace:manage"],
    "subscriptions:read": ["subscription:read", "subscription:manage"],
    "subscriptions:manage": ["subscription:manage"],
    "users:read": ["user:read"],
    "users:manage": ["user:manage", "user:create", "role:assign", "user:invite"],
    "dashboard:read": ["system:monitor"],
  };
  const alt = alias[needed] || [];
  return alt.some((a) => permissions.includes(a));
}

export function canPerform(admin, permission) {
  const normalized = normalizeRole(admin?.role || admin?.roles?.[0] || admin?.username);
  const perms = permissionsFor(normalized);
  if (!perms.length && permission === "dashboard:read" && (admin?.email || admin?.token || admin?.name)) return true;
  return hasPermission(perms, permission);
}

export function canAccessPage(admin, page) {
  if (page === "dashboard" && (admin?.email || admin?.token || admin?.name)) {
    const normalized = normalizeRole(admin?.role || admin?.roles?.[0] || admin?.username);
    if (!permissionsFor(normalized).length) return true;
  }
  const needed = PAGE_PERMISSIONS[page];
  if (!needed) return false;
  return canPerform(admin, needed);
}

export function getDefaultPage(admin) {
  return Object.keys(PAGE_PERMISSIONS).find((page) => canAccessPage(admin, page)) || null;
}

export function getKbRoleLabel(role) {
  const r = normalizeRole(role);
  const kb = legacyToKb(r);
  if (kb === "super_admin" || r === "super_admin") return "Super Admin";
  if (kb === "platform_operator") return "Platform Operator";
  if (kb === "support_agent") return "Support Agent";
  return r;
}
