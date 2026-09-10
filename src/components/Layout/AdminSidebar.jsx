import { useState, useEffect } from "react";
import { LayoutDashboard, Store, Puzzle, ClipboardList, CreditCard, Settings, ChevronLeft, ChevronRight, X, LogOut, UserCheck, Menu } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import { useAuth } from "../../context/AuthContext";
import { canAccessPage } from "../../services/permissions";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
  { id: "merchants", icon: Store, label: "Merchants" },
  { id: "pending-admins", icon: UserCheck, label: "Pending Admins" },
  { id: "marketplace", icon: Puzzle, label: "Marketplace" },
  { id: "audit", icon: ClipboardList, label: "Audit Log" },
  { id: "subscriptions", icon: CreditCard, label: "Subscriptions" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function AdminSidebar({ page, setPage, admin, showToast, sidebarOpen, closeSidebar }) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingMerchants, setPendingMerchants] = useState(0);
  const [pendingAdmins, setPendingAdmins] = useState(0);
  // badges: pending merchants (filter) + pending admins (separate nav)
  // poll counts when admin changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchBadges = async () => {
    try {
      if (canAccessPage(admin, "merchants")) {
        const r = await businessDashboardApi.getMerchants({ status: "pending", page: 1, limit: 1 });
        setPendingMerchants(r.total ?? 0);
      }
    } catch { /* ignore */ }
    try {
      if (canAccessPage(admin, "pending-admins")) {
        const r = await businessDashboardApi.getUsers({ status: "pending", page: 1, limit: 1 });
        setPendingAdmins(r.total ?? 0);
      }
    } catch { /* ignore */ }
  };
  useEffect(() => { fetchBadges(); }, [admin]);

  const handleLogout = () => {
    logout();
    showToast?.("Logged out successfully", "info");
  };

  return (
    <nav className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`} style={{ width: collapsed ? 68 : 260 }} aria-label="Admin navigation">
      <div className={styles.logoArea}>
        <div className={styles.appBadge}>D</div>
        {!collapsed && <div style={{ flex: 1 }}><div className={styles.appTitle}>DukaDesk</div><div className={styles.portalLabel}>ADMIN PORTAL</div></div>}
        <button className={styles.menuToggle} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand menu" : "Collapse menu"}><Menu size={18} /></button>
        <button className={styles.closeBtn} onClick={closeSidebar} aria-label="Close navigation"><X size={16} /></button>
      </div>
      <ul className={styles.navList}>
        {(() => {
          let visible = navItems.filter((item) => canAccessPage(admin, item.id));
          // safety net: any authenticated admin should at least see dashboard (prevents "No navigation" for legacy role payloads like getdukadesk/admin)
          if (visible.length === 0 && admin?.email) {
            visible = navItems.filter((item) => item.id === "dashboard");
          }
          if (visible.length === 0) return (
            <li style={{ padding: 16, fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5 }}>
              No navigation — check role
              <br />
              <span style={{ fontSize: 11, opacity: 0.8 }}>role: {String(admin?.role || admin?.roles?.[0] || "—")}</span>
              <br />
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 8, fontSize: 11, color: "var(--amber)", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                Clear cache & reload
              </button>
            </li>
          );
          return visible.map((item) => {
            const active = page === item.id;
            const Icon = item.icon;
            const badge = item.id === "merchants" ? pendingMerchants : item.id === "pending-admins" ? pendingAdmins : 0;
            return <li key={item.id} style={{ position: "relative" }}><button className={styles.navItem} title={collapsed ? item.label : undefined} style={{ background: active ? "#252547" : "none", borderLeft: active ? "3px solid var(--amber)" : "3px solid transparent", paddingLeft: active ? 13 : 16, color: active ? "#fff" : "var(--gray-400)", justifyContent: collapsed ? "center" : "flex-start" }} onClick={() => setPage(item.id)}><span className={styles.navIcon}><Icon size={18} /></span>{!collapsed && <span className={styles.navLabel}>{item.label}</span>}{!collapsed && badge > 0 && <span className={styles.badge} style={{ background: "var(--amber)", marginLeft: "auto" }}>{badge > 99 ? "99+" : badge}</span>}</button>{collapsed && badge > 0 && <span style={{ position: "absolute", right: 10, top: 8, width: 8, height: 8, background: "var(--amber)", borderRadius: "50%", border: "2px solid var(--navy)" }} />}</li>;
          });
        })()}
      </ul>
      <div className={styles.profile} style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
        <div className={styles.profileAvatar}>{admin?.name ? admin.name.split(" ").map((name) => name[0]).join("") : "SA"}</div>
        {!collapsed && <div className={styles.profileInfo}><span className={styles.profileName}>{admin?.name || "Administrator"}</span><span className={styles.profileRole}>{admin?.role || "admin"}</span></div>}
        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        {collapsed ? (
          <button className={styles.logoutIconBtn} onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={16} /></button>
        ) : (
          <button className={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        )}
      </div>
    </nav>
  );
}

export default AdminSidebar;
