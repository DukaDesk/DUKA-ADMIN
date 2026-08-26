import { useState, useEffect, useCallback } from "react";
import { businessDashboardApi } from "../../services/businessDashboard";
import AccessibleToggle from "../../components/UI/AccessibleToggle";
import RemoteTablePage from "../../components/UI/RemoteTablePage";
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

const ADMIN_TEAM = [
  { name: "Super Admin", email: "admin@dukadesk.com", role: "Super Admin", color: "#E74C3C" },
  { name: "Moderation A", email: "moda@dukadesk.com", role: "Moderator", color: "#7C3AED" },
  { name: "Support B", email: "support@dukadesk.com", role: "Support", color: "#2ECC71" },
];

export default function Settings({ showToast }) {
  const [activeTab, setActiveTab] = useState("security");
  const [allSettings, setAllSettings] = useState({});
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, flagsRes] = await Promise.all([
        businessDashboardApi.getSettings(),
        businessDashboardApi.getFeatureFlags(),
      ]);
      setAllSettings(settingsRes?.settings || settingsRes?.data || settingsRes || {});
      setFeatureFlags(Array.isArray(flagsRes) ? flagsRes : flagsRes?.flags || flagsRes?.data || flagsRes || []);
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
            <RemoteTablePage
              title=""
              description="Platform feature flags. Toggle states require backend workflow."
              load={businessDashboardApi.getFeatureFlags}
            />
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
            <h3 className={styles.sectionTitle}>Admin Team</h3>
            <div className={styles.teamList}>
              {ADMIN_TEAM.map((member, idx) => (
                <div
                  key={idx}
                  className={styles.teamItem}
                  style={{ borderBottom: idx < ADMIN_TEAM.length - 1 ? "1px solid var(--gray-100)" : "none" }}
                >
                  <div className={styles.teamAvatar} style={{ background: member.color }}>
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className={styles.teamInfo}>
                    <div className={styles.teamName}>{member.name}</div>
                    <div className={styles.teamEmail}>{member.email}</div>
                  </div>
                  <span className={styles.teamRole} style={{ background: member.color + "22", color: member.color }}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
            <button
              className={styles.inviteBtn}
              onClick={() => showToast("Invite flow requires backend /admin/users endpoints", "info")}
            >
              + Invite Team Member
            </button>
            <p style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 12 }}>
              Full user management requires backend endpoints (see MISSING_ENDPOINTS_FOR_BACKEND.md)
            </p>
          </section>
        )}
      </div>
    </div>
  );
}