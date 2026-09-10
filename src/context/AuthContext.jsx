import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { recordAuditEvent } from "../services/audit";
import { unwrapAuth } from "../utils/unwrapAuth";

const AuthContext = createContext(null);

const STORAGE_KEY = "dukadesk_admin";

function healStoredAdmin(obj) {
  if (!obj || typeof obj !== "object") return obj;
  let role = obj.role || (Array.isArray(obj.roles) && obj.roles[0]) || obj.username || null;
  // handle case where username like getdukadesk was mistakenly stored as role, or role missing
  if (role === "getdukadesk" || role === "getdukadesk_admin") role = "admin";
  if (!role) {
    // legacy session without role — default to admin if any identifier exists (email, name, username, token) to prevent empty nav
    if (obj.email || obj.name || obj.username || obj.token) role = obj.email && obj.email.includes("superadmin") ? "super_admin" : "admin";
  }
  if (role) {
    role = String(role).toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_").replace(/^superadmin$/, "super_admin").replace(/^administrator$/, "admin").replace(/^investors$/, "investor").replace(/^getdukadesk.*$/, "admin");
    obj = { ...obj, role };
    // clean roles array if present
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
    // normalize role from various shapes: role, roles[0], username, ADMIN, etc.
    if (!nextAdmin.role && Array.isArray(nextAdmin.roles) && nextAdmin.roles[0]) nextAdmin.role = nextAdmin.roles[0];
    if (!nextAdmin.role && nextAdmin.username) {
      const u = String(nextAdmin.username).toLowerCase();
      if (u.includes("superadmin")) nextAdmin.role = "super_admin";
      else if (u === "getdukadesk" || u === "admin") nextAdmin.role = "admin";
    }
    if (!nextAdmin.role && nextAdmin.email?.includes("superadmin")) nextAdmin.role = "super_admin";
    // fallback for legacy sessions where role was never persisted (e.g. getdukadesk/admin) — keep customer care functional
    if (!nextAdmin.role) nextAdmin.role = "admin";
    // normalize casing immediately so permissions match (admin vs ADMIN)
    if (nextAdmin.role) nextAdmin.role = String(nextAdmin.role).toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_").replace(/^superadmin$/, "super_admin").replace(/^getdukadesk.*$/, "admin");
    if (nextAdmin.role === "administrator") nextAdmin.role = "admin";
    if (nextAdmin.role === "investors") nextAdmin.role = "investor";
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
