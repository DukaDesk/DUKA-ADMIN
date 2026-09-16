import { useCallback, useState } from "react";
import { Send, Plug } from "lucide-react";
import EnhancedRemoteTablePage from "../../components/UI/EnhancedRemoteTablePage";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

export default function Marketing({ showToast }) {
  const { admin } = useAuth();
  const canSend = canPerform(admin, "announcement:send") || canPerform(admin, "tenant:manage") || canPerform(admin, "marketplace:manage");
  const [tableKey, setTableKey] = useState(0);
  const refresh = () => setTableKey((k) => k + 1);

  const loadCampaigns = useCallback(async (params) => businessDashboardApi.getCampaigns(params), []);
  const loadIntegrations = useCallback(async (params) => businessDashboardApi.getIntegrations(params), []);

  const campaignColumns = [
    { key: "name", label: "Campaign", width: 200, sortable: true, render: (v, r) => v || r.subject || r.title || "—" },
    { key: "channel", label: "Channel", width: 120, sortable: true, render: (v) => String(v || "email").toUpperCase() },
    { key: "status", label: "Status", width: 110, sortable: true, render: (v) => {
      const s = String(v || "queued").toLowerCase();
      const bg = s === "sent" ? "var(--green)22" : s === "queued" ? "var(--amber)22" : "var(--gray-100)";
      const c = s === "sent" ? "var(--green)" : s === "queued" ? "var(--amber)" : "var(--gray-500)";
      return <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: bg, color: c, textTransform: "capitalize" }}>{s}</span>;
    }},
    { key: "recipients", label: "Recipients", width: 110, sortable: true, render: (v) => typeof v === "number" ? v : Array.isArray(v) ? v.length : "—" },
    { key: "createdAt", label: "Created", width: 140, sortable: true, render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  const integrationColumns = [
    { key: "provider", label: "Provider", width: 160, sortable: true, render: (v) => v || "—" },
    { key: "name", label: "Name", width: 180, sortable: true, render: (v) => v || "—" },
    { key: "status", label: "Status", width: 120, sortable: true, render: (v) => {
      const s = String(v || "disconnected").toLowerCase();
      const c = s === "connected" ? "var(--green)" : "var(--gray-500)";
      return <span style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: c+"22", color: c, textTransform:"capitalize" }}>{s}</span>;
    }},
    { key: "lastSyncAt", label: "Last Sync", width: 140, sortable: true, render: (v) => v ? new Date(v).toLocaleString() : "—" },
  ];

  const campaignActions = [
    { key: "send", label: "Send", icon: Send, variant: "Primary", disabled: () => !canSend, onClick: async (r) => {
      try { await businessDashboardApi.sendCampaign({ templateId: r.id, channel: r.channel || "email" }); showToast?.("Campaign queued", "success"); refresh(); } catch (e) { showToast?.(e.message, "error"); }
    }},
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <EnhancedRemoteTablePage
        key={`camp-${tableKey}`}
        title="Campaigns"
        description="Push/email/SMS campaigns live via POST /app/notifications/campaigns. Create in Settings → Notifications."
        load={loadCampaigns}
        rowKey="id"
        columns={campaignColumns}
        searchable
        sortable
        pagination
        pageSize={10}
        actions={campaignActions}
        emptyMessage="No campaigns. Create one via POST /app/notifications/campaigns."
      />
      <EnhancedRemoteTablePage
        key={`int-${tableKey}`}
        title="Integrations"
        description="Available connectors live via GET /app/integrations/available and tenant status via /bff/tenant/:id/integrations."
        load={loadIntegrations}
        rowKey="provider"
        columns={integrationColumns}
        searchable
        sortable
        pagination
        pageSize={10}
        actions={[
          { key: "test", label: "Test", icon: Plug, variant: "Secondary", onClick: async (r) => showToast?.(`Test ${r.provider} — via POST /app/integrations/:provider/test`, "info") },
        ]}
        emptyMessage="No integrations configured."
      />
    </div>
  );
}
