import { AMBER } from "../../utils";
import styles from "./PrimaryBtn.module.css";

function PrimaryBtn({ children, loading }) {
  return (
    <button
      type="submit"
      className={styles.btn}
      disabled={loading}
      style={{
        background: loading ? "var(--gray-300)" : AMBER,
        color: "var(--navy)",
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default PrimaryBtn;
