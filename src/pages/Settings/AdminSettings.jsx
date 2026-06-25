import { useState } from "react";
import styles from "./AdminSettings.module.css";

function AdminSettings({ showToast }) {
  const [twoFA, setTwoFA] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  const adminTeam = [
    { name: "Super Admin", email: "admin@dukadesk.com", role: "Super Admin", color: "#E74C3C" },
    { name: "Moderation A", email: "moda@dukadesk.com", role: "Moderator", color: "#7C3AED" },
    { name: "Support B", email: "support@dukadesk.com", role: "Support", color: "#2ECC71" },
  ];

  const sections = [
    {
      title: "Security",
      items: [
        { label: "Two-Factor Authentication", sub: "Require 2FA for all admin logins", val: twoFA, set: setTwoFA },
        { label: "Auto-approve low-risk apps", sub: "Skip moderation queue for apps passing all automated checks", val: autoApprove, set: setAutoApprove },
      ],
    },
    {
      title: "Notifications",
      items: [
        { label: "Email Alerts", sub: "Receive email for critical reports and platform events", val: emailAlerts, set: setEmailAlerts },
        { label: "Slack Alerts", sub: "Send critical alerts to Slack channel", val: slackAlerts, set: setSlackAlerts },
      ],
    },
  ];

  const Toggle = ({ val, set, label }) => (
    <div
      className={`${styles.switch} ${val ? styles.switchOn : styles.switchOff}`}
      onClick={() => {
        set(!val);
        showToast(`${label} ${!val ? "enabled" : "disabled"}`, "success");
      }}
    >
      <div className={styles.switchKnob} style={{ left: val ? 24 : 2 }} />
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>Settings</h2>
      <p className={styles.pageDesc}>Manage admin portal configuration and security settings.</p>

      {sections.map((section, si) => (
        <div key={si} className={styles.section}>
          <div className={styles.sectionTitle}>{section.title}</div>
          {section.items.map((item, ii) => (
            <div key={ii} className={ii < section.items.length - 1 ? styles.toggleItemBorder : styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <div className={styles.toggleLabel}>{item.label}</div>
                <div className={styles.toggleSub}>{item.sub}</div>
              </div>
              <Toggle val={item.val} set={item.set} label={item.label} />
            </div>
          ))}
        </div>
      ))}

      <div className={styles.teamSection}>
        <div className={styles.teamTitle}>Admin Team</div>
        {adminTeam.map((a, i) => (
          <div key={i} className={i < adminTeam.length - 1 ? styles.teamItemBorder : styles.teamItem}>
            <div className={styles.teamAvatar} style={{ background: a.color }}>{a.name[0]}</div>
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{a.name}</div>
              <div className={styles.teamEmail}>{a.email}</div>
            </div>
            <span className={styles.teamRole} style={{ background: a.color + "22", color: a.color }}>{a.role}</span>
          </div>
        ))}
        <button onClick={() => showToast("Invite sent!", "success")} className={styles.inviteBtn}>+ Invite Team Member</button>
      </div>

      <button onClick={() => showToast("All settings saved!", "success")} className={styles.saveBtn}>Save All Settings</button>
    </div>
  );
}

export default AdminSettings;
