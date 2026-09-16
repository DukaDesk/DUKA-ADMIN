import { ShieldAlert } from "lucide-react";
import styles from "../NotFound/NotFound.module.css";

/**
 * KB: ERROR_HANDLING_STANDARD.md — 403 Forbidden
 * Shown when `canAccessPage`/`canPerform` fails (SEC-0002 SR-07)
 */
export default function Forbidden({ setPage, requiredPermission }) {
  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.code} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
        <ShieldAlert size={36} /> 403
      </div>
      <h1 className={styles.title}>Access denied</h1>
      <p className={styles.description}>
        You do not have permission to view this section.
        {requiredPermission ? ` Required: ${requiredPermission}` : ""}
        <br />
        If you need access, contact a Super Admin or Platform Operator.
      </p>
      <button className={styles.homeBtn} onClick={() => setPage("dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}
