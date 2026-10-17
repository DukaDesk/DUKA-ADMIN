import { useCallback } from "react";
import { Info } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import { businessDashboardApi } from "../../services/businessDashboard";

export default function Marketing() {
  const loadIntegrations = useCallback((params) => businessDashboardApi.getIntegrations(params), []);
  const integrationColumns = [
    { key: "provider", label: "Provider", width: 160, sortable: true },
    { key: "label", label: "Name", width: 180, sortable: true },
    { key: "description", label: "Description", width: 300 },
    {
      key: "oauthRequired",
      label: "Authentication",
      width: 150,
      render: (value) => value ? "OAuth required" : "API credentials",
    },
  ];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h2 style={{ margin: 0, color: "var(--navy)", fontSize: 22, fontWeight: 700 }}>Marketing</h2>
        <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
          Review available integration providers.
        </p>
      </header>
      <div role="note" style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 12, border: "1px solid var(--gray-200)", borderRadius: 8, color: "var(--gray-600)", background: "#fff", fontSize: 13 }}>
        <Info size={16} aria-hidden="true" />
        <span>Campaign delivery is tenant-scoped. Platform campaign history and sending are not available in this portal.</span>
      </div>
      <EnhancedRemoteTablePage
        title="Available Integrations"
        description="Connector providers supported by the platform."
        load={loadIntegrations}
        rowKey="provider"
        columns={integrationColumns}
        searchable={false}
        sortable={false}
        pagination={false}
        emptyMessage="No integration providers are configured."
      />
    </section>
  );
}
