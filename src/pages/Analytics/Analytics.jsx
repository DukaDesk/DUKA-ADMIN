import { useEffect, useState, useCallback } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, DollarSign, Store, Users, TrendingUp, CreditCard } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import { toneBackground } from "../../utils/badgeTones";
import styles from "./Analytics.module.css";

const PERIOD_OPTIONS = [
  { days: 7, label: "7 days", groupBy: "day" },
  { days: 30, label: "30 days", groupBy: "day" },
  { days: 90, label: "90 days", groupBy: "week" },
  { days: 365, label: "12 months", groupBy: "month" },
];

function Stat({ label, value, icon: Icon, color }) {
  return (
    <article className={styles.stat}>
      <div className={styles.statIcon} style={{ background: toneBackground(color), color }}><Icon size={18} /></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </article>
  );
}

function formatPeriod(period) {
  const date = new Date(`${period}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? period
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function EmptyChart({ message }) {
  return <div className={styles.chartEmpty}>{message}</div>;
}

export default function Analytics() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const fetchData = useCallback((days) => {
    let active = true;
    setLoading(true);
    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - days * 24 * 60 * 60 * 1000);
    const option = PERIOD_OPTIONS.find((opt) => opt.days === days) || PERIOD_OPTIONS[1];
    const params = {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      groupBy: option.groupBy,
    };

    Promise.allSettled([
      businessDashboardApi.getBffAnalytics(params),
      businessDashboardApi.getBffRevenue(params),
    ]).then(([analyticsResult, revenueResult]) => {
      if (!active) return;
      const nextErrors = [];
      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value?.data ?? analyticsResult.value);
      } else {
        nextErrors.push(`Platform activity: ${analyticsResult.reason?.message || "Unable to load data"}`);
      }
      if (revenueResult.status === "fulfilled") {
        setRevenue(revenueResult.value?.data ?? revenueResult.value);
      } else {
        nextErrors.push(`Revenue: ${revenueResult.reason?.message || "Unable to load data"}`);
      }
      setErrors(nextErrors);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const cleanup = fetchData(selectedDays);
    return cleanup;
  }, [fetchData, selectedDays]);

  if (loading && !analytics && !revenue) {
    return <div className={styles.loading} aria-live="polite">Loading platform analytics…</div>;
  }

  const revenueTrend = analytics?.revenueTrend || [];
  const transactionTrend = analytics?.orderVolume || [];
  const userGrowth = analytics?.userGrowth || [];
  const revenueValue = revenue?.revenue;
  const transactionCount = revenue?.transactionCount;
  const activeUsers = analytics?.activeUsers;
  const activeMerchants = analytics?.activeTenants;
  const gmvValue = analytics?.gmv;
  const avgOrderValue = (revenueValue != null && transactionCount > 0)
    ? Math.round(Number(revenueValue) / Number(transactionCount))
    : null;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Platform Analytics</h2>
          <p className={styles.subtitle}>Paid transactions and platform activity over the last {selectedDays} days.</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.periodGroup} role="group" aria-label="Select analytics timeframe">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                className={`${styles.periodBtn} ${selectedDays === opt.days ? styles.periodBtnActive : ""}`}
                onClick={() => setSelectedDays(opt.days)}
                aria-pressed={selectedDays === opt.days}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={styles.period}>Last {selectedDays} days</span>
        </div>
      </header>

      {errors.length > 0 && (
        <div className={styles.error} role="alert">
          <strong>Some analytics are unavailable.</strong>
          {errors.map((message) => <div key={message}>{message}</div>)}
        </div>
      )}

      <div className={styles.statsGrid}>
        <Stat label="Revenue" value={revenueValue == null ? "—" : formatCurrency(revenueValue)} icon={DollarSign} color="var(--green)" />
        <Stat label="Transactions" value={transactionCount == null ? "—" : Number(transactionCount).toLocaleString()} icon={BarChart3} color="var(--blue)" />
        <Stat label={selectedDays === 30 ? "Active Users · 30 days" : `Active Users · ${selectedDays} days`} value={activeUsers == null ? "—" : Number(activeUsers).toLocaleString()} icon={Users} color="var(--purple)" />
        <Stat label="Published Merchants" value={activeMerchants == null ? "—" : Number(activeMerchants).toLocaleString()} icon={Store} color="var(--amber)" />
        {gmvValue != null && (
          <Stat label="Gross Merchandise Value" value={formatCurrency(gmvValue)} icon={TrendingUp} color="var(--teal)" />
        )}
        {avgOrderValue != null && (
          <Stat label="Avg. Transaction" value={formatCurrency(avgOrderValue)} icon={CreditCard} color="var(--indigo)" />
        )}
      </div>

      <div className={styles.chartsGrid}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Revenue trend</h3>
          {revenueTrend.length === 0 ? <EmptyChart message="No paid transactions in this period." /> : (
            <div className={styles.chart} role="img" aria-label={`Revenue trend over the last ${selectedDays} days`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => new Intl.NumberFormat("en-NG", { notation: "compact" }).format(value)} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={formatPeriod} formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--green)" fill="var(--green)" fillOpacity={0.16} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Transactions</h3>
          {transactionTrend.length === 0 ? <EmptyChart message="No paid transactions in this period." /> : (
            <div className={styles.chart} role="img" aria-label={`Daily paid transaction count over the last ${selectedDays} days`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionTrend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={formatPeriod} />
                  <Bar dataKey="count" name="Transactions" fill="var(--blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        {userGrowth.length > 0 && (
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>User growth</h3>
            <div className={styles.chart} role="img" aria-label="Platform user growth over periods">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowth} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Users" fill="var(--purple)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
