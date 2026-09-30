import { useCallback, useState, useEffect } from "react";
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
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [tableKey, setTableKey] = useState(0);

  useEffect(() => {
    let active = true;
    businessDashboardApi.getMerchants({ page: 1, limit: 50 }).then((res) => {
      if (!active) return;
      const list = res?.data || res?.merchants || res?.items || [];
      setMerchants(Array.isArray(list) ? list : []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleMerchantChange = (merchantId) => {
    setSelectedMerchant(merchantId);
    setTableKey((k) => k + 1);
  };

  const load = useCallback(async (params) => {
    // Good-practice: tenant app users are via TenantUser (getMerchantUsers), not just admin users with role=customer
    // If merchant selected, fetch tenant-scoped users; else fetch platform users (admin + tenant) with fallback
    if (selectedMerchant) {
      try {
        const res = await businessDashboardApi.getMerchantUsers(selectedMerchant, params);
        // If tenant has no users, fallback to empty with clear message
        return res;
      } catch (e) {
        // If merchant has no TenantUser rows, fallback to getCustomers
        if (e?.status === 404) return { users: [], total: 0 };
        throw e;
      }
    }
    // No merchant filter: try tenant-aware customers first, then platform users
    // This ensures app/tenant users appear even when role=customer filter is empty on backend
    try {
      const res = await businessDashboardApi.getCustomers(params);
      const list = res?.data || res?.users || res?.items || [];
      if (Array.isArray(list) && list.length > 0) return res;
      // Fallback: if no customers via role filter, try fetching first merchant's tenant users to show app data
      if (merchants.length > 0) {
        const firstId = merchants[0].id;
        try {
          const tenantRes = await businessDashboardApi.getMerchantUsers(firstId, { page: params.page, limit: params.limit, search: params.search });
          const tList = tenantRes?.users || tenantRes?.data || tenantRes?.items || [];
          if (Array.isArray(tList) && tList.length > 0) {
            // Annotate with merchant context for display
            return { ...tenantRes, users: tList.map((u) => ({ ...u, _merchantName: merchants[0].name })) };
          }
        } catch {}
      }
      return res;
    } catch (e) {
      return businessDashboardApi.getCustomers(params);
    }
  }, [selectedMerchant, merchants]);

  const columns = [
    { key: "name", label: "Customer", width: 180, sortable: true, render: (v, r) => v || `${r.firstName || ""} ${r.lastName || ""}`.trim() || r.email || "—" },
    { key: "email", label: "Email", width: 220, sortable: true, render: (v) => canViewEmail(admin) ? v : maskEmail(v) },
    { key: "_merchantName", label: "Tenant App", width: 160, sortable: true, render: (v, r) => {
      const tenant = v || r.tenant?.name || r.tenantName || r._merchantName || (r.tenants?.[0]?.tenant?.name) || "";
      if (!tenant) return <span style={{ fontSize: 11, color: "var(--gray-400)" }}>— (platform)</span>;
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--teal)", background: "var(--teal)12", padding: "2px 8px", borderRadius: 6 }}>{tenant}</span>;
    }},
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
    { key: "email", label: "Email", icon: Mail, variant: "Secondary", onClick: (r) => showToast?.(`Email to ${r.email}`, "info") },
    { key: "ban", label: "Deactivate", icon: Ban, variant: "Danger", disabled: () => !canManage, onClick: async (r) => {
      if (!confirm(`Deactivate ${r.email}? 30-day soft delete.`)) return;
      try { await businessDashboardApi.removeUser(r.id, ""); showToast?.("Customer deactivated", "success"); } catch (e) { showToast?.(e.message, "error"); }
    }},
  ];

  return (
    <>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 10 }}>
        <label htmlFor="merchant-filter" style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Merchant:</label>
        <select
          id="merchant-filter"
          value={selectedMerchant}
          onChange={(e) => handleMerchantChange(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, minWidth: 200, background: "#fff" }}
          aria-label="Filter by merchant"
        >
          <option value="">All Customers</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Customers"
        description="End-user customer directory."
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
            {detail.tenants && Array.isArray(detail.tenants) && detail.tenants.length > 0 && (
              <div style={{ padding: 10, background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Stores ({detail.tenants.length})</div>
                {detail.tenants.map((tm) => (
                  <div key={tm.tenantId || tm.tenant?.id} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>{tm.tenant?.name || tm.tenantId}</span>
                    <span style={{ fontSize: 11, textTransform: "capitalize" }}>{tm.status || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </>
  );
}
