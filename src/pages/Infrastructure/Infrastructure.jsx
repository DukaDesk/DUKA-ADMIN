import { useEffect, useState } from "react";
import { Activity, Cloud, Database, HeartPulse, Server, Shield } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import styles from "./Infrastructure.module.css";

function unwrap(value) {
  return value?.data ?? value ?? null;
}

function valuesFrom(payload, keys) {
  const sources = [payload, payload?.metrics, payload?.summary, payload?.stats, payload?.data];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null) return value;
    }
  }
  return undefined;
}

function seriesFrom(payload, keys) {
  const candidate = Array.isArray(payload) ? payload : valuesFrom(payload, keys);
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((point) => {
      if (typeof point === "number") return point;
      if (!point || typeof point !== "object") return null;
      const value = point.value ?? point.count ?? point.total ?? point.uptime ?? point.percentage;
      return Number.isFinite(Number(value)) ? Number(value) : null;
    })
    .filter((value) => value !== null);
}

function formatStatus(value) {
  if (!value) return "Unknown";
  if (typeof value === "object") value = value.status ?? value.overallStatus ?? value.state ?? value.name;
  if (!value) return "Unknown";
  return String(value).replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metricValue(value, fallback = "—") {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return value.total ?? value.count ?? value.value ?? fallback;
  return value ?? fallback;
}

function Sparkline({ values, label }) {
  if (values.length < 2) {
    return (
      <div className={styles.sparklineEmpty} role="img" aria-label={`${label} trend unavailable`}>
        <svg viewBox="0 0 120 28" aria-hidden="true">
          <path d="M2 14 H118" />
          <circle cx="60" cy="14" r="3" />
        </svg>
        <span>History not available yet</span>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 116 + 2;
    const y = 24 - ((value - min) / spread) * 20;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={styles.sparkline} role="img" aria-label={`${label} recent trend`}>
      <svg viewBox="0 0 120 28" aria-hidden="true">
        <polyline points={points} />
      </svg>
      <span>Recent trend</span>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, tone, trend }) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon} style={{ color: tone, backgroundColor: `color-mix(in srgb, ${tone} 12%, white)` }}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className={styles.metricLabel}>{title}</span>
      </div>
      <strong className={styles.metricValue}>{value}</strong>
      <Sparkline values={trend} label={title} />
    </article>
  );
}

function UptimeIndicator({ value }) {
  const percentage = Number(value);
  const valid = Number.isFinite(percentage) && percentage >= 0 && percentage <= 100;
  return (
    <div className={`${styles.uptimeRing} ${valid ? "" : styles.uptimeUnknown}`} style={valid ? { "--uptime": `${percentage}%` } : undefined} role="img" aria-label={valid ? `${percentage}% uptime` : "Uptime data unavailable"}>
      <div>
        <strong>{valid ? `${percentage}%` : "—"}</strong>
        <span>uptime</span>
      </div>
    </div>
  );
}

