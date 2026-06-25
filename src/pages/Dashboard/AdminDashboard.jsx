import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { revData, userGrowth, appsBycat, recentMerchants, pendingApps } from "../../data";
import { NAVY, AMBER, PIE_COLORS } from "../../utils";
import PlanBadge from "../../components/UI/PlanBadge";
import StatusBadge from "../../components/UI/StatusBadge";
import styles from "./AdminDashboard.module.css";

function AdminDashboard({ setPage, showToast }) {
  const kpis = [
    { label: "Total Users", value: "48,204", trend: "+1,240 this month", up: true, color: NAVY },
    { label: "Total Merchants", value: "2,847", trend: "+89 this month", up: true, color: AMBER },
    { label: "Published Apps", value: "1,592", trend: "+34 this week", up: true, color: NAVY },
    { label: "Platform MRR", value: "₦9.2M", trend: "+18% vs last month", up: true, color: AMBER },
    { label: "Open Reports", value: "23", trend: "3 Critical ⚡", up: false, color: "var(--red)" },
  ];

  return (
    <div>
      <div className={styles.criticalAlert}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <span style={{ flex: 1, fontSize: 14, color: "#991B1B", fontWeight: 500 }}>
          3 critical reports require immediate review. Merchants may be engaging in fraudulent activity.
        </span>
        <button
          onClick={() => setPage("reports")}
          style={{ background: "var(--red)", color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Review Now →
        </button>
        <button onClick={() => showToast("Alert dismissed", "info")}>&times;</button>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map((k, i) => (
          <div
            key={i}
            onClick={i === 4 ? () => setPage("reports") : undefined}
            className={`${styles.kpiCard} ${i === 4 ? styles.kpiCardCritical : ""}`}
          >
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
            <div className={styles.kpiTrend} style={{ color: k.up ? "var(--green)" : "var(--red)" }}>
              {k.up ? "↑ " : "⚡ "}{k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Revenue Growth (6 Months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={v => [`₦${(v/1000000).toFixed(2)}M`, "MRR"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Line type="monotone" dataKey="v" stroke={AMBER} strokeWidth={3} dot={{ fill: AMBER, r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitleSm}>Apps by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={appsBycat} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="count">
                {appsBycat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 8, border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitleSm}>Merchant Growth</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="w" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
              <Bar dataKey="users" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span className={styles.tableCardTitle}>Recent Merchants</span>
            <button className={styles.viewAllBtn} onClick={() => setPage("merchants")}>View All →</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                {["Merchant", "Business", "Plan", "Status", "Apps", "Joined"].map(h => (
                  <th key={h} className={styles.tableHeader}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentMerchants.map((m, i) => (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.merchantCell}>
                      <div className={styles.avatar}>{m.name[0]}</div>
                      <span className={styles.merchantName}>{m.name}</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}><span className={styles.bizCell}>{m.biz}</span></td>
                  <td className={styles.tableCell}><PlanBadge plan={m.plan} /></td>
                  <td className={styles.tableCell}><StatusBadge status={m.status} /></td>
                  <td className={styles.tableCell}><span className={styles.appsCell}>{m.apps}</span></td>
                  <td className={styles.tableCell}><span className={styles.joinedCell}>{m.joined}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span className={styles.tableCardTitle}>Pending Moderation</span>
            <button className={styles.viewAllBtn} onClick={() => setPage("apps")}>Queue →</button>
          </div>
          {pendingApps.map((a, i) => (
            <div key={i} className={styles.pendingItem} style={{ borderBottom: i < pendingApps.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <div className={styles.pendingIcon}>📱</div>
              <div className={styles.pendingInfo}>
                <div className={styles.pendingName}>{a.app}</div>
                <div className={styles.pendingMeta}>by {a.merchant} · {a.time}</div>
              </div>
              <button className={styles.reviewBtn} onClick={() => setPage("apps")}>Review →</button>
            </div>
          ))}
          <button className={styles.viewAllPendingBtn} onClick={() => setPage("apps")}>View all 8 pending apps →</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
