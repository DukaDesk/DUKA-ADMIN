import { useEffect, useId, useRef, useState } from "react";
import styles from "./ConfirmModal.module.css";

function ConfirmModal({ open, title, message, confirmLabel, confirmColor, variant, onConfirm, onClose, onCancel, requireText, busy = false }) {
  const [typed, setTyped] = useState("");
  const modalRef = useRef(null);
  const cancelRef = useRef(null);
  const inputRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const closeHandlerRef = useRef(() => {});
  const busyRef = useRef(busy);
  const titleId = useId();
  const messageId = useId();
  const inputId = useId();
  const canConfirm = requireText ? typed === requireText : true;
  const handleClose = onClose || onCancel || (() => {});
  const isOpen = open === undefined ? true : Boolean(open);
  const resolvedColor = confirmColor || (variant === "Danger" ? "#E74C3C" : variant === "Primary" ? "var(--amber)" : "#E74C3C");

  closeHandlerRef.current = handleClose;
  busyRef.current = busy;

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      const initialTarget = requireText ? inputRef.current : cancelRef.current;
      (initialTarget || modalRef.current)?.focus();
    } else {
      previousActiveElementRef.current?.focus?.();
    }
  }, [isOpen, requireText]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        closeHandlerRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = modalRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={busy ? undefined : handleClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
      >
        <div className={styles.icon}>&#x26A0;&#xFE0F;</div>
        <h3 className={styles.title} id={titleId}>{title}</h3>
        <p className={styles.message} id={messageId}>{message}</p>
        {requireText && (
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor={inputId}>
              Type <strong>{requireText}</strong> to confirm:
            </label>
            <input
              ref={inputRef}
              id={inputId}
              className={styles.input}
              value={typed}
              disabled={busy}
              onChange={e => setTyped(e.target.value)}
            />
          </div>
        )}
        <div className={styles.btnRow}>
          <button ref={cancelRef} type="button" className={styles.cancelBtn} onClick={handleClose} disabled={busy} aria-label="Cancel">
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
