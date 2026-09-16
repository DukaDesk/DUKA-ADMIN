import { useCallback, useState } from "react";
import { Eye, Mail, Ban } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";
import { maskEmail } from "../../utils/maskEmail";
import { canViewEmail } from "../../services/permissions";

export default function Customers({ showToast }) {
  const { admin } = useAuth();
  const canManage = canPerform(admin, "user:update") || canPerform(admin, "tenant:manage");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (params) => {
    // Customers are tenant users with customer role; fallback to all users if role filter empty
    const res = await businessDashboardApi.getCustomers(params);
    return res;
  }, []);

  const columns = [
    { key: "name", label: "Customer", width: 180, sortable: true, render: (v, r) => v || `${r.firstName || ""} ${r.lastName || ""}`.trim() || r.email || "—" },
    { key: "email", label: "Email", width: 220, sortable: true, render: (v) => canViewEmail(admin) ? v : maskEmail(v) },
    { key: "phoneNumber", label: "Phone", width: 140, sortable: true, render: (v) => v || "—" },
    { key: "status", label: "Status", width: 110, sortable: true, render: (v) => {
      const s = String(v || "active").toLowerCase();
      const bg = s === "active" ? "var(--green)22" : s === "pending" ? "var(--amber)22" : "var(--gray-100)";
      const c = s === "active" ? "var(--green)" : s === "pending" ? "var(--amber)" : "var(--gray-500)";
      return <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: bg, color: c, textTransform: "capitalize" }}>{s}</span>;
    }},
    { key: "createdAt", label: "Joined", width: 140, sortable: true, render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  const actions = [
    { key: "view", label: "View", icon: Eye, variant: "Ghost", onClick: async (r) => {
      try { const res = await businessDashboardApi.getUser(r.id); setDetail(res?.data || res); } catch (e) { showToast?.(e.message, "error"); }
    }},
    { key: "email", label: "Email", icon: Mail, variant: "Secondary", onClick: (r) => showToast?.(`Email to ${r.email} — via notifications`, "info") },
    { key: "ban", label: "Deactivate", icon: Ban, variant: "Danger", disabled: () => !canManage, onClick: async (r) => {
      if (!confirm(`Deactivate ${r.email}? 30-day soft delete.`)) return;
      try { await businessDashboardApi.removeUser(r.id, ""); showToast?.("Customer deactivated", "success"); } catch (e) { showToast?.(e.message, "error"); }
    }},
  ];

  return (
    <>
      <EnhancedRemoteTablePage
        title="Customers"
        description="End-user customer directory — live via GET /admin/users?role=customer. Filter, view, or deactivate (30-day soft delete)."
        load={load}
        rowKey="id"
        columns={columns}
        searchable
        sortable
        pagination
        pageSize={10}
        pageSizeOptions={[10,25,50]}
        filters={[]}
        defaultSort={{ key: "createdAt", direction: "desc" }}
        actions={actions}
        emptyMessage="No customers found."
      />
      <SlideOver open={!!detail} onClose={() => setDetail(null)} title={detail?.email || "Customer detail"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <div><strong>{detail.firstName} {detail.lastName}</strong> · {canViewEmail(admin) ? detail.email : maskEmail(detail.email)}</div>
            <div>Status: {detail.status} · Phone: {detail.phoneNumber || "—"}</div>
            <div>Joined: {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}</div>
            <pre style={{ background: "var(--gray-50)", padding: 12, borderRadius: 8, fontSize: 11, maxHeight: 300, overflow: "auto" }}>{JSON.stringify(detail, null, 2)}</pre>
          </div>
        )}
      </SlideOver>
    </>
  );
}
