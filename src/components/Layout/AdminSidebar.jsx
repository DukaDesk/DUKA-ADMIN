import { useState } from "react";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { id: "dashboard", icon: "📊", label: "Overview" },
  { id: "users", icon: "👥", label: "Users" },
  { id: "merchants", icon: "🏪", label: "Merchants" },
  { id: "apps", icon: "📱", label: "Apps", badge: 8 },
  { id: "reports", icon: "🛡️", label: "Moderation", badge: 23, badgeColor: "#E74C3C" },
  { id: "revenue", icon: "💰", label: "Revenue" },
  { id: "waitlist", icon: "📋", label: "Waitlist" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

function AdminSidebar({ page, setPage, admin }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav className={styles.sidebar} style={{ width: collapsed ? 68 : 260 }}>
      <div className={styles.logoArea}>
        <div className={styles.appBadge}>D</div>
        {!collapsed && (
          <div>
            <div className={styles.appTitle}>DukaDesk</div>
            <div className={styles.portalLabel}>ADMIN PORTAL</div>
          </div>
        )}
      </div>

      <ul className={styles.navList}>
        {navItems.map((item) => {
          const active = page === item.id;
          return (
            <li key={item.id}>
              <button
                className={styles.navItem}
                style={{
                  background: active ? "#252547" : "none",
                  borderLeft: active ? "3px solid var(--amber)" : "3px solid transparent",
                  paddingLeft: active ? 13 : 16,
                  color: active ? "#fff" : "var(--gray-400)",
                }}
                onClick={() => setPage(item.id)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                {!collapsed && item.badge != null && (
                  <span
                    className={styles.badge}
                    style={{ background: item.badgeColor || "#F4A026" }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.profile}>
        <div className={styles.profileAvatar}>
          {admin?.name
            ? admin.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            : "SA"}
        </div>
        {!collapsed && (
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>
              {admin?.name || "Super Admin"}
            </span>
            <span className={styles.profileRole}>
              {admin?.role || "super_admin"}
            </span>
          </div>
        )}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>
    </nav>
  );
}

export default AdminSidebar;
