import styles from "./NotFound.module.css";

export default function NotFound({ setPage }) {
  return (
    <div className={styles.container}>
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.description}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button className={styles.homeBtn} onClick={() => setPage("dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}
