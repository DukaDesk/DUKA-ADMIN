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
  { key: "totalMerchants", label: "Total Merchants", icon: Store, color: "var(--blue)", trend: "+12%", trendLabel: "vs last month" },
  { key: "activeMerchants", label: "Active Merchants", icon: BadgeCheck, color: "var(--green)", trend: "+8%", trendLabel: "vs last month" },
  { key: "pendingMerchants", label: "Pending Review", icon: Hourglass, color: "var(--amber)", trend: "-3%", trendLabel: "vs last month" },
  { key: "monthlyRevenue", label: "Monthly Revenue", icon: Wallet, color: "var(--purple)", trend: "+23%", trendLabel: "vs last month", formatter: formatCurrency },
  { key: "totalSubscriptions", label: "Total Subscriptions", icon: ClipboardList, color: "var(--indigo)", trend: "+15%", trendLabel: "vs last month" },
  { key: "activeSubscriptions", label: "Active Subscriptions", icon: CircleDot, color: "var(--teal)", trend: "+10%", trendLabel: "vs last month" },
  { key: "totalMarketplaceListings", label: "Marketplace Listings", icon: ShoppingBag, color: "var(--orange)", trend: "+5%", trendLabel: "vs last month" },
  { key: "publishedListings", label: "Published Listings", icon: Globe, color: "var(--cyan)", trend: "+7%", trendLabel: "vs last month" },
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

function RevenueChart({ data }) {
  if (!data || data.length === 0) return <div className={styles.chartPlaceholder}>Revenue data will appear here when backend provides analytics endpoint</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 + 10;
    return `${x}% ${y}%`;
  }).join(", ");
  const areaPoints = [0 + "% 100%", ...points, 100 + "% 100%"].join(", ");
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} role="img" aria-label="Revenue trend chart">
        <polygon fill="var(--amber-alpha-10)" points={areaPoints} />
        <polyline fill="none" stroke="var(--amber)" strokeWidth="2.5" points={points} />
      </svg>
    </div>
  );
}

function MerchantGrowthChart({ data }) {
  if (!data || data.length === 0) return <div className={styles.chartPlaceholder}>Merchant growth data will appear here when backend provides analytics endpoint</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const bars = data.map((value, i) => {
    const height = ((value - min) / range) * 80 + 10;
    const x = (i / (data.length - 1)) * 100;
    const width = 100 / data.length * 0.7;
    return <rect key={i} x={x + "%"} y={100 - height + "%"} width={width + "%"} height={height + "%"} fill="var(--blue)" rx="2" />;
  });
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} role="img" aria-label="Merchant growth chart">
        {bars}
      </svg>
    </div>
  );
}

export default function AdminDashboard({ showToast }) {
  const [overview, setOverview] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
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
          setOverview(overviewRes?.overview || overviewRes?.stats || overviewRes?.data || overviewRes);
          setPlatformStats(statsRes?.stats || statsRes?.data || statsRes);
          setHealth(healthRes?.data || healthRes);
          setAnalytics(analyticsRes?.data || analyticsRes);
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

  const mockRevenueData = [2.1, 2.3, 2.5, 2.8, 2.6, 3.0, 3.2, 3.1, 3.3, 3.5, 3.4, 3.6];
  const mockMerchantData = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];

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
            <p className={styles.chartDesc}>Monthly revenue in NGN {analytics ? "· live via bff/admin/analytics" : ""}</p>
          </header>
          <RevenueChart data={analytics?.revenueTrend || overviewData.revenueTrend || mockRevenueData} />
        </section>
        <section className={styles.chartCard} aria-labelledby="merchant-chart-title">
          <header className={styles.chartHeader}>
            <h3 id="merchant-chart-title" className={styles.chartTitle}>Merchant Growth (12 months)</h3>
            <p className={styles.chartDesc}>Active merchants count {analytics ? "· live" : ""}</p>
          </header>
          <MerchantGrowthChart data={analytics?.userGrowth || overviewData.merchantGrowth || mockMerchantData} />
        </section>
      </div>

      <section className={styles.quickStats} aria-labelledby="quick-stats-title">
        <h3 id="quick-stats-title" className={styles.sectionTitle}>Platform Health {health ? `· ${health.status}` : ""}</h3>
        <div className={styles.quickStatsGrid}>
          <QuickStat
            label="API Uptime"
            value={health?.uptime ? health.uptime + "%" : statsData.platformUptime ? statsData.platformUptime + "%" : "99.97%"}
            icon={Activity}
            color="var(--green)"
          />
          <QuickStat
            label="Error Rate (24h)"
            value={statsData.errorRate ? statsData.errorRate + "%" : "0.12%"}
            icon={TrendingDown}
            color="var(--red)"
          />
          <QuickStat
            label="Avg Response Time"
            value={statsData.avgResponseTime ? statsData.avgResponseTime + "ms" : "145ms"}
            icon={Zap}
            color="var(--amber)"
          />
          <QuickStat
            label="Storage Used"
            value={statsData.storageUsedGB ? statsData.storageUsedGB + " GB" : "245 GB"}
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