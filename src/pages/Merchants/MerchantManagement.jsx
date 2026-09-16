import { useCallback, useState } from "react";
import { Check, Pause, Eye, Trash2, X } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import ConfirmModal from "../../components/UI/ConfirmModal";
import { Modal } from "../../components/UI/Modal";
import Field from "../../components/UI/Field";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform, isInvestor, canViewEmail } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { maskEmail } from "../../utils/maskEmail";
import { recordAuditEvent } from "../../services/audit";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

export default function MerchantManagement({ showToast }) {
  const { admin } = useAuth();
  const readOnly = isInvestor(admin);
  const [detail, setDetail] = useState(null);
  const [quota, setQuota] = useState(null);
  const [tenantSummary, setTenantSummary] = useState(null);
  const [tenantAnalytics, setTenantAnalytics] = useState(null);
  const [mobileManifest, setMobileManifest] = useState(null);
  const [publishedDef, setPublishedDef] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [tableKey, setTableKey] = useState(0);

  const closeDetail = () => {
    setDetail(null);
    setQuota(null);
    setTenantSummary(null);
    setTenantAnalytics(null);
    setMobileManifest(null);
    setPublishedDef(null);
  };

  const canApprove = !readOnly && canPerform(admin, "merchants:manage");
  const canSuspend = !readOnly && canPerform(admin, "merchants:manage");
  const canReject = !readOnly && canPerform(admin, "merchants:manage");
  const canDelete = !readOnly && canPerform(admin, "merchants:manage");

  const load = useCallback(async (params) => {
    return businessDashboardApi.getMerchants(params);
  }, []);
  const columns = [
    { key: "name", label: "Merchant", width: 200, sortable: true },
    { key: "email", label: "Email", width: 200, sortable: true, render: (v) => canViewEmail(admin) ? v : maskEmail(v) },
    { key: "status", label: "Status", width: 120, sortable: true,
      render: (value) => {
        const status = String(value).toLowerCase();
        const colors = {
          active: "var(--green)",
          pending: "var(--amber)",
          suspended: "var(--red)",
          rejected: "var(--gray-500)",
        };
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: 11,
            fontWeight: 600,
            background: (colors[status] || "var(--gray-200)") + "22",
            color: colors[status] || "var(--gray-500)",
            textTransform: "capitalize",
          }}>
            {status}
          </span>
        );
      }
    },
    { key: "plan", label: "Plan", width: 140, sortable: true,
      render: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1)
    },
    { key: "createdAt", label: "Joined", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
  ];

  const filters = [
    { key: "status", label: "Status", placeholder: "All Statuses", options: STATUS_OPTIONS },
    { key: "plan", label: "Plan", placeholder: "All Plans", options: PLAN_OPTIONS },
  ];

  const actions = [
    {
      key: "approve",
      label: "Approve",
      icon: Check,
      variant: "Primary",
      disabled: (row) => {
        const s = String(row.status).toLowerCase();
        return (s === "published" || s === "active") || !canApprove;
      },
      ariaLabel: (row) => `Approve merchant ${row.name} — publish app live`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.approveMerchant(row.id);
          recordAuditEvent({ admin, action: "merchant.approve", target: row.id });
          showToast?.(`${row.name} approved — app is now live`, "success");
          if (detail?.id === row.id) closeDetail();
          setTableKey((k) => k + 1);
        } catch (err) {
          showToast?.(err.message || "Failed to approve", "error");
        }
      },
    },
    {
      key: "decline",
      label: "Decline",
      icon: X,
      variant: "Danger",
      disabled: (row) => {
        const s = String(row.status).toLowerCase();
        return (s !== "draft" && s !== "pending") || !canReject;
      },
      ariaLabel: (row) => `Decline merchant ${row.name} — reject before live`,
      onClick: async (row) => {
        setRejectTarget(row);
        setRejectComment("");
        setRejectError("");
      },
    },
    {
      key: "suspend",
      label: "Suspend",
      icon: Pause,
      variant: "Danger",
      disabled: (row) => String(row.status).toLowerCase() === "suspended" || !canSuspend,
      ariaLabel: (row) => `Suspend merchant ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.suspendMerchant(row.id);
          recordAuditEvent({ admin, action: "merchant.suspend", target: row.id });
          showToast?.(`${row.name} suspended`, "success");
          if (detail?.id === row.id) closeDetail();
          setTableKey((k) => k + 1);
        } catch (err) {
          showToast?.(err.message || "Failed to suspend", "error");
        }
      },
    },
    {
      key: "view",
      label: "View",
      icon: Eye,
      variant: "Ghost",
      ariaLabel: (row) => `View merchant ${row.name}`,
      onClick: async (row) => {
        try {
          // Merchant is a separate portal (Site Builder). Enrich with Tenant App (mobile) data when linked — good-practice correlation.
          const enriched = await businessDashboardApi.getMerchantEnriched(row.id);
          setDetail(enriched.merchant);
          setQuota(enriched.quota);
          setTenantSummary(enriched.tenantSummary);
          setTenantAnalytics(enriched.tenantAnalytics);
          setMobileManifest(enriched.mobileManifest);
          setPublishedDef(enriched.publishedDefinition);
        } catch (err) {
          // Fallback to basic detail if enrichment fails
          try {
            const res = await businessDashboardApi.getMerchantDetail(row.id);
            const data = res?.data || res?.merchant || res?.tenant || res;
            let q = null;
            try { q = await businessDashboardApi.getQuota(row.id); } catch { /* ignore */ }
            setDetail(data);
            setQuota(q?.quota || q);
            setTenantSummary(null);
            setTenantAnalytics(null);
            setMobileManifest(null);
            setPublishedDef(null);
          } catch (fallbackErr) {
            showToast?.(fallbackErr.message || err.message || "Failed to load detail", "error");
          }
        }
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      variant: "Danger",
      disabled: () => !canDelete,
      ariaLabel: (row) => `Delete merchant ${row.name}`,
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await businessDashboardApi.deleteMerchant(deleteTarget.id);
      showToast?.(`${deleteTarget.name} deleted`, "success");
      setDeleteTarget(null);
      setTableKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to delete", "error");
    }
  };

  return (
    <>
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Merchants (Site Builder Portal)"
        description="Manage site-creator accounts from the builder portal — approve, suspend or delete. Tenant app (mobile) status shown in View detail."
        load={load}
        rowKey="id"
        columns={columns}
        searchable={true}
        sortable={true}
        pagination={true}
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        filters={filters}
        defaultSort={{ key: "createdAt", direction: "desc" }}
        actions={actions}
        emptyMessage="No merchants found matching your criteria."
      />
      <SlideOver
        open={!!detail}
        onClose={closeDetail}
        title={detail?.name || "Merchant detail"}
        footer={
          detail && ["draft", "pending"].includes(String(detail.status).toLowerCase()) ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setRejectTarget(detail);
                  setRejectComment("");
                  setRejectError("");
                }}
                disabled={!canReject}
                style={{
                  padding: "10px 16px",
                  background: "#fff",
                  border: "1px solid var(--red)",
                  color: "var(--red)",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: canReject ? "pointer" : "not-allowed",
                  opacity: canReject ? 1 : 0.6,
                }}
              >
                Decline
              </button>
              <button
                onClick={async () => {
                  try {
                    await businessDashboardApi.approveMerchant(detail.id);
                    recordAuditEvent({ admin, action: "merchant.approve", target: detail.id });
                    showToast?.(`${detail.name} approved — app is now live`, "success");
                    closeDetail();
                    setTableKey((k) => k + 1);
                  } catch (err) {
                    showToast?.(err.message || "Failed to approve", "error");
                  }
                }}
                disabled={!canApprove}
                style={{
                  padding: "10px 18px",
                  background: "var(--green)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: canApprove ? "pointer" : "not-allowed",
                  opacity: canApprove ? 1 : 0.6,
                }}
              >
                Approve — Go Live
              </button>
            </div>
          ) : null
        }
      >
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Credentials Review — required before approve/decline */}
            <div style={{ background: "var(--amber-alpha-10)", border: "1px solid var(--amber)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--amber)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Review Credentials — Required before app goes live</div>
              <div style={{ fontSize: 11, color: "var(--gray-600)", lineHeight: 1.5 }}>
                Verify business details below. Approve to publish (`draft → published`) and make the App-Builder app live. Decline requires a reason and sets `rejected`.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Site Builder Portal</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--amber-alpha-15)", color: "var(--amber)", border: "1px solid var(--amber)" }}>Separate Portal</span>
              <span style={{ display: "inline-flex", width: 8, height: 8, borderRadius: "50%", background: String(detail.status).toLowerCase() === "published" || String(detail.status).toLowerCase() === "active" ? "var(--green)" : String(detail.status).toLowerCase() === "draft" || String(detail.status).toLowerCase() === "pending" ? "var(--amber)" : String(detail.status).toLowerCase() === "rejected" ? "var(--red)" : "var(--gray-400)" }} title={detail.status} />
              <span style={{ fontSize: 11, fontWeight: 600, color: String(detail.status).toLowerCase() === "published" ? "var(--green)" : String(detail.status).toLowerCase() === "rejected" ? "var(--red)" : "var(--amber)", textTransform: "capitalize", marginLeft: 4 }}>{detail.status}</span>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12 }}><strong style={{ color: "var(--gray-600)" }}>Business Name:</strong> {detail.name || "—"}</div>
              <div style={{ fontSize: 12 }}><strong style={{ color: "var(--gray-600)" }}>Email:</strong> {canViewEmail(admin) ? detail.email || "—" : maskEmail(detail.email)} {detail.emailVerified === false && <span style={{ color: "var(--red)", fontSize: 10 }}>· unverified</span>}</div>
              <div style={{ fontSize: 12 }}><strong style={{ color: "var(--gray-600)" }}>Slug:</strong> <code style={{ fontSize: 11, background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{detail.slug || "—"}</code></div>
              <div style={{ fontSize: 12 }}><strong style={{ color: "var(--gray-600)" }}>Description:</strong> {detail.description || <span style={{ color: "var(--gray-400)" }}>— no description</span>}</div>
              <div style={{ fontSize: 12 }}><strong style={{ color: "var(--gray-600)" }}>Plan:</strong> {detail.plan || detail.subscription?.plan?.name || "—"} · <strong>Status:</strong> {detail.status}</div>
              {detail.config && Object.keys(detail.config).length > 0 && (
                <details style={{ fontSize: 11, background: "var(--gray-50)", padding: 8, borderRadius: 6 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600 }}>Config (credentials)</summary>
                  <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(detail.config, null, 2)}</pre>
                </details>
              )}
              {detail.config?.rejectionReason && (
                <div style={{ fontSize: 11, color: "var(--red)", background: "#FEF2F2", padding: 8, borderRadius: 6, border: "1px solid var(--red)" }}>
                  <strong>Previous rejection:</strong> {detail.config.rejectionReason} {detail.config.rejectedAt ? `· ${new Date(detail.config.rejectedAt).toLocaleString()}` : ""}
                </div>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>{canViewEmail(admin) ? detail.email : maskEmail(detail.email)} · {detail.status} · {detail.plan}</div>
            {quota && <div style={{ fontSize: 12, padding: 10, background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-200)" }}>Quota: {quota.used ?? quota.count ?? "—"}/{quota.limit ?? quota.max ?? "—"} {quota.remaining != null ? `· ${quota.remaining} remaining` : ""}</div>}
            <div style={{ fontSize: 12, color: "var(--gray-500)", lineHeight: 1.6 }}>
              Merchant ID: <code style={{ fontSize: 11, background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{detail.id}</code> · Created {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"} {detail.ownerId ? `· Owner ${detail.ownerId.slice(0, 8)}…` : ""}
              <br />
              <a href={`https://builder.dukadesk.com/${detail.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>
                Open in Builder (separate website) →
              </a>
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--gray-500)", background: "var(--amber-alpha-10)", padding: 8, borderRadius: 6, border: "1px solid var(--amber-alpha-15)" }}>
                Merchant = Site Builder Portal (desktop/web). Tenant = Mobile App (separate runtime). View correlates both via BFF when linked.
              </div>
            </div>

            {/* Tenant App (mobile) — correlated when merchant has tenantId/slug */}
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              Tenant App (Mobile)
              {tenantSummary ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--teal)22", color: "var(--teal)", border: "1px solid var(--teal)" }}>Linked · Live</span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--gray-100)", color: "var(--gray-500)", border: "1px solid var(--gray-200)" }}>No linked tenant</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-600)", background: tenantSummary ? "var(--teal-alpha-10, #e6fffa)" : "var(--gray-50)", padding: 12, borderRadius: 8, border: tenantSummary ? "1px solid var(--teal)" : "1px solid var(--gray-200)" }}>
              <div>Tenant ID: <code style={{ fontSize: 11, background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{detail.tenantId || tenantSummary?.id || "— (site-builder only)"}</code> · Slug: <code style={{ fontSize: 11, background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{detail.slug || mobileManifest?.slug || tenantSummary?.slug || "—"}</code></div>
              {tenantSummary ? (
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                  <div style={{ background: "#fff", padding: 8, borderRadius: 6 }}>Users: <strong>{tenantSummary.totalUsers ?? tenantSummary.userCount ?? "—"}</strong></div>
                  <div style={{ background: "#fff", padding: 8, borderRadius: 6 }}>Active: <strong style={{ color: "var(--teal)" }}>{tenantSummary.activeUsers ?? tenantSummary.activeCount ?? "—"}</strong></div>
                  <div style={{ background: "#fff", padding: 8, borderRadius: 6 }}>Bookings: <strong>{tenantSummary.totalBookings ?? "—"}</strong></div>
                  <div style={{ background: "#fff", padding: 8, borderRadius: 6 }}>Revenue: <strong>{tenantSummary.revenue != null ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(tenantSummary.revenue)) : "—"}</strong></div>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>No tenant app data — merchant is site-builder-only. When a tenant is linked, summary/analytics appear here color-coded (teal) vs builder (amber).</div>
              )}
              {tenantAnalytics && (tenantAnalytics.integrations || tenantAnalytics.summary) && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  <strong>Integrations:</strong> {Array.isArray(tenantAnalytics.integrations) ? tenantAnalytics.integrations.map((i) => i.provider || i.name || i).join(", ") : typeof tenantAnalytics.integrations === "object" ? JSON.stringify(tenantAnalytics.integrations).slice(0,120) : "—"}
                </div>
              )}
              {mobileManifest && (
                <div style={{ marginTop: 8, fontSize: 11, padding: 8, background: "#fff", borderRadius: 6 }}>
                  <strong>Mobile Manifest:</strong> {mobileManifest.appName || mobileManifest.name || "—"} {mobileManifest.version ? `· v${mobileManifest.version}` : ""} {mobileManifest.platform ? `· ${mobileManifest.platform}` : ""}
                  <div style={{ color: "var(--gray-500)", marginTop: 4 }}>{mobileManifest.bundleId || mobileManifest.slug || ""}</div>
                </div>
              )}
              {publishedDef && (
                <div style={{ marginTop: 8, fontSize: 11, padding: 8, background: "#fff", borderRadius: 6, border: "1px solid var(--gray-200)" }}>
                  <strong>Published Definition:</strong> {publishedDef.publishedAt ? `live · ${new Date(publishedDef.publishedAt).toLocaleString()}` : "draft / not published"}
                  {publishedDef.version ? ` · v${publishedDef.version}` : ""}
                </div>
              )}
              {!tenantSummary && !mobileManifest && !publishedDef && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>Mobile manifest + published definition load live via BFF when available (separate tenant runtime).</div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
      {/* Decline merchant — requires reason, sets rejected (blocks app live) */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Decline merchant — reject before live">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--gray-600)", margin: 0 }}>
            Decline <strong>{rejectTarget?.name}</strong> ({rejectTarget?.email})? App will remain not live. Requires a reason for audit.
          </p>
          <Field label="Reason (required)" value={rejectComment} onChange={(e) => { setRejectComment(e.target.value); setRejectError(""); }} placeholder="Explain why this merchant is declined (e.g., incomplete credentials)" required />
          {rejectError && <div role="alert" style={{ fontSize: 12, color: "var(--red)", background: "#FEF2F2", padding: 8, borderRadius: 6 }}>{rejectError}</div>}
          <div style={{ padding: 10, background: "var(--gray-50)", borderRadius: 8, fontSize: 11, color: "var(--gray-500)" }}>
            Credentials to review: name, email, slug, description, plan, config. App goes live only after <strong>Approve — Go Live</strong> (draft → published).
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setRejectTarget(null)} style={{ padding: "8px 16px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <button
              onClick={async () => {
                if (!rejectComment.trim()) { setRejectError("Rejection requires a reason — per Administration domain audit"); return; }
                if (rejectComment.trim().length < 8) { setRejectError("Please provide at least 8 characters"); return; }
                try {
                  await businessDashboardApi.rejectMerchant(rejectTarget.id, { reason: rejectComment.trim(), comment: rejectComment.trim(), rejectionReason: rejectComment.trim() });
                  recordAuditEvent({ admin, action: "merchant.reject", target: rejectTarget.id, metadata: { comment: rejectComment.trim() } });
                  showToast?.(`${rejectTarget.name} declined`, "success");
                  const wasDetail = detail?.id === rejectTarget.id;
                  setRejectTarget(null);
                  setRejectComment("");
                  if (wasDetail) closeDetail();
                  setTableKey((k) => k + 1);
                } catch (err) { setRejectError(err.message || "Failed to decline"); }
              }}
              style={{ padding: "8px 16px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
            >
              Confirm Decline
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete merchant?"
        message={deleteTarget ? `Delete ${deleteTarget.name}? This cannot be undone. Use Suspend for reversible action.` : ""}
        confirmLabel="Delete"
        variant="Danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}