import { Search } from "lucide-react";
import styles from "./FilterBar.module.css";

function FilterBar({ search, setSearch, placeholder, children }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.searchGroup}>
        <span className={styles.searchIcon}><Search size={14} /></span>
        <input
          className={styles.input}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children}
    </div>
  );
}

export default FilterBar;
