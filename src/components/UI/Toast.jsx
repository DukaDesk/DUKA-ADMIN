import { useEffect } from "react";
import { toastConfig } from "../../utils";
import styles from "./Toast.module.css";

function Toast({ toast, onDismiss }) {
  const c = toastConfig[toast.type] || toastConfig.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={styles.wrapper}
      style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}` }}
    >
      <span className={styles.icon} style={{ color: c.border }}>{c.icon}</span>
      <span className={styles.text} style={{ color: c.text }}>{toast.msg}</span>
      <button className={styles.dismiss} onClick={() => onDismiss?.(toast.id)}>&times;</button>
    </div>
  );
}

export default Toast;
