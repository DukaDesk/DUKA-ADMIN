import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { recordAuditEvent } from "../services/audit";
import { unwrapAuth } from "../utils/unwrapAuth";

const AuthContext = createContext(null);

const STORAGE_KEY = "dukadesk_admin";

/**
 * KB Strict healing: maps any legacy or display role to KB canonical platform roles
 * KB: SEC-0002 (Super Admin, Platform Operator, Support Agent)
 * UI-0003: role-aware navigation requires correct role
 */
function toKbCanonical(roleRaw) {
  const r = String(roleRaw || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
  if (r === "super_admin" || r === "superadmin" || r === "super-admin") return "super_admin";
  if (r === "platform_operator" || r === "platformoperator" || r === "platform-operator" || r === "operator") return "platform_operator";
  if (r === "support_agent" || r === "supportagent" || r === "support-agent") return "support_agent";
  // legacy → KB
  if (r === "admin" || r === "administrator" || r === "getdukadesk" || r === "getdukadesk_admin") return "platform_operator";
  if (r === "finance" || r === "admin") return "platform_operator";
  if (r === "investor" || r === "investors") return "support_agent";
  if (r === "marketing" || r === "hr" || r === "moderator" || r === "analyst" || r === "support") return "support_agent";
  return r;
}

function healStoredAdmin(obj) {
  if (!obj || typeof obj !== "object") return obj;
  let role = obj.role || (Array.isArray(obj.roles) && obj.roles[0]) || obj.username || null;
  if (role === "getdukadesk" || role === "getdukadesk_admin") role = "platform_operator";
  if (!role) {
    if (obj.email || obj.name || obj.username || obj.token) role = obj.email && obj.email.includes("superadmin") ? "super_admin" : "platform_operator";
  }
  if (role) {
    role = toKbCanonical(role);
    obj = { ...obj, role };
    if (Array.isArray(obj.roles)) delete obj.roles;
    if (obj.username && obj.username === obj.role) delete obj.username;
  }
  return obj;
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      return healStoredAdmin(parsed);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (admin) {
      const healed = healStoredAdmin(admin);
      // persist healed version if role was missing
      if (healed.role !== admin.role) setAdmin(healed);
      else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
        if (admin.token) localStorage.setItem("admin_token", admin.token);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [admin]);

  useEffect(() => {
    // heal split-brain: if dukadesk_admin has token but admin_token missing (e.g. after refresh)
    // also heal missing role on mount
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored) {
        const healed = healStoredAdmin(stored);
        if (healed.role !== stored.role) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(healed));
          if (healed.role) setAdmin(healed);
        }
        if (healed?.token && !localStorage.getItem("admin_token")) {
          localStorage.setItem("admin_token", healed.token);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

const login = useCallback((data) => {
    const { token, admin } = unwrapAuth(data);
    const resolvedToken = token || data?.token || data?.accessToken || data?.access_token || null;
    if (resolvedToken) localStorage.setItem("admin_token", resolvedToken);
    const base = admin && typeof admin === "object" ? admin : {};
    const nextAdmin = { ...base, token: resolvedToken || base.token || null };
    if (!nextAdmin.role && Array.isArray(nextAdmin.roles) && nextAdmin.roles[0]) nextAdmin.role = nextAdmin.roles[0];
    if (!nextAdmin.role && nextAdmin.username) {
      const u = String(nextAdmin.username).toLowerCase();
      if (u.includes("superadmin")) nextAdmin.role = "super_admin";
      else if (u === "getdukadesk" || u === "admin") nextAdmin.role = "platform_operator";
    }
    if (!nextAdmin.role && nextAdmin.email?.includes("superadmin")) nextAdmin.role = "super_admin";
    if (!nextAdmin.role) nextAdmin.role = "platform_operator";
    if (nextAdmin.role) nextAdmin.role = toKbCanonical(nextAdmin.role);
    if (Array.isArray(nextAdmin.roles)) delete nextAdmin.roles;
    // ensure at least fallback name/email from data if admin was empty wrapper
    if (!nextAdmin.email && data?.email) nextAdmin.email = data.email;
    if (!nextAdmin.name && (nextAdmin.email || data?.email)) nextAdmin.name = (nextAdmin.email || data.email).split("@")[0];
    else if (!nextAdmin.name && nextAdmin.username) nextAdmin.name = nextAdmin.username;
    setAdmin(nextAdmin);
    recordAuditEvent({
      admin: nextAdmin,
      action: "admin.session.started",
      target: "admin-portal",
    });
  }, []);

  const logout = useCallback(() => {
    recordAuditEvent({
      admin,
      action: "admin.session.ended",
      target: "admin-portal",
    });
    localStorage.removeItem("admin_token");
    setAdmin(null);
  }, [admin]);

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
