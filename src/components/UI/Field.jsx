import { useId } from "react";
import { AMBER } from "../../utils";
import styles from "./Field.module.css";

function Field({ label, error, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        style={{ border: `1px solid ${error ? "var(--red)" : "var(--gray-200)"}` }}
        {...props}
        onFocus={e => { e.target.style.borderColor = AMBER; }}
        onBlur={e => { e.target.style.borderColor = error ? "var(--red)" : "var(--gray-200)"; }}
      />
      {error && <p id={errorId} className={styles.errorText}>&#x26A0; {error}</p>}
    </div>
  );
}

export default Field;
