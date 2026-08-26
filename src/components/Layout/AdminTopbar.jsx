import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./AdminTopbar.module.css";

const pageLabels = { dashboard: "Platform Overview", merchants: "Merchant Management", marketplace: "Marketplace", audit: "Audit Log", subscriptions: "Subscriptions", settings: "Platform Configuration" };

function AdminTopbar({ page, onMenuClick }) {
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/notifications").then((response) => {
      const list = Array.isArray(response) ? response : response?.notifications;
      if (active && Array.isArray(list)) setNotifications(list);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}><button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open navigation">Menu</button><h1 className={styles.pageTitle}>{pageLabels[page] || "Admin Portal"}</h1></div>
      <div className={styles.rightSection}>
        <div className={styles.notifWrapper}>
          <button className={styles.notifBtn} onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">Alerts{notifications.length ? <span className={styles.notifDot} /> : null}</button>
          {notifOpen && <div className={styles.notifDropdown}><div className={styles.notifHeader}><span className={styles.notifHeaderTitle}>Notifications</span><span className={styles.notifHeaderCount}>{notifications.length} new</span></div><div className={styles.notifList}>{notifications.length ? notifications.map((notification, index) => <div key={notification.id || index} className={styles.notifItem}><div className={styles.notifItemContent}><div className={styles.notifItemText}>{notification.message || notification.title || "Notification"}</div><div className={styles.notifItemTime}>{notification.createdAt || notification.time || ""}</div></div></div>) : <div className={styles.notifItem}>No notifications.</div>}</div></div>}
        </div>
        <div className={styles.avatar}>AD</div>
      </div>
    </header>
  );
}

export default AdminTopbar;
