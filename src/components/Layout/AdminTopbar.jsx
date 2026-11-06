import { useEffect, useState, useRef } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getKbRoleLabel } from "../../services/permissions";
import Breadcrumbs from "../UI/Breadcrumbs";
import api from "../../services/api";
import styles from "./AdminTopbar.module.css";

function AdminTopbar({ page, onMenuClick, setPage }) {
  const { admin, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const avatarRef = useRef(null);

  useEffect(() => {
    let active = true;
    const loadNotifications = () => api.get("/notifications?unreadOnly=true").then((response) => {
      const payload = response?.data ?? response;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload?.notifications;
      if (!active || !Array.isArray(list)) return;
      setNotifications(list);
      setUnreadCount(Number.isFinite(payload?.meta?.unreadCount) ? payload.meta.unreadCount : list.filter((item) => !item.isRead).length);
    }).catch(() => {});
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    window.addEventListener("focus", loadNotifications);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
    };
  }, []);

  useEffect(() => {
    const onDown = (e) => { if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    const openFromSidebar = () => setNotifOpen(true);
    window.addEventListener("admin:open-notifications", openFromSidebar);
    return () => window.removeEventListener("admin:open-notifications", openFromSidebar);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (typeof setPage === "function") setPage("merchants");
  };

  const openNotification = async (notification) => {
    setNotifOpen(false);
    if (notification.id) {
      try {
        await api.put(`/notifications/${encodeURIComponent(notification.id)}/read`);
      } catch {
        // Keep navigation available if marking the notification read fails.
      }
    }
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setUnreadCount((current) => Math.max(0, current - 1));
    if (notification.type === "merchant_app_review" || notification.data?.category === "merchant_app_review") {
      if (typeof setPage === "function") setPage("merchants");
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}><button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open navigation"><Menu size={20} /></button><Breadcrumbs page={page} setPage={setPage} /></div>
      <div className={styles.searchCenter}>
        <form className={styles.searchWrapper} role="search" onSubmit={handleSearchSubmit}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search merchants, users, apps..."
            aria-label="Search merchants, users, apps"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.notifWrapper}>
          <button className={styles.notifBtn} onClick={() => setNotifOpen(!notifOpen)} aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}>
            <Bell size={18} aria-hidden="true" />
            {unreadCount ? <span className={styles.notifDot} aria-hidden="true" /> : null}
          </button>
          {notifOpen && <div className={styles.notifDropdown}><div className={styles.notifHeader}><span className={styles.notifHeaderTitle}>Notifications</span><span className={styles.notifHeaderCount}>{unreadCount} unread</span></div><div className={styles.notifList}>{notifications.length ? notifications.map((notification, index) => <button key={notification.id || index} type="button" className={styles.notifItem} onClick={() => openNotification(notification)}><span className={styles.notifItemContent}><span className={styles.notifItemText}>{notification.title || notification.message || "Notification"}</span>{notification.body ? <span className={styles.notifItemTime}>{notification.body}</span> : null}<span className={styles.notifItemTime}>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : notification.time || ""}</span></span></button>) : <div className={styles.notifItem}>No notifications.</div>}</div></div>}
        </div>
        <div className={styles.avatarWrap} ref={avatarRef}>
          <button className={styles.avatar} onClick={() => setAvatarOpen((v) => !v)} aria-label="User menu">{admin?.name ? admin.name.split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase() : "AD"}</button>
          {avatarOpen && (
            <div className={styles.avatarDropdown}>
              <div className={styles.avatarDropdownInfo}><strong>{admin?.name || "Administrator"}</strong><span>{getKbRoleLabel(admin?.role) || "Platform Operator"}</span><span style={{ fontSize: 11, color: "var(--gray-500)" }}>{admin?.email || ""}</span></div>
              <button className={styles.avatarLogout} onClick={() => { setAvatarOpen(false); logout(); }}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
