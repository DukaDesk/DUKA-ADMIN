import { useCallback, useState } from "react";
import { Eye, ArrowUpCircle, CheckCircle2, UserPlus, Plus } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import { Modal } from "../../components/UI/Modal";
import Field from "../../components/UI/Field";
import ExportButton from "../../components/UI/ExportButton";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { recordAuditEvent } from "../../services/audit";
import { toneBackground } from "../../utils/badgeTones";

const STATUS_TONES = { open: "var(--amber)", in_progress: "var(--primary)", escalated: "var(--red)", resolved: "var(--green)", closed: "var(--gray-500)" };
const PRIORITY_TONES = { low: "var(--gray-500)", normal: "var(--primary)", high: "var(--amber)", urgent: "var(--red)" };

function StatusPill({ value, tones }) {
  const v = String(value || "—").toLowerCase();
  const color = tones[v] || "var(--gray-500)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, background: toneBackground(color), color, textTransform: "capitalize" }}>
      {String(value || "—").replace(/_/g, " ")}
    </span>
  );
}

const STATUS_OPTIONS = [
  { key: "status", label: "Status", options: [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "escalated", label: "Escalated" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ] },
  { key: "priority", label: "Priority", options: [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ] },
];

export default function SupportTickets({ showToast }) {
  const { admin } = useAuth();
  const canTriage = canPerform(admin, "support:access");
  const [tableKey, setTableKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState("");
  const [comment, setComment] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "normal", category: "general" });
  const [formError, setFormError] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolveError, setResolveError] = useState("");
  const refresh = () => setTableKey((k) => k + 1);

  const load = useCallback((params) => businessDashboardApi.getSupportTickets(params), []);

  const openDetail = async (id) => {
    try {
      const res = await businessDashboardApi.getSupportTicket(id);
      setDetail(res?.data || res);
      setComment("");
    } catch (err) { showToast?.(err.message, "error"); }
  };

  const runTicketAction = async (key, fn, auditAction, successMsg) => {
    setBusy(key);
    try {
      await fn();
      recordAuditEvent({ admin, action: auditAction, target: detail?.id });
      showToast?.(successMsg, "success");
      return true;
    } catch (err) {
      showToast?.(err.message || "Action failed", "error");
      return false;
    } finally {
      setBusy("");
    }
  };

  const columns = [
    { key: "subject", label: "Subject", width: 260, sortable: true },
    { key: "status", label: "Status", width: 130, render: (v) => <StatusPill value={v} tones={STATUS_TONES} /> },
    { key: "priority", label: "Priority", width: 110, render: (v) => <StatusPill value={v} tones={PRIORITY_TONES} /> },
    { key: "assigneeId", label: "Assignee", width: 160, render: (v) => v ? `${String(v).slice(0, 8)}…` : "Unassigned" },
    { key: "createdAt", label: "Opened", width: 160, sortable: true, render: (v) => v ? new Date(v).toLocaleString() : "—" },
  ];

  const actions = [
    { key: "view", label: "View", icon: Eye, variant: "Ghost", onClick: (row) => openDetail(row.id) },
    {
      key: "assign", label: "Assign to me", icon: UserPlus, variant: "Primary",
      disabled: () => !canTriage || !admin?.id,
      onClick: async (row) => {
        const ok = await runTicketAction(`assign-${row.id}`, () => businessDashboardApi.assignSupportTicket(row.id, admin.id), "support.ticket_assign", "Ticket assigned to you");
        if (ok) { refresh(); if (detail?.id === row.id) openDetail(row.id); }
      },
    },
    {
      key: "escalate", label: "Escalate", icon: ArrowUpCircle, variant: "Danger",
      disabled: (row) => !canTriage || ["resolved", "closed"].includes(String(row.status)),
      onClick: async (row) => {
        const ok = await runTicketAction(`escalate-${row.id}`, () => businessDashboardApi.escalateSupportTicket(row.id), "support.ticket_escalate", "Ticket escalated");
        if (ok) { refresh(); if (detail?.id === row.id) openDetail(row.id); }
      },
    },
    {
      key: "resolve", label: "Resolve", icon: CheckCircle2, variant: "Primary",
      disabled: (row) => !canTriage || String(row.status) === "resolved",
      onClick: (row) => { setDetail(row.id === detail?.id ? detail : row); setResolution(""); setResolveError(""); setResolveOpen(true); },
    },
  ];

  const submitCreate = async () => {
    if (!form.subject.trim()) { setFormError("A subject is required"); return; }
    if (!form.description.trim()) { setFormError("A description is required"); return; }
    setBusy("create");
    try {
      await businessDashboardApi.createSupportTicket({
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category.trim() || "general",
      });
      recordAuditEvent({ admin, action: "support.ticket_create" });
      showToast?.("Ticket created", "success");
      setCreateOpen(false);
      setForm({ subject: "", description: "", priority: "normal", category: "general" });
      refresh();
    } catch (err) {
      setFormError(err.message || "Failed to create ticket");
    } finally {
      setBusy("");
    }
  };

  const submitResolve = async () => {
    if (!resolution.trim()) { setResolveError("A resolution is required"); return; }
    const target = detail?.id || detail?.subject;
    const ok = await runTicketAction("resolve", () => businessDashboardApi.resolveSupportTicket(detail?.id, resolution.trim()), "support.ticket_resolve", "Ticket resolved");
    if (ok) { setResolveOpen(false); setResolution(""); refresh(); if (target) openDetail(detail.id); }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    const ok = await runTicketAction("comment", () => businessDashboardApi.commentSupportTicket(detail.id, comment.trim()), "support.ticket_comment", "Comment added");
    if (ok) { setComment(""); openDetail(detail.id); }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        <ExportButton report="support-tickets" showToast={showToast} />
        <button
          type="button"
          onClick={() => { setForm({ subject: "", description: "", priority: "normal", category: "general" }); setFormError(""); setCreateOpen(true); }}
          disabled={!canTriage}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: canTriage ? "pointer" : "not-allowed", opacity: canTriage ? 1 : 0.6 }}
        >
          <Plus size={16} aria-hidden="true" /> New Ticket
        </button>
      </div>

      <EnhancedRemoteTablePage
        key={tableKey}
        title="Support Tickets"
        description="Cases raised by merchants and platform operators. Assign, escalate, and resolve through the canonical support service."
        load={load}
        rowKey="id"
        columns={columns}
        searchable
        sortable
        pagination
        pageSize={20}
        pageSizeOptions={[10, 20, 50]}
        filters={STATUS_OPTIONS}
        actions={actions}
        actionsDisplay="menu"
        defaultSort={{ key: "createdAt", direction: "desc" }}
        emptyMessage="No support tickets."
      />

      <SlideOver open={!!detail} onClose={() => setDetail(null)} title={detail?.subject || "Ticket"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StatusPill value={detail.status} tones={STATUS_TONES} />
              <StatusPill value={detail.priority} tones={PRIORITY_TONES} />
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{detail.description}</div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
              Assignee: {detail.assigneeId || "Unassigned"} · Opened {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}
            </div>
            {detail.resolution && (
              <div style={{ padding: 10, background: "var(--gray-50)", borderRadius: 8 }}>
                <strong>Resolution:</strong> {detail.resolution}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Activity</div>
              {Array.isArray(detail.events) && detail.events.length > 0 ? (
                detail.events.map((e) => (
                  <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--gray-100)", fontSize: 12 }}>
                    <strong style={{ textTransform: "capitalize" }}>{String(e.type).replace(/_/g, " ")}</strong>
                    {e.message ? ` — ${e.message}` : ""}
                    <div style={{ color: "var(--gray-400)" }}>{e.createdAt ? new Date(e.createdAt).toLocaleString() : ""}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--gray-500)", margin: 0 }}>No activity yet.</p>
              )}
            </div>
            {canTriage && !["resolved", "closed"].includes(String(detail.status)) && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Field label="Add comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Internal note…" />
                </div>
                <button type="button" onClick={submitComment} disabled={busy === "comment" || !comment.trim()} style={{ padding: "8px 14px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, height: 38 }}>
                  {busy === "comment" ? "Adding…" : "Comment"}
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New support ticket">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Subject" value={form.subject} onChange={(e) => { setForm({ ...form, subject: e.target.value }); setFormError(""); }} placeholder="Short summary" required />
          <Field label="Description" value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormError(""); }} placeholder="What is happening?" required />
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ fontSize: 12, flex: 1 }}>Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--gray-200)", marginTop: 4 }}>
                {["low", "normal", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <div style={{ flex: 1 }}>
              <Field label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="general" />
            </div>
          </div>
          {formError && <div role="alert" style={{ fontSize: 12, color: "var(--red)", background: "#FEF2F2", padding: 8, borderRadius: 6 }}>{formError}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setCreateOpen(false)} style={{ padding: "8px 16px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <button onClick={submitCreate} disabled={busy === "create"} style={{ padding: "8px 16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
              {busy === "create" ? "Creating…" : "Create Ticket"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve ticket">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--gray-600)", margin: 0 }}>
            Resolve <strong>{detail?.subject}</strong>? A resolution is required and is recorded on the ticket.
          </p>
          <Field label="Resolution (required)" value={resolution} onChange={(e) => { setResolution(e.target.value); setResolveError(""); }} placeholder="How was this resolved?" required />
          {resolveError && <div role="alert" style={{ fontSize: 12, color: "var(--red)", background: "#FEF2F2", padding: 8, borderRadius: 6 }}>{resolveError}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setResolveOpen(false)} style={{ padding: "8px 16px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <button onClick={submitResolve} disabled={busy === "resolve"} style={{ padding: "8px 16px", background: "var(--green)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
              {busy === "resolve" ? "Resolving…" : "Confirm Resolve"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
