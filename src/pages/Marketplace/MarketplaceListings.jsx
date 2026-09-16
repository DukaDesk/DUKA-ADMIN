import { useCallback, useState } from "react";
import { Check, X, Star, Eye, Trash2 } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_OPTIONS = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "booking", label: "Booking & Appointments" },
  { value: "payments", label: "Payments" },
  { value: "marketing", label: "Marketing" },
  { value: "analytics", label: "Analytics" },
  { value: "productivity", label: "Productivity" },
  { value: "other", label: "Other" },
];

export default function MarketplaceListings({ showToast }) {
  const { admin } = useAuth();
  const canModerate = canPerform(admin, "marketplace:manage");
  const [selectedRows, setSelectedRows] = useState(new Set());
  // slug map for bulk actions: id -> slug (real data, no mock fallback)
  const [slugMap, setSlugMap] = useState({});

  const load = useCallback(async (params) => {
    const res = await businessDashboardApi.getMarketplaceListings(params);
    const list = res?.data || res?.listings || res?.items || (Array.isArray(res) ? res : []);
    if (Array.isArray(list)) {
      const map = {};
      list.forEach((r) => { if (r.id && r.slug) map[r.id] = r.slug; });
      setSlugMap(map);
    }
    return res;
  }, []);

  const columns = [
    { key: "name", label: "Listing", width: 220, sortable: true,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--navy)" }}>{value}</div>
          {row.slug && <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{row.slug}</div>}
        </div>
      )
    },
    { key: "category", label: "Category", width: 160, sortable: true,
      render: (value) => (
        <span style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "var(--radius-sm)",
          fontSize: 11,
          fontWeight: 600,
          background: "var(--amber-alpha-15)",
          color: "var(--amber)",
          textTransform: "capitalize",
        }}>
          {String(value).replace(/_/g, " ")}
        </span>
      )
    },
    { key: "merchantName", label: "Merchant", width: 180, sortable: true },
    { key: "status", label: "Status", width: 140, sortable: true,
      render: (value) => {
        const status = String(value).toLowerCase();
        const colors = {
          published: "var(--green)",
          draft: "var(--gray-500)",
          pending_review: "var(--amber)",
          rejected: "var(--red)",
          archived: "var(--gray-400)",
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
    { key: "downloads", label: "Downloads", width: 100, sortable: true,
      render: (value) => typeof value === "number" ? value.toLocaleString() : String(value)
    },
    { key: "rating", label: "Rating", width: 80, sortable: true,
      render: (value) => value ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={12} /> {Number(value).toFixed(1)}</span> : "—"
    },
    { key: "createdAt", label: "Created", width: 160, sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
  ];

  const filters = [
    { key: "status", label: "Status", placeholder: "All Statuses", options: STATUS_OPTIONS },
    { key: "category", label: "Category", placeholder: "All Categories", options: CATEGORY_OPTIONS },
  ];

  const [tableKey, setTableKey] = useState(0);
  const refresh = () => setTableKey((k) => k + 1);

  const rowActions = [
    {
      key: "approve",
      label: "Approve",
      icon: Check,
      variant: "Primary",
      disabled: (row) => row.status === "published" || !canModerate,
      ariaLabel: (row) => `Approve listing ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.updateListing(row.slug, { status: "published" });
          showToast?.(`${row.name} approved`, "success");
          refresh();
        } catch (err) {
          showToast?.(err.message || "Failed to approve", "error");
        }
      },
    },
    {
      key: "reject",
      label: "Reject",
      icon: X,
      variant: "Danger",
      disabled: (row) => row.status === "rejected" || !canModerate,
      ariaLabel: (row) => `Reject listing ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.updateListing(row.slug, { status: "rejected" });
          showToast?.(`${row.name} rejected`, "success");
          refresh();
        } catch (err) {
          showToast?.(err.message || "Failed to reject", "error");
        }
      },
    },
    {
      key: "feature",
      label: "Feature",
      icon: Star,
      variant: "Secondary",
      disabled: (row) => row.featured || !canModerate,
      ariaLabel: (row) => `Feature listing ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.updateListing(row.slug, { featured: true });
          showToast?.(`${row.name} featured`, "success");
          refresh();
        } catch (err) {
          showToast?.(err.message || "Failed to feature", "error");
        }
      },
    },
    {
      key: "view",
      label: "View",
      icon: Eye,
      variant: "Ghost",
      ariaLabel: (row) => `View listing ${row.name}`,
      onClick: async (row) => {
        try {
          const res = await businessDashboardApi.getListing(row.slug);
          const data = res?.data || res;
          showToast?.(`${data.name}: ${data.status} • ${data.downloads} downloads`, "info");
        } catch (err) {
          showToast?.(err.message || "Failed to load", "error");
        }
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      variant: "Danger",
      disabled: () => !canModerate,
      ariaLabel: (row) => `Delete listing ${row.name}`,
      onClick: async (row) => {
        try {
          await businessDashboardApi.deleteListing(row.slug);
          showToast?.(`${row.name} deleted`, "success");
          refresh();
        } catch (err) {
          showToast?.(err.message || "Failed to delete", "error");
        }
      },
    },
  ];

  const bulkActions = selectedRows.size > 0 && canModerate ? [
    {
      label: `Approve (${selectedRows.size})`,
      onClick: async () => {
        try {
          for (const id of [...selectedRows]) {
            const slug = slugMap[id] || id;
            await businessDashboardApi.updateListing(slug, { status: "published" });
          }
          showToast?.(`Bulk approved ${selectedRows.size}`, "success");
          setSelectedRows(new Set());
          refresh();
        } catch (err) { showToast?.(err.message, "error"); }
      },
      variant: "Primary",
    },
    {
      label: `Reject (${selectedRows.size})`,
      onClick: async () => {
        try {
          for (const id of [...selectedRows]) {
            const slug = slugMap[id] || id;
            await businessDashboardApi.updateListing(slug, { status: "rejected" });
          }
          showToast?.(`Bulk rejected ${selectedRows.size}`, "success");
          setSelectedRows(new Set());
          refresh();
        } catch (err) { showToast?.(err.message, "error"); }
      },
      variant: "Danger",
    },
  ] : [];

  return (
    <>
      {bulkActions.length > 0 && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--color-surface)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 8, boxShadow: "var(--shadow-sm)" }} role="toolbar" aria-label="Bulk actions">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", marginRight: 8 }}>{selectedRows.size} selected</span>
          {bulkActions.map((a) => (
            <button key={a.label} onClick={a.onClick} style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "none", background: a.variant === "Primary" ? "var(--color-primary-500)" : "var(--color-error-500)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{a.label}</button>
          ))}
          <button onClick={() => setSelectedRows(new Set())} style={{ marginLeft: "auto", padding: "6px 12px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 12 }}>Clear</button>
        </div>
      )}
      <EnhancedRemoteTablePage
        key={tableKey}
        title="Marketplace Listings"
        description="Moderate and manage all marketplace listings — approve, reject, feature, delete (customer care + Builder overview). Click rows to select for bulk approve/reject."
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
        actions={rowActions}
        emptyMessage="No marketplace listings found matching your criteria."
        onRowClick={(row) => {
          const newSelected = new Set(selectedRows);
          if (newSelected.has(row.id)) {
            newSelected.delete(row.id);
          } else {
            newSelected.add(row.id);
          }
          setSelectedRows(newSelected);
        }}
      />
    </>
  );
}