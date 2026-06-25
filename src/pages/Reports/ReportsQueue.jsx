import { useState } from "react";
import { reportsData } from "../../data";
import StatusBadge from "../../components/UI/StatusBadge";
import SlideOver from "../../components/UI/SlideOver";
import FilterBar from "../../components/UI/FilterBar";
import ConfirmModal from "../../components/UI/ConfirmModal";
import TableHeader from "../../components/UI/TableHeader";
import { priorityStyles, typeStyles } from "../../utils";
import styles from "./ReportsQueue.module.css";

function ReportsQueue({ showToast }) {
  const [reports, setReports] = useState(reportsData);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [banConfirm, setBanConfirm] = useState(null);

  const tabs = ["All", "Critical", "High", "Medium", "Resolved"];

  const filtered = reports.filter(r => {
    if (tab === "Resolved") return r.status === "Resolved";
    if (tab !== "All" && r.priority !== tab) return false;
    if (r.status === "Resolved" && tab !== "Resolved") return false;
    if (search && !r.reporter.toLowerCase().includes(search.toLowerCase()) && !r.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resolve = (id) => {
    setReports(r => r.map(x => x.id === id ? { ...x, status: "Resolved" } : x));
    showToast("Report resolved", "success");
    setDetail(null);
  };

  const doBan = (id) => {
    showToast("Merchant banned and app removed from marketplace", "warning");
    setBanConfirm(null);
    setDetail(null);
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>Reports Queue</h2>
          <div className={styles.headerSub}>
            {reports.filter(r => r.status !== "Resolved").length} open &middot;{" "}
            {reports.filter(r => r.priority === "Critical" && r.status !== "Resolved").length} critical
          </div>
        </div>
        <button onClick={() => showToast("Exported", "info")} className={styles.exportBtn}>Export</button>
      </div>

      <div className={styles.tabs}>
        {tabs.map(t => {
          const count = t === "All" ? reports.length : t === "Resolved" ? reports.filter(r => r.status === "Resolved").length : reports.filter(r => r.priority === t && r.status !== "Resolved").length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? styles.tabActive : styles.tab}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      <FilterBar search={search} setSearch={setSearch} placeholder="Search reporter or subject..." />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <TableHeader cols={["ID", "Reporter", "Subject", "Type", "Priority", "Status", "Submitted", "Assigned", "Action"]} />
          <tbody>
            {filtered.map((r, i) => {
              const ps = priorityStyles[r.priority] || priorityStyles.Medium;
              const isCritical = r.priority === "Critical" && r.status !== "Resolved";
              return (
                <tr key={r.id} className={isCritical ? styles.tableRowCritical : styles.tableRow} style={{ background: !isCritical ? (i % 2 === 0 ? "#fff" : "#FAFAFA") : undefined }}>
                  <td className={styles.cellId}>{r.id}</td>
                  <td className={styles.cellReporter}>
                    <div className={styles.reporterWrap}>
                      <div className={styles.avatar}>{r.reporter[0]}</div>
                      <span className={styles.reporterName}>{r.reporter}</span>
                    </div>
                  </td>
                  <td className={styles.cellSubject}>{r.subject}</td>
                  <td className={styles.cellType}>
                    <span className={styles.typeBadge} style={{ background: (typeStyles[r.type] || "#6B7280") + "22", color: typeStyles[r.type] || "#6B7280" }}>{r.type}</span>
                  </td>
                  <td className={styles.cellPriority}>
                    <div className={styles.priorityWrap}>
                      <div className={styles.priorityDot} style={{ background: ps.dot }} />
                      <span className={styles.priorityLabel} style={{ color: ps.color }}>{r.priority}</span>
                    </div>
                  </td>
                  <td className={styles.cellStatus}><StatusBadge status={r.status} /></td>
                  <td className={styles.cellSubmitted}>{r.submitted}</td>
                  <td className={styles.cellAssigned} style={{ color: r.assigned === "Unassigned" ? "var(--gray-400)" : "var(--gray-500)" }}>{r.assigned}</td>
                  <td className={styles.cellAction}>
                    <button
                      onClick={() => setDetail(r)}
                      className={`${styles.reviewBtn} ${r.status !== "Resolved" ? styles.reviewBtnActive : styles.reviewBtnDone}`}
                    >
                      Review &rarr;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>&#x2705;</div>
            <div className={styles.emptyLabel}>All caught up! No reports in this category.</div>
          </div>
        )}
      </div>

      {detail && (
        <SlideOver
          title={`Report ${detail.id}`}
          onClose={() => setDetail(null)}
          footer={
            detail.status !== "Resolved" ? (
              <div className={styles.footerBtnWrap}>
                <div className={styles.footerRow}>
                  <button onClick={() => { showToast("Warning sent to merchant", "info"); }} className={styles.warnBtn}>Warn Merchant</button>
                  <button onClick={() => { showToast("App suspended", "warning"); }} className={styles.suspendBtn}>Suspend App</button>
                </div>
                <div className={styles.footerRow}>
                  <button onClick={() => setBanConfirm(detail)} className={styles.banBtn}>Ban Merchant</button>
                  <button onClick={() => resolve(detail.id)} className={styles.dismissBtn}>Dismiss</button>
                </div>
              </div>
            ) : (
              <div className={styles.resolvedMsg}>&check; This report has been resolved</div>
            )
          }
        >
          <div className={styles.detailInfoGrid}>
            <div className={styles.detailInfoItem}>
              <div className={styles.detailInfoLabel}>Reporter</div>
              <div className={styles.detailInfoValue}>{detail.reporter}</div>
            </div>
            <div className={styles.detailInfoItem}>
              <div className={styles.detailInfoLabel}>Subject</div>
              <div className={styles.detailInfoValue}>{detail.subject}</div>
            </div>
            <div className={styles.detailInfoItem}>
              <div className={styles.detailInfoLabel}>Submitted</div>
              <div className={styles.detailInfoValue}>{detail.submitted}</div>
            </div>
          </div>

          <div className={styles.detailTags}>
            <span className={styles.detailTag} style={{ background: (typeStyles[detail.type] || "#6B7280") + "22", color: typeStyles[detail.type] || "#6B7280" }}>{detail.type}</span>
            <span className={styles.detailTag} style={{ background: (priorityStyles[detail.priority] || priorityStyles.Medium).bg, color: (priorityStyles[detail.priority] || priorityStyles.Medium).color }}>{detail.priority} Priority</span>
            <StatusBadge status={detail.status} />
          </div>

          <div className={styles.detailSectionTitle}>Report Details</div>
          <div className={styles.detailDesc}>{detail.desc}</div>

          <div className={styles.detailSectionTitle}>Assigned To</div>
          <div className={detail.assigned === "Unassigned" ? styles.detailAssignedEmpty : styles.detailAssigned}>{detail.assigned}</div>

          <div className={styles.detailSectionTitle}>Timeline</div>
          {[`Submitted by ${detail.reporter}`, "Report received by system", detail.assigned !== "Unassigned" ? `Assigned to ${detail.assigned}` : "Awaiting assignment"].map((e, i) => (
            <div key={i} className={styles.timelineItem}>
              <span className={styles.timelineDot}>&#x25CF;</span>{e}
            </div>
          ))}
        </SlideOver>
      )}

      {banConfirm && (
        <ConfirmModal
          title={`Ban merchant for "${banConfirm.subject}"?`}
          message="This will permanently ban the merchant, remove their app from the marketplace, and prevent future signups."
          confirmLabel="Confirm Ban"
          confirmColor="#E74C3C"
          requireText="CONFIRM"
          onConfirm={() => doBan(banConfirm.id)}
          onClose={() => setBanConfirm(null)}
        />
      )}
    </div>
  );
}

export default ReportsQueue;
