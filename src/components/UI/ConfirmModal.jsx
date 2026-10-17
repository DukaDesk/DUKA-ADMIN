import { useState } from "react";
import styles from "./ConfirmModal.module.css";

function ConfirmModal({ open, title, message, confirmLabel, confirmColor, variant, onConfirm, onClose, onCancel, requireText, busy = false }) {
  const [typed, setTyped] = useState("");
  const canConfirm = requireText ? typed === requireText : true;
  const handleClose = onClose || onCancel || (() => {});
  const isOpen = open === undefined ? true : Boolean(open);
  const resolvedColor = confirmColor || (variant === "Danger" ? "#E74C3C" : variant === "Primary" ? "var(--amber)" : "#E74C3C");

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={busy ? undefined : handleClose} aria-hidden="true" />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.icon}>&#x26A0;&#xFE0F;</div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        {requireText && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              Type <strong>{requireText}</strong> to confirm:
            </label>
            <input
              className={styles.input}
              value={typed}
              disabled={busy}
              onChange={e => setTyped(e.target.value)}
            />
          </div>
        )}
        <div className={styles.btnRow}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={busy} aria-label="Cancel">
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={canConfirm && !busy ? onConfirm : undefined}
            disabled={!canConfirm || busy}
            aria-busy={busy}
            aria-label={confirmLabel}
            style={{
              background: canConfirm && !busy ? resolvedColor : "var(--gray-300)",
              cursor: canConfirm && !busy ? "pointer" : "not-allowed",
              pointerEvents: canConfirm && !busy ? "auto" : "none",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
