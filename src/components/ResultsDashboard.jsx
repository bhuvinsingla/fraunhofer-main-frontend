import { fileUrl } from "../api";
import BladeValueTable from "./BladeValueTable";
import MethodPanel from "./MethodPanel";
import MetricsGrid from "./MetricsGrid";
import RadiiTable from "./RadiiTable";
import TiltWarning from "./TiltWarning";
import ValidationPanel from "./ValidationPanel";

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

const METHOD_CONFIG = [
  {
    key: "fixed_distance_circle",
    title: "Method 1 — Fixed-distance inscribed circle",
    description:
      "Physical l (nm) → scan line; circle through tip + left/right intersections. Reports R25–R200; headline = median R100.",
    imageKey: "method1",
    csvKey: "method1_csv",
    valueKey: "median_radius_nm",
    fallbackKey: "mean_radius_nm",
    meanLabel: "Median R100",
    meanFmt: (v) => `${fmt(v)} nm`,
    columns: [
      { key: "peak_id", label: "Peak" },
      { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
      { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
      { key: "radius_nm", label: "R100 (nm)", format: (v) => fmt(v) },
      { key: "R25_nm", label: "R25", format: (v) => fmt(v) },
      { key: "R50_nm", label: "R50", format: (v) => fmt(v) },
      { key: "R200_nm", label: "R200", format: (v) => fmt(v) },
    ],
    rowMap: (c) => ({
      peak_id: c.peak_id,
      peak_x: c.peak_location?.[0],
      peak_y: c.peak_location?.[1],
      radius_nm: c.radius_nm,
      R25_nm: c.radii_by_l?.R25?.radius_nm,
      R50_nm: c.radii_by_l?.R50?.radius_nm,
      R200_nm: c.radii_by_l?.R200?.radius_nm,
    }),
  },
  {
    key: "projected_tip_distance",
    title: "Method 2 — Projected tip distance",
    description: "Flank lines fit over 50–200 nm below tip; distance from projected apex to tip. Headline = median l.",
    imageKey: "method2",
    csvKey: "method2_csv",
    valueKey: "median_distance_l_nm",
    fallbackKey: "mean_distance_l_nm",
    meanLabel: "Median l",
    meanFmt: (v) => `${fmt(v)} nm`,
    columns: [
      { key: "peak_id", label: "Peak" },
      { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
      { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
      { key: "distance_l_nm", label: "l (nm)", format: (v) => fmt(v) },
      { key: "included_angle_deg", label: "α (°)", format: (v) => fmt(v) },
      { key: "area_under_curve_nm2", label: "A (nm²)", format: (v) => fmt(v, 1) },
    ],
    rowMap: (c) => ({
      peak_id: c.peak_id,
      peak_x: c.peak_location?.[0],
      peak_y: c.peak_location?.[1],
      distance_l_nm: c.distance_l_nm,
      included_angle_deg: c.included_angle_deg,
      area_under_curve_nm2: c.area_under_curve_nm2,
    }),
  },
  {
    key: "inscribed_angle",
    title: "Method 3 — Inscribed angle",
    description: "Fixed physical circle diameter D (default 100 nm). Output is included angle θ — not a radius.",
    imageKey: "method3",
    csvKey: "method3_csv",
    valueKey: "median_angle_deg",
    fallbackKey: "mean_angle_deg",
    meanLabel: "Median θ100",
    meanFmt: (v) => `${fmt(v)}°`,
    columns: [
      { key: "peak_id", label: "Peak" },
      { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
      { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
      { key: "angle_degrees", label: "θ (°)", format: (v) => fmt(v) },
    ],
    rowMap: (c) => ({
      peak_id: c.peak_id,
      peak_x: c.peak_location?.[0],
      peak_y: c.peak_location?.[1],
      angle_degrees: c.angle_degrees,
    }),
  },
];

const RESEARCH_COLUMNS = [
  { key: "peak_id", label: "Peak" },
  { key: "radius_um", label: "R (μm)", format: (v) => fmt(v, 3) },
  { key: "included_angle_deg", label: "α (°)", format: (v) => fmt(v, 1) },
  { key: "distance_l_nm", label: "l (nm)", format: (v) => fmt(v) },
  { key: "confidence_score", label: "Confidence", format: (v) => `${fmt(v * 100, 1)}%` },
  { key: "fit_residual_nm", label: "Residual (nm)", format: (v) => fmt(v, 3) },
  { key: "geometric_valid", label: "Geo valid", format: (v) => (v ? "Yes" : "No") },
];

function ProtocolBanner({ protocol }) {
  if (!protocol) return null;
  const approved = protocol.approved;
  const l = (protocol.method1_distances_nm || []).join(", ");
  const band = protocol.method2_fit_band_nm || [];
  const lo = band[0] ?? protocol.method2_fit_lo_nm;
  const hi = band[1] ?? protocol.method2_fit_hi_nm;
  const d = protocol.method3_circle_diameter_nm;
  const primary = protocol.method1_primary_nm ?? 100;

  return (
    <div className={`protocol-banner ${approved ? "approved" : "pending"}`}>
      <strong>Measurement protocol</strong>
      {!approved ? (
        <p className="protocol-banner-note">
          Proposed defaults — approve <em>l</em>, fit band, and <em>D</em> with the client before treating as a lab standard.
        </p>
      ) : (
        <p className="protocol-banner-note">Client has approved these values.</p>
      )}
      <dl className="protocol-banner-params">
        <div>
          <dt>Method 1 distances l (nm)</dt>
          <dd>{l || "—"}</dd>
        </div>
        <div>
          <dt>Method 1 primary (nm)</dt>
          <dd>{primary}</dd>
        </div>
        <div>
          <dt>Method 2 band (nm)</dt>
          <dd>{lo ?? "—"} – {hi ?? "—"}</dd>
        </div>
        <div>
          <dt>Method 3 circle D (nm)</dt>
          <dd>{d ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function ResultsDashboard({ result }) {
  const annotated = fileUrl(result.files?.annotated);
  const bs = result.brainstorming_methods || result.alternative_methods || {};
  const protocol = result.protocol || bs.protocol || {};
  const tipVal = bs.tip_validation || {};
  const rg = result.research_grade || {};
  const rgSummary = rg.summary || {};
  const rgCurves = (rg.per_curve || []).filter((c) => !c.rejected);

  return (
    <div className="results">
      <TiltWarning tilt={result.tilt_correction} />
      <ProtocolBanner protocol={protocol} />
      <MetricsGrid result={result} />

      <BladeValueTable bladeValue={bs.blade_value} files={result.files} />

      {(tipVal.n_detected_candidates != null) && (
        <p className="muted tip-validation-line">
          Tip validation: {tipVal.n_accepted ?? 0} accepted / {tipVal.n_detected_candidates} candidates
          {result.calibration?.nm_per_pixel != null && (
            <> · {fmt(result.calibration.nm_per_pixel, 3)} nm/px ({result.calibration.calibration_source || "cal"})</>
          )}
        </p>
      )}

      {rgCurves.length > 0 && (
        <MethodPanel
          tint="research"
          title="Research-grade — Osculating circle"
          description="Canny → RANSAC flank lines → virtual apex → curvature tip → Hough init → nonlinear refinement → geometric validation."
          imageKey="research"
          csvKey="research_csv"
          files={result.files}
          summary={{
            count: rgSummary.accepted_count ?? rgCurves.length,
            mean: rgSummary.mean_radius_um != null ? `${fmt(rgSummary.mean_radius_um, 3)} μm` : null,
            meanLabel: "Mean R",
          }}
          rows={rgCurves.map((c) => ({
            peak_id: c.peak_id,
            radius_um: c.radius_um,
            included_angle_deg: c.included_angle_deg,
            distance_l_nm: c.distance_l_nm,
            confidence_score: c.confidence_score,
            fit_residual_nm: c.fit_residual_nm,
            geometric_valid: c.geometric_valid,
          }))}
          columns={RESEARCH_COLUMNS}
        />
      )}

      <section className="card image-card card-tint-sage">
        <div className="card-header">
          <h3>Whiteboard overlay — flanks · α · d · inscribed R</h3>
          <a className="link-btn" href={annotated} download>Download PNG</a>
        </div>
        <div className="image-frame">
          <img src={`${annotated}?t=${Date.now()}`} alt="Whiteboard tip geometry overlay" />
        </div>
      </section>

      <div className="method-panels">
        {METHOD_CONFIG.map((cfg, i) => {
          const methodData = bs[cfg.key] || {};
          const perCurve = methodData.per_curve || [];
          const meanVal = methodData[cfg.valueKey] ?? methodData[cfg.fallbackKey] ?? methodData.headline_value;
          const tints = ["blue", "lavender", "sage"];
          return (
            <MethodPanel
              key={cfg.key}
              tint={tints[i % tints.length]}
              title={cfg.title}
              description={cfg.description}
              imageKey={cfg.imageKey}
              csvKey={cfg.csvKey}
              files={result.files}
              summary={{
                count: methodData.count ?? perCurve.length,
                mean: meanVal != null ? cfg.meanFmt(meanVal) : null,
                meanLabel: cfg.meanLabel,
              }}
              rows={perCurve.map(cfg.rowMap)}
              columns={cfg.columns}
            />
          );
        })}
      </div>

      <ValidationPanel validation={result.validation} files={result.files} />
      {(result.radius_results || []).length > 0 && (
        <RadiiTable rows={result.radius_results} files={result.files} />
      )}
    </div>
  );
}
