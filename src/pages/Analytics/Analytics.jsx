import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, DollarSign, Store, Users } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import { toneBackground } from "../../utils/badgeTones";
import styles from "./Analytics.module.css";

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
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let active = true;
    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    const params = {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      groupBy: "day",
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

  if (loading) return <div className={styles.loading} aria-live="polite">Loading platform analytics…</div>;

  const revenueTrend = analytics?.revenueTrend || [];
  const transactionTrend = analytics?.orderVolume || [];
  const revenueValue = revenue?.revenue;
  const transactionCount = revenue?.transactionCount;
  const activeUsers = analytics?.activeUsers;
  const activeMerchants = analytics?.activeTenants;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Platform Analytics</h2>
          <p className={styles.subtitle}>Paid transactions and platform activity over the last 30 days.</p>
        </div>
        <span className={styles.period}>Last 30 days</span>
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
        <Stat label="Active Users · 30 days" value={activeUsers == null ? "—" : Number(activeUsers).toLocaleString()} icon={Users} color="var(--purple)" />
        <Stat label="Published Merchants" value={activeMerchants == null ? "—" : Number(activeMerchants).toLocaleString()} icon={Store} color="var(--amber)" />
      </div>

      <div className={styles.chartsGrid}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Revenue trend</h3>
          {revenueTrend.length === 0 ? <EmptyChart message="No paid transactions in this period." /> : (
            <div className={styles.chart} role="img" aria-label="Revenue trend over the last 30 days">
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
            <div className={styles.chart} role="img" aria-label="Daily paid transaction count over the last 30 days">
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
      </div>
    </section>
  );
}
