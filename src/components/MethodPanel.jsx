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
  /** @type {{ imageKey: string, description: string, flowTitle?: string, titleSuffix?: string }[]} */
  extraVisuals = [],
  secondaryImageKey = null,
  secondaryDescription = null,
  secondaryFlowTitle = "Next steps",
}) {
  const imageUrl = files?.[imageKey] ? fileUrl(files[imageKey]) : null;
  const csvUrl = files?.[csvKey] ? fileUrl(files[csvKey]) : null;
  const flowSteps = parseFlowSteps(description);

  const extras = [...extraVisuals];
  if (secondaryImageKey || secondaryDescription) {
    extras.unshift({
      imageKey: secondaryImageKey,
      description: secondaryDescription,
      flowTitle: secondaryFlowTitle,
      titleSuffix: "fixed-distance inscribed circle",
    });
  }

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

      <VisualRow imageUrl={imageUrl} title={title} flowSteps={flowSteps} />

      {extras.map((extra, idx) => {
        const url =
          extra.imageKey && files?.[extra.imageKey]
            ? fileUrl(files[extra.imageKey])
            : null;
        const steps = parseFlowSteps(extra.description);
        if (!url && steps.length === 0) return null;
        return (
          <VisualRow
            key={`${extra.imageKey || "extra"}-${idx}`}
            imageUrl={url}
            title={`${title} — ${extra.titleSuffix || extra.flowTitle || `step ${idx + 2}`}`}
            flowSteps={steps}
            flowTitle={extra.flowTitle || "Next steps"}
          />
        );
      })}

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
