import { useState, useEffect, useCallback } from "react";
import { businessDashboardApi } from "../../services/businessDashboard";
import AccessibleToggle from "../../components/UI/AccessibleToggle";
import RemoteTablePage from "../../components/UI/RemoteTablePage";
import { Modal } from "../../components/UI/Modal";
import Field from "../../components/UI/Field";
import styles from "./Settings.module.css";

const TABS = [
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "features", label: "Feature Flags" },
  { id: "platform", label: "Platform Config" },
  { id: "team", label: "Admin Team" },
];

const SETTING_CATEGORIES = {
  security: [
    { key: "two_factor_auth", label: "Two-Factor Authentication", description: "Require 2FA for all admin logins" },
    { key: "auto_approve_apps", label: "Auto-approve low-risk apps", description: "Skip moderation queue for apps passing all automated checks" },
  ],
  notifications: [
    { key: "email_alerts", label: "Email Alerts", description: "Receive email for critical reports and platform events" },
    { key: "slack_alerts", label: "Slack Alerts", description: "Send critical alerts to Slack channel" },
  ],
};

const ROLE_OPTIONS = ["admin", "support", "moderator", "analyst"];

export default function Settings({ showToast }) {
  const [activeTab, setActiveTab] = useState("security");
  const [allSettings, setAllSettings] = useState({});
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [plans, setPlans] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("support");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMsg, setAnnMsg] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, flagsRes, usersRes, annRes, plansRes] = await Promise.all([
        businessDashboardApi.getSettings(),
        businessDashboardApi.getFeatureFlags(),
        businessDashboardApi.getUsers({ limit: 50 }).catch(() => ({ data: [] })),
        businessDashboardApi.getAnnouncements({ limit: 20 }).catch(() => ({ data: [] })),
        businessDashboardApi.getPlans().catch(() => ({ data: [] })),
      ]);
      setAllSettings(settingsRes?.settings || settingsRes?.data || settingsRes || {});
      setFeatureFlags(Array.isArray(flagsRes) ? flagsRes : flagsRes?.flags || flagsRes?.data || flagsRes || []);
      const u = usersRes?.data || usersRes?.users || usersRes?.items || usersRes || [];
      setUsers(Array.isArray(u) ? u : []);
      const ann = annRes?.data || annRes?.announcements || annRes?.items || annRes || [];
      setAnnouncements(Array.isArray(ann) ? ann : []);
      const pl = plansRes?.data || plansRes?.plans || plansRes?.items || plansRes || [];
      setPlans(Array.isArray(pl) ? pl : []);
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettingChange = async (key, newValue) => {
    const previousValue = allSettings[key];
    setAllSettings((prev) => ({ ...prev, [key]: newValue }));
    try {
      await businessDashboardApi.updateSetting(key, newValue);
      showToast(`${key} updated`, "success");
    } catch (err) {
      setAllSettings((prev) => ({ ...prev, [key]: previousValue }));
      showToast(err.message || "Failed to update setting", "error");
    }
  };

  const handlePlatformSettingChange = async (key, newValue) => {
    const previousValue = allSettings[key];
    setAllSettings((prev) => ({ ...prev, [key]: newValue }));
    try {
      await businessDashboardApi.updateSetting(key, newValue);
      showToast(`${key} updated`, "success");
    } catch (err) {
      setAllSettings((prev) => ({ ...prev, [key]: previousValue }));
      showToast(err.message || "Failed to update setting", "error");
    }
  };

  if (loading) {
    return <div className={styles.loading} aria-live="polite">Loading settings…</div>;
  }

  const categorySettings = SETTING_CATEGORIES[activeTab] || [];

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>Settings</h2>
      <p className={styles.pageDesc}>Manage admin portal configuration, security, and platform settings.</p>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <nav className={styles.tabs} aria-label="Settings categories" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {categorySettings.length > 0 && (
          <section className={styles.section} aria-label={`${activeTab} settings`}>
            <h3 className={styles.sectionTitle}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h3>
            {categorySettings.map((setting, idx) => (
              <div
                key={setting.key}
                className={styles.settingRow}
                style={{ borderBottom: idx < categorySettings.length - 1 ? "1px solid var(--gray-100)" : "none" }}
              >
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>{setting.label}</span>
                  <span className={styles.settingSub}>{setting.description}</span>
                </div>
                <AccessibleToggle
                  checked={Boolean(allSettings[setting.key])}
                  onChange={(val) => handleSettingChange(setting.key, val)}
                  label={setting.label}
                  description={setting.description}
                  id={`setting-${setting.key}`}
                />
              </div>
            ))}
          </section>
        )}

        {activeTab === "features" && (
          <section className={styles.section} aria-label="Feature flags">
            <h3 className={styles.sectionTitle}>Feature Flags</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {featureFlags.length === 0 && <p className={styles.empty}>No flags.</p>}
              {featureFlags.map((f) => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8 }}>
                  <div style={{ flex: 1 }}><strong style={{ fontSize: 13 }}>{f.key}</strong><div style={{ fontSize: 11, color: "var(--gray-500)" }}>{f.description}</div></div>
                  <AccessibleToggle
                    checked={Boolean(f.enabled)}
                    onChange={async (val) => {
                      try { await businessDashboardApi.updateFeatureFlag(f.key, { enabled: val }); setFeatureFlags((prev) => prev.map((x) => x.key === f.key ? { ...x, enabled: val } : x)); showToast(`${f.key} updated`, "success"); } catch (e) { showToast(e.message, "error"); }
                    }}
                    label={f.key}
                    id={`flag-${f.key}`}
                  />
                  <button onClick={async () => { try { await businessDashboardApi.deleteFeatureFlag(f.key); setFeatureFlags((p) => p.filter((x) => x.key !== f.key)); showToast("Deleted", "success"); } catch (e) { showToast(e.message, "error"); } } } style={{ fontSize: 11, color: "var(--red)" }}>Delete</button>
                </div>
              ))}
            </div>
            <button className={styles.inviteBtn} onClick={async () => { const key = prompt("Flag key"); if (!key) return; try { const nf = await businessDashboardApi.createFeatureFlag({ key, enabled: false, description: "" }); setFeatureFlags((p) => [...p, nf?.data || nf]); showToast("Created", "success"); } catch (e) { showToast(e.message, "error"); } }}>+ Create Flag</button>
            <div style={{ marginTop: 16 }}><RemoteTablePage title="" description="Raw flags table (legacy)" load={businessDashboardApi.getFeatureFlags} /></div>
          </section>
        )}

        {activeTab === "platform" && (
          <section className={styles.section} aria-label="Platform configuration">
            <h3 className={styles.sectionTitle}>Platform Configuration</h3>
            {Object.keys(allSettings).length === 0 ? (
              <p className={styles.empty}>No configuration settings returned.</p>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                      <th style={{ width: 120 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(allSettings).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{key}</td>
                        <td>
                          {typeof value === "boolean" ? (
                            <span className={`${styles.badge} ${value ? styles.badgeEnabled : styles.badgeDisabled}`}>
                              {value ? "Enabled" : "Disabled"}
                            </span>
                          ) : typeof value === "object" ? (
                            <pre style={{ margin: 0, fontSize: 11, maxHeight: 100, overflow: "auto" }}>
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            String(value)
                          )}
                        </td>
                        <td>
                          {typeof value === "boolean" && (
                            <AccessibleToggle
                              checked={value}
                              onChange={(val) => handlePlatformSettingChange(key, val)}
                              label={`Toggle ${key}`}
                              id={`platform-${key}`}
                            />
                          )}
                          {typeof value !== "boolean" && (
                            <button
                              className={styles.editableCell}
                              onClick={() => {}}
                              disabled
                              title="Inline editing for non-boolean values coming soon"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "team" && (
          <section className={styles.section} aria-label="Admin team">
            <h3 className={styles.sectionTitle}>Admin Team (customer care)</h3>
            <div className={styles.teamList}>
              {users.length === 0 && <p className={styles.empty}>No users.</p>}
              {users.map((member, idx) => (
                <div key={member.id || idx} className={styles.teamItem} style={{ borderBottom: idx < users.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                  <div className={styles.teamAvatar} style={{ background: "#7C3AED" }}>{(member.name || member.email || "?").split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div className={styles.teamInfo}><div className={styles.teamName}>{member.name || member.email}</div><div className={styles.teamEmail}>{member.email}</div></div>
                  <span className={styles.teamRole} style={{ background: "#7C3AED22", color: "#7C3AED" }}>{member.role || "—"}</span>
                  <button onClick={async () => { try { await businessDashboardApi.removeUser(member.id, member.tenantId || ""); setUsers((p) => p.filter((x) => x.id !== member.id)); showToast("Removed", "success"); } catch (e) { showToast(e.message, "error"); } }} style={{ fontSize: 11, color: "var(--red)" }}>Remove</button>
                </div>
              ))}
            </div>
            <button className={styles.inviteBtn} onClick={() => setInviteOpen(true)}>+ Invite Team Member</button>
            <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite user">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                <label style={{ fontSize: 12 }}>Role <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
                <button
                  className={styles.inviteBtn}
                  onClick={async () => {
                    if (!inviteEmail) return showToast("Email required", "error");
                    try {
                      // Spec: POST /admin/users/{id}/invite?role=&tenantId= — invite requires user id; if not found, fallback to creating via admin/users
                      // Try to find existing user by email else create placeholder
                      const found = users.find((u) => u.email === inviteEmail);
                      if (found) {
                        await businessDashboardApi.inviteUser(found.id, { role: inviteRole });
                      } else {
                        // No direct create endpoint in spec; use invite with temp id or show guidance
                        showToast("User not found — ask backend to add POST /admin/users", "info");
                        return;
                      }
                      showToast("Invite sent", "success");
                      setInviteOpen(false);
                      setInviteEmail("");
                    } catch (e) { showToast(e.message, "error"); }
                  }}
                >
                  Send Invite
                </button>
              </div>
            </Modal>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Announcements (Platform)</h4>
              {announcements.length === 0 && <p className={styles.empty}>No announcements.</p>}
              {announcements.map((a) => (
                <div key={a.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <div><strong style={{ fontSize: 13 }}>{a.title}</strong><div style={{ fontSize: 11, color: "var(--gray-500)" }}>{a.message}</div></div>
                  <button onClick={async () => { try { await businessDashboardApi.deleteAnnouncement(a.id); setAnnouncements((p) => p.filter((x) => x.id !== a.id)); showToast("Deleted", "success"); } catch (e) { showToast(e.message, "error"); } }} style={{ fontSize: 11, color: "var(--red)" }}>Delete</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} style={{ flex: 1, padding: 6, border: "1px solid var(--gray-200)", borderRadius: 6 }} />
                <input placeholder="Message" value={annMsg} onChange={(e) => setAnnMsg(e.target.value)} style={{ flex: 2, padding: 6, border: "1px solid var(--gray-200)", borderRadius: 6 }} />
                <button className={styles.inviteBtn} onClick={async () => { if (!annTitle) return; try { const na = await businessDashboardApi.createAnnouncement({ title: annTitle, message: annMsg, type: "info" }); setAnnouncements((p) => [...p, na?.data || na]); setAnnTitle(""); setAnnMsg(""); showToast("Created", "success"); } catch (e) { showToast(e.message, "error"); } }}>Create</button>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Plans (Subscription lifecycle)</h4>
              {plans.length === 0 && <p className={styles.empty}>No plans.</p>}
              {plans.map((p) => (
                <div key={p.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <div><strong>{p.name}</strong> <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{p.interval} • {p.price}</span></div>
                  <button onClick={async () => { try { await businessDashboardApi.deletePlan(p.id); setPlans((prev) => prev.filter((x) => x.id !== p.id)); showToast("Deleted", "success"); } catch (e) { showToast(e.message, "error"); } }} style={{ fontSize: 11, color: "var(--red)" }}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}