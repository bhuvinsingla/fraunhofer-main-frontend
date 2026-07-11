import { fileUrl } from "../api";

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

const LABELS = {
  rmse_nm: "RMSE (nm)",
  mae_nm: "MAE (nm)",
  mean_relative_error_pct: "Mean rel. error (%)",
  n_matched: "Matched peaks",
};

export default function ValidationPanel({ validation, files }) {
  if (!validation?.metrics) return null;

  const plot = fileUrl(files?.validation_plot);

  return (
    <section className="card card-tint-lavender">
      <div className="card-header">
        <h3>Validation vs ground truth</h3>
        {files?.validation && (
          <a className="link-btn" href={fileUrl(files.validation)} download>Download CSV</a>
        )}
      </div>
      <div className="validation-metrics">
        {Object.entries(LABELS).map(([key, label]) => {
          const value = validation.metrics[key];
          if (value == null) return null;
          return (
            <div key={key} className="val-metric">
              <span>{label}</span>
              <strong>{fmt(value)}</strong>
            </div>
          );
        })}
      </div>
      {plot && (
        <div className="image-frame compact">
          <img src={`${plot}?t=${Date.now()}`} alt="Validation scatter plot" />
        </div>
      )}
    </section>
  );
}
