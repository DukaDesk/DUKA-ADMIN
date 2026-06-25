import { useState } from "react";
import { appsData, checkItems } from "../../data";
import StatusBadge from "../../components/UI/StatusBadge";
import SlideOver from "../../components/UI/SlideOver";
import FilterBar from "../../components/UI/FilterBar";
import styles from "./AppModeration.module.css";

function AppModeration({ showToast }) {
  const [apps, setApps] = useState(appsData);
  const [tab, setTab] = useState("Under Review");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [note, setNote] = useState("");

  const tabs = ["All", "Under Review", "Live", "Rejected"];

  const filtered = apps.filter(a => {
    if (tab !== "All" && a.status !== tab) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const approve = (id) => {
    setApps(a => a.map(x => x.id === id ? { ...x, status: "Live" } : x));
    showToast("App approved and now live! Merchant notified.", "success");
    setDetail(null);
  };

  const reject = (id) => {
    setApps(a => a.map(x => x.id === id ? { ...x, status: "Rejected" } : x));
    showToast("App rejected. Merchant has been notified with feedback.", "info");
    setRejectModal(null);
    setDetail(null);
    setRejectReason("");
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>App Moderation</h2>
          <div className={styles.headerSub}>
            {apps.filter(a => a.status === "Live").length} Live &middot;{" "}
            {apps.filter(a => a.status === "Under Review").length} Pending Review &middot;{" "}
            {apps.filter(a => a.status === "Rejected").length} Rejected
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map(t => {
          const count = t === "All" ? apps.length : apps.filter(a => a.status === t).length;
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

      <FilterBar search={search} setSearch={setSearch} placeholder="Search apps..." />

      <div className={styles.grid}>
        {filtered.map(app => (
          <div key={app.id} className={app.status === "Under Review" ? styles.cardReview : styles.card}>
            <div className={styles.logoArea}>
              {app.logo}
              <div className={styles.logoBadge}><StatusBadge status={app.status} /></div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.appName}>{app.name}</div>
              <div className={styles.appMerchant}>by {app.merchant}</div>
              <div className={styles.appTime}>Submitted {app.submitted}</div>
              <button onClick={() => setDetail(app)} className={styles.reviewBtn}>Review &rarr;</button>
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <SlideOver
          title={`Review: ${detail.name}`}
          onClose={() => setDetail(null)}
          footer={
            detail.status === "Under Review" ? (
              <div className={styles.footerBtnWrap}>
                <button onClick={() => approve(detail.id)} className={styles.approveBtn}>&check; Approve App</button>
                <button onClick={() => showToast("Changes requested — merchant notified", "info")} className={styles.requestBtn}>Request Changes</button>
                <button onClick={() => setRejectModal(detail)} className={styles.rejectBtn}>&times; Reject App</button>
              </div>
            ) : null
          }
        >
          <div className={styles.detailHeader}>
            <div className={styles.detailLogo}>{detail.logo}</div>
            <div className={styles.detailInfo}>
              <div className={styles.detailName}>{detail.name}</div>
              <div className={styles.detailMerchant}>by {detail.merchant}</div>
              <div className={styles.detailTags}>
                <StatusBadge status={detail.status} />
                <span style={{ background: "var(--gray-100)", color: "var(--gray-500)", fontSize: 11, padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>{detail.cat}</span>
              </div>
            </div>
          </div>

          <div className={styles.sectionTitle}>Review Checklist</div>
          <div className={styles.checklist}>
            {checkItems.map((item, i) => (
              <div key={i} className={i < checkItems.length - 1 ? styles.checkItemBorder : styles.checkItem}>
                <span className={styles.checkIcon} style={{ color: detail.checklist[i] ? "var(--green)" : "var(--red)" }}>
                  {detail.checklist[i] ? "\u2713" : "\u2715"}
                </span>
                <span className={styles.checkLabel} style={{ color: detail.checklist[i] ? "var(--navy)" : "var(--gray-400)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.sectionTitle}>Internal Note</div>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note for your team..."
          />
          {note && (
            <button onClick={() => { showToast("Note saved", "success"); }} className={styles.saveNoteBtn}>
              Save Note
            </button>
          )}
        </SlideOver>
      )}

      {rejectModal && (
        <>
          <div className={styles.modalOverlay} onClick={() => setRejectModal(null)} />
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Reject &ldquo;{rejectModal.name}&rdquo;</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>Select reason:</label>
              {["Content violation", "Incomplete setup", "Inappropriate branding", "Suspected fraud", "Other"].map(r => (
                <label key={r} className={styles.radioItem}>
                  <input type="radio" name="rej" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <textarea
              className={styles.modalTextarea}
              placeholder="Message to merchant (pre-filled from reason)..."
              defaultValue={rejectReason ? `Hi, your app was rejected due to: ${rejectReason}. Please make the required changes and resubmit.` : ""}
            />
            <div className={styles.modalActions}>
              <button onClick={() => reject(rejectModal.id)} className={styles.sendRejectionBtn}>Send Rejection</button>
              <button onClick={() => setRejectModal(null)} className={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AppModeration;
