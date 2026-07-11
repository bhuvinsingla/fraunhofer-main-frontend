import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 15;

export default function PaginatedTable({ rows, columns, pageSize = PAGE_SIZE }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!rows.length) {
    return null;
  }

  const showPagination = rows.length > pageSize;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, rows.length);

  return (
    <div className="paginated-table">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={`${page}-${i}`}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(row)
                      : col.format
                        ? col.format(row[col.key])
                        : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="table-pagination">
          <span className="pagination-info">
            {start}–{end} of {rows.length}
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-ghost pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="pagination-page">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
