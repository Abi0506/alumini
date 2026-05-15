import React, { useRef, useEffect } from "react";

const columns = [
  { key: "roll", label: "Roll", className: "small" },
  { key: "name", label: "Name" },
  { key: "dept", label: "Dept", className: "small" },
  { key: "year", label: "Year", className: "small" },
  { key: "company", label: "Company", className: "small" },
  { key: "designation", label: "Designation", className: "small" },
  { key: "email", label: "Email", className: "small" },
  { key: "phone", label: "Phone", className: "small" },
  { key: "address", label: "Address", className: "small" },
];

export default function ResultsTable({ results, onEdit, canEdit = false, hasSearched, hasMore, loadingMore, onLoadMore, sortConfig, onSort }) {
  if (!hasSearched) return null;

 
  if (!results?.length) {
    return (
      <div className="text-center py-5">
        <div className="mb-2 fs-5 fw-semibold text-muted">No results found</div>
        <div className="small text-secondary">Try adjusting your filters and search again.</div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr>
            {columns.map((column) => {
              const isActive = sortConfig?.key === column.key;
              const directionClass = !isActive ? "is-neutral" : sortConfig.direction === "asc" ? "is-asc" : "is-desc";

              return (
                <th key={column.key} className={column.className}>
                  <button
                    type="button"
                    className="table-sort-btn"
                    onClick={() => onSort?.(column.key)}
                    aria-label={`Sort by ${column.label} ${isActive ? sortConfig.direction : "ascending"}`}
                  >
                    <span>{column.label}</span>
                    <span className={`table-sort-btn__icon ${directionClass}`} aria-hidden="true" />
                  </button>
                </th>
              );
            })}
            {canEdit && <th className="text-end small">Action</th>}
          </tr>
        </thead>

        <tbody>
          {results.map((item, index) => (
            <tr key={item.roll || item.email || item.phone || item.name || index}>
              <td className="small fw-semibold">{item.roll || "not available"}</td>
              <td className="fw-semibold">{item.name || "not available"}</td>
              <td className="small">{item.dept || "not available"}</td>
              
              <td className="small">{item.year || "not available"}</td>
             
              
              <td className="small">{item.company || "not available"}</td>
              <td className="small">{item.designation || "not available"}</td>
              <td className="small text-truncate" style={{ maxWidth: "160px" }}>
                {item.email || "not available"}
              </td>
              <td className="small">{item.phone || "not available"}</td>
             <td className="small">{item.address || "not available"}</td>
              {canEdit && (
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-primary px-3 rounded-pill"
                    onClick={() => onEdit?.(item)}
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && <LoadMoreSentinel onLoadMore={onLoadMore} loadingMore={loadingMore} />}
    </div>
  );
}

function LoadMoreSentinel({ onLoadMore, loadingMore }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, loadingMore]);

  return (
    <div ref={ref} className="text-center py-3">
      {loadingMore ? (
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ) : (
        <span className="text-muted small">Scroll for more...</span>
      )}
    </div>
  );
}
