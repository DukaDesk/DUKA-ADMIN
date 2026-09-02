import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./EnhancedRemoteTablePage.module.css";

function recordsFrom(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  for (const key of ["data", "items", "merchants", "listings", "subscriptions", "events", "flags", "plans"]) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
}

function labelFor(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (value) => value.toUpperCase());
}

function display(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function EnhancedRemoteTablePage({
  title,
  description,
  load,
  rowKey = "id",
  columns: columnConfig = [],
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  actions = [],
  filters = [],
  defaultSort = { key: null, direction: "asc" },
  emptyMessage = "No records found.",
  loadingMessage = "Loading…",
  onRowClick,
}) {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);
  const [filterValues, setFilterValues] = useState({});

  const searchId = `search-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const pageSizeId = `page-size-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: pagination ? currentPage : 1,
        limit: pagination ? selectedPageSize : 1000,
        search: searchTerm || undefined,
        sort: sortConfig.key,
        order: sortConfig.direction,
        ...filterValues,
      };
      const response = await load(params);
      const data = recordsFrom(response);
      setRows(data);
      if (response && typeof response === "object") {
        setTotalCount(response.total || response.count || data.length);
      } else {
        setTotalCount(data.length);
      }
    } catch (err) {
      setError(err.message || "Unable to load this resource.");
    } finally {
      setLoading(false);
    }
  }, [load, currentPage, selectedPageSize, searchTerm, sortConfig, filterValues, pagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setSelectedPageSize(size);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / selectedPageSize) || 1;

  const visibleColumns = columnConfig.length > 0
    ? columnConfig
    : (rows.length > 0 ? Object.keys(rows[0]) : []);

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.searchWrapper}>
              <label htmlFor={searchId} className={styles.visuallyHidden}>
                Search {title}
              </label>
              <input
                id={searchId}
                type="search"
                placeholder={"Search " + title + "…"}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles.searchInput}
                aria-label={"Search " + title}
              />
            </div>
          )}
          {filters.length > 0 && (
            <div className={styles.filters} role="group" aria-label="Filters">
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={filterValues[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className={styles.filterSelect}
                  aria-label={filter.label}
                >
                  <option value="">{"All " + filter.label}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>
      </header>

      {loading && (
        <div className={styles.loading} aria-live="polite" aria-busy="true">
          <span className={styles.spinner} />
          {loadingMessage}
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
          <button className={styles.retryBtn} onClick={fetchData}>Retry</button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className={styles.empty}>{emptyMessage}</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {visibleColumns.map((col) => {
                  const config = typeof col === "string" ? { key: col } : col;
                  const isSortable = sortable && config.sortable !== false;
                  return (
                    <th
                      key={config.key}
                      className={styles.th + " " + (isSortable ? styles.sortable : "")}
                      onClick={() => isSortable && handleSort(config.key)}
                      style={{ width: config.width }}
                      aria-sort={sortConfig.key === config.key ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <div className={styles.thContent}>
                        <span>{config.label || labelFor(config.key)}</span>
                        {isSortable && sortConfig.key === config.key && (
                          <span className={styles.sortIcon} aria-hidden="true">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions.length > 0 && <th className={styles.th} style={{ width: 120 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row[rowKey] || index}
                  className={styles.tr}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {visibleColumns.map((col) => {
                    const config = typeof col === "string" ? { key: col } : col;
                    const value = row[config.key];
                    return (
                      <td key={config.key} className={styles.td}>
                        {config.render ? config.render(value, row) : display(value)}
                      </td>
                    );
                  })}
                  {actions.length > 0 && (
                    <td className={styles.td}>
                      <div className={styles.actions} role="group" aria-label="Row actions">
                        {actions.map((action) => (
                          <button
                            key={action.key}
                            className={styles.actionBtn + " " + styles["action" + (action.variant || "Primary")]}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            disabled={action.disabled?.(row)}
                            aria-label={action.ariaLabel?.(row) || action.label}
                          >
                            {action.icon && <span aria-hidden="true">{typeof action.icon === "string" ? action.icon : (() => { const Ico = action.icon; return <Ico size={14} />; })()}</span>}
                            <span className={styles.actionText}>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && totalPages > 1 && !loading && !error && (
        <nav className={styles.pagination} aria-label="Pagination">
          <div className={styles.pageSize}>
            <label htmlFor={pageSizeId} className={styles.visuallyHidden}>
              Rows per page
            </label>
            <select
              id={pageSizeId}
              value={selectedPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <div className={styles.pageInfo} aria-live="polite">
            Showing {(currentPage - 1) * selectedPageSize + 1}–{Math.min(currentPage * selectedPageSize, totalCount)} of {totalCount}
          </div>
          <div className={styles.pageControls}>
            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="First page"
              aria-disabled={currentPage === 1}
            >
              ««
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              aria-disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={styles.pageBtn + " " + (currentPage === pageNum ? styles.pageBtnActive : "")}
                  onClick={() => handlePageChange(pageNum)}
                  aria-label={"Page " + pageNum}
                  aria-current={currentPage === pageNum ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              aria-disabled={currentPage === totalPages}
            >
              »
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
              aria-disabled={currentPage === totalPages}
            >
              »»
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}