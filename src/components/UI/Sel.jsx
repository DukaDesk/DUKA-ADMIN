import styles from "./Sel.module.css";

function Sel({ value, onChange, options }) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default Sel;
