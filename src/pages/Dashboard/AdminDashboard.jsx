import { useEffect, useState } from "react";
import { Store, BadgeCheck, Hourglass, Wallet, ClipboardList, CircleDot, ShoppingBag, Globe, Activity, TrendingDown, Zap, HardDrive } from "lucide-react";
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
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon} style={{ background: metric.color + "22", color: metric.color }}>
          <Icon size={18} />
        </span>
        {metric.trend && (
          <span className={styles.metricTrend} style={{ color: metric.trend.startsWith("-") ? "var(--red)" : "var(--green)" }}>
            {metric.trend}
          </span>
        )}
      </div>
      <div className={styles.metricLabel}>{metric.label}</div>
      <div className={styles.metricValue}>
        {metric.formatter ? metric.formatter(value) : formatNumber(value)}
      </div>
      {metric.trendLabel && <div className={styles.metricTrendLabel}>{metric.trendLabel}</div>}
    </article>
  );
}

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
  if ((!data || data.length === 0) && !hasTenant) return <div className={styles.chartPlaceholder}>Revenue data will appear here when backend provides analytics endpoint</div>;
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
  if ((!data || data.length === 0) && !hasTenant) return <div className={styles.chartPlaceholder}>Merchant growth data will appear here when backend provides analytics endpoint</div>;
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

export default function AdminDashboard({ showToast }) {
  const [overview, setOverview] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tenantRevenueTrend, setTenantRevenueTrend] = useState(null);
  const [tenantGrowthTrend, setTenantGrowthTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      businessDashboardApi.getOverview(),
      businessDashboardApi.getPlatformStats(),
      businessDashboardApi.getHealth().catch(() => null),
      businessDashboardApi.getBffAnalytics().catch(() => null),
    ])
      .then(([overviewRes, statsRes, healthRes, analyticsRes]) => {
        if (active) {
          const ov = overviewRes?.overview || overviewRes?.stats || overviewRes?.data || overviewRes;
          const an = analyticsRes?.data || analyticsRes;
          setOverview(ov);
          setPlatformStats(statsRes?.stats || statsRes?.data || statsRes);
          setHealth(healthRes?.data || healthRes);
          setAnalytics(an);
          // If tenant-correlated series already in analytics, use it directly (good-practice tenant coloring)
          if (an?.tenantRevenueTrend || an?.tenantGrowth) {
            setTenantRevenueTrend(an.tenantRevenueTrend || null);
            setTenantGrowthTrend(an.tenantGrowth || an.tenantUserGrowth || null);
          } else if (ov) {
            // Enrich platform overview with tenant app data from first linked merchant — merchant is separate portal, tenant is mobile
            businessDashboardApi.getMerchants({ page: 1, limit: 5 }).then((mRes) => {
              const list = mRes?.data || mRes?.merchants || mRes?.items || [];
              const linked = list.find((m) => m.tenantId || m.tenant_id || m.slug);
              if (!linked || !active) return;
              const tenantId = linked.tenantId || linked.tenant_id || linked.slug;
              // Fetch tenant analytics for correlation; failures are silent (site-builder-only merchants)
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
              // Also try summary for tenant revenue fallback
              businessDashboardApi.getTenantSummary(tenantId).then((sRes) => {
                const s = sRes?.data || sRes;
                if (active && !tenantRevenueTrend && s?.revenueTrend && Array.isArray(s.revenueTrend)) {
                  setTenantRevenueTrend(s.revenueTrend);
                }
              }).catch(() => {});
            }).catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load the platform overview.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <section className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Platform Overview</h2>
            <p className={styles.subtitle}>Live administrative data from the Business Dashboard API.</p>
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

  if (error) {
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

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Platform Overview</h2>
          <p className={styles.subtitle}>Live administrative data from the Business Dashboard API.</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.refreshTime}>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <div className={styles.metricsGrid} role="region" aria-label="Key metrics">
        {METRIC_CARDS.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            value={overviewData[metric.key] ?? statsData[metric.key] ?? 0}
          />
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <section className={styles.chartCard} aria-labelledby="revenue-chart-title">
          <header className={styles.chartHeader}>
            <h3 id="revenue-chart-title" className={styles.chartTitle}>Revenue Trend (12 months)</h3>
            <p className={styles.chartDesc}>Monthly revenue in NGN {analytics ? "· live via bff/admin/analytics" : ""} {tenantRevenueTrend ? "· tenant correlated (teal dashed)" : ""}</p>
          </header>
          <RevenueChart data={analytics?.revenueTrend || overviewData.revenueTrend || []} tenantData={tenantRevenueTrend || analytics?.tenantRevenueTrend || overviewData.tenantRevenueTrend} />
        </section>
        <section className={styles.chartCard} aria-labelledby="merchant-chart-title">
          <header className={styles.chartHeader}>
            <h3 id="merchant-chart-title" className={styles.chartTitle}>Merchant Growth (12 months)</h3>
            <p className={styles.chartDesc}>Active merchants (Site Builder) {tenantGrowthTrend ? "· Tenant (Mobile) teal line" : analytics ? "· live" : ""}</p>
          </header>
          <MerchantGrowthChart data={analytics?.userGrowth || overviewData.merchantGrowth || []} tenantData={tenantGrowthTrend || analytics?.tenantGrowth} />
        </section>
      </div>

      <section className={styles.quickStats} aria-labelledby="quick-stats-title">
        <h3 id="quick-stats-title" className={styles.sectionTitle}>Platform Health {health ? `· ${health.status}` : ""}</h3>
        <div className={styles.quickStatsGrid}>
          <QuickStat
            label="API Uptime"
            value={health?.uptime ? health.uptime + "%" : statsData.platformUptime ? statsData.platformUptime + "%" : "—"}
            icon={Activity}
            color="var(--green)"
          />
          <QuickStat
            label="Error Rate (24h)"
            value={statsData.errorRate != null ? statsData.errorRate + "%" : "—"}
            icon={TrendingDown}
            color="var(--red)"
          />
          <QuickStat
            label="Avg Response Time"
            value={statsData.avgResponseTime != null ? statsData.avgResponseTime + "ms" : "—"}
            icon={Zap}
            color="var(--amber)"
          />
          <QuickStat
            label="Storage Used"
            value={statsData.storageUsedGB != null ? statsData.storageUsedGB + " GB" : "—"}
            icon={HardDrive}
            color="var(--purple)"
          />
        </div>
      </section>
    </section>
  );
}

function QuickStat({ label, value, icon: Icon, color }) {
  return (
    <article className={styles.quickStat}>
      <div className={styles.quickStatIcon} style={{ background: color + "22", color }}>
        <Icon size={18} />
      </div>
      <div className={styles.quickStatValue}>{value}</div>
      <div className={styles.quickStatLabel}>{label}</div>
    </article>
  );
}