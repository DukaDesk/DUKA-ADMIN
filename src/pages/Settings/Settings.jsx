import { useState, useEffect, useCallback, useRef } from "react";
import { businessDashboardApi } from "../../services/businessDashboard";
import AccessibleToggle from "../../components/UI/AccessibleToggle";
import ConfirmModal from "../../components/UI/ConfirmModal";
import RemoteTablePage from "../../components/UI/RemoteTablePage";
import { Modal } from "../../components/UI/Modal";
import Field from "../../components/UI/Field";
import ExportButton from "../../components/UI/ExportButton";
import { maskEmail } from "../../utils/maskEmail";
import { canViewEmail, isInvestor, canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { toneBackground } from "../../utils/badgeTones";
import styles from "./Settings.module.css";

const TABS = [
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "features", label: "Feature Flags" },
  { id: "platform", label: "Platform Config" },
  { id: "promo", label: "Promo Feed" },
  { id: "team", label: "Admin Team" },
  { id: "maintenance", label: "Maintenance" },
  { id: "policies", label: "Policies" },
];

const POLICY_STATUS_TONES = {
  draft: "var(--gray-500)",
  in_review: "var(--amber)",
  published: "var(--green)",
  archived: "var(--gray-500)",
};

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

function normalizeSettingValues(response) {
  const settings = response?.settings ?? response?.data ?? response;
  if (Array.isArray(settings)) {
    return Object.fromEntries(
      settings
        .filter((setting) => setting && typeof setting.key === "string")
        .map((setting) => [setting.key, setting.value])
    );
  }
  return settings && typeof settings === "object" ? settings : {};
}

// KB Strict SEC-0002: Platform roles are Super Admin, Platform Operator, Operations, Support Agent. Legacy kept as fallback.
const ROLE_OPTIONS = ["platform_operator", "operations", "support_agent", "super_admin"];
const ROLE_LABELS = { super_admin: "Super Admin", platform_operator: "Platform Operator", operations: "Operations", support_agent: "Support Agent" };

// Promo-post lifetime is fixed in the backend (24h purge); admins control
// the per-tier daily post quota via each plan's limits JSON.
export const PROMO_FREE_DEFAULT_DAILY = 5;

