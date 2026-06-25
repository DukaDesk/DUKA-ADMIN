import { useState } from "react";
import styles from "./ConfirmModal.module.css";

function ConfirmModal({ title, message, confirmLabel, confirmColor = "#E74C3C", onConfirm, onClose, requireText }) {
  const [typed, setTyped] = useState("");
  const canConfirm = requireText ? typed === requireText : true;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
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
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.confirmBtn}
            onClick={canConfirm ? onConfirm : undefined}
            disabled={!canConfirm}
            style={{
              background: canConfirm ? confirmColor : "var(--gray-300)",
              cursor: canConfirm ? "pointer" : "not-allowed",
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
