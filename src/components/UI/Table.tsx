import styles from "./Table.module.css";

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  sortConfig?: { key: string; direction: "asc" | "desc" };
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  sortConfig,
  onSort,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  striped = true,
  hoverable = true,
  className = "",
}: TableProps<T>) {
  const getRowKey = (row: T) =>
    typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);

  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-busy="true">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={styles.th} style={{ width: col.width, textAlign: col.align }}>
                  <div className={styles.thContent}>
                    <span>{col.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className={styles.tr}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.td}>
                    <div className={styles.skeleton} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty} role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={`${styles.table} ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${styles.th} ${col.sortable && onSort ? styles.sortable : ""}`}
                onClick={() => col.sortable && onSort?.(col.key)}
                style={{ width: col.width, textAlign: col.align }}
                aria-sort={sortConfig?.key === col.key ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className={styles.thContent}>
                  <span>{col.label}</span>
                  {col.sortable && onSort && sortConfig?.key === col.key && (
                    <span className={styles.sortIcon} aria-hidden="true">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={getRowKey(row)}
              className={`${styles.tr} ${striped && index % 2 === 1 ? styles.striped : ""} ${hoverable && onRowClick ? styles.hoverable : ""}`}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {columns.map((col) => (
                <td key={col.key} className={styles.td} style={{ textAlign: col.align }}>
                  {col.render
                    ? col.render(row[col.key as keyof T], row, index)
                    : String(row[col.key as keyof T] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}