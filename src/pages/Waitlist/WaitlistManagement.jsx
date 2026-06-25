import { useState } from "react";
import { waitlistData } from "../../data";
import FilterBar from "../../components/UI/FilterBar";
import TableHeader from "../../components/UI/TableHeader";
import styles from "./WaitlistManagement.module.css";

const statusStyles = {
  "Not Invited": { bg: "#F3F4F6", color: "#6B7280" },
  Invited: { bg: "#FFF8ED", color: "#92400E" },
  Joined: { bg: "#F0FDF4", color: "#065F46" },
};

function WaitlistManagement({ showToast }) {
  const [list, setList] = useState(waitlistData);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Merchants");
  const [selected, setSelected] = useState([]);
  const [inviteModal, setInviteModal] = useState(null);

  const filtered = list.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const sendInvite = (item) => {
    setList(l => l.map(x => x.id === item.id ? { ...x, status: "Invited" } : x));
    showToast(`Invite sent to ${item.name}!`, "success");
    setInviteModal(null);
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>Waitlist</h2>
          <div className={styles.headerSub}>3,847 Total &middot; 1,204 Merchants &middot; 2,643 Consumers &middot; 20.4% Conversion</div>
        </div>
        <button onClick={() => showToast("Exported", "info")} className={styles.exportBtn}>Export CSV</button>
      </div>

      <div className={styles.statGrid}>
        {[
          { label: "Total Signups", value: "3,847", color: "var(--amber)" },
          { label: "Invited", value: "1,820", color: "var(--navy)" },
          { label: "Joined", value: list.filter(x => x.status === "Joined").length.toString(), color: "var(--green)" },
          { label: "Conversion", value: "20.4%", color: "#7C3AED" },
        ].map((k, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statLabel}>{k.label}</div>
            <div className={styles.statValue} style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.tabs}>
        {["Merchants", "Consumers"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? styles.tabActive : styles.tab}>{t}</button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.length} selected</span>
          <button
            onClick={() => {
              setList(l => l.map(x => selected.includes(x.id) ? { ...x, status: "Invited" } : x));
              showToast(`${selected.length} invites sent!`, "success");
              setSelected([]);
            }}
            className={styles.bulkInviteBtn}
          >
            Send Invites
          </button>
          <button onClick={() => showToast("Exported", "info")} className={styles.bulkExportBtn}>Export</button>
          <button onClick={() => setSelected([])} className={styles.bulkClearBtn}>&times;</button>
        </div>
      )}

      <FilterBar search={search} setSearch={setSearch} placeholder="Search by name or email..." />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <TableHeader cols={["", "#", "Name", "Email", "Business Type", "City", "Signed Up", "Status", "Actions"]} />
          <tbody>
            {filtered.map((u, i) => {
              const ss = statusStyles[u.status] || statusStyles["Not Invited"];
              return (
                <tr key={u.id} className={selected.includes(u.id) ? styles.tableRowSelected : styles.tableRow} style={{ background: !selected.includes(u.id) ? (i % 2 === 0 ? "#fff" : "#FAFAFA") : undefined }}>
                  <td style={{ padding: "12px 14px" }}>
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className={styles.checkbox} />
                  </td>
                  <td className={styles.cellNum}>#{i + 1}</td>
                  <td className={styles.cellName}>
                    <div className={styles.nameWrap}>
                      <div className={styles.avatar}>{u.name[0]}</div>
                      <span className={styles.name}>{u.name}</span>
                    </div>
                  </td>
                  <td className={styles.cellEmail}>{u.email}</td>
                  <td className={styles.cellType}><span className={styles.typeBadge}>{u.type}</span></td>
                  <td className={styles.cellCity}>{u.city}</td>
                  <td className={styles.cellSigned}>{u.signed}</td>
                  <td className={styles.cellStatus}>
                    <span className={styles.statusBadge} style={{ background: ss.bg, color: ss.color }}>{u.status}</span>
                  </td>
                  <td className={styles.cellActions}>
                    <div className={styles.actionsWrap}>
                      {u.status === "Not Invited" && (
                        <button onClick={() => setInviteModal(u)} className={styles.inviteBtn}>Invite</button>
                      )}
                      {u.status === "Joined" && <span className={styles.activeLabel}>&check; Active</span>}
                      {u.status === "Invited" && <span className={styles.pendingLabel}>Pending...</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inviteModal && (
        <>
          <div className={styles.modalOverlay} onClick={() => setInviteModal(null)} />
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Send Invite to {inviteModal.name}</h3>
            <div className={styles.previewBox}>
              <div className={styles.previewLine}>From: team@dukadesk.com</div>
              <div className={styles.previewSubject}>
                Subject: Your spot on EverythingApp is ready, {inviteModal.name.split(" ")[0]}!
              </div>
              <div className={styles.previewBody}>
                Hi {inviteModal.name.split(" ")[0]},<br /><br />
                We're excited to welcome you to EverythingApp! Your spot is ready. Click below to set up your merchant account and launch your first app within minutes.<br /><br />
                &mdash; The DukaDesk Team
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => sendInvite(inviteModal)} className={styles.sendBtn}>Send Invite Now</button>
              <button onClick={() => setInviteModal(null)} className={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default WaitlistManagement;
