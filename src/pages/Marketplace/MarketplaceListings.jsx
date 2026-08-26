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
          // TODO: connect to backend when endpoint exists
          showToast?.(`Approve ${row.name} — endpoint pending`, "info");
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
          // TODO: connect to backend when endpoint exists
          showToast?.(`Reject ${row.name} — endpoint pending`, "info");
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
          // TODO: connect to backend when endpoint exists
          showToast?.(`Feature ${row.name} — endpoint pending`, "info");
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
      onClick: (row) => {
        showToast?.(`View detail for ${row.name} — coming soon`, "info");
      },
    },
  ];

  const bulkActions = selectedRows.size > 0 && canModerate ? [
    {
      label: `Approve (${selectedRows.size})`,
      onClick: () => showToast?.(`Bulk approve ${selectedRows.size} listings — endpoint pending`, "info"),
      variant: "Primary",
    },
    {
      label: `Reject (${selectedRows.size})`,
      onClick: () => showToast?.(`Bulk reject ${selectedRows.size} listings — endpoint pending`, "info"),
      variant: "Danger",
    },
  ] : [];

  return (
    <EnhancedRemoteTablePage
      title="Marketplace Listings"
      description="Moderate and manage all marketplace listings across the platform."
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