import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { recordAuditEvent } from "../services/audit";

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
    const nextAdmin = data.admin || data;
    if (data.token) localStorage.setItem("admin_token", data.token);
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
