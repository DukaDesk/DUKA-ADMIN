import { useCallback, useState } from "react";
import { Pause, Eye, Trash2 } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import ConfirmModal from "../../components/UI/ConfirmModal";
import MerchantReview from "./MerchantReview";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform, isInvestor, canViewEmail } from "../../services/permissions";
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
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
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
  const readOnly = isInvestor(admin);
  const [reviewId, setReviewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tableKey, setTableKey] = useState(0);

  const canManage = !readOnly && canPerform(admin, "merchants:manage");

  const load = useCallback(async (params) => {
    return businessDashboardApi.getMerchants(params);
  }, []);

  const columns = [
    { key: "name", label: "Merchant", width: 200, sortable: true },
    { key: "email", label: "Email", width: 200, sortable: true, render: (v) => canViewEmail(admin) ? v : maskEmail(v) },
    { key: "status", label: "Status", width: 120, sortable: true,
      render: (value) => <StatusBadge value={value} tones={{ active: "var(--green)", published: "var(--green)", pending: "var(--amber)", draft: "var(--amber)", suspended: "var(--red)", rejected: "var(--gray-500)" }} />
    },
    { key: "verificationStatus", label: "Verification", width: 130, sortable: true,
      render: (value) => <StatusBadge value={value || "pending"} tones={{ pending: "var(--amber)", verified: "var(--green)", rejected: "var(--red)" }} />
    },
    { key: "appStatus", label: "App Review", width: 130, sortable: true,
      render: (value) => <StatusBadge value={String(value || "none").replace("_", " ")} tones={{ none: "var(--gray-400)", in_review: "var(--amber)", "in review": "var(--amber)", approved: "var(--green)", rejected: "var(--red)" }} />
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
    { key: "verification", label: "Verification", placeholder: "All Verifications", options: VERIFICATION_OPTIONS },
    { key: "appStatus", label: "App Review", placeholder: "All Reviews", options: APP_OPTIONS },
    { key: "plan", label: "Plan", placeholder: "All Plans", options: PLAN_OPTIONS },
  ];

  const actions = [
    {
      key: "view",
      label: "Review",
      icon: Eye,
      variant: "Ghost",
      ariaLabel: (row) => `Review merchant ${row.name}`,
      onClick: async (row) => setReviewId(row.id),
    },
    {
      key: "suspend",
      label: "Suspend",
      icon: Pause,
      variant: "Danger",
      disabled: (row) => String(row.status).toLowerCase() === "suspended" || !canManage,
      ariaLabel: (row) => `Suspend merchant ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.suspendMerchant(row.id);
          recordAuditEvent({ admin, action: "merchant.suspend", target: row.id });
          showToast?.(`${row.name} suspended`, "success");
          setTableKey((k) => k + 1);
        } catch (err) {
          showToast?.(err.message || "Failed to suspend", "error");
        }
      },
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
        title="Merchants"
        description="Review merchant credentials and app designs — approve in two stages."
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
      {reviewId && (
        <MerchantReview
          merchantId={reviewId}
          admin={admin}
          canManage={canManage}
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
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
