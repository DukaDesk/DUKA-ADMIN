import { useState } from "react";
import styles from "./AdminTopbar.module.css";

const pageLabels = {
  dashboard: "Platform Overview",
  users: "User Management",
  merchants: "Merchant Management",
  apps: "App Moderation",
  reports: "Reports Queue",
  revenue: "Revenue Dashboard",
  waitlist: "Waitlist Management",
  settings: "Settings",
};

const notifications = [
  { icon: "🛡️", text: "3 critical reports need review", time: "2 min ago", urgent: true },
  { icon: "📱", text: "Mama's Kitchen app submitted for review", time: "15 min ago" },
  { icon: "💰", text: "MRR milestone: ₦9M reached", time: "1 hr ago" },
  { icon: "👥", text: "50 new merchant signups today", time: "3 hrs ago" },
];

function AdminTopbar({ page, showToast, setPage, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <button className={styles.menuBtn} onClick={onMenuClick}>☰</button>
        <h1 className={styles.pageTitle}>{pageLabels[page] || "Dashboard"}</h1>
        <div
          className={styles.alertBanner}
          onClick={() => setPage("reports")}
        >
          🛡️ 3 critical reports
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search anything..."
          />
        </div>

        <div className={styles.notifWrapper}>
          <button
            className={styles.notifBtn}
            onClick={() => setNotifOpen(!notifOpen)}
          >
            🔔
            <span className={styles.notifDot} />
          </button>

          {notifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span className={styles.notifHeaderTitle}>Notifications</span>
                <span className={styles.notifHeaderCount}>4 new</span>
              </div>
              <div className={styles.notifList}>
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`${styles.notifItem} ${n.urgent ? styles.notifItemUrgent : ""}`}
                  >
                    <span className={styles.notifItemIcon}>{n.icon}</span>
                    <div className={styles.notifItemContent}>
                      <div className={styles.notifItemText}>{n.text}</div>
                      <div className={styles.notifItemTime}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.avatar}>SA</div>
      </div>
    </header>
  );
}

export default AdminTopbar;