function EmptyState({ title, message, icon: Icon }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}><Icon size={20} aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export default function Infrastructure() {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthHistory, setHealthHistory] = useState(null);
  const [envs, setEnvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      businessDashboardApi.getInfraOverview(),
      businessDashboardApi.getInfraHealth({}).catch((err) => {
        console.warn("[Infrastructure] health status unavailable", err?.requestId, err?.message);
        return null;
      }),
      businessDashboardApi.getEnvironments({ page: 1, limit: 10 }),
      businessDashboardApi.getHealthHistory({ limit: 10 }).catch((err) => {
        console.warn("[Infrastructure] health history unavailable", err?.requestId, err?.message);
        return null;
      }),
    ]).then(([ov, h, e, history]) => {
      if (!active) return;
      if (ov.status === "fulfilled") setOverview(unwrap(ov.value));
      if (h.status === "fulfilled") setHealth(unwrap(h.value));
      if (history.status === "fulfilled") setHealthHistory(unwrap(history.value));
      if (e.status === "fulfilled") {
        const result = unwrap(e.value);
        const list = Array.isArray(result) ? result : result?.environments || result?.items || [];
        setEnvs(Array.isArray(list) ? list : []);
      }
      const firstFail = [ov, h, e, history].find((result) => result.status === "rejected");
      if (firstFail) setError(firstFail.reason?.message || "Some infrastructure data could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className={styles.loading} aria-live="polite">Loading infrastructure…</div>;

  const deploymentCount = valuesFrom(overview, ["deploymentCount", "totalDeployments", "deployments"]);
  const backupCount = valuesFrom(overview, ["backupCount", "totalBackups", "backups"]);
  const healthCheckCount = valuesFrom(health, ["healthCheckCount", "totalHealthChecks", "checks", "healthChecks"]);
  const deployments = metricValue(deploymentCount, envs.length);
  const backups = metricValue(backupCount);
  const checks = metricValue(healthCheckCount);
  const healthStatus = valuesFrom(health, ["status", "overallStatus", "health"]) ?? valuesFrom(overview, ["healthStatus"]);
  const uptime = valuesFrom(health, ["uptime", "uptimePercentage", "availability"]) ?? valuesFrom(overview, ["uptime", "uptimePercentage"]);
  const backupStatus = valuesFrom(overview, ["backupStatus", "lastBackupStatus"]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Infrastructure</h2>
          <p className={styles.subtitle}>Deployment activity, backup coverage, and platform health at a glance.</p>
        </div>
        <span className={styles.liveIndicator}><span /> Platform overview</span>
      </header>
      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.metricsGrid}>
        <MetricCard title="Deployments" value={deployments} icon={Cloud} tone="var(--blue)" trend={seriesFrom(overview, ["deploymentHistory", "deploymentTrend", "deployments"])} />
        <MetricCard title="Backups" value={backups} icon={Database} tone="var(--purple)" trend={seriesFrom(overview, ["backupHistory", "backupTrend", "backups"])} />
        <MetricCard title="Health checks" value={checks} icon={Activity} tone="var(--green)" trend={seriesFrom(healthHistory, ["healthHistory", "checks", "history", "series"])} />
      </div>

      <div className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.healthPanel}`}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}><HeartPulse size={17} aria-hidden="true" /><h3>Service health</h3></div>
            <span className={`${styles.statusPill} ${String(healthStatus || "").toLowerCase() === "healthy" || String(healthStatus || "").toLowerCase() === "ok" ? styles.statusGood : styles.statusNeutral}`}>
              {formatStatus(healthStatus)}
            </span>
          </div>
          <div className={styles.healthContent}>
            <UptimeIndicator value={uptime} />
            <div className={styles.healthDetails}>
              <strong>Platform health checks</strong>
              <p>{checks === "—" ? "Waiting for health-check data." : `${checks} checks reported by the platform.`}</p>
              <Sparkline values={seriesFrom(healthHistory, ["healthHistory", "checks", "history", "series"])} label="Health checks" />
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}><Server size={17} aria-hidden="true" /><h3>Environments</h3></div>
            <span className={styles.countBadge}>{envs.length}</span>
          </div>
          {envs.length === 0 ? (
            <EmptyState title="No environments configured" message="Environment status will appear here once deployments are connected." icon={Cloud} />
          ) : (
            <div className={styles.environmentList}>
              {envs.map((environment, index) => {
                const activeEnvironment = Boolean(environment.isActive ?? String(environment.status).toLowerCase() === "active");
                return (
                  <div key={environment.id || environment.slug || environment.name || index} className={styles.environmentRow}>
                    <span className={`${styles.environmentIcon} ${activeEnvironment ? styles.environmentIconActive : ""}`}><Server size={16} aria-hidden="true" /></span>
                    <div className={styles.environmentInfo}>
                      <strong>{environment.name || environment.slug || `Environment ${index + 1}`}</strong>
                      <span>{formatStatus(environment.status || environment.slug || "status unavailable")}</span>
                    </div>
                    <span className={`${styles.statusPill} ${activeEnvironment ? styles.statusGood : styles.statusNeutral}`}>
                      {activeEnvironment ? "Active" : "Inactive"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}><Database size={17} aria-hidden="true" /><h3>Backup coverage</h3></div>
            <span className={`${styles.statusPill} ${String(backupStatus || "").toLowerCase() === "healthy" || String(backupStatus || "").toLowerCase() === "complete" ? styles.statusGood : styles.statusNeutral}`}>
              {formatStatus(backupStatus || (backups === "—" ? "Awaiting data" : "Reported"))}
            </span>
          </div>
          <div className={styles.backupContent}>
            <strong className={styles.backupValue}>{backups}</strong>
            <span className={styles.backupLabel}>backups reported</span>
            <Sparkline values={seriesFrom(overview, ["backupHistory", "backupTrend", "backups"])} label="Backups" />
          </div>
          {backups === "—" && <p className={styles.panelNote}>Backup metrics will appear when the platform reports backup history.</p>}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}><Shield size={17} aria-hidden="true" /><h3>Security posture</h3></div>
          </div>
          <EmptyState title="Managed in Settings" message="Review and update platform security policies in Settings → Policies." icon={Shield} />
        </article>
      </div>
    </section>
  );
}
