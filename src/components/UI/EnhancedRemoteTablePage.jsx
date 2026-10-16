import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, EllipsisVertical, Info, RefreshCw } from "lucide-react";
import styles from "./EnhancedRemoteTablePage.module.css";

function recordsFrom(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  // Guard: backend envelope success:false should not be treated as data — handled in fetchData
  if (response.success === false) return [];
  // Unwrap TransformInterceptor envelope {success:true, data: {...}} if present
  const src = response.data && typeof response.data === "object" && !Array.isArray(response.data) && "success" in response ? response.data : response;
  for (const key of ["data", "users", "tenants", "auditLogs", "logs", "items", "merchants", "listings", "subscriptions", "events", "flags", "plans", "roles"]) {
    if (Array.isArray(src[key])) return src[key];
    if (Array.isArray(response[key])) return response[key];
  }
  // Handle nested data object e.g., {success:true, data:{users, total}}
  if (src.data && Array.isArray(src.data)) return src.data;
  if (response.data && Array.isArray(response.data)) return response.data;
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
  titleTooltip,
  load,
  rowKey = "id",
  columns: columnConfig = [],
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  actions = [],
  actionsDisplay = "inline",
  filters = [],
  quickFilters = [],
  defaultSort = { key: null, direction: "asc" },
  refreshIntervalMs = 0,
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
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const actionMenuRef = useRef(null);
  const inFlightCountRef = useRef(0);

  const searchId = `search-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const pageSizeId = `page-size-${title.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    if (openActionMenu === null) return undefined;
    const handlePointerDown = (event) => {
      if (!actionMenuRef.current?.contains(event.target)) setOpenActionMenu(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenActionMenu(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionMenu]);

  const fetchData = useCallback(async () => {
    inFlightCountRef.current += 1;
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
      // Handle envelope success:false even on 200 (backend TransformInterceptor)
      if (response && typeof response === "object" && response.success === false) {
        const raw = response.errors?.join(", ") || response.message || "Request failed";
        // Treat 404 / not available as empty, not banner (e.g., maintenance)
        const isNotAvailable = String(raw).includes("Cannot GET") || String(raw).includes("not available") || response.status === 404;
        if (isNotAvailable) {
          setRows([]);
          setTotalCount(0);
          return;
        }
        throw new Error(raw);
      }
      const data = recordsFrom(response);
      setRows(data);
      if (response && typeof response === "object") {
        // Handle both {total} and {meta:{total}} and envelope {data:{total}} / {data:{meta:{total}}} shapes
        const src = response.data && typeof response.data === "object" && !Array.isArray(response.data) && "success" in response ? response.data : response;
        const total = response.total ?? response.count ?? response.meta?.total ?? src.total ?? src.count ?? src.meta?.total ?? src?.data?.total ?? data.length;
        setTotalCount(total);
      } else {
        setTotalCount(data.length);
      }
    } catch (err) {
      const status = err?.status;
      const raw = err?.message || "Unable to load this resource.";
      const rid = err?.requestId ? ` (Ref: ${String(err.requestId).slice(0, 8)})` : "";
      // 404 for empty tables should not show banner (consistent with businessDashboard swallowing)
      const is404 = status === 404 || String(raw).includes("Cannot GET") || String(raw).includes("not available");
      if (is404 && title && /maintenance|polic|alert/i.test(title)) {
        setRows([]);
        setTotalCount(0);
        return;
      }
      // Log correlation for support, but show friendly
      if (err?.requestId) console.warn(`[EnhancedRemoteTablePage:${title}]`, status, err.requestId, raw);
      const friendly = String(raw).includes("prisma") || String(raw).includes("Unknown field") ? `Service temporarily unavailable.${rid}` : raw + rid;
      setError(friendly);
    } finally {
      inFlightCountRef.current -= 1;
      if (inFlightCountRef.current === 0) setLoading(false);
    }
  }, [load, currentPage, selectedPageSize, searchTerm, sortConfig, filterValues, pagination, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshIntervalMs) return undefined;
    const intervalId = window.setInterval(() => {
      if (inFlightCountRef.current === 0) fetchData();
    }, refreshIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [fetchData, refreshIntervalMs]);

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

  const handleQuickFilter = (filter) => {
    setFilterValues((prev) => ({ ...prev, [filter.key]: filter.value || undefined }));
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
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
            {titleTooltip && (
              <button
                type="button"
                className={styles.titleTooltip}
                title={titleTooltip}
                aria-label={`${title} information`}
              >
                <Info size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <div className={styles.toolbar}>
          {refreshIntervalMs > 0 && (
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={fetchData}
              disabled={loading}
              aria-label={`Refresh ${title}`}
              title="Refresh now (also refreshes automatically)"
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          )}
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
          {quickFilters.length > 0 && (
            <div className={styles.quickFilters} role="group" aria-label={`${title} quick filters`}>
              {quickFilters.map((filter) => {
                const isActive = (filterValues[filter.key] || "") === (filter.value || "");
                return (
                  <button
                    key={`${filter.key}-${filter.value || "all"}`}
                    type="button"
                    className={`${styles.quickFilter} ${isActive ? styles.quickFilterActive : ""}`}
                    aria-pressed={isActive}
                    onClick={() => handleQuickFilter(filter)}
                  >
                    {filter.label}
                  </button>
                );
              })}
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
                            {sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions.length > 0 && <th className={styles.th} style={{ width: actionsDisplay === "menu" ? 72 : 120 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row[rowKey] || index}
                  className={styles.tr}
                  onClick={(event) => {
                    if (event.target.closest("button, a, input, select, textarea")) return;
                    onRowClick?.(row);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
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
                      {actionsDisplay === "menu" ? (() => {
                        const rowMenuKey = String(row[rowKey] ?? index);
                        const menuIsOpen = openActionMenu === rowMenuKey;
                        return (
                          <div className={styles.actionMenu} ref={menuIsOpen ? actionMenuRef : null}>
                            <button
                              type="button"
                              className={styles.actionMenuTrigger}
                              aria-label={`Actions for ${row.name || "row"}`}
                              aria-haspopup="menu"
                              aria-expanded={menuIsOpen}
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActionMenu(menuIsOpen ? null : rowMenuKey);
                              }}
                            >
                              <EllipsisVertical size={18} aria-hidden="true" />
                            </button>
                            {menuIsOpen && (
                              <div className={styles.actionMenuList} role="menu">
                                {actions.map((action) => {
                                  const ActionIcon = action.icon;
                                  const actionLabel = typeof action.label === "function" ? action.label(row) : action.label;
                                  return (
                                    <button
                                      key={action.key}
                                      type="button"
                                      className={`${styles.actionMenuItem} ${action.variant === "Danger" ? styles.actionMenuDanger : ""}`}
                                      role="menuitem"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenActionMenu(null);
                                        action.onClick(row);
                                      }}
                                      disabled={action.disabled?.(row)}
                                      aria-label={action.ariaLabel?.(row) || actionLabel}
                                    >
                                      {ActionIcon && <ActionIcon size={14} aria-hidden="true" />}
                                      <span>{actionLabel}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })() : (
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
                      )}
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
              <ChevronsLeft size={14} />
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              aria-disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
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
              <ChevronRight size={14} />
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
              aria-disabled={currentPage === totalPages}
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
