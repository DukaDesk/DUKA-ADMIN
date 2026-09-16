import { ChevronRight, Home } from "lucide-react";

/**
 * KB: NAVIGATION_STANDARD.md — Breadcrumbs for dashboards: Dashboard / Module / Screen
 * Also ERROR_HANDLING_STANDARD: every screen has clear entry point + way back.
 */
const LABELS = {
  dashboard: "Platform Overview",
  merchants: "Merchant Management",
  "pending-admins": "Pending Admins",
  marketplace: "Marketplace",
  audit: "Audit Log",
  subscriptions: "Subscriptions",
  settings: "Platform Configuration",
};

export default function Breadcrumbs({ page, setPage }) {
  const isDashboard = page === "dashboard" || page === "404" || page === "403";
  return (
    <nav aria-label="Breadcrumb" style={{ padding: "12px 24px 0", fontSize: 13, color: "var(--color-neutral-500)" }}>
      <ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
        <li>
          <button
            onClick={() => setPage("dashboard")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: isDashboard ? "var(--color-neutral-900)" : "var(--color-primary-500)", fontWeight: isDashboard ? 600 : 400 }}
            aria-current={isDashboard ? "page" : undefined}
          >
            <Home size={14} /> Dashboard
          </button>
        </li>
        {!isDashboard && (
          <>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li aria-current="page" style={{ color: "var(--color-neutral-900)", fontWeight: 600 }}>{LABELS[page] || page}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
