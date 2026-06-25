import styles from "./ErrBanner.module.css";

function ErrBanner({ msg }) {
  return <div className={styles.banner}>&#x26A0; {msg}</div>;
}

export default ErrBanner;
