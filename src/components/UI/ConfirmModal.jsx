import { useState } from "react";
import styles from "./ConfirmModal.module.css";

function ConfirmModal({ open, title, message, confirmLabel, confirmColor, variant, onConfirm, onClose, onCancel, requireText }) {
  const [typed, setTyped] = useState("");
  const canConfirm = requireText ? typed === requireText : true;
  const handleClose = onClose || onCancel || (() => {});
  const isOpen = open === undefined ? true : Boolean(open);
  const resolvedColor = confirmColor || (variant === "Danger" ? "#E74C3C" : variant === "Primary" ? "var(--amber)" : "#E74C3C");

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />
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
              onChange={e => setTyped(e.target.value)}
            />
          </div>
        )}
        <div className={styles.btnRow}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose} aria-label="Cancel">
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={canConfirm ? onConfirm : undefined}
            disabled={!canConfirm}
            aria-label={confirmLabel}
            style={{
              background: canConfirm ? resolvedColor : "var(--gray-300)",
              cursor: canConfirm ? "pointer" : "not-allowed",
              pointerEvents: canConfirm ? "auto" : "none",
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