function PromoFeedSection({ plans, planReadOnly, runMutation, onPlanUpdated }) {
  const [drafts, setDrafts] = useState({});
  useEffect(() => {
    setDrafts((prev) => {
      const next = {};
      plans.forEach((plan) => {
        const stored = plan?.limits?.dailyPromoPosts;
        next[plan.id] = prev[plan.id] ?? (stored == null ? "" : String(stored));
      });
      return next;
    });
  }, [plans]);

  const save = (plan) => {
    const current = (Array.isArray(plans) ? plans : []).find((p) => p.id === plan.id);
    const raw = String(drafts[plan.id] ?? "").trim();
    const limits = { ...(current?.limits || {}) };
    const operation = () => {
      if (!raw) {
        delete limits.dailyPromoPosts;
      } else {
        const value = Number(raw);
        if (!Number.isInteger(value) || value < 1 || value > 100000) {
          return Promise.reject(new Error("Enter a whole number between 1 and 100000, or clear for the Free default of 5"));
        }
        limits.dailyPromoPosts = value;
      }
      return businessDashboardApi.updatePlan(plan.id, { limits });
    };
    runMutation(
      `plan:${plan.id}`,
      operation,
      `${plan.name} updated`,
      () => onPlanUpdated?.(plan.id, limits),
    );
  };

  if (plans.length === 0) return <p className={styles.empty}>No plans configured yet — create plans under Subscriptions first.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {plans.map((plan) => {
        const activeSubs = plan._count?.subscriptions ?? null;
        return (
          <div key={plan.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px", minWidth: 160 }}>
              <div style={{ fontWeight: 600 }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                {plan.slug} · {plan.currency} {plan.price}
                {activeSubs != null ? ` · ${activeSubs} subscribers` : ""}
                {typeof plan.limits?.dailyPromoPosts === "number" ? ` · now ${plan.limits.dailyPromoPosts}/day` : ` · Free default ${PROMO_FREE_DEFAULT_DAILY}/day`}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gray-600)" }}>
              Daily promo posts
              <input
                type="number"
                min={1}
                max={100000}
                step={1}
                value={drafts[plan.id] ?? ""}
                placeholder={String(PROMO_FREE_DEFAULT_DAILY)}
                disabled={planReadOnly}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                style={{ width: 96, padding: "6px 10px", border: "1px solid var(--gray-200)", borderRadius: 8 }}
                aria-label={`Daily promo posts for ${plan.name}`}
              />
            </label>
            <button
              onClick={() => save(plan)}
              disabled={planReadOnly}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--gray-200)", background: planReadOnly ? "var(--gray-100)" : "#111827", color: planReadOnly ? "var(--gray-400)" : "#fff", cursor: planReadOnly ? "not-allowed" : "pointer", fontWeight: 600 }}
            >
              Save
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Settings({ showToast }) {
  const { admin } = useAuth();
  // KB Strict: Support Agent (and legacy investor) is read-only for team management — only Super Admin / Platform Operator can invite/manage
  const readOnly = isInvestor(admin) || !canPerform(admin, "users:manage");
  // Plan/limit edits (Promo Feed quotas) follow subscriptions:manage.
  const planReadOnly = isInvestor(admin) || !canPerform(admin, "subscriptions:manage");
  const [activeTab, setActiveTab] = useState("security");
  const [allSettings, setAllSettings] = useState({});
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [plans, setPlans] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("support_agent");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [invites, setInvites] = useState([]);
  const [pendingMutations, setPendingMutations] = useState({});
  const pendingMutationsRef = useRef(new Set());
  const tabListRef = useRef(null);
  const [confirmation, setConfirmation] = useState(null);

  const loadInvites = useCallback(async () => {
    if (readOnly) {
      setInvites([]);
      return;
    }
    try {
      const res = await businessDashboardApi.listInvites({ status: "pending" });
      const list = res?.data || res?.invites || res?.items || res || [];
      setInvites(Array.isArray(list) ? list : []);
    } catch {
      setInvites([]);
    }
  }, [readOnly]);
  const [annTitle, setAnnTitle] = useState("");
  const [annMsg, setAnnMsg] = useState("");

  const [maintenance, setMaintenance] = useState([]);
  const [maintenanceUnavailable, setMaintenanceUnavailable] = useState(false);
  const [policies, setPolicies] = useState([]);
  const runMutation = async (key, operation, successMessage, onSuccess) => {
    if (pendingMutationsRef.current.has(key)) return null;
    pendingMutationsRef.current.add(key);
    setPendingMutations((current) => ({ ...current, [key]: true }));
    try {
      const result = await operation();
      onSuccess?.(result);
      if (successMessage) showToast(successMessage, "success");
      return true;
    } catch (err) {
      showToast(err.message || `Failed to ${key}`, "error");
      return false;
    } finally {
      pendingMutationsRef.current.delete(key);
      setPendingMutations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const requestConfirmation = (details) => setConfirmation(details);
  const executeConfirmation = async () => {
    if (!confirmation) return;
    const completed = await runMutation(
      confirmation.key,
      confirmation.operation,
      confirmation.successMessage,
      confirmation.onSuccess,
    );
    if (completed) setConfirmation(null);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        businessDashboardApi.getSettings(),
        businessDashboardApi.getFeatureFlags(),
        readOnly ? Promise.resolve(null) : businessDashboardApi.getUsers({ limit: 50, role: "platform_admin" }),
        businessDashboardApi.getAnnouncements({ page: 1, limit: 20 }),
        businessDashboardApi.getPlans(),
        businessDashboardApi.getMaintenanceWindows({ page: 1, limit: 10 }),
        businessDashboardApi.getPolicies({ page: 1, limit: 10 }),
      ]);
      const [settingsRes, flagsRes, usersRes, annRes, plansRes, maintRes, polRes] = results.map((r) => (r.status === "fulfilled" ? r.value : null));
      const failures = results.map((r, i) => (r.status === "rejected" ? { idx: i, err: r.reason } : null)).filter(Boolean);
      if (failures.length) {
        failures.forEach(({ err }) => {
          if (err?.requestId) console.warn("[Settings] load failed", err.requestId, err.message);
        });
        const critical = failures.find(({ idx }) => idx <= 1); // settings or flags
        const usersFailed = failures.find(({ idx }) => idx === 2);
        if (critical) setError(critical.err?.message || "Failed to load settings");
        if (usersFailed) {
          const rid = usersFailed.err?.requestId ? ` (Ref: ${String(usersFailed.err.requestId).slice(0, 8)})` : "";
          showToast?.(`User list temporarily unavailable.${rid}`, "error");
        }
      }
      if (settingsRes) setAllSettings(normalizeSettingValues(settingsRes));
      if (flagsRes) setFeatureFlags(Array.isArray(flagsRes) ? flagsRes : flagsRes?.flags || flagsRes?.data || flagsRes || []);
      if (usersRes) {
        const u = usersRes?.data?.users || usersRes?.users || usersRes?.items || usersRes?.data || usersRes || [];
        setUsers(Array.isArray(u) ? u : []);
      } else if (readOnly) {
        setUsers([]);
      } else if (failures.find(({ idx }) => idx === 2)) {
        setUsers([]);
      }
      if (annRes) {
        const ann = annRes?.data || annRes?.announcements || annRes?.items || annRes || [];
        setAnnouncements(Array.isArray(ann) ? ann : []);
      }
      if (plansRes) {
        const pl = plansRes?.data || plansRes?.plans || plansRes?.items || plansRes || [];
        setPlans(Array.isArray(pl) ? pl : []);
      }
      const m = maintRes?.data || maintRes?.items || maintRes || [];
      setMaintenance(Array.isArray(m) ? m : []);
      setMaintenanceUnavailable(!maintRes);
      const p = polRes?.data || polRes?.items || polRes || [];
      setPolicies(Array.isArray(p) ? p : []);
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [readOnly, showToast]);

  useEffect(() => {
    loadData();
    loadInvites();
  }, [loadData, loadInvites]);

  const handleSettingChange = async (key, newValue) => {
    if (pendingMutationsRef.current.has(`setting:${key}`)) return;
    const previousValue = allSettings[key];
    setAllSettings((prev) => ({ ...prev, [key]: newValue }));
    const completed = await runMutation(
      `setting:${key}`,
      () => businessDashboardApi.updateSetting(key, newValue),
      `${key} updated`,
    );
    if (completed === false) {
      setAllSettings((prev) => ({ ...prev, [key]: previousValue }));
    }
  };
  const handlePlatformSettingChange = handleSettingChange;

  if (loading) {
    return <div className={styles.loading} aria-live="polite">Loading settings…</div>;
  }

  const categorySettings = SETTING_CATEGORIES[activeTab] || [];

  const handleTabKeyDown = (event) => {
    const handledKeys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!handledKeys.includes(event.key)) return;
    const tabs = Array.from(tabListRef.current?.querySelectorAll('[role="tab"]') || []);
    if (!tabs.length) return;
    event.preventDefault();
    const currentIndex = tabs.findIndex((tab) => tab === event.currentTarget);
    const lastIndex = tabs.length - 1;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    if (event.key === "ArrowLeft") nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id.replace(/^tab-/, ""));
    nextTab.focus();
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>Settings</h2>
      <p className={styles.pageDesc}>Manage admin portal configuration, security, and platform settings.</p>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <nav ref={tabListRef} className={styles.tabs} aria-label="Settings categories" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={handleTabKeyDown}
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
                  disabled={Boolean(pendingMutations[`setting:${setting.key}`])}
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
                    onChange={(val) => runMutation(
                      `flag:${f.key}`,
                      () => businessDashboardApi.updateFeatureFlag(f.key, { enabled: val }),
                      `${f.key} updated`,
                      () => setFeatureFlags((prev) => prev.map((x) => x.key === f.key ? { ...x, enabled: val } : x)),
                    )}
                    label={f.key}
                    id={`flag-${f.key}`}
                    disabled={Boolean(pendingMutations[`flag:${f.key}`])}
                  />
                  <button
                    disabled={Boolean(pendingMutations[`delete-flag:${f.key}`])}
                    onClick={() => requestConfirmation({
                      key: `delete-flag:${f.key}`,
                      title: "Delete feature flag?",
                      message: `Delete the ${f.key} feature flag?`,
                      confirmLabel: "Delete",
                      operation: () => businessDashboardApi.deleteFeatureFlag(f.key),
                      successMessage: "Feature flag deleted",
                      onSuccess: () => setFeatureFlags((p) => p.filter((x) => x.key !== f.key)),
                    })}
                    style={{ fontSize: 11, color: "var(--red)" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.inviteBtn} onClick={async () => { const key = prompt("Flag key"); if (!key) return; try { const nf = await businessDashboardApi.createFeatureFlag({ key, enabled: false, description: "" }); setFeatureFlags((p) => [...p, nf?.data || nf]); showToast("Created", "success"); } catch (e) { showToast(e.message, "error"); } }}>+ Create Flag</button>
            <div style={{ marginTop: 16 }}><RemoteTablePage title="" description="All feature flags" load={businessDashboardApi.getFeatureFlags} /></div>
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
                              disabled={Boolean(pendingMutations[`setting:${key}`])}
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

        {activeTab === "promo" && (
          <section className={styles.section} aria-label="Promo feed configuration">
            <h3 className={styles.sectionTitle}>Promo Feed</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--gray-500)" }}>
              Promo posts run for 24 hours and are then deleted from the database. Set how many promo posts each tier may publish per day; tenants without a configured plan follow the Free default of {PROMO_FREE_DEFAULT_DAILY}/day (quota counts the UTC day).
            </p>
            <PromoFeedSection planReadOnly={planReadOnly} plans={plans} runMutation={runMutation} onPlanUpdated={(id, limits) => setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, limits } : plan)))} />
          </section>
        )}

        {activeTab === "team" && (
          <section className={styles.section} aria-label="Admin team">
            <h3 className={styles.sectionTitle}>Admin Team (customer care) — {users.length} shown {readOnly ? "· read-only" : ""}</h3>
            {readOnly && <p style={{ fontSize: 12, color: "var(--amber)", background: "var(--amber-alpha-10)", padding: 8, borderRadius: 6, marginBottom: 12 }}>Admin-user management is restricted to Super Admins.</p>}
            <div className={styles.teamList}>
              {!readOnly && users.length === 0 && <p className={styles.empty}>No platform admins.</p>}
              {users.map((member, idx) => (
                <div key={member.id || idx} className={styles.teamItem} style={{ borderBottom: idx < users.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                  <div className={styles.teamAvatar} style={{ background: "#7C3AED" }}>{(member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email || "?").split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div className={styles.teamInfo}><div className={styles.teamName}>{member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email}</div><div className={styles.teamEmail}>{canViewEmail(admin) ? member.email : maskEmail(member.email)}</div></div>
                  <span className={styles.teamRole} style={{ background: "#7C3AED22", color: "#7C3AED" }}>{member.role || member.roles?.map((assignment) => assignment.role?.name).filter(Boolean).join(", ") || "—"}</span>
                  <button
                    disabled={readOnly || Boolean(pendingMutations[`remove-user:${member.id}`])}
                    onClick={() => requestConfirmation({
                      key: `remove-user:${member.id}`,
                      title: "Remove platform admin?",
                      message: `Remove ${member.name || member.email} from platform administration?`,
                      confirmLabel: "Remove",
                      operation: () => businessDashboardApi.removeUser(member.id),
                      successMessage: "Removed from platform",
                      onSuccess: () => setUsers((p) => p.filter((x) => x.id !== member.id)),
                    })}
                    style={{ fontSize: 11, color: "var(--red)", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.inviteBtn} disabled={readOnly} onClick={() => { if (!readOnly) { setInviteOpen(true); setGeneratedLink(""); } }} style={{ opacity: readOnly ? 0.6 : 1, cursor: readOnly ? "not-allowed" : "pointer" }}>+ Generate Invite Link</button>
            {invites.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 13, marginBottom: 8 }}>Pending Invites ({invites.length})</h4>
                {invites.map((inv) => (
                  <div key={inv.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><strong style={{ fontSize: 13 }}>{inv.email}</strong> <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{inv.role} · expires {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—"}</span></div>
                    <button
                      disabled={readOnly || Boolean(pendingMutations[`revoke-invite:${inv.id}`])}
                      onClick={() => requestConfirmation({
                        key: `revoke-invite:${inv.id}`,
                        title: "Revoke admin invite?",
                        message: `Revoke the pending invite for ${inv.email}?`,
                        confirmLabel: "Revoke Invite",
                        operation: () => businessDashboardApi.revokeInvite(inv.id),
                        successMessage: "Invite revoked",
                        onSuccess: () => setInvites((p) => p.filter((x) => x.id !== inv.id)),
                      })}
                      style={{ fontSize: 11, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Modal isOpen={inviteOpen} onClose={() => { setInviteOpen(false); setGeneratedLink(""); setInviteEmail(""); }} title="Generate invite link">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {!generatedLink ? (
                  <>
                    <Field label="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                    <label style={{ fontSize: 12 }}>Role <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}</select></label>
                    <p style={{ fontSize: 11, color: "var(--gray-500)", margin: 0 }}>Single-use link, bound to this email and role, expires in 7 days. Share it directly with the new admin.</p>
                    <button
                      className={styles.inviteBtn}
                      disabled={Boolean(pendingMutations["create-invite"])}
                      onClick={async () => {
                        const email = inviteEmail.trim();
                        if (!email) return showToast("Email required", "error");
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast("Invalid email", "error");
                        const completed = await runMutation(
                          "create-invite",
                          async () => {
                            const response = await businessDashboardApi.createInvite({ email, role: inviteRole });
                            const data = response?.data || response;
                            if (typeof data?.token !== "string" || !data.token.trim()) {
                              throw new Error("The server did not return an invite token. Please try again.");
                            }
                            return data;
                          },
                          "Invite link generated",
                          (data) => setGeneratedLink(`${window.location.origin}/register?token=${data.token}`),
                        );
                        if (completed) void loadInvites();
                      }}
                    >
                      {pendingMutations["create-invite"] ? "Generating…" : "Generate Link"}
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 12, color: "var(--gray-600)", margin: 0 }}>Share this link with <strong>{inviteEmail}</strong>:</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input readOnly value={generatedLink} onFocus={(e) => e.target.select()} style={{ flex: 1, padding: 8, border: "1px solid var(--gray-200)", borderRadius: 6, fontSize: 12 }} aria-label="Invite link" />
                      <button
                        className={styles.inviteBtn}
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(generatedLink); showToast("Link copied", "success"); }
                          catch { showToast("Copy failed — select the link manually", "error"); }
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <button className={styles.inviteBtn} onClick={() => { setInviteOpen(false); setGeneratedLink(""); setInviteEmail(""); }}>Done</button>
                  </>
                )}
              </div>
            </Modal>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Announcements (Platform)</h4>
              {announcements.length === 0 && <p className={styles.empty}>No announcements.</p>}
              {announcements.map((a) => (
                <div key={a.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <div><strong style={{ fontSize: 13 }}>{a.title}</strong><div style={{ fontSize: 11, color: "var(--gray-500)" }}>{a.message}</div></div>
                  <button
                    disabled={Boolean(pendingMutations[`delete-announcement:${a.id}`])}
                    onClick={() => requestConfirmation({
                      key: `delete-announcement:${a.id}`,
                      title: "Delete announcement?",
                      message: `Delete “${a.title}”?`,
                      confirmLabel: "Delete",
                      operation: () => businessDashboardApi.deleteAnnouncement(a.id),
                      successMessage: "Announcement deleted",
                      onSuccess: () => setAnnouncements((p) => p.filter((x) => x.id !== a.id)),
                    })}
                    style={{ fontSize: 11, color: "var(--red)" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} style={{ flex: 1, padding: 6, border: "1px solid var(--gray-200)", borderRadius: 6 }} />
                <input placeholder="Message" value={annMsg} onChange={(e) => setAnnMsg(e.target.value)} style={{ flex: 2, padding: 6, border: "1px solid var(--gray-200)", borderRadius: 6 }} />
                <button
                  className={styles.inviteBtn}
                  disabled={Boolean(pendingMutations["create-announcement"])}
                  onClick={async () => {
                    const title = annTitle.trim();
                    const message = annMsg.trim();
                    if (!title || !message) return showToast("Announcement title and message are required.", "error");
                    await runMutation(
                      "create-announcement",
                      () => businessDashboardApi.createAnnouncement({ title, message, type: "info" }),
                      "Announcement created",
                      (response) => {
                        setAnnouncements((p) => [...p, response?.data || response]);
                        setAnnTitle("");
                        setAnnMsg("");
                      },
                    );
                  }}
                >
                  {pendingMutations["create-announcement"] ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Plans (Subscription lifecycle)</h4>
              {plans.length === 0 && <p className={styles.empty}>No plans.</p>}
              {plans.map((p) => (
                <div key={p.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <div><strong>{p.name}</strong> <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{p.interval} • {p.price}</span></div>
                  <button
                    disabled={Boolean(pendingMutations[`delete-plan:${p.id}`])}
                    onClick={() => requestConfirmation({
                      key: `delete-plan:${p.id}`,
                      title: "Delete subscription plan?",
                      message: `Delete the ${p.name} plan? Existing subscriptions may prevent deletion.`,
                      confirmLabel: "Delete Plan",
                      operation: () => businessDashboardApi.deletePlan(p.id),
                      successMessage: "Plan deleted",
                      onSuccess: () => setPlans((prev) => prev.filter((x) => x.id !== p.id)),
                    })}
                    style={{ fontSize: 11, color: "var(--red)" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "maintenance" && (
          <section className={styles.section} aria-label="Maintenance windows">
            <h3 className={styles.sectionTitle}>Maintenance Windows</h3>
            {maintenanceUnavailable && <p className={styles.empty} role="status">Maintenance scheduling is not available in the current backend.</p>}
            {!maintenanceUnavailable && maintenance.length === 0 && <p className={styles.empty}>No maintenance windows are scheduled.</p>}
            {maintenance.map((m) => (
              <div key={m.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <div><strong style={{ fontSize: 13 }}>{m.title || m.name || m.id}</strong><div style={{ fontSize: 11, color: "var(--gray-500)" }}>{m.startAt ? new Date(m.startAt).toLocaleString() : ""} {m.endAt ? `→ ${new Date(m.endAt).toLocaleString()}` : ""} · {m.status || "scheduled"}</div></div>
              </div>
            ))}
          </section>
        )}

        {activeTab === "policies" && (
          <section className={styles.section} aria-label="Platform policies">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.sectionTitle}>Platform Policies</h3>
              <ExportButton report="policies" showToast={showToast} />
            </div>
            <p className={styles.empty}>Governed lifecycle: draft → in review → published → archived.</p>
            {policies.length === 0 && <p className={styles.empty}>No policies configured.</p>}
            {policies.map((p) => {
              const status = String(p.status || "draft").toLowerCase();
              const color = POLICY_STATUS_TONES[status] || "var(--gray-500)";
              const canPublish = admin?.role === "super_admin";
              return (
                <div key={p.id || p.key} style={{ padding: 12, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: 13 }}>{p.title || p.name || p.key}</strong>
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: toneBackground(color), color, textTransform: "capitalize" }}>
                        {status.replace(/_/g, " ")}
                      </span>
                      <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 4 }}>
                        {p.key} · v{p.version ?? 1}{p.category ? ` · ${p.category}` : ""}{p.effectiveAt ? ` · effective ${new Date(p.effectiveAt).toLocaleDateString()}` : ""}
                      </div>
                      {p.body && <div style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 6, whiteSpace: "pre-wrap" }}>{p.body}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {status === "draft" && (
                        <button
                          type="button"
                          disabled={readOnly || Boolean(pendingMutations[`policy-submit:${p.id}`])}
                          onClick={() => runMutation(
                            `policy-submit:${p.id}`,
                            () => businessDashboardApi.submitPolicy(p.id),
                            "Policy submitted for review",
                            () => setPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "in_review" } : x))),
                          )}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--gray-200)", background: "#fff", cursor: "pointer" }}
                        >
                          {pendingMutations[`policy-submit:${p.id}`] ? "Submitting…" : "Submit"}
                        </button>
                      )}
                      {status === "in_review" && canPublish && (
                        <button
                          type="button"
                          disabled={Boolean(pendingMutations[`policy-publish:${p.id}`])}
                          onClick={() => runMutation(
                            `policy-publish:${p.id}`,
                            () => businessDashboardApi.publishPolicy(p.id),
                            "Policy published",
                            () => setPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "published" } : x))),
                          )}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none", background: "var(--green)", color: "#fff", cursor: "pointer" }}
                        >
                          {pendingMutations[`policy-publish:${p.id}`] ? "Publishing…" : "Publish"}
                        </button>
                      )}
                      {status === "published" && canPublish && (
                        <button
                          type="button"
                          disabled={Boolean(pendingMutations[`policy-archive:${p.id}`])}
                          onClick={() => runMutation(
                            `policy-archive:${p.id}`,
                            () => businessDashboardApi.archivePolicy(p.id),
                            "Policy archived",
                            () => setPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "archived" } : x))),
                          )}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--gray-200)", background: "#fff", cursor: "pointer" }}
                        >
                          {pendingMutations[`policy-archive:${p.id}`] ? "Archiving…" : "Archive"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
      <ConfirmModal
        open={!!confirmation}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        variant="Danger"
        busy={Boolean(confirmation && pendingMutations[confirmation.key])}
        onConfirm={executeConfirmation}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}