import { useCallback, useState } from "react";
import { Eye, Truck, Check, X } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Orders({ showToast }) {
  const { admin } = useAuth();
  const canManage = canPerform(admin, "order:update_status") || canPerform(admin, "orders:manage") || canPerform(admin, "tenant:manage");
  const [tableKey, setTableKey] = useState(0);
  const refresh = () => setTableKey((k) => k + 1);

  const load = useCallback(async (params) => businessDashboardApi.getOrders(params), []);

  const columns = [
    { key: "id", label: "Order ID", width: 160, sortable: true, render: (v) => v ? <code style={{ fontSize: 11, background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{String(v).slice(0, 8)}…</code> : "—" },
    { key: "merchantName", label: "Merchant", width: 160, sortable: true, render: (v, r) => v || r.tenant?.name || r.merchantId || "—" },
    { key: "customerName", label: "Customer", width: 160, sortable: true, render: (v, r) => v || r.customerEmail || `${r.firstName || ""} ${r.lastName || ""}`.trim() || "—" },
    { key: "status", label: "Status", width: 130, sortable: true, render: (v) => {
      const s = String(v || "pending").toLowerCase();
      const colors = { pending_payment: "var(--amber)", paid: "var(--green)", processing: "var(--blue)", shipped: "var(--purple)", delivered: "var(--teal)", cancelled: "var(--red)" };
      return <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: (colors[s]||"var(--gray-200)")+"22", color: colors[s]||"var(--gray-500)", textTransform:"capitalize" }}>{s.replace("_"," ")}</span>;
    }},
    { key: "total", label: "Total", width: 110, sortable: true, render: (v, r) => {
      const amt = Number(v ?? r.total ?? 0);
      const cur = r.currency || "NGN";
      return new Intl.NumberFormat("en-NG", { style:"currency", currency: cur, maximumFractionDigits:0 }).format(amt);
    }},
    { key: "createdAt", label: "Placed", width: 150, sortable: true, render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  const filters = [{ key: "status", label: "Status", placeholder: "All Statuses", options: STATUS_OPTIONS }];

  const actions = [
    { key: "view", label: "View", icon: Eye, variant: "Ghost", ariaLabel: (r) => `View order ${r.id}`, onClick: (r) => showToast?.(`${r.id}: ${r.status} • ${r.total ?? ""}`, "info") },
    { key: "ship", label: "Mark Shipped", icon: Truck, variant: "Secondary", disabled: (r) => !canManage || String(r.status).toLowerCase()==="shipped", onClick: async (r) => {
      try { await businessDashboardApi.updateOrderStatus(r.id, { status:"shipped" }); showToast?.("Order marked shipped", "success"); refresh(); } catch(e){ showToast?.(e.message,"error"); }
    }},
    { key: "deliver", label: "Deliver", icon: Check, variant: "Primary", disabled: (r) => !canManage || String(r.status).toLowerCase()==="delivered", onClick: async (r) => {
      try { await businessDashboardApi.updateOrderStatus(r.id, { status:"delivered" }); showToast?.("Order delivered", "success"); refresh(); } catch(e){ showToast?.(e.message,"error"); }
    }},
    { key: "cancel", label: "Cancel", icon: X, variant: "Danger", disabled: (r) => !canManage || String(r.status).toLowerCase()==="cancelled", onClick: async (r) => {
      try { await businessDashboardApi.updateOrderStatus(r.id, { status:"cancelled" }); showToast?.("Order cancelled", "success"); refresh(); } catch(e){ showToast?.(e.message,"error"); }
    }},
  ];

  return (
    <EnhancedRemoteTablePage
      key={tableKey}
      title="Orders"
      description="Monitor all tenant orders — view and update status via POST /app/commerce/orders/:id/status. Live via BFF when available."
      load={load}
      rowKey="id"
      columns={columns}
      searchable
      sortable
      pagination
      pageSize={10}
      pageSizeOptions={[10,25,50,100]}
      filters={filters}
      defaultSort={{ key: "createdAt", direction: "desc" }}
      actions={actions}
      emptyMessage="No orders found."
    />
  );
}
