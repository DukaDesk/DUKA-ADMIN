import { useCallback, useState } from "react";
import { Eye, ArrowLeftRight, Pause, X } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import ConfirmModal from "../../components/UI/ConfirmModal";
import ExportButton from "../../components/UI/ExportButton";
import SlideOver from "../../components/UI/SlideOver";
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
  const [detail, setDetail] = useState(null);
  const [capabilities, setCapabilities] = useState(undefined);
  const refresh = () => setTableKey((k) => k + 1);

  const openDetail = async (row) => {
    setDetail(row);
    setCapabilities(undefined);
    try {
      const response = await businessDashboardApi.getPlans();
      const payload = response?.success === true ? response.data : response;
      const plans = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.plans) ? payload.plans : [];
      const match = plans.find((p) => p.slug === row.plan || p.name === row.planName || p.id === row.planId);
      setCapabilities(match ? { features: match.features || {}, limits: match.limits || {}, name: match.name } : null);
    } catch {
      setCapabilities(null);
    }
  };

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
      onClick: (row) => openDetail(row),
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--gray-500)" }} role="note">
          {canManage ? "Platform operator view — merchant subscriptions are managed here." : "Read-only view — your role cannot change plans, pause, or cancel."}
        </span>
        <ExportButton report="subscriptions" showToast={showToast} />
      </div>
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
      <SlideOver open={!!detail} onClose={() => setDetail(null)} title={detail?.merchantName || "Subscription"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <div><strong>Plan:</strong> {detail.planName || detail.plan || "—"}</div>
            <div><strong>Status:</strong> {String(detail.status || "—").replace("_", " ")}</div>
            <div><strong>Renews:</strong> {detail.currentPeriodEnd ? new Date(detail.currentPeriodEnd).toLocaleDateString() : "—"}</div>
            <div><strong>Started:</strong> {detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : "—"}</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Plan capabilities</div>
              {capabilities === undefined && <p style={{ color: "var(--gray-500)", margin: 0 }}>Loading capabilities…</p>}
              {capabilities === null && <p style={{ color: "var(--gray-500)", margin: 0 }}>Capability details unavailable for this plan.</p>}
              {capabilities && (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {Object.entries(capabilities.limits || {}).map(([k, v]) => (
                    <li key={`limit-${k}`}><strong>{k.replace(/([A-Z])/g, " $1")}:</strong> {String(v)}</li>
                  ))}
                  {Object.entries(capabilities.features || {}).map(([k, v]) => (
                    <li key={`feature-${k}`}>{k.replace(/([A-Z])/g, " $1")}: {typeof v === "boolean" ? (v ? "included" : "not included") : String(v)}</li>
                  ))}
                  {Object.keys(capabilities.limits || {}).length === 0 && Object.keys(capabilities.features || {}).length === 0 && (
                    <li>No capability metadata published for this plan.</li>
                  )}
                </ul>
              )}
            </div>
            {!canManage && <div role="note" style={{ fontSize: 12, color: "var(--gray-500)" }}>Read-only — financial detail is displayed without management controls.</div>}
          </div>
        )}
      </SlideOver>
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
