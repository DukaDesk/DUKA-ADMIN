import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { recordAuditEvent } from "../services/audit";
import { unwrapAuth } from "../utils/unwrapAuth";

const AuthContext = createContext(null);

const STORAGE_KEY = "dukadesk_admin";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [admin]);

const login = useCallback((data) => {
    const { token, admin } = unwrapAuth(data);
    const resolvedToken = token || data?.token || data?.accessToken || null;
    if (resolvedToken) localStorage.setItem("admin_token", resolvedToken);
    const base = admin && typeof admin === "object" ? admin : {};
    const nextAdmin = { ...base, token: resolvedToken || base.token || null };
    if (!nextAdmin.role && nextAdmin.email?.includes("superadmin")) nextAdmin.role = "super_admin";
    // ensure at least fallback name/email from data if admin was empty wrapper
    if (!nextAdmin.email && data?.email) nextAdmin.email = data.email;
    if (!nextAdmin.name && nextAdmin.email) nextAdmin.name = nextAdmin.email.split("@")[0];
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
