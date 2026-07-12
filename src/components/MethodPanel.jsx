import { fileUrl } from "../api";
import PaginatedTable from "./PaginatedTable";

function parseFlowSteps(description) {
  if (!description) return [];
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, ""));
}

function VisualRow({ imageUrl, title, flowSteps, flowTitle = "How it works" }) {
  if (!imageUrl && flowSteps.length === 0) return null;
  const cacheBust = imageUrl ? `${imageUrl}?t=${Date.now()}` : null;
  return (
    <div className="method-visual-row">
      {cacheBust && (
        <div className="method-image-zoom-wrap">
          <div className="image-frame method-image">
            <img src={cacheBust} alt={title} />
            <span className="method-zoom-hint">Hover to enlarge</span>
          </div>
          <div className="method-zoom-overlay" aria-hidden="true">
            <img src={cacheBust} alt="" />
          </div>
        </div>
      )}
      {flowSteps.length > 0 && (
        <aside className="method-flow">
          <h4 className="method-flow-title">{flowTitle}</h4>
          <ol className="method-flow-steps">
            {flowSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}

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
  secondaryImageKey = null,
  secondaryDescription = null,
  secondaryFlowTitle = "Next steps",
}) {
  const imageUrl = files?.[imageKey] ? fileUrl(files[imageKey]) : null;
  const secondaryUrl =
    secondaryImageKey && files?.[secondaryImageKey]
      ? fileUrl(files[secondaryImageKey])
      : null;
  const csvUrl = files?.[csvKey] ? fileUrl(files[csvKey]) : null;
  const flowSteps = parseFlowSteps(description);
  const secondarySteps = parseFlowSteps(secondaryDescription);

  return (
    <section className={`card method-panel card-tint-${tint}`}>
      <div className="card-header">
        <div>
          <h3>{title}</h3>
        </div>
        <div className="method-summary-badges">
          <span className="method-badge">{summary?.count ?? 0} tips</span>
          {summary?.mean != null && (
            <span className="method-badge accent">
              {summary.meanLabel}: {summary.mean}
            </span>
          )}
        </div>
      </div>

      <VisualRow
        imageUrl={imageUrl}
        title={title}
        flowSteps={flowSteps}
      />
      {(secondaryUrl || secondarySteps.length > 0) && (
        <VisualRow
          imageUrl={secondaryUrl}
          title={`${title} — fixed-distance circle`}
          flowSteps={secondarySteps}
          flowTitle={secondaryFlowTitle}
        />
      )}

      <div className="method-panel-footer">
        {csvUrl && (
          <a className="link-btn" href={csvUrl} download>
            Download CSV
          </a>
        )}
      </div>

      {rows && rows.length > 0 && (
        <PaginatedTable rows={rows} columns={columns} />
      )}
    </section>
  );
}
