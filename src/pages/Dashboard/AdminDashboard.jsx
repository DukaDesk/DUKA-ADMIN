import { useEffect, useState } from "react";
import { Store, BadgeCheck, Hourglass, Wallet, ClipboardList, CircleDot, ShoppingBag, Globe, Shield, BarChart3, Puzzle, Settings } from "lucide-react";
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

const METRIC_CARDS = [
  { key: "totalMerchants", label: "Total Merchants", icon: Store, color: "var(--blue)" },
  { key: "activeMerchants", label: "Active Merchants", icon: BadgeCheck, color: "var(--green)" },
  { key: "pendingMerchants", label: "Pending Review", icon: Hourglass, color: "var(--amber)" },
  { key: "totalUsers", label: "Total Staff", icon: ClipboardList, color: "var(--indigo)", formatter: formatNumber },
  { key: "monthlyRevenue", label: "Monthly Revenue", icon: Wallet, color: "var(--purple)", formatter: formatCurrency },
  { key: "totalSubscriptions", label: "Total Subscriptions", icon: ClipboardList, color: "var(--indigo)" },
  { key: "activeSubscriptions", label: "Active Subscriptions", icon: CircleDot, color: "var(--teal)" },
  { key: "totalMarketplaceListings", label: "Marketplace Listings", icon: ShoppingBag, color: "var(--orange)" },
  { key: "publishedListings", label: "Published Listings", icon: Globe, color: "var(--cyan)" },
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
        {metric.formatter ? metric.formatter(value) : formatNumber(value)}
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

function Sparkline({ data, color = "var(--amber)" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 90;
    return `${x}% ${y}%`;
  }).join(", ");
  return (
    <svg className={styles.sparkline} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

function RevenueChart({ data, tenantData }) {
  const hasTenant = Array.isArray(tenantData) && tenantData.length > 1;
  if ((!data || data.length === 0) && !hasTenant) return <div className={styles.chartPlaceholder}>No revenue data yet</div>;
  const primary = data && data.length ? data : hasTenant ? tenantData : [];
  const max = Math.max(...(hasTenant ? [...primary, ...tenantData] : primary));
  const min = Math.min(...(hasTenant ? [...primary, ...tenantData] : primary));
  const range = max - min || 1;
  const toPoints = (arr) => arr.map((value, i) => {
    const x = (i / (arr.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 + 10;
    return `${x}% ${y}%`;
  }).join(", ");
  const points = primary.length ? toPoints(primary) : "";
  const tenantPoints = hasTenant ? toPoints(tenantData) : "";
  const areaPoints = primary.length ? [0 + "% 100%", ...points.split(", "), 100 + "% 100%"].join(", ") : "";
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} role="img" aria-label="Revenue trend chart">
        {primary.length > 0 && <polygon fill="var(--amber-alpha-10)" points={areaPoints} />}
        {primary.length > 0 && <polyline fill="none" stroke="var(--amber)" strokeWidth="2.5" points={points} />}
        {hasTenant && <polyline fill="none" stroke="var(--teal)" strokeWidth="2" strokeDasharray="3 2" points={tenantPoints} />}
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 3, background: "var(--amber)", borderRadius: 2, display: "inline-block" }} /> Merchant (Site Builder)</span>
        {hasTenant && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 3, background: "var(--teal)", borderRadius: 2, display: "inline-block", border: "1px dashed var(--teal)" }} /> Tenant (Mobile App)</span>}
      </div>
    </div>
  );
}

function MerchantGrowthChart({ data, tenantData }) {
  const hasTenant = Array.isArray(tenantData) && tenantData.length > 1;
  if ((!data || data.length === 0) && !hasTenant) return <div className={styles.chartPlaceholder}>No merchant data yet</div>;
  const primary = data && data.length ? data : hasTenant ? tenantData : [];
  const allVals = hasTenant ? [...primary, ...tenantData] : primary;
  const max = Math.max(...allVals);
  const min = Math.min(...allVals);
  const range = max - min || 1;
  const bars = primary.map((value, i) => {
    const height = ((value - min) / range) * 80 + 10;
    const x = (i / (primary.length - 1)) * 100;
    const width = 100 / primary.length * 0.7;
    return <rect key={i} x={x + "%"} y={100 - height + "%"} width={width + "%"} height={height + "%"} fill="var(--blue)" rx="2" />;
  });
  const tenantPoints = hasTenant ? tenantData.map((value, i) => {
    const x = (i / (tenantData.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 + 10;
    return `${x}% ${y}%`;
  }).join(", ") : "";
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} role="img" aria-label="Merchant growth chart">
        {bars}
        {hasTenant && <polyline fill="none" stroke="var(--teal)" strokeWidth="2" points={tenantPoints} />}
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--blue)", borderRadius: 2, display: "inline-block" }} /> Merchant (Site Builder)</span>
        {hasTenant && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 3, background: "var(--teal)", borderRadius: 2, display: "inline-block" }} /> Tenant (Mobile)</span>}
      </div>
    </div>
  );
}

