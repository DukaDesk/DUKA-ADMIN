import { statusStyles } from "../../utils";
import styles from "./StatusBadge.module.css";

function StatusBadge({ status }) {
  const s = statusStyles[status] || { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span className={styles.badge} style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default StatusBadge;
