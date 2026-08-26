import styles from "./AccessibleToggle.module.css";

export default function AccessibleToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) {
  const toggleId = id || `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className={styles.label} htmlFor={toggleId}>
      <div className={styles.info}>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.toggleSub}>{description}</span>}
      </div>
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        className={`${styles.switch} ${checked ? styles.switchOn : styles.switchOff}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            !disabled && onChange(!checked);
          }
        }}
      >
        <span className={styles.switchKnob} />
      </button>
    </label>
  );
}