export default function AdminDashboard({ showToast, setPage }) {
  const [overview, setOverview] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [marketplaceStats, setMarketplaceStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [tenantRevenueTrend, setTenantRevenueTrend] = useState(null);
  const [tenantGrowthTrend, setTenantGrowthTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      businessDashboardApi.getOverview(),
      businessDashboardApi.getPlatformStats(),
      businessDashboardApi.getHealth().catch(() => null),
      businessDashboardApi.getBffAnalytics().catch(() => null),
      businessDashboardApi.getMarketplaceStats().catch(() => null),
      businessDashboardApi.getAuditLog({ page: 1, limit: 5 }).catch(() => null),
    ]).then((results) => {
      if (!active) return;
      const [ovRes, statsRes, healthRes, analyticsRes, marketplaceRes, eventsRes] = results;
      if (ovRes.status === "fulfilled") {
        const ov = ovRes.value?.overview || ovRes.value?.stats || ovRes.value?.data || ovRes.value;
        setOverview(ov);
        const an = analyticsRes.status === "fulfilled" ? analyticsRes.value?.data || analyticsRes.value : null;
        if (an?.tenantRevenueTrend || an?.tenantGrowth) {
          setTenantRevenueTrend(an.tenantRevenueTrend || null);
          setTenantGrowthTrend(an.tenantGrowth || an.tenantUserGrowth || null);
        } else if (ov) {
          businessDashboardApi.getMerchants({ page: 1, limit: 5 }).then((mRes) => {
            const list = mRes?.data || mRes?.merchants || mRes?.items || [];
            const linked = list.find((m) => m.tenantId || m.tenant_id || m.slug);
            if (!linked || !active) return;
            const tenantId = linked.tenantId || linked.tenant_id || linked.slug;
            businessDashboardApi.getTenantAnalytics(tenantId).then((tRes) => {
              const t = tRes?.data || tRes;
              const rev = t?.revenueTrend || t?.revenue || t?.monthlyRevenue;
              const growth = t?.userGrowth || t?.growth || t?.tenantGrowth;
              if (active) {
                if (Array.isArray(rev)) setTenantRevenueTrend(rev);
                else if (Array.isArray(t?.trend)) setTenantRevenueTrend(t.trend);
                if (Array.isArray(growth)) setTenantGrowthTrend(growth);
              }
            }).catch(() => {});
            businessDashboardApi.getTenantSummary(tenantId).then((sRes) => {
              const s = sRes?.data || sRes;
              if (active && !tenantRevenueTrend && s?.revenueTrend && Array.isArray(s.revenueTrend)) {
                setTenantRevenueTrend(s.revenueTrend);
              }
            }).catch(() => {});
          }).catch(() => {});
        }
      } else if (ovRes.reason) {
        const rid = ovRes.reason?.requestId ? ` (Ref: ${String(ovRes.reason.requestId).slice(0, 8)})` : "";
        console.warn("[AdminDashboard] overview failed", ovRes.reason.requestId, ovRes.reason.message);
        setError(ovRes.reason.message + rid);
      }
      if (statsRes.status === "fulfilled") {
        setPlatformStats(statsRes.value?.stats || statsRes.value?.data || statsRes.value);
      } else if (statsRes.reason) {
        console.warn("[AdminDashboard] stats failed", statsRes.reason.requestId, statsRes.reason.message);
        if (!error) showToast?.(`Stats temporarily unavailable. (Ref: ${String(statsRes.reason.requestId||"").slice(0,8)})`, "error");
      }
      if (healthRes.status === "fulfilled") setHealth(healthRes.value?.data || healthRes.value);
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value?.data || analyticsRes.value);
      if (marketplaceRes.status === "fulfilled") setMarketplaceStats(marketplaceRes.value?.data || marketplaceRes.value);
      if (eventsRes.status === "fulfilled" && eventsRes.value) {
        const raw = eventsRes.value;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.logs || raw?.items || raw?.events || [];
        if (Array.isArray(list)) setRecentEvents(list.slice(0, 5));
      }
      // Log any failures for support; health/analytics/marketplace are optional so no error banner
      results.forEach((r, i) => {
        if (r.status === "rejected" && r.reason?.requestId) console.warn("[AdminDashboard] part failed", i, r.reason.requestId);
      });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [showToast]);

  if (loading) {
    return (
      <section className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Platform Overview</h2>
          </div>
        </header>
        <div className={styles.metricsGrid} role="status" aria-live="polite">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className={styles.chartsGrid}>
          <section className={styles.chartCard}><div className={styles.chartSkeleton} /></section>
          <section className={styles.chartCard}><div className={styles.chartSkeleton} /></section>
        </div>
      </section>
    );
  }

  const hasCriticalError = Boolean(error && !overview && !platformStats);
  if (hasCriticalError) {
    return (
      <section className={styles.dashboard}>
        <div className={styles.error} role="alert">
          {error}
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
        </div>
      </section>
    );
  }

  const overviewData = overview || {};
  const statsData = platformStats || {};
  const marketData = marketplaceStats || {};

  // Backend uses tenant/tenants naming (KB merchant = tenant). Map to UI metric keys.
  const getMetricValue = (key) => {
    const aliases = {
      totalMerchants: ["totalTenants", "totalMerchants", "tenants", "totalTenantsCount"],
      activeMerchants: ["publishedTenants", "activeTenants", "activeMerchants", "published"],
      pendingMerchants: ["draftTenants", "pendingMerchants", "pending", "draft"],
      totalUsers: ["totalUsers", "users", "totalStaff"],
      monthlyRevenue: ["totalRevenue", "revenue", "monthlyRevenue", "gmv"],
      totalSubscriptions: ["totalSubscriptions", "subscriptions", "totalSubs"],
      activeSubscriptions: ["activeSubscriptions", "activeSubs"],
      totalMarketplaceListings: ["total", "totalListings", "totalMarketplaceListings", "listings", "totalProducts"],
      publishedListings: ["published", "publishedListings", "isPublished", "publishedTenants"],
    };
    const keys = aliases[key] || [key];
    for (const k of keys) {
      const v = overviewData[k] ?? statsData[k] ?? marketData[k] ?? overviewData?.data?.[k] ?? statsData?.data?.[k];
      if (v !== undefined && v !== null) return v;
    }
    // Fallback: check nested data objects from envelope
    if (overviewData.data && typeof overviewData.data === "object") {
      for (const k of keys) if (overviewData.data[k] !== undefined) return overviewData.data[k];
    }
    return 0;
  };

  const systemMetricRows = [
    { label: "API Uptime", value: health?.uptime ? health.uptime + "%" : statsData.platformUptime ? statsData.platformUptime + "%" : "—" },
    { label: "Error Rate (24h)", value: statsData.errorRate != null ? statsData.errorRate + "%" : "—" },
    { label: "Avg Response Time", value: statsData.avgResponseTime != null ? statsData.avgResponseTime + "ms" : "—" },
    { label: "Storage Used", value: statsData.storageUsedGB != null ? statsData.storageUsedGB + " GB" : "—" },
  ];

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitleRow}>
            <span className={styles.shieldIcon} aria-hidden="true">
              <Shield size={24} />
            </span>
            <div>
              <h2 className={styles.title}>Platform Overview</h2>
              <p className={styles.subtitle}>Complete visibility and control over DukaDesk</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.refreshTime}>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>
      {error && (overview || platformStats) && (
        <div className={styles.error} role="alert" style={{ marginBottom: 16 }}>
          {error} <span style={{ opacity: 0.8 }}>— showing cached/partial data.</span>
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
            <h3 id="revenue-chart-title" className={styles.chartTitle}>Revenue Trend (12 months)</h3>
            <p className={styles.chartDesc}>Monthly revenue in NGN</p>
          </header>
          <RevenueChart data={analytics?.revenueTrend || overviewData.revenueTrend || []} tenantData={tenantRevenueTrend || analytics?.tenantRevenueTrend || overviewData.tenantRevenueTrend} />
        </section>
        <section className={styles.chartCard} aria-labelledby="merchant-chart-title">
          <header className={styles.chartHeader}>
            <h3 id="merchant-chart-title" className={styles.chartTitle}>Merchant Growth (12 months)</h3>
            <p className={styles.chartDesc}>Active merchants count</p>
          </header>
          <MerchantGrowthChart data={analytics?.userGrowth || overviewData.merchantGrowth || []} tenantData={tenantGrowthTrend || analytics?.tenantGrowth} />
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