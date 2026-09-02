import { useCallback, useState } from "react";
import { Check, Pause, Eye, Trash2 } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import ConfirmModal from "../../components/UI/ConfirmModal";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

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
  const [detail, setDetail] = useState(null);
  const [quota, setQuota] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tableKey, setTableKey] = useState(0);

  const canApprove = canPerform(admin, "merchants:manage");
  const canSuspend = canPerform(admin, "merchants:manage");
  const canDelete = canPerform(admin, "merchants:manage");

  const load = useCallback(async (params) => {
    return businessDashboardApi.getMerchants(params);
  }, []);

  const columns = [
    { key: "name", label: "Merchant", width: 200, sortable: true },
    { key: "email", label: "Email", width: 200, sortable: true },
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
          const res = await businessDashboardApi.getTenantDetail(row.id);
          const data = res?.data || res?.tenant || res;
          let q = null;
          try { q = await businessDashboardApi.getQuota(row.id); } catch { /* ignore */ }
          setDetail(data);
          setQuota(q?.quota || q);
        } catch (err) {
          showToast?.(err.message || "Failed to load detail", "error");
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
      await businessDashboardApi.deleteTenant(deleteTarget.id);
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
        title="Merchants"
        description="Manage merchant accounts, approve, suspend or delete — customer care + overview of Builder/Mobile activity."
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
      <SlideOver open={!!detail} onClose={() => setDetail(null)} title={detail?.name || "Merchant detail"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>{detail.email} · {detail.status} · {detail.plan}</div>
            {quota && <div style={{ fontSize: 12, padding: 10, background: "var(--gray-50)", borderRadius: 8 }}>Quota: {quota.used ?? "—"}/{quota.limit ?? "—"}</div>}
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
              Tenant ID: {detail.id} · Created {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}
              <br />
              <a href={`https://builder.dukadesk.com/${detail.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                Open in Builder (separate website) →
              </a>
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