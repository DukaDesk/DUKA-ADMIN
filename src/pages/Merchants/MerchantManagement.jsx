import { useCallback, useState } from "react";
import { Pause, Eye, Trash2 } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import ConfirmModal from "../../components/UI/ConfirmModal";
import MerchantReview from "./MerchantReview";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform, canReviewMerchantApps, canViewEmail } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { maskEmail } from "../../utils/maskEmail";
import { recordAuditEvent } from "../../services/audit";
import { toneBackground } from "../../utils/badgeTones";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
];

const VERIFICATION_OPTIONS = [
  { value: "pending", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const APP_OPTIONS = [
  { value: "none", label: "No App" },
  { value: "in_review", label: "Needs Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const APP_REVIEW_OPTIONS = APP_OPTIONS.filter((option) => option.value !== "none");

const APP_QUEUE_FILTERS = [
  { key: "appStatus", value: "", label: "All Apps" },
  { key: "appStatus", value: "in_review", label: "Needs Review" },
  { key: "appStatus", value: "approved", label: "Approved" },
  { key: "appStatus", value: "rejected", label: "Rejected" },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

function StatusBadge({ value, tones }) {
  const v = String(value || "—").toLowerCase();
  const color = tones[v] || "var(--gray-500)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: toneBackground(color), color, textTransform: "capitalize" }}>
      {String(value || "—").replace("_", " ")}
    </span>
  );
}

export default function MerchantManagement({ showToast }) {
  const { admin } = useAuth();
  const [reviewId, setReviewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [tableKey, setTableKey] = useState(0);

  const canManage = canPerform(admin, "merchants:manage");
  const canReviewApps = canReviewMerchantApps(admin);

  const load = useCallback(async (params) => {
    return businessDashboardApi.getMerchants(params);
  }, []);

  const merchantColumns = [
    { key: "name", label: "Merchant", width: 200, sortable: true },
    { key: "email", label: "Email", width: 200, sortable: false, render: (v) => canViewEmail(admin) ? v : maskEmail(v) },
    { key: "status", label: "Status", width: 120, sortable: true,
      render: (value) => <StatusBadge value={value} tones={{ active: "var(--green)", published: "var(--green)", pending: "var(--amber)", draft: "var(--amber)", suspended: "var(--red)", rejected: "var(--gray-500)" }} />
    },
    { key: "verificationStatus", label: "Verification", width: 130, sortable: true,
      render: (value) => <StatusBadge value={value || "pending"} tones={{ pending: "var(--amber)", verified: "var(--green)", rejected: "var(--red)" }} />
    },
    { key: "appStatus", label: "App Review", width: 130, sortable: true,
      render: (value) => <StatusBadge value={String(value || "none").replace("_", " ")} tones={{ none: "var(--gray-400)", in_review: "var(--amber)", "in review": "var(--amber)", approved: "var(--green)", rejected: "var(--red)" }} />
    },
    { key: "plan", label: "Plan", width: 140, sortable: false,
      render: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1)
    },
    { key: "createdAt", label: "Joined", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
  ];

  const appReviewColumns = [
    { key: "name", label: "Merchant", width: 240, sortable: true },
    { key: "appStatus", label: "App Review", width: 160, sortable: true,
      render: (value) => <StatusBadge value={String(value || "none").replace("_", " ")} tones={{ none: "var(--gray-400)", in_review: "var(--amber)", "in review": "var(--amber)", approved: "var(--green)", rejected: "var(--red)" }} />
    },
  ];

  const columns = canReviewApps && !canManage ? appReviewColumns : merchantColumns;

  const merchantFilters = [
    { key: "status", label: "Status", placeholder: "All Statuses", options: STATUS_OPTIONS },
    { key: "verification", label: "Verification", placeholder: "All Verifications", options: VERIFICATION_OPTIONS },
    { key: "appStatus", label: "App Review", placeholder: "All Reviews", options: APP_OPTIONS },
    { key: "plan", label: "Plan", placeholder: "All Plans", options: PLAN_OPTIONS },
  ];

  const filters = canReviewApps && !canManage
    ? [{ key: "appStatus", label: "App Review", placeholder: "Needs Review", options: APP_REVIEW_OPTIONS }]
    : merchantFilters;

  const actions = [
    {
      key: "view",
      label: "View Details",
      icon: Eye,
      variant: "Ghost",
      ariaLabel: (row) => `View details for merchant ${row.name}`,
      onClick: async (row) => setReviewId(row.id),
    },
    {
      key: "suspend",
      label: (row) => String(row.status).toLowerCase() === "suspended" ? "Unsuspend" : "Suspend",
      icon: Pause,
      variant: "Danger",
      disabled: () => !canManage || Boolean(busyAction),
      ariaLabel: (row) => `${String(row.status).toLowerCase() === "suspended" ? "Unsuspend" : "Suspend"} merchant ${row.name}`,
      onClick: (row) => setStatusTarget(row),
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      variant: "Danger",
      disabled: () => !canManage,
      ariaLabel: (row) => `Delete merchant ${row.name}`,
      onClick: (row) => setDeleteTarget(row),
    },
  ].filter((action) => action.key === "view" ? canManage || canReviewApps : canManage);

  const handleStatusChange = async () => {
    if (!statusTarget || busyAction) return;
    const target = statusTarget;
    const isSuspended = String(target.status).toLowerCase() === "suspended";
    setBusyAction("status");
    try {
      if (isSuspended) {
        await businessDashboardApi.updateTenantById(target.id, { status: "published" });
      } else {
        await businessDashboardApi.suspendMerchant(target.id);
      }
      recordAuditEvent({ admin, action: isSuspended ? "merchant.unsuspend" : "merchant.suspend", target: target.id });
      showToast?.(`${target.name} ${isSuspended ? "unsuspended" : "suspended"}`, "success");
      setStatusTarget(null);
      setTableKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to update merchant status", "error");
    } finally {
      setBusyAction("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || busyAction) return;
    const target = deleteTarget;
    setBusyAction("delete");
    try {
      await businessDashboardApi.deleteMerchant(target.id);
      showToast?.(`${target.name} deleted`, "success");
      setDeleteTarget(null);
      setTableKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to delete merchant", "error");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <>
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Merchants"
        titleTooltip={canReviewApps && !canManage
          ? "Review merchant app submissions. Credential submission is not required to approve an app."
          : "Review merchant credentials and app designs. Credential submission is not required to approve an app."}
        load={load}
        rowKey="id"
        onRowClick={canManage || canReviewApps ? (row) => setReviewId(row.id) : undefined}
        columns={columns}
        searchable={true}
        sortable={true}
        pagination={true}
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        filters={filters}
        defaultSort={{ key: "createdAt", direction: "desc" }}
        actions={actions}
        actionsDisplay="menu"
        quickFilters={APP_QUEUE_FILTERS}
        refreshIntervalMs={30000}
        emptyMessage="No merchants found matching your criteria."
      />
      {reviewId && (
        <MerchantReview
          merchantId={reviewId}
          admin={admin}
          canManage={canManage}
          canReviewApps={canReviewApps}
          showToast={showToast}
          onClose={() => setReviewId(null)}
          onChanged={() => setTableKey((k) => k + 1)}
        />
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete merchant?"
        message={deleteTarget ? `Delete ${deleteTarget.name}? This cannot be undone. Use Suspend for reversible action.` : ""}
        confirmLabel="Delete"
        variant="Danger"
        busy={busyAction === "delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        open={!!statusTarget}
        title={statusTarget && String(statusTarget.status).toLowerCase() === "suspended" ? "Unsuspend merchant?" : "Suspend merchant?"}
        message={statusTarget && String(statusTarget.status).toLowerCase() === "suspended"
          ? `Restore ${statusTarget.name} to active status?`
          : `Suspend ${statusTarget?.name}? The merchant will lose access until unsuspended.`}
        confirmLabel={statusTarget && String(statusTarget.status).toLowerCase() === "suspended" ? "Unsuspend" : "Suspend"}
        variant={statusTarget && String(statusTarget.status).toLowerCase() === "suspended" ? "Primary" : "Danger"}
        busy={busyAction === "status"}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </>
  );
}
