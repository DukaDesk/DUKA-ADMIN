import { useCallback, useState } from "react";
import { Eye, Edit, Trash2, Package } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import SlideOver from "../../components/UI/SlideOver";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
];

export default function Products({ showToast }) {
  const { admin } = useAuth();
  const canManage = canPerform(admin, "product:update") || canPerform(admin, "catalog:manage") || canPerform(admin, "tenant:manage");
  const [tableKey, setTableKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const refresh = () => setTableKey((k) => k + 1);

  const load = useCallback(async (params) => businessDashboardApi.getProducts(params), []);

  const columns = [
    { key: "name", label: "Product", width: 220, sortable: true, render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v || r.title || "—"}</div><div style={{ fontSize: 11, color: "var(--gray-500)" }}>{r.slug || r.id?.slice(0, 8) || ""}</div></div> },
    { key: "category", label: "Category", width: 140, sortable: true, render: (v, r) => String(v || r.category?.name || r.category || "—") },
    { key: "price", label: "Price", width: 110, sortable: true, render: (v, r) => {
      const p = Number(v ?? r.price ?? r.variants?.[0]?.price ?? 0);
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(p);
    }},
    { key: "stock", label: "Stock", width: 100, sortable: true, render: (v, r) => {
      const s = Number(v ?? r.stock ?? r.quantity ?? 0);
      const color = s === 0 ? "var(--red)" : s < 10 ? "var(--amber)" : "var(--green)";
      return <span style={{ color, fontWeight: 600 }}>{s}</span>;
    }},
    { key: "status", label: "Status", width: 110, sortable: true, render: (v, r) => {
      const s = String(v || r.status || (r.isActive === false ? "inactive" : "active")).toLowerCase();
      const bg = s === "active" ? "var(--green)22" : "var(--gray-100)";
      const c = s === "active" ? "var(--green)" : "var(--gray-500)";
      return <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: bg, color: c, textTransform: "capitalize" }}>{s}</span>;
    }},
    { key: "createdAt", label: "Created", width: 140, sortable: true, render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  const actions = [
    { key: "view", label: "View", icon: Eye, variant: "Ghost", onClick: async (r) => {
      try { const res = await businessDashboardApi.getProduct(r.id); setDetail(res?.data || res); } catch (e) { showToast?.(e.message, "error"); }
    }},
    { key: "stock", label: "Adjust Stock", icon: Package, variant: "Secondary", disabled: () => !canManage, onClick: async (r) => {
      const val = prompt(`Adjust stock for ${r.name || r.id} — enter delta (e.g., 5 or -3):`);
      if (val === null) return;
      const delta = Number(val);
      if (Number.isNaN(delta)) { showToast?.("Invalid number", "error"); return; }
      try { await businessDashboardApi.adjustStock(r.id, { delta, quantity: delta }); showToast?.("Stock updated", "success"); refresh(); } catch (e) { showToast?.(e.message, "error"); }
    }},
    { key: "edit", label: "Edit", icon: Edit, variant: "Secondary", disabled: () => !canManage, onClick: (r) => showToast?.(`Edit ${r.name || r.id} — use Builder for rich editing`, "info") },
    { key: "delete", label: "Delete", icon: Trash2, variant: "Danger", disabled: () => !canManage, onClick: async (r) => {
      if (!confirm(`Delete ${r.name || r.id}?`)) return;
      try { await businessDashboardApi.deleteProduct(r.id); showToast?.("Product deleted", "success"); refresh(); } catch (e) { showToast?.(e.message, "error"); }
    }},
  ];

  return (
    <>
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Products"
        description="Catalog management — list, adjust stock, edit or delete. Live via GET /app/commerce/products. Use Builder for rich layout."
        load={load}
        rowKey="id"
        columns={columns}
        searchable
        sortable
        pagination
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        filters={[{ key: "category", label: "Category", placeholder: "All Categories", options: CATEGORY_OPTIONS }]}
        defaultSort={{ key: "createdAt", direction: "desc" }}
        actions={actions}
        emptyMessage="No products found."
      />
      <SlideOver open={!!detail} onClose={() => setDetail(null)} title={detail?.name || detail?.title || "Product detail"}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <div><strong>{detail.name || detail.title}</strong> · {detail.category || "—"}</div>
            <div>Price: {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(detail.price || 0))} · Stock: {detail.stock ?? detail.quantity ?? "—"}</div>
            <pre style={{ background: "var(--gray-50)", padding: 12, borderRadius: 8, fontSize: 11, maxHeight: 300, overflow: "auto" }}>{JSON.stringify(detail, null, 2)}</pre>
          </div>
        )}
      </SlideOver>
    </>
  );
}
