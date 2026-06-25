import { useState } from "react";
import { merchantsData } from "../../data";
import StatusBadge from "../../components/UI/StatusBadge";
import PlanBadge from "../../components/UI/PlanBadge";
import SlideOver from "../../components/UI/SlideOver";
import ConfirmModal from "../../components/UI/ConfirmModal";
import FilterBar from "../../components/UI/FilterBar";
import TableHeader from "../../components/UI/TableHeader";
import Sel from "../../components/UI/Sel";
import styles from "./MerchantManagement.module.css";

function MerchantManagement({ showToast }) {
  const [merchants, setMerchants] = useState(merchantsData);
  const [search, setSearch] = useState("");
  const [planF, setPlanF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filtered = merchants.filter(m => {
    if (planF !== "All" && m.plan !== planF) return false;
    if (statusF !== "All" && m.status !== statusF) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.biz.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const doAction = (id, action) => {
    setMerchants(m => m.map(x => x.id === id ? { ...x, status: action === "suspend" ? "Suspended" : "Active" } : x));
    showToast(`Merchant ${action === "suspend" ? "suspended" : "restored"}`, action === "suspend" ? "warning" : "success");
    setConfirm(null);
    setDetail(null);
  };

  const emailFromName = (name) => name.toLowerCase().replace(/\s/g, ".") + "@gmail.com";

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Merchant Management</h2>
          <div className={styles.pageSubtitle}>2,847 Total Merchants · 755 Paying · 2,092 on Free Plan</div>
        </div>
        <button className={styles.exportBtn} onClick={() => showToast("Exported", "info")}>Export CSV</button>
      </div>

      <FilterBar search={search} setSearch={setSearch} placeholder="Search merchant or business name...">
        <Sel value={planF} onChange={setPlanF} options={["All", "Starter", "Growth", "Business", "Enterprise"]} />
        <Sel value={statusF} onChange={setStatusF} options={["All", "Active", "Suspended", "Banned"]} />
      </FilterBar>

      <div className={styles.tableWrapper}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["Merchant", "Business", "Category", "Plan", "Status", "Apps", "Customers", "Revenue", "Joined", "Actions"]} />
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: "1px solid var(--gray-100)", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}>
                  <div className={styles.merchantCell}>
                    <div className={styles.merchantAvatar}>{m.name[0]}</div>
                    <div>
                      <div className={styles.merchantName}>{m.name}</div>
                      <div className={styles.merchantEmail}>{emailFromName(m.name)}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><span className={styles.bizCell}>{m.biz}</span></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><span className={styles.catBadge}>{m.cat}</span></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><PlanBadge plan={m.plan} /></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><StatusBadge status={m.status} /></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><span className={styles.appsCell}>{m.apps}</span></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><span className={styles.customersCell}>{m.customers.toLocaleString()}</span></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><span className={styles.revenueCell}>₦{m.revenue.toLocaleString()}</span></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><span className={styles.joinedCell}>{m.joined}</span></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => setDetail(m)}>View</button>
                    {m.status === "Active" ? (
                      <button className={`${styles.actionBtn} ${styles.actionSuspend}`} onClick={() => setConfirm({ type: "suspend", merchant: m })}>Suspend</button>
                    ) : (
                      <button className={`${styles.actionBtn} ${styles.actionRestore}`} onClick={() => doAction(m.id, "restore")}>Restore</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <SlideOver title={detail.biz} onClose={() => setDetail(null)} footer={
          <div style={{ display: "flex", gap: 10 }}>
            {detail.status === "Active" ? (
              <button className={`${styles.footerBtn} ${styles.footerSuspend}`} onClick={() => setConfirm({ type: "suspend", merchant: detail })}>Suspend Merchant</button>
            ) : (
              <button className={`${styles.footerBtn} ${styles.footerRestore}`} onClick={() => doAction(detail.id, "restore")}>Restore Merchant</button>
            )}
            <button className={`${styles.footerBtn} ${styles.footerMsg}`} onClick={() => showToast("Message sent to merchant", "success")}>Send Message</button>
          </div>
        }>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <div className={styles.detailLogo}>{detail.name[0]}</div>
            <div>
              <div className={styles.detailBizName}>{detail.biz}</div>
              <div className={styles.detailOwner}>Owner: {detail.name}</div>
              <div className={styles.detailBadges}>
                <PlanBadge plan={detail.plan} />
                <StatusBadge status={detail.status} />
                <span className={styles.catBadge}>{detail.cat}</span>
              </div>
            </div>
          </div>
          <div className={styles.metricGrid}>
            {[["Apps", detail.apps], ["Customers", detail.customers.toLocaleString()], ["Revenue", `₦${detail.revenue.toLocaleString()}`], ["Joined", detail.joined]].map(([k, v]) => (
              <div key={k} className={styles.metricCard}>
                <div className={styles.metricValue}>{v}</div>
                <div className={styles.metricLabel}>{k}</div>
              </div>
            ))}
          </div>
        </SlideOver>
      )}

      {confirm && (
        <ConfirmModal
          title={`Suspend ${confirm.merchant.biz}?`}
          message={`${confirm.merchant.name}'s app will be taken offline. Customers will no longer be able to access it.`}
          confirmLabel="Suspend Merchant"
          confirmColor="var(--orange)"
          onConfirm={() => doAction(confirm.merchant.id, "suspend")}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export default MerchantManagement;
