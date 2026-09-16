import { useState, useEffect } from "react";
import { LayoutDashboard, Store, Puzzle, ClipboardList, CreditCard, Settings, ChevronLeft, ChevronRight, X, LogOut, UserCheck, Menu, ShoppingCart, Package, Users, BarChart3, Megaphone, Server } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import { useAuth } from "../../context/AuthContext";
import { canAccessPage, getKbRoleLabel } from "../../services/permissions";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
  { id: "merchants", icon: Store, label: "Merchants" },
  { id: "pending-admins", icon: UserCheck, label: "Pending Admins" },
  { id: "orders", icon: ShoppingCart, label: "Orders" },
  { id: "products", icon: Package, label: "Products" },
  { id: "customers", icon: Users, label: "Customers" },
  { id: "marketplace", icon: Puzzle, label: "Marketplace" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "marketing", icon: Megaphone, label: "Marketing" },
  { id: "audit", icon: ClipboardList, label: "Audit Log" },
  { id: "subscriptions", icon: CreditCard, label: "Subscriptions" },
  { id: "infrastructure", icon: Server, label: "Infrastructure" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function AdminSidebar({ page, setPage, admin, showToast, sidebarOpen, closeSidebar }) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingMerchants, setPendingMerchants] = useState(0);
  const [pendingAdmins, setPendingAdmins] = useState(0);
  // badges: pending merchants (filter) + pending admins (separate nav)
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
    <nav className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${sidebarOpen ? styles.sidebarOpen : ""}`} style={{ width: collapsed ? 68 : 260 }} aria-label="Admin navigation">
      <div className={styles.logoArea}>
        <div className={styles.appBadge}>D</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.appTitle}>DukaDesk</div>
            <div className={styles.portalLabel}>ADMIN PORTAL</div>
          </div>
        )}
        <button className={styles.menuToggle} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand menu" : "Collapse menu"}>
          <Menu size={18} />
        </button>
        <button className={styles.closeBtn} onClick={closeSidebar} aria-label="Close navigation">
          <X size={16} />
        </button>
      </div>

      <ul className={styles.navList}>
        {(() => {
          let visible = navItems.filter((item) => canAccessPage(admin, item.id));
          if (visible.length === 0 && admin?.email) {
            visible = navItems.filter((item) => item.id === "dashboard");
          }
          if (visible.length === 0)
            return (
              <li style={{ padding: 16, fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5 }}>
                No navigation — check role
                <br />
                <span style={{ fontSize: 11, opacity: 0.8 }}>role: {String(admin?.role || admin?.roles?.[0] || "—")}</span>
                <br />
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--amber)",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Clear cache & reload
                </button>
              </li>
            );
          return visible.map((item) => {
            const active = page === item.id;
            const Icon = item.icon;
            const badge = item.id === "merchants" ? pendingMerchants : item.id === "pending-admins" ? pendingAdmins : 0;
            return (
              <li key={item.id} className={styles.navListItem}>
                <button
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setPage(item.id)}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={styles.navIcon}>
                    <Icon size={18} />
                  </span>
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  {!collapsed && badge > 0 && <span className={styles.badge}>{badge > 99 ? "99+" : badge}</span>}
                  {collapsed && badge > 0 && <span className={styles.badgeDot} aria-hidden="true" />}
                </button>
              </li>
            );
          });
        })()}
      </ul>

      {/* User Profile Shortcut + Logout directly underneath — flex column, consistent gap */}
      <div className={styles.profileSection}>
        <div className={styles.profile}>
          <div className={styles.profileAvatar}>{admin?.name ? admin.name.split(" ").map((name) => name[0]).join("") : "SA"}</div>
          {!collapsed && (
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{admin?.name || "Administrator"}</span>
              <span className={styles.profileRole}>{getKbRoleLabel(admin?.role) || "Platform Operator"}</span>
            </div>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        {/* Logout sits directly underneath profile — full-width when expanded, icon-only centered when collapsed */}
        <button className={collapsed ? styles.logoutIconBtn : styles.logoutBtn} onClick={handleLogout} aria-label="Log out">
          <LogOut size={collapsed ? 16 : 14} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </nav>
  );
}

export default AdminSidebar;
