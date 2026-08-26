import { useCallback, useState, useEffect } from "react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import { businessDashboardApi } from "../../services/businessDashboard";

const ACTION_OPTIONS = [
  { value: "tenant.approve", label: "Tenant Approved" },
  { value: "tenant.suspend", label: "Tenant Suspended" },
  { value: "tenant.create", label: "Tenant Created" },
  { value: "tenant.update", label: "Tenant Updated" },
  { value: "user.invite", label: "User Invited" },
  { value: "user.role_assign", label: "Role Assigned" },
  { value: "plan.create", label: "Plan Created" },
  { value: "plan.update", label: "Plan Updated" },
  { value: "marketplace.approve", label: "Listing Approved" },
  { value: "marketplace.reject", label: "Listing Rejected" },
  { value: "settings.update", label: "Settings Updated" },
  { value: "login", label: "Admin Login" },
  { value: "logout", label: "Admin Logout" },
];

export default function AuditLog({ showToast }) {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [quickRange, setQuickRange] = useState("7d");

  const load = useCallback(async (params) => {
    const searchParams = { ...params };
    if (dateRange.from) searchParams.from = dateRange.from;
    if (dateRange.to) searchParams.to = dateRange.to;
    return businessDashboardApi.getAuditLog(searchParams);
  }, [dateRange]);

  useEffect(() => {
    if (!quickRange) return;
    const now = new Date();
    const days = quickRange === "7d" ? 7 : quickRange === "30d" ? 30 : quickRange === "90d" ? 90 : 7;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({
      from: from.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    });
  }, [quickRange]);

  const columns = [
    { key: "timestamp", label: "Time", width: 180, sortable: true,
      render: (value) => value ? new Date(value).toLocaleString() : "—"
    },
    { key: "adminEmail", label: "Admin", width: 200, sortable: true },
    { key: "action", label: "Action", width: 200, sortable: true,
      render: (value) => {
        const action = String(value);
        const opt = ACTION_OPTIONS.find((o) => o.value === action);
        return (
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
            {opt?.label || action.replace(".", " ")}
          </span>
        );
      }
    },
    { key: "targetType", label: "Target Type", width: 140, sortable: true,
      render: (value) => value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "—"
    },
    { key: "targetId", label: "Target ID", width: 140, sortable: true,
      render: (value) => value ? (
        <code style={{ fontSize: 12, background: "var(--gray-100)", padding: "2px 6px", borderRadius: "var(--radius-sm)" }}>
          {value}
        </code>
      ) : "—"
    },
    { key: "metadata", label: "Details", width: 240, sortable: false,
      render: (value) => value ? (
        <details style={{ cursor: "pointer" }}>
          <summary style={{ fontSize: 12, color: "var(--gray-600)" }}>View details</summary>
          <pre style={{ marginTop: 8, fontSize: 11, background: "var(--gray-50)", padding: 8, borderRadius: "var(--radius-sm)", maxHeight: 150, overflow: "auto" }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      ) : "—"
    },
  ];

  const filters = [
    { key: "action", label: "Action", placeholder: "All Actions", options: ACTION_OPTIONS },
  ];

  return (
    <div>
      <EnhancedRemoteTablePage
        title="Audit Log"
        description="Track all privileged administrative actions across the platform."
        load={load}
        rowKey="id"
        columns={columns}
        searchable={true}
        sortable={true}
        pagination={true}
        pageSize={15}
        pageSizeOptions={[15, 25, 50, 100]}
        filters={filters}
        defaultSort={{ key: "timestamp", direction: "desc" }}
        emptyMessage="No audit records found matching your criteria."
      />

      <div style={{ marginTop: 24, padding: 20, background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", border: "1px solid var(--gray-200)" }}>
        <h3 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 16, color: "var(--navy)" }}>
          Date Range Filter
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, color: "var(--gray-600)" }}>Quick:</label>
            <select
              value={quickRange}
              onChange={(e) => setQuickRange(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="">Custom range</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, color: "var(--gray-600)" }}>From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              style={{ padding: "8px 12px", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
            />
            <label style={{ fontSize: 13, color: "var(--gray-600)" }}>To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              style={{ padding: "8px 12px", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
            />
          </div>
          <button
            onClick={() => {
              setDateRange({ from: "", to: "" });
              setQuickRange("");
            }}
            style={{
              padding: "8px 16px",
              background: "var(--gray-100)",
              color: "var(--gray-700)",
              border: "1px solid var(--gray-200)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear Range
          </button>
        </div>
      </div>
    </div>
  );
}