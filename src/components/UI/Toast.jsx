import { useEffect } from "react";
import { Check, X, Info, TriangleAlert } from "lucide-react";
import { toastConfig } from "../../utils";
import styles from "./Toast.module.css";

const iconMap = { success: Check, error: X, info: Info, warning: TriangleAlert };

function Toast({ toast, onDismiss }) {
  const c = toastConfig[toast.type] || toastConfig.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = iconMap[toast.type] || iconMap.info;
  return (
    <div
      className={styles.wrapper}
      style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}` }}
    >
      <span className={styles.icon} style={{ color: c.border }}><Icon size={14} /></span>
      <span className={styles.text} style={{ color: c.text }}>{toast.msg}</span>
      <button className={styles.dismiss} onClick={() => onDismiss?.(toast.id)} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

export default Toast;
