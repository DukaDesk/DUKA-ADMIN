import { useCallback, useState } from "react";
import { Check, X, Eye } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import { Modal } from "../../components/UI/Modal";
import Field from "../../components/UI/Field";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform, isInvestor } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { maskEmail } from "../../utils/maskEmail";
import { recordAuditEvent } from "../../services/audit";

export default function PendingAdmins({ showToast }) {
  const { admin } = useAuth();
  const canManage = canPerform(admin, "users:manage");
  const readOnly = isInvestor(admin);
  const [tableKey, setTableKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError] = useState("");
  const refresh = () => setTableKey((k) => k + 1);

  const load = useCallback(async (params) => {
    // backend Prisma expects UserStatus enum PENDING (uppercase) but mock uses pending lower — businessDashboard handles both with fallback
    return businessDashboardApi.getUsers({ ...params, status: "pending" });
  }, []);

  const columns = [
    { key: "name", label: "Name", width: 160, sortable: true },
    {
      key: "email", label: "Email", width: 200, sortable: true,
      render: (v) => readOnly ? maskEmail(v) : v,
    },
    { key: "role", label: "Requested Role", width: 140, sortable: true, render: (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1) },
    {
      key: "status", label: "Status", width: 110, sortable: true,
      render: (v) => {
        const s = String(v).toLowerCase();
        const bg = s === "pending" ? "var(--amber)22" : "var(--gray-100)";
        const color = s === "pending" ? "var(--amber)" : "var(--gray-500)";
        return <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: bg, color, textTransform: "capitalize" }}>{s}</span>;
      }
    },
    { key: "createdAt", label: "Requested", width: 160, sortable: true, render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  const actions = [
    {
      key: "approve", label: "Approve", icon: Check, variant: "Primary",
      disabled: (row) => row.status !== "pending" || !canManage || readOnly,
      onClick: async (row) => {
        if (row.email === admin?.email) { showToast?.("Cannot approve your own request", "error"); return; }
        try {
          await businessDashboardApi.approveUser(row.id);
          recordAuditEvent({ admin, action: "user.approve", target: row.id });
          showToast?.(`${row.email} approved`, "success");
          refresh();
        } catch (err) { showToast?.(err.message, "error"); }
      }
    },
    {
      key: "reject", label: "Reject", icon: X, variant: "Danger",
      disabled: (row) => row.status !== "pending" || !canManage || readOnly,
      onClick: async (row) => {
        if (row.email === admin?.email) { showToast?.("Cannot reject your own request", "error"); return; }
        setRejectTarget(row);
        setRejectComment("");
        setRejectError("");
      }
    },
    {
      key: "view", label: "View", icon: Eye, variant: "Ghost",
      onClick: async (row) => {
        try {
          const res = await businessDashboardApi.getUser(row.id);
          setDetail(res?.data || res);
        } catch (err) { showToast?.(err.message, "error"); }
      }
    },
  ];

  return (
    <>
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Pending Admins"
        description="Separate admin approvals — investor read-only, finance sees email, super admin approves before account created. Staff pending only; merchant (site-builder) pending stays in Merchants; tenant app (mobile) via BFF."
        load={load}
        rowKey="id"
        columns={columns}
        searchable
        sortable
        pagination
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        filters={[]}
        defaultSort={{ key: "createdAt", direction: "desc" }}
        actions={actions}
        emptyMessage="No pending admin requests."
      />
      <SlideOver open={!!detail} onClose={() => setDetail(null)} title={detail?.email || "Request detail"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <div><strong>{detail.name}</strong> · {readOnly ? maskEmail(detail.email) : detail.email}</div>
            <div>Role: {detail.role} · Status: {detail.status}</div>
            <div>Requested: {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}</div>
            <div style={{ padding: 10, background: "var(--gray-50)", borderRadius: 8, fontSize: 12 }}>
              Approval Timeline: Pending → Approved (actor, timestamp, comment via AuditLog)
            </div>
            <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Separation: admin approvals are platform identity (this queue); merchant approvals are site-builder provisioning (Merchants → filter pending + badge); tenant app (mobile) status via BFF tenant dashboard.</div>
          </div>
        )}
      </SlideOver>
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject admin request">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--gray-600)", margin: 0 }}>
            Reject <strong>{rejectTarget?.email}</strong>? This is auditable per Administration domain.
          </p>
          <Field label="Reason (required)" value={rejectComment} onChange={(e) => { setRejectComment(e.target.value); setRejectError(""); }} placeholder="Explain why this request is rejected" required />
          {rejectError && <div role="alert" style={{ fontSize: 12, color: "var(--red)", background: "var(--red)12", padding: 8, borderRadius: 6 }}>{rejectError}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setRejectTarget(null)} style={{ padding: "8px 16px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <button
              onClick={async () => {
                if (!rejectComment.trim()) { setRejectError("Rejection requires a comment — per ERROR_HANDLING_STANDARD"); return; }
                if (rejectComment.trim().length < 8) { setRejectError("Please provide at least 8 characters"); return; }
                try {
                  await businessDashboardApi.rejectUser(rejectTarget.id, { reason: rejectComment.trim(), comment: rejectComment.trim(), rejectionReason: rejectComment.trim() });
                  recordAuditEvent({ admin, action: "user.reject", target: rejectTarget.id, metadata: { comment: rejectComment.trim() } });
                  showToast?.(`${rejectTarget.email} rejected`, "success");
                  setRejectTarget(null);
                  setRejectComment("");
                  refresh();
                } catch (err) { setRejectError(err.message || "Failed to reject"); }
              }}
              style={{ padding: "8px 16px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
