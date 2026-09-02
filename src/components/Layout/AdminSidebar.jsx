import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { canAccessPage } from "../../services/permissions";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { id: "dashboard", icon: "📊", label: "Overview" },
  { id: "merchants", icon: "🏪", label: "Merchants" },
  { id: "marketplace", icon: "🧩", label: "Marketplace" },
  { id: "audit", icon: "📋", label: "Audit Log" },
  { id: "subscriptions", icon: "💳", label: "Subscriptions" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

function AdminSidebar({ page, setPage, admin, showToast, sidebarOpen, closeSidebar }) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    showToast?.("Logged out successfully", "info");
  };

  return (
    <nav className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`} style={{ width: collapsed ? 68 : 260 }} aria-label="Admin navigation">
      <div className={styles.logoArea}>
        <div className={styles.appBadge}>D</div>
        {!collapsed && <div><div className={styles.appTitle}>DukaDesk</div><div className={styles.portalLabel}>ADMIN PORTAL</div></div>}
        <button className={styles.closeBtn} onClick={closeSidebar} aria-label="Close navigation">x</button>
      </div>
      <ul className={styles.navList}>
        {(() => {
          const visible = navItems.filter((item) => canAccessPage(admin, item.id));
          if (visible.length === 0) return <li style={{ padding: 16, fontSize: 12, color: "var(--gray-500)" }}>No navigation — check role</li>;
          return visible.map((item) => {
            const active = page === item.id;
            return <li key={item.id}><button className={styles.navItem} title={collapsed ? item.label : undefined} style={{ background: active ? "#252547" : "none", borderLeft: active ? "3px solid var(--amber)" : "3px solid transparent", paddingLeft: active ? 13 : 16, color: active ? "#fff" : "var(--gray-400)", justifyContent: collapsed ? "center" : "flex-start" }} onClick={() => setPage(item.id)}><span className={styles.navIcon}>{item.icon}</span>{!collapsed && <span className={styles.navLabel}>{item.label}</span>}</button></li>;
          });
        })()}
      </ul>
      <div className={styles.profile} style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
        <div className={styles.profileAvatar}>{admin?.name ? admin.name.split(" ").map((name) => name[0]).join("") : "SA"}</div>
        {!collapsed && <div className={styles.profileInfo}><span className={styles.profileName}>{admin?.name || "Administrator"}</span><span className={styles.profileRole}>{admin?.role || "admin"}</span></div>}
        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>{collapsed ? ">" : "<"}</button>
        {collapsed ? (
          <button className={styles.logoutIconBtn} onClick={handleLogout} title="Log out" aria-label="Log out">⏻</button>
        ) : (
          <button className={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        )}
      </div>
    </nav>
  );
}

export default AdminSidebar;
