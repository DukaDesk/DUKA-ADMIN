import { useState } from "react";
import { Download } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { businessDashboardApi } from "../../services/businessDashboard";
import { downloadCsv } from "../../utils/downloadCsv";
import { canPerform } from "../../services/permissions";
import { useAuth } from "../../context/AuthContext";

export default function ExportButton({ report, filters = {}, label = "Export CSV", showToast, sensitive = true }) {
  const { admin } = useAuth();
  const allowed = canPerform(admin, "reports:read");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!allowed) return null;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await businessDashboardApi.exportReport(report, filters);
      downloadCsv(result?.filename || `${report}.csv`, result?.csv || "");
      showToast?.(`Exported ${result?.rows ?? 0} row(s)`, "success");
      setConfirming(false);
    } catch (err) {
      showToast?.(err.message || "Export failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (sensitive ? setConfirming(true) : run())}
        disabled={busy}
        aria-label={label}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px",
          background: "var(--gray-100)", color: "var(--navy)", border: "1px solid var(--gray-200)",
          borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
        }}
      >
        <Download size={16} aria-hidden="true" /> {busy ? "Exporting…" : label}
      </button>
      {sensitive && (
        <ConfirmModal
          open={confirming}
          title="Export data as CSV?"
          message={`This exports the current ${report.replace(/-/g, " ")} view. Large or sensitive exports are recorded in the audit log.`}
          confirmLabel="Export"
          busy={busy}
          onConfirm={run}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
