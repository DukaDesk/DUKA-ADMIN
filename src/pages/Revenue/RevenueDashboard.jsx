import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { revMonths, planData, planPie } from "../../data";
import Sel from "../../components/UI/Sel";
import PlanBadge from "../../components/UI/PlanBadge";
import TableHeader from "../../components/UI/TableHeader";
import { NAVY, AMBER, PIE_COLORS } from "../../utils";
import styles from "./RevenueDashboard.module.css";

function RevenueDashboard({ showToast }) {
  const totalMrr = 11897800;

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Revenue Dashboard</h2>
        <div className={styles.headerActions}>
          <Sel value="June 2025" onChange={() => {}} options={["June 2025", "May 2025", "Q2 2025", "YTD"]} />
          <button onClick={() => showToast("PDF report generated", "success")} className={styles.exportBtn}>Export PDF</button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {[
          { label: "MRR", value: "\u20A69,200,000", trend: "+18% vs May", up: true },
          { label: "ARR (Projected)", value: "\u20A6110.4M", trend: "Annualised", up: null },
          { label: "Paying Merchants", value: "755", trend: "of 2,847 total", up: null },
          { label: "Churn This Month", value: "12", trend: "4 at risk \u26A0\uFE0F", up: false },
        ].map((k, i) => (
          <div key={i} className={i === 3 ? styles.kpiCardDanger : styles.kpiCard} style={i === 3 ? {} : {}}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValue} style={{ color: i === 0 ? AMBER : i === 3 ? "var(--red)" : NAVY }}>
              {k.value}
            </div>
            <div className={styles.kpiTrend} style={{ color: k.up === true ? "var(--green)" : k.up === false ? "var(--red)" : "var(--gray-400)" }}>
              {k.up === true ? "\u2191 " : k.up === false ? "\u26A0 " : ""}{k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Monthly Revenue Growth</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revMonths}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} tickFormatter={v => `\u20A6${v}M`} />
              <Tooltip formatter={v => [`\u20A6${v}M`, "MRR"]} contentStyle={{ borderRadius: 8, border: "none" }} />
              <Area type="monotone" dataKey="v" stroke={AMBER} strokeWidth={3} fill="url(#ag)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Revenue by Plan</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {planPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 8, border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {planPie.map((p, i) => (
              <div key={i} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: PIE_COLORS[i] }} />
                <span className={styles.legendLabel}>{p.name} {p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableTitle}>Plan Breakdown</div>
        <table className={styles.table}>
          <TableHeader cols={["Plan", "Active Merchants", "MRR", "% of Total", "Avg/Merchant", "Churn Rate", "Trend"]} />
          <tbody>
            {planData.map((p, i) => (
              <tr key={i} className={styles.tableRow} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td className={styles.cellPlan}><PlanBadge plan={p.name.split(" ")[0]} /></td>
                <td className={styles.cellMerchants}>{p.merchants.toLocaleString()}</td>
                <td className={styles.cellMrr}>{p.mrr === 0 ? "\u20A60 (Beta)" : `\u20A6${(p.mrr / 1000000).toFixed(2)}M`}</td>
                <td className={styles.cellPercent}>{p.mrr === 0 ? "\u2014" : `${Math.round((p.mrr / totalMrr) * 100)}%`}</td>
                <td className={styles.cellAvg}>{p.mrr === 0 ? "\u20A60" : `\u20A6${Math.round(p.mrr / p.merchants).toLocaleString()}`}</td>
                <td className={styles.cellChurn}>
                  <span className={styles.churnBadge} style={{ color: parseFloat(p.churn) > 5 ? "var(--red)" : parseFloat(p.churn) > 2 ? "var(--orange)" : "var(--green)" }}>
                    {p.churn}
                  </span>
                </td>
                <td className={styles.cellTrend}>&#x2191;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RevenueDashboard;
