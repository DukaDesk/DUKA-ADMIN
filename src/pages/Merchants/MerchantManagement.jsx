import { useCallback, useState } from "react";
import { Check, Pause, Eye, Trash2 } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import ConfirmModal from "../../components/UI/ConfirmModal";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform, isInvestor, canViewEmail } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { maskEmail } from "../../utils/maskEmail";

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
      disabled: (row) => row.status === "active" || !canApprove,
      ariaLabel: (row) => `Approve merchant ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.approveMerchant(row.id);
          showToast?.(`${row.name} approved`, "success");
          setTableKey((k) => k + 1);
        } catch (err) {
          showToast?.(err.message || "Failed to approve", "error");
        }
      },
    },
    {
      key: "suspend",
      label: "Suspend",
      icon: Pause,
      variant: "Danger",
      disabled: (row) => row.status === "suspended" || !canSuspend,
      ariaLabel: (row) => `Suspend merchant ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.suspendMerchant(row.id);
          showToast?.(`${row.name} suspended`, "success");
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
      <SlideOver open={!!detail} onClose={closeDetail} title={detail?.name || "Merchant detail"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Site Builder Portal</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--amber-alpha-15)", color: "var(--amber)", border: "1px solid var(--amber)" }}>Separate Portal</span>
              <span style={{ display: "inline-flex", width: 8, height: 8, borderRadius: "50%", background: String(detail.status).toLowerCase() === "active" ? "var(--green)" : String(detail.status).toLowerCase() === "pending" ? "var(--amber)" : "var(--gray-400)" }} title={detail.status} />
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>{canViewEmail(admin) ? detail.email : maskEmail(detail.email)} · {detail.status} · {detail.plan}</div>
            {quota && <div style={{ fontSize: 12, padding: 10, background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-200)" }}>Quota: {quota.used ?? quota.count ?? "—"}/{quota.limit ?? quota.max ?? "—"} {quota.remaining != null ? `· ${quota.remaining} remaining` : ""}</div>}
            <div style={{ fontSize: 12, color: "var(--gray-500)", lineHeight: 1.6 }}>
              Merchant ID: <code style={{ fontSize: 11, background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{detail.id}</code> · Created {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}
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