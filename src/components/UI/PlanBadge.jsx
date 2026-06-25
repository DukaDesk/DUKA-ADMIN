import { planStyles } from "../../utils";
import styles from "./PlanBadge.module.css";

function PlanBadge({ plan }) {
  const s = planStyles[plan] || planStyles.Starter;
  return (
    <span className={styles.badge} style={{ background: s.bg, color: s.color }}>
      {plan}
    </span>
  );
}

export default PlanBadge;
