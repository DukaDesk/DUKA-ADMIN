import { useEffect, useState } from "react";
import { Server, Shield, Cloud, Activity } from "lucide-react";
import { businessDashboardApi } from "../../services/businessDashboard";

function Card({ title, children, icon: Icon }) {
  return (
    <article style={{ background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 12, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>{Icon && <Icon size={16} />} {title}</h3>
      <div style={{ fontSize: 13 }}>{children}</div>
    </article>
  );
}

export default function Infrastructure({ showToast }) {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [envs, setEnvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      businessDashboardApi.getInfraOverview().catch(() => null),
      businessDashboardApi.getInfraHealth({}).catch(() => null),
      businessDashboardApi.getEnvironments({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
    ]).then(([ov, h, e]) => {
      if (!active) return;
      if (ov.status === "fulfilled" && ov.value) setOverview(ov.value?.data || ov.value);
      if (h.status === "fulfilled" && h.value) setHealth(h.value?.data || h.value);
      if (e.status === "fulfilled" && e.value) {
        const list = e.value?.data || e.value?.environments || e.value?.items || [];
        setEnvs(Array.isArray(list) ? list : []);
      }
      const firstFail = [ov, h, e].find((r) => r.status === "rejected");
      if (firstFail) setError(firstFail.reason?.message || "");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div style={{ padding: 24, color: "var(--gray-500)", fontSize: 13 }} aria-live="polite">Loading infrastructure…</div>;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header><h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--navy)", margin: 0 }}>Infrastructure</h2><p style={{ color: "var(--gray-500)", fontSize: 13, margin: "4px 0 0" }}>Live via GET /infra/overview, /infra/status, /infra/environments. Managed in DUKA-BACKEND `infrastructure` module.</p></header>
      {error && <div role="alert" style={{ background: "#FEF2F2", color: "var(--red)", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <Card title="Overview" icon={Cloud}><pre style={{ margin: 0, background: "var(--gray-50)", padding: 12, borderRadius: 8, fontSize: 11, maxHeight: 260, overflow: "auto" }}>{overview ? JSON.stringify(overview, null, 2) : "No overview — awaiting /infra/overview"}</pre></Card>
        <Card title="Health" icon={Activity}><pre style={{ margin: 0, background: "var(--gray-50)", padding: 12, borderRadius: 8, fontSize: 11, maxHeight: 260, overflow: "auto" }}>{health ? JSON.stringify(health, null, 2) : "No health — awaiting /infra/status"}</pre></Card>
        <Card title="Environments" icon={Server}>
          {envs.length === 0 ? <p style={{ color: "var(--gray-500)", fontSize: 13 }}>No environments. Create via POST /infra/environments.</p> : envs.map((e) => (
            <div key={e.id || e.slug} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><strong style={{ fontSize: 13 }}>{e.name || e.slug}</strong> <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{e.status || e.slug}</span></div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-full)", background: e.isActive ? "var(--green)22" : "var(--gray-100)", color: e.isActive ? "var(--green)" : "var(--gray-500)" }}>{e.isActive ? "active" : "inactive"}</span>
            </div>
          ))}
        </Card>
        <Card title="Security" icon={Shield}><p style={{ fontSize: 13, color: "var(--gray-500)", margin: 0 }}>Policies live in Settings → Policies (`GET /admin/policies` → `Platform Policy`). Security events via `GET /app/security/events` (not exposed here).</p></Card>
      </div>
    </section>
  );
}
