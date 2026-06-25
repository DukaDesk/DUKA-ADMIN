import { AMBER } from "../../utils";
import styles from "./Field.module.css";

function Field({ label, error, ...props }) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        style={{ border: `1px solid ${error ? "var(--red)" : "var(--gray-200)"}` }}
        {...props}
        onFocus={e => { e.target.style.borderColor = AMBER; }}
        onBlur={e => { e.target.style.borderColor = error ? "var(--red)" : "var(--gray-200)"; }}
      />
      {error && <p className={styles.errorText}>&#x26A0; {error}</p>}
    </div>
  );
}

export default Field;
