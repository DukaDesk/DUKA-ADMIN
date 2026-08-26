import { useCallback } from "react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
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

  const canApprove = canPerform(admin, "merchants:manage");
  const canSuspend = canPerform(admin, "merchants:manage");

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
      icon: "✓",
      variant: "Primary",
      disabled: (row) => row.status === "active" || !canApprove,
      ariaLabel: (row) => `Approve merchant ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.approveMerchant(row.id);
          showToast?.(`${row.name} approved`, "success");
        } catch (err) {
          showToast?.(err.message || "Failed to approve", "error");
        }
      },
    },
    {
      key: "suspend",
      label: "Suspend",
      icon: "⏸",
      variant: "Danger",
      disabled: (row) => row.status === "suspended" || !canSuspend,
      ariaLabel: (row) => `Suspend merchant ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.suspendMerchant(row.id);
          showToast?.(`${row.name} suspended`, "success");
        } catch (err) {
          showToast?.(err.message || "Failed to suspend", "error");
        }
      },
    },
    {
      key: "view",
      label: "View",
      icon: "👁",
      variant: "Ghost",
      ariaLabel: (row) => `View merchant ${row.name}`,
      onClick: (row) => {
        showToast?.(`View detail for ${row.name} — coming soon`, "info");
      },
    },
  ];

  return (
    <EnhancedRemoteTablePage
      title="Merchants"
      description="Manage merchant accounts, approve applications, and monitor platform partners."
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
  );
}