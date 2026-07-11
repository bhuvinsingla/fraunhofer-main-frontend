import { fileUrl } from "../api";
import PaginatedTable from "./PaginatedTable";

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

export default function MethodPanel({
  title,
  description,
  imageKey,
  csvKey,
  files,
  summary,
  rows,
  columns,
  tint = "default",
}) {
  const imageUrl = files?.[imageKey] ? fileUrl(files[imageKey]) : null;
  const csvUrl = files?.[csvKey] ? fileUrl(files[csvKey]) : null;

  return (
    <section className={`card method-panel card-tint-${tint}`}>
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          {description && <p className="muted method-desc">{description}</p>}
        </div>
        <div className="method-summary-badges">
          <span className="method-badge">{summary?.count ?? 0} curves</span>
          {summary?.mean != null && (
            <span className="method-badge accent">{summary.meanLabel}: {summary.mean}</span>
          )}
        </div>
      </div>

      {imageUrl && (
        <div className="image-frame method-image">
          <img src={`${imageUrl}?t=${Date.now()}`} alt={title} />
        </div>
      )}

      <div className="method-panel-footer">
        {csvUrl && (
          <a className="link-btn" href={csvUrl} download>Download CSV</a>
        )}
      </div>

      {rows && rows.length > 0 && (
        <PaginatedTable rows={rows} columns={columns} />
      )}
    </section>
  );
}
