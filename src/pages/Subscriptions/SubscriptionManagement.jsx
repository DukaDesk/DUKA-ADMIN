import { useCallback, useState } from "react";
import { Eye, ArrowLeftRight, Pause, X } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import ConfirmModal from "../../components/UI/ConfirmModal";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { toneBackground } from "../../utils/badgeTones";

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

function normalizeSubscriptionResponse(response) {
  let payload = response;
  while (payload?.success === true && payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    payload = payload.data;
  }
  const records = Array.isArray(payload) ? payload : payload?.data || payload?.subscriptions;
  const rows = Array.isArray(records) ? records : [];
  return {
    ...(payload && !Array.isArray(payload) ? payload : {}),
    data: rows.map((row) => ({
      ...row,
      merchantName: row.merchantName || row.tenant?.name || row.tenantName || "—",
      planName: row.planName || row.plan?.name || (typeof row.plan === "string" ? row.plan : "—"),
      plan: row.plan?.slug || row.planSlug || (typeof row.plan === "string" ? row.plan : ""),
      amount: row.amount ?? row.plan?.price ?? 0,
      amountIsMajorUnits: row.amountIsMajorUnits ?? (row.plan?.price != null),
      currency: row.currency || row.plan?.currency || "NGN",
      currentPeriodEnd: row.currentPeriodEnd || row.endDate || null,
    })),
  };
}

export default function SubscriptionManagement({ showToast }) {
  const { admin } = useAuth();
  const canManage = canPerform(admin, "subscriptions:manage") || canPerform(admin, "plan:manage");
  const [tableKey, setTableKey] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const refresh = () => setTableKey((k) => k + 1);

  const load = useCallback(async (params) => {
    const response = await businessDashboardApi.getSubscriptions(params);
    return normalizeSubscriptionResponse(response);
  }, []);

  const columns = [
    { key: "merchantName", label: "Merchant", width: 200, sortable: true },
    { key: "planName", label: "Plan", width: 140, sortable: true,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--navy)" }}>{value || row.plan}</div>
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
            background: toneBackground(colors[status] || "var(--gray-200)"),
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
        const rawAmount = Number(value ?? row.amount ?? 0);
        const amount = row.amountIsMajorUnits ? rawAmount : rawAmount / 100;
        const currency = row.currency || "NGN";
        return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
      }
    },
    { key: "currentPeriodEnd", label: "Renews", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
    { key: "createdAt", label: "Started", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
  ];

  const filters = [
    { key: "status", label: "Status", placeholder: "All Statuses", options: STATUS_OPTIONS },
    { key: "plan", label: "Plan", placeholder: "All Plans", options: PLAN_OPTIONS },
  ];

  const confirmMutation = async () => {
    if (!confirmation || mutationBusy) return;
    const { kind, row } = confirmation;
    setMutationBusy(true);
    try {
      if (kind === "change_plan") {
        const targetSlug = row.plan === "professional" ? "enterprise" : "professional";
        const response = await businessDashboardApi.getPlans();
        const payload = response?.success === true ? response.data : response;
        const plans = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.plans)
              ? payload.plans
              : [];
        const targetPlan = plans.find((plan) => plan.slug === targetSlug);
        if (!targetPlan?.id) throw new Error(`The ${targetSlug} plan is unavailable.`);
        await businessDashboardApi.updateSubscription(row.id, { planId: targetPlan.id });
        showToast?.(`Plan updated for ${row.merchantName}`, "success");
      } else {
        const status = kind === "pause" ? "paused" : "canceled";
        await businessDashboardApi.updateSubscription(row.id, { status });
        showToast?.(`${kind === "pause" ? "Paused" : "Canceled"} ${row.merchantName}`, "success");
      }
      setConfirmation(null);
      refresh();
    } catch (err) {
      showToast?.(err.message || "Failed to update subscription", "error");
    } finally {
      setMutationBusy(false);
    }
  };

  const actions = [
    {
      key: "view",
      label: "View",
      icon: Eye,
      variant: "Ghost",
      ariaLabel: (row) => `View subscription for ${row.merchantName}`,
      onClick: (row) => {
        showToast?.(`${row.merchantName}: ${row.planName} • ${row.status}`, "info");
      },
    },
    {
      key: "change_plan",
      label: "Change Plan",
      icon: ArrowLeftRight,
      variant: "Secondary",
      disabled: (row) => row.status === "canceled" || !canManage,
      ariaLabel: (row) => `Change plan for ${row.merchantName}`,
      onClick: (row) => setConfirmation({ kind: "change_plan", row }),
    },
    {
      key: "pause",
      label: "Pause",
      icon: Pause,
      variant: "Secondary",
      disabled: (row) => row.status !== "active" || !canManage,
      ariaLabel: (row) => `Pause subscription for ${row.merchantName}`,
      onClick: (row) => setConfirmation({ kind: "pause", row }),
    },
    {
      key: "cancel",
      label: "Cancel",
      icon: X,
      variant: "Danger",
      disabled: (row) => row.status === "canceled" || !canManage,
      ariaLabel: (row) => `Cancel subscription for ${row.merchantName}`,
      onClick: (row) => setConfirmation({ kind: "cancel", row }),
    },
  ];

  return (
    <>
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Subscriptions"
        description="Monitor and manage all merchant subscriptions — change plan, pause or cancel."
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
      <ConfirmModal
        open={!!confirmation}
        title={confirmation?.kind === "change_plan" ? "Change subscription plan?"
          : confirmation?.kind === "pause" ? "Pause subscription?" : "Cancel subscription?"}
        message={confirmation
          ? `${confirmation.kind === "change_plan" ? "Change the plan for" : `${confirmation.kind === "pause" ? "Pause" : "Cancel"} the subscription for`} ${confirmation.row.merchantName}?`
          : ""}
        confirmLabel={confirmation?.kind === "change_plan" ? "Change Plan"
          : confirmation?.kind === "pause" ? "Pause" : "Cancel Subscription"}
        variant={confirmation?.kind === "cancel" ? "Danger" : "Primary"}
        busy={mutationBusy}
        onConfirm={confirmMutation}
        onCancel={() => setConfirmation(null)}
      />
    </>
  );
}
