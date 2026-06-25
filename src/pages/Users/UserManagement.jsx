import { useState } from "react";
import { usersData } from "../../data";
import StatusBadge from "../../components/UI/StatusBadge";
import PlanBadge from "../../components/UI/PlanBadge";
import SlideOver from "../../components/UI/SlideOver";
import ConfirmModal from "../../components/UI/ConfirmModal";
import FilterBar from "../../components/UI/FilterBar";
import TableHeader from "../../components/UI/TableHeader";
import Sel from "../../components/UI/Sel";
import styles from "./UserManagement.module.css";

function UserManagement({ showToast }) {
  const [users, setUsers] = useState(usersData);
  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState([]);

  const filtered = users.filter(u => {
    if (roleF !== "All" && u.role !== roleF) return false;
    if (statusF !== "All" && u.status !== statusF) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const doAction = (id, action) => {
    const statusMap = { suspend: "Suspended", restore: "Active", ban: "Banned" };
    setUsers(u => u.map(x => x.id === id ? { ...x, status: statusMap[action] } : x));
    showToast(`User ${action === "ban" ? "banned" : action === "restore" ? "restored" : "suspended"} successfully`, action === "ban" ? "warning" : "success");
    setConfirm(null);
    setDetail(null);
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const roleBadgeStyle = (role) => {
    if (role === "Merchant") return { background: "var(--navy)", color: "var(--navy)", opacity: 0.1 };
    if (role === "Admin") return { background: "#EDE9FE", color: "#5B21B6" };
    return { background: "var(--gray-100)", color: "var(--gray-500)" };
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>User Management</h2>
          <div className={styles.pageSubtitle}>48,204 Total · 2,847 Merchants · 45,357 Consumers · 1,024 Active Today</div>
        </div>
        <button className={styles.exportBtn} onClick={() => showToast("Exporting users...", "info")}>Export CSV</button>
      </div>

      {selected.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.length} selected</span>
          <button className={styles.bulkSuspendBtn} onClick={() => { showToast(`${selected.length} users suspended`, "warning"); setSelected([]); }}>Suspend All</button>
          <button className={styles.bulkExportBtn} onClick={() => showToast("Exported", "info")}>Export</button>
          <button className={styles.bulkClearBtn} onClick={() => setSelected([])}>× Clear</button>
        </div>
      )}

      <FilterBar search={search} setSearch={setSearch} placeholder="Search by name or email...">
        <Sel value={roleF} onChange={setRoleF} options={["All", "Consumer", "Merchant", "Admin"]} />
        <Sel value={statusF} onChange={setStatusF} options={["All", "Active", "Suspended", "Banned"]} />
      </FilterBar>

      <div className={styles.tableWrapper}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["", "User", "Role", "Status", "Plan", "Apps", "Joined", "Last Active", "Actions"]} />
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--gray-100)", background: selected.includes(u.id) ? "#FFF8ED" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}>
                  <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className={styles.checkbox} />
                </td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>{u.name[0]}</div>
                    <div>
                      <div className={styles.userName}>{u.name}</div>
                      <div className={styles.userEmail}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}>
                  <span
                    className={styles.roleBadge}
                    style={{
                      background: u.role === "Merchant" ? "var(--navy)" : u.role === "Admin" ? "#EDE9FE" : "var(--gray-100)",
                      color: u.role === "Merchant" ? "var(--navy)" : u.role === "Admin" ? "#5B21B6" : "var(--gray-500)",
                      opacity: u.role === "Merchant" ? 0.1 : 1,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><StatusBadge status={u.status} /></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}><PlanBadge plan={u.plan} /></td>
                <td className={styles.tableCell} style={{ padding: "12px 14px", fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>{u.apps}</td>
                <td className={styles.tableCell} style={{ padding: "12px 14px", fontSize: 12, color: "var(--gray-400)" }}>{u.joined}</td>
                <td className={styles.tableCell} style={{ padding: "12px 14px", fontSize: 12, color: "var(--gray-400)" }}>{u.lastActive}</td>
                <td className={styles.tableCell} style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => setDetail(u)}>View</button>
                    {u.status === "Active" && <button className={`${styles.actionBtn} ${styles.actionSuspend}`} onClick={() => setConfirm({ type: "suspend", user: u })}>Suspend</button>}
                    {u.status === "Suspended" && <button className={`${styles.actionBtn} ${styles.actionRestore}`} onClick={() => doAction(u.id, "restore")}>Restore</button>}
                    {u.status !== "Banned" && <button className={`${styles.actionBtn} ${styles.actionBan}`} onClick={() => setConfirm({ type: "ban", user: u })}>Ban</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className={styles.noUsers}>No users match your search.</div>}
      </div>

      {detail && (
        <SlideOver title="User Profile" onClose={() => setDetail(null)} footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button className={`${styles.footerBtn} ${styles.footerResetPw}`} onClick={() => showToast("Password reset email sent", "success")}>Reset Password</button>
            {detail.status !== "Banned" && <button className={`${styles.footerBtn} ${styles.footerBan}`} onClick={() => setConfirm({ type: "ban", user: detail })}>Ban Account</button>}
          </div>
        }>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className={styles.detailAvatar}>{detail.name[0]}</div>
            <div className={styles.detailName}>{detail.name}</div>
            <div className={styles.detailEmail}>{detail.email}</div>
            <div className={styles.detailBadges}>
              <span
                className={styles.roleBadge}
                style={{
                  background: detail.role === "Merchant" ? "var(--navy)" : "var(--gray-100)",
                  color: detail.role === "Merchant" ? "var(--navy)" : "var(--gray-500)",
                  opacity: detail.role === "Merchant" ? 0.1 : 1,
                }}
              >
                {detail.role}
              </span>
              <StatusBadge status={detail.status} />
              <PlanBadge plan={detail.plan} />
            </div>
          </div>
          <div className={styles.detailSection}>
            {[["Joined", detail.joined], ["Last Active", detail.lastActive], ["Apps Published", detail.apps], ["Plan", detail.plan]].map(([k, v]) => (
              <div key={k} className={styles.detailRow}>
                <span className={styles.detailLabel}>{k}</span>
                <span className={styles.detailValue}>{v}</span>
              </div>
            ))}
          </div>
          <div className={styles.detailSectionTitle}>Recent Activity</div>
          {["Published app", "Added 12 products", "Received first order", "Updated branding"].map((a, i) => (
            <div key={i} className={styles.activityItem}>
              <span className={styles.activityDot}>●</span>{a} — {["Jun 1", "Jun 2", "Jun 5", "Jun 8"][i]}
            </div>
          ))}
        </SlideOver>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.type === "ban" ? `Ban ${confirm.user.name}?` : `Suspend ${confirm.user.name}?`}
          message={confirm.type === "ban" ? `This will permanently ban ${confirm.user.name}. They will lose access to all their apps and data.` : `${confirm.user.name} will be temporarily suspended from the platform.`}
          confirmLabel={confirm.type === "ban" ? "Confirm Ban" : "Suspend"}
          confirmColor={confirm.type === "ban" ? "var(--red)" : "var(--orange)"}
          requireText={confirm.type === "ban" ? "CONFIRM" : undefined}
          onConfirm={() => doAction(confirm.user.id, confirm.type)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export default UserManagement;
