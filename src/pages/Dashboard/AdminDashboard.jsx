import { useEffect, useState } from "react";
import { Store, BadgeCheck, Hourglass, Wallet, ClipboardList, CircleDot, BarChart3, Puzzle, Settings } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import styles from "./AdminDashboard.module.css";

function formatNumber(value) {
  if (typeof value !== "number") return String(value);
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toLocaleString();
}

function formatCurrency(value, currency = "NGN") {
  if (typeof value !== "number") return String(value);
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function seriesValues(series, field) {
  if (!Array.isArray(series)) return [];
  return series
    .map((point) => (typeof point === "number" ? point : Number(point?.[field])))
    .filter(Number.isFinite);
}

const METRIC_CARDS = [
  { key: "totalMerchants", label: "Total Merchants", icon: Store, color: "var(--blue)" },
  { key: "activeMerchants", label: "Active Merchants", icon: BadgeCheck, color: "var(--green)" },
  { key: "pendingMerchants", label: "Pending Review", icon: Hourglass, color: "var(--amber)" },
  { key: "totalPlatformStaff", label: "Platform Staff", icon: ClipboardList, color: "var(--indigo)", formatter: formatNumber },
  { key: "revenue30Days", label: "Revenue (30 days)", icon: Wallet, color: "var(--purple)", formatter: formatCurrency },
  { key: "totalSubscriptions", label: "Total Subscriptions", icon: ClipboardList, color: "var(--indigo)" },
  { key: "activeSubscriptions", label: "Active Subscriptions", icon: CircleDot, color: "var(--teal)" },
];

function SkeletonCard() {
  return (
    <article className={styles.metricCard} aria-hidden="true">
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonText} style={{ width: "60%" }} />
      <div className={styles.skeletonText} style={{ width: "40%", marginTop: 8 }} />
      <div className={styles.skeletonText} style={{ width: "80%", marginTop: 12 }} />
    </article>
  );
}

function MetricCard({ metric, value, loading }) {
  if (loading) return <SkeletonCard />;
  const Icon = metric.icon;
  const trendText = [metric.trend, metric.trendLabel].filter(Boolean).join(" ");
  const trendNegative = typeof metric.trend === "string" && metric.trend.startsWith("-");
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricTopRow}>
        <div className={styles.metricLabel}>{metric.label}</div>
        <span className={styles.metricIconMuted} aria-hidden="true">
          <Icon size={20} />
        </span>
      </div>
      <div className={styles.metricValue}>
        {value == null ? "—" : metric.formatter ? metric.formatter(value) : formatNumber(value)}
      </div>
      {trendText && (
        <div className={`${styles.metricTrendLine} ${trendNegative ? styles.metricTrendNegative : styles.metricTrendPositive}`}>
          {trendText}
        </div>
      )}
    </article>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return "unknown time";
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "unknown time";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatUptime(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function eventBadges(action) {
  const a = String(action || "").toLowerCase();
  const category = /secur|login|auth|password|token|breach/.test(a)
    ? { label: "Security", color: "#E74C3C" }
    : /user|merchant|tenant|admin|member|customer/.test(a)
      ? { label: "User", color: "#F4A026" }
      : { label: "System", color: "#3B82F6" };
  const priority = /suspend|reject|delete|ban|cancel|fail|breach|revoke/.test(a)
    ? { label: "High", background: "#E74C3C", color: "#fff" }
    : /login|view|read|fetch|logout/.test(a)
      ? { label: "Low", background: "#2ECC71", color: "#1A1A2E" }
      : { label: "Medium", background: "#F4A026", color: "#fff" };
  return { category, priority };
}

function humanizeAction(action) {
  return String(action || "system event").replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
}

const QUICK_ACTIONS = [
  { icon: Store, title: "Merchant Management", subtitle: "Manage all merchants", button: "Manage", filled: true, route: "merchants" },
  { icon: BarChart3, title: "Platform Analytics", subtitle: "View detailed metrics", button: "View", filled: false, route: "analytics" },
  { icon: Puzzle, title: "App Moderation", subtitle: "Review pending apps", button: "Review", filled: false, route: "marketplace" },
  { icon: Settings, title: "System Settings", subtitle: "Configure platform", button: "Configure", filled: false, route: "settings" },
];

function RevenueChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return <div className={styles.chartPlaceholder}>No revenue data yet</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 + 10;
    return `${x}% ${y}%`;
  }).join(", ");
  const areaPoints = ["0% 100%", ...points.split(", "), "100% 100%"].join(", ");
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} role="img" aria-label="Revenue trend chart">
        <polygon fill="var(--amber-alpha-10)" points={areaPoints} />
        <polyline fill="none" stroke="var(--amber)" strokeWidth="2.5" points={points} />
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 3, background: "var(--amber)", borderRadius: 2, display: "inline-block" }} /> Platform revenue</span>
      </div>
    </div>
  );
}

function MerchantGrowthChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return <div className={styles.chartPlaceholder}>No user data yet</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const bars = data.map((value, i) => {
    const height = ((value - min) / range) * 80 + 10;
    const x = data.length === 1 ? 15 : (i / (data.length - 1)) * 85;
    const width = data.length === 1 ? 70 : 100 / data.length * 0.7;
    return <rect key={i} x={x + "%"} y={100 - height + "%"} width={width + "%"} height={height + "%"} fill="var(--blue)" rx="2" />;
  });
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} role="img" aria-label="Platform user growth chart">
        {bars}
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--blue)", borderRadius: 2, display: "inline-block" }} /> Platform users</span>
      </div>
    </div>
  );
}

export default function AdminDashboard({ setPage }) {
  const [overview, setOverview] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let active = true;
    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    Promise.allSettled([
      businessDashboardApi.getOverview(),
      businessDashboardApi.getPlatformStats(),
      businessDashboardApi.getHealth(),
      businessDashboardApi.getBffAnalytics({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        groupBy: "day",
      }),
      businessDashboardApi.getAuditLog({ page: 1, limit: 5 }),
    ]).then((results) => {
      if (!active) return;
      const [ovRes, statsRes, healthRes, analyticsRes, eventsRes] = results;
      const nextErrors = [];
      if (ovRes.status === "fulfilled") {
        const ov = ovRes.value?.overview || ovRes.value?.stats || ovRes.value?.data || ovRes.value;
        setOverview(ov);
      } else nextErrors.push(`Overview: ${ovRes.reason?.message || "Unavailable"}`);
      if (statsRes.status === "fulfilled") {
        setPlatformStats(statsRes.value?.stats || statsRes.value?.data || statsRes.value);
      } else nextErrors.push(`Subscription metrics: ${statsRes.reason?.message || "Unavailable"}`);
      if (healthRes.status === "fulfilled") setHealth(healthRes.value?.data || healthRes.value);
      else nextErrors.push(`System health: ${healthRes.reason?.message || "Unavailable"}`);
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value?.data || analyticsRes.value);
      else nextErrors.push(`Revenue trend: ${analyticsRes.reason?.message || "Unavailable"}`);
      if (eventsRes.status === "fulfilled" && eventsRes.value) {
        const raw = eventsRes.value;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.logs || raw?.items || raw?.events || [];
        if (Array.isArray(list)) setRecentEvents(list.slice(0, 5));
      } else if (eventsRes.status === "rejected") nextErrors.push(`Recent events: ${eventsRes.reason?.message || "Unavailable"}`);
      setErrors(nextErrors);
      if (results.some((result) => result.status === "fulfilled")) setLastUpdated(new Date());
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <section className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.headerLeft} />
        </header>
        <div className={styles.metricsGrid} role="status" aria-live="polite">
        {METRIC_CARDS.map((metric) => <SkeletonCard key={metric.key} />)}
        </div>
        <div className={styles.chartsGrid}>
          <section className={styles.chartCard}><div className={styles.chartSkeleton} /></section>
          <section className={styles.chartCard}><div className={styles.chartSkeleton} /></section>
        </div>
      </section>
    );
  }

  const overviewData = overview || {};
  const statsData = platformStats || {};
  const analyticsData = analytics || {};

  const getMetricValue = (key) => {
    const values = {
      totalMerchants: overviewData.totalTenants,
      activeMerchants: overviewData.publishedTenants,
      pendingMerchants: overviewData.inReviewTenants,
      totalPlatformStaff: overviewData.totalPlatformStaff,
      revenue30Days: analyticsData.gmv,
      totalSubscriptions: statsData.totalSubscriptions,
      activeSubscriptions: statsData.activeSubscriptions,
    };
    const value = values[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };

  const systemMetricRows = [
    { label: "API Status", value: health?.status || "Unavailable" },
    { label: "Database", value: health?.checks?.database || "Unavailable" },
    { label: "Process Uptime", value: formatUptime(health?.uptime) },
  ];

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft} />
        <div className={styles.headerRight}>
          <span className={styles.refreshTime}>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</span>
        </div>
      </header>
      {errors.length > 0 && (
        <div className={styles.error} role="alert" style={{ marginBottom: 16 }}>
          <strong>Some dashboard data is unavailable.</strong>
          {errors.map((message) => <div key={message}>{message}</div>)}
        </div>
      )}

      <div className={styles.metricsGrid} role="region" aria-label="Key metrics">
        {METRIC_CARDS.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            value={getMetricValue(metric.key)}
          />
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <section className={styles.chartCard} aria-labelledby="revenue-chart-title">
          <header className={styles.chartHeader}>
            <h3 id="revenue-chart-title" className={styles.chartTitle}>Revenue Trend (30 days)</h3>
            <p className={styles.chartDesc}>Paid revenue in NGN</p>
          </header>
          <RevenueChart data={seriesValues(analytics?.revenueTrend || overviewData.revenueTrend, "revenue")} />
        </section>
        <section className={styles.chartCard} aria-labelledby="merchant-chart-title">
          <header className={styles.chartHeader}>
            <h3 id="merchant-chart-title" className={styles.chartTitle}>Platform User Growth (12 months)</h3>
            <p className={styles.chartDesc}>New platform users</p>
          </header>
          <MerchantGrowthChart data={seriesValues(analytics?.userGrowth, "count")} />
        </section>
      </div>

      <div className={styles.panelsGrid}>
        <section className={styles.panelCard} aria-labelledby="system-metrics-title">
          <h3 id="system-metrics-title" className={styles.sectionTitle}>System Metrics</h3>
          <div role="list">
            {systemMetricRows.map((row) => (
              <div key={row.label} className={styles.systemMetricRow} role="listitem">
                <span className={styles.systemMetricLabel}>{row.label}</span>
                <span className={styles.systemMetricValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panelCard} aria-labelledby="quick-actions-title">
          <h3 id="quick-actions-title" className={styles.sectionTitle}>Quick Actions</h3>
          <div>
            {QUICK_ACTIONS.map((action) => {
              const ActionIcon = action.icon;
              return (
                <div key={action.title} className={styles.quickActionRow}>
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <ActionIcon size={18} />
                  </span>
                  <span className={styles.quickActionText}>
                    <span className={styles.quickActionTitle}>{action.title}</span>
                    <span className={styles.quickActionSubtitle}>{action.subtitle}</span>
                  </span>
                  <button
                    type="button"
                    className={action.filled ? styles.quickActionBtnFilled : styles.quickActionBtnGhost}
                    onClick={() => { if (typeof setPage === "function") setPage(action.route); }}
                  >
                    {action.button}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className={styles.panelCard} aria-labelledby="recent-events-title">
        <h3 id="recent-events-title" className={styles.sectionTitle}>Recent System Events</h3>
        {recentEvents.length === 0 ? (
          <p className={styles.eventsEmpty}>No recent events.</p>
        ) : (
          <div>
            {recentEvents.map((event, index) => {
              const { category, priority } = eventBadges(event.action);
              const actor = event.adminEmail || event.actor || event.user || "System";
              const when = event.createdAt || event.timestamp || event.time;
              return (
                <div key={event.id || index} className={styles.eventRow}>
                  <div className={styles.eventMain}>
                    <div className={styles.eventTopLine}>
                      <span className={styles.eventId}>#EVT{String(index + 1).padStart(3, "0")}</span>
                      <span
                        className={styles.eventCategoryBadge}
                        style={{ background: `${category.color}26`, color: category.color }}
                      >
                        {category.label}
                      </span>
                      <span
                        className={styles.eventPriorityBadge}
                        style={{ background: priority.background, color: priority.color }}
                      >
                        {priority.label}
                      </span>
                    </div>
                    <div className={styles.eventTitle}>{humanizeAction(event.action)}</div>
                    <div className={styles.eventAttr}>{actor} · {timeAgo(when)}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.eventDetailsLink}
                    onClick={() => { if (typeof setPage === "function") setPage("audit"); }}
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
