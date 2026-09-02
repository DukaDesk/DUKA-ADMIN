import { useCallback, useState } from "react";
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

  const load = useCallback(async (params) => {
    return businessDashboardApi.getMarketplaceListings(params);
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
      render: (value) => value ? `★ ${Number(value).toFixed(1)}` : "—"
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
      icon: "✓",
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
      icon: "✕",
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
      icon: "★",
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
      icon: "👁",
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
      icon: "🗑",
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
        for (const id of selectedRows) {
          const row = document.querySelector(`[data-row-id="${id}"]`);
        }
        // bulk via sequential updates
        try {
          for (const sid of [...selectedRows]) {
            const listing = { slug: sid.replace?.("lst_", "plugin-") || sid };
            // best-effort: find slug from id mapping — fallback to updateListing with id as slug alias
            await businessDashboardApi.updateListing(sid, { status: "published" }).catch(() => businessDashboardApi.updateListing(listing.slug, { status: "published" }));
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
          for (const sid of [...selectedRows]) {
            await businessDashboardApi.updateListing(sid, { status: "rejected" }).catch(() => {});
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
    <EnhancedRemoteTablePage
      key={tableKey}
      title="Marketplace Listings"
      description="Moderate and manage all marketplace listings — approve, reject, feature, delete (customer care + Builder overview)."
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
  );
}