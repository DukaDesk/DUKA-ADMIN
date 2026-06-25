import styles from "./TableHeader.module.css";

function TableHeader({ cols }) {
  return (
    <thead>
      <tr className={styles.row}>
        {cols.map(h => (
          <th key={h} className={styles.headerCell}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

export default TableHeader;
