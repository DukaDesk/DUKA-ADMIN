import { useEffect, useState } from "react";
import { BarChart3, Users, Calendar, DollarSign } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";
import styles from "./Analytics.module.css";

function Stat({ label, value, icon: Icon, color }) {
  return (
    <article className={styles.stat}>
      <div className={styles.statIcon} style={{ background: color + "22", color }}><Icon size={18} /></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </article>
  );
}

export default function Analytics({ showToast }) {
  const [revenue, setRevenue] = useState(null);
  const [users, setUsers] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      businessDashboardApi.getRevenueReport({}).catch(() => null),
      businessDashboardApi.getUserAnalytics({}).catch(() => null),
      businessDashboardApi.getBookingAnalytics({}).catch(() => null),
      businessDashboardApi.getSavedReports({}).catch(() => ({ data: [] })),
    ]).then(([rev, usr, book, sav]) => {
      if (!active) return;
      if (rev.status === "fulfilled" && rev.value) setRevenue(rev.value?.data || rev.value);
      if (usr.status === "fulfilled" && usr.value) setUsers(usr.value?.data || usr.value);
      if (book.status === "fulfilled" && book.value) setBookings(book.value?.data || book.value);
      if (sav.status === "fulfilled" && sav.value) {
        const list = sav.value?.data || sav.value?.reports || sav.value?.items || sav.value || [];
        setSaved(Array.isArray(list) ? list : []);
      }
    }).catch((e) => { if (active) setError(e.message || "Unable to load analytics"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleCreate = async () => {
    const name = prompt("Report name");
    if (!name) return;
    try {
      await businessDashboardApi.createReport({ name, metric: "revenue", type: "custom" });
      showToast?.("Report created", "success");
      const res = await businessDashboardApi.getSavedReports({}).catch(() => ({ data: [] }));
      const list = res?.data || res?.reports || [];
      setSaved(Array.isArray(list) ? list : []);
    } catch (e) { showToast?.(e.message, "error"); }
  };

  if (loading) return <div className={styles.loading} aria-live="polite">Loading analytics…</div>;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div><h2 className={styles.title}>Analytics & Reports</h2><p className={styles.subtitle}>Revenue, user and booking analytics live via GET /analytics/reports/* + saved reports via POST /app/analytics/reports.</p></div>
        <button className={styles.createBtn} onClick={handleCreate}>+ New Report</button>
      </header>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <div className={styles.statsGrid}>
        <Stat label="Revenue (period)" value={revenue ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(revenue.revenue ?? revenue.total ?? 0)) : "—"} icon={DollarSign} color="var(--green)" />
        <Stat label="Transactions" value={revenue?.transactionCount ?? revenue?.count ?? "—"} icon={BarChart3} color="var(--blue)" />
        <Stat label="Active Users" value={users?.activeCount ?? users?.total ?? "—"} icon={Users} color="var(--purple)" />
        <Stat label="Bookings" value={bookings?.total ?? bookings?.count ?? "—"} icon={Calendar} color="var(--amber)" />
      </div>

      <div className={styles.cardsGrid}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Revenue Report</h3>
          <pre className={styles.json}>{revenue ? JSON.stringify(revenue, null, 2) : "No data — awaiting /analytics/reports/revenue"}</pre>
        </article>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>User Analytics</h3>
          <pre className={styles.json}>{users ? JSON.stringify(users, null, 2) : "No data — awaiting /analytics/reports/users"}</pre>
        </article>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Booking Analytics</h3>
          <pre className={styles.json}>{bookings ? JSON.stringify(bookings, null, 2) : "No data — awaiting /analytics/reports/bookings"}</pre>
        </article>
      </div>

      <section className={styles.savedSection} aria-labelledby="saved-reports">
        <h3 id="saved-reports" className={styles.sectionTitle}>Saved Reports ({saved.length})</h3>
        {saved.length === 0 ? <p className={styles.empty}>No saved reports. Create one to persist filters.</p> : saved.map((r) => (
          <div key={r.id} className={styles.savedItem}>
            <div><strong>{r.name}</strong> <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{r.metric || r.type} · {r.period || ""}</span></div>
            <button onClick={async () => { try { await businessDashboardApi.deleteReport(r.id); setSaved((p) => p.filter((x) => x.id !== r.id)); showToast?.("Deleted", "success"); } catch (e) { showToast?.(e.message, "error"); } }} style={{ fontSize: 11, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
          </div>
        ))}
      </section>
    </section>
  );
}
