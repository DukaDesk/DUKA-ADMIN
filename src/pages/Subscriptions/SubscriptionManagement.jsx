import { useCallback, useState } from "react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past Due" },
  { value: "canceled", label: "Canceled" },
  { value: "trialing", label: "Trialing" },
  { value: "paused", label: "Paused" },
  { value: "incomplete", label: "Incomplete" },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

const INTERVAL_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function SubscriptionManagement({ showToast }) {
  const { admin } = useAuth();
  const canManage = canPerform(admin, "subscriptions:manage") || canPerform(admin, "plan:manage");
  const [tableKey, setTableKey] = useState(0);
  const refresh = () => setTableKey((k) => k + 1);

  const load = useCallback(async (params) => {
    return businessDashboardApi.getSubscriptions(params);
  }, []);

  const columns = [
    { key: "merchantName", label: "Merchant", width: 200, sortable: true },
    { key: "planName", label: "Plan", width: 140, sortable: true,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--navy)" }}>{value || row.plan}</div>
          {row.interval && (
            <span style={{
              display: "inline-block",
              marginTop: 2,
              padding: "1px 6px",
              borderRadius: "var(--radius-sm)",
              fontSize: 10,
              fontWeight: 600,
              background: "var(--gray-100)",
              color: "var(--gray-600)",
              textTransform: "capitalize",
            }}>
              {row.interval}
            </span>
          )}
        </div>
      )
    },
    { key: "status", label: "Status", width: 120, sortable: true,
      render: (value) => {
        const status = String(value).toLowerCase();
        const colors = {
          active: "var(--green)",
          trialing: "var(--blue)",
          past_due: "var(--red)",
          canceled: "var(--gray-500)",
          paused: "var(--amber)",
          incomplete: "var(--orange)",
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
            {status.replace("_", " ")}
          </span>
        );
      }
    },
    { key: "amount", label: "Amount", width: 100, sortable: true,
      render: (value, row) => {
        const amount = Number(value || row.amount || 0) / 100;
        const currency = row.currency || "NGN";
        return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
      }
    },
    { key: "currentPeriodEnd", label: "Renews", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
    { key: "trialEnd", label: "Trial Ends", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
    { key: "createdAt", label: "Started", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
  ];

  const filters = [
    { key: "status", label: "Status", placeholder: "All Statuses", options: STATUS_OPTIONS },
    { key: "plan", label: "Plan", placeholder: "All Plans", options: PLAN_OPTIONS },
    { key: "interval", label: "Billing", placeholder: "All Intervals", options: INTERVAL_OPTIONS },
  ];

  const actions = [
    {
      key: "view",
      label: "View",
      icon: "👁",
      variant: "Ghost",
      ariaLabel: (row) => `View subscription for ${row.merchantName}`,
      onClick: (row) => {
        showToast?.(`${row.merchantName}: ${row.planName} • ${row.status} • ${row.interval}`, "info");
      },
    },
    {
      key: "change_plan",
      label: "Change Plan",
      icon: "⇄",
      variant: "Secondary",
      disabled: (row) => row.status === "canceled" || !canManage,
      ariaLabel: (row) => `Change plan for ${row.merchantName}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.updateSubscription(row.id, { plan: row.plan === "professional" ? "enterprise" : "professional" });
          showToast?.(`Plan updated for ${row.merchantName}`, "success");
          refresh();
        } catch (err) { showToast?.(err.message, "error"); }
      },
    },
    {
      key: "pause",
      label: "Pause",
      icon: "⏸",
      variant: "Secondary",
      disabled: (row) => row.status !== "active" || !canManage,
      ariaLabel: (row) => `Pause subscription for ${row.merchantName}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.updateSubscription(row.id, { status: "paused" });
          showToast?.(`Paused ${row.merchantName}`, "success");
          refresh();
        } catch (err) { showToast?.(err.message, "error"); }
      },
    },
    {
      key: "cancel",
      label: "Cancel",
      icon: "✕",
      variant: "Danger",
      disabled: (row) => row.status === "canceled" || !canManage,
      ariaLabel: (row) => `Cancel subscription for ${row.merchantName}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.updateSubscription(row.id, { status: "canceled" });
          showToast?.(`Canceled ${row.merchantName}`, "success");
          refresh();
        } catch (err) { showToast?.(err.message, "error"); }
      },
    },
  ];

  return (
    <EnhancedRemoteTablePage
      key={tableKey}
      title="Subscriptions"
      description="Monitor and manage all merchant subscriptions — change plan, pause or cancel via PUT /admin/subscriptions/:id."
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
      emptyMessage="No subscriptions found matching your criteria."
    />
  );
}