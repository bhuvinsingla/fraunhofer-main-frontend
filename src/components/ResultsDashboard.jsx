import { useState } from "react";
import MethodPanel from "./MethodPanel";
import ValidationPanel from "./ValidationPanel";
import PaginatedTable from "./PaginatedTable";

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

/** Method 1 — Fixed-distance inscribed circle → radius R */
const METHOD1 = {
  key: "fixed_distance_circle",
  title: "Fixed-distance inscribed circle",
  description:
    "1. Identify the ultimate tip T (top blue dot)\n" +
    "2. Project a horizontal (red) line a predefined distance l below T (y = y_t + l)\n" +
    "3. Find intersections with left/right blade edges: P_L and P_R (lower blue dots)\n" +
    "4. Fit the circumcircle through T, P_L, P_R\n" +
    "5. Output = radius R of that circle\n" +
    "Smaller R = sharper tip. Larger R = more rounded / blunt. l is held fixed across samples.",
  imageKey: "method1",
  csvKey: "method1_csv",
  valueKey: "median_radius_nm",
  fallbackKey: "mean_radius_nm",
  meanLabel: "Median R",
  meanFmt: (v) => `${fmt(v)} nm`,
  columns: [
    { key: "peak_id", label: "Peak" },
    { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
    { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
    { key: "radius_nm", label: "R (nm)", format: (v) => fmt(v) },
  ],
  rowMap: (c) => ({
    peak_id: c.peak_id,
    peak_x: c.peak_location?.[0] ?? c.tip_point?.[0],
    peak_y: c.peak_location?.[1] ?? c.tip_point?.[1],
    radius_nm: c.radius_nm,
  }),
};

/** Method 2 — Distance from projected tip → length l */
const METHOD2 = {
  key: "projected_tip_distance",
  title: "Distance from projected tip",
  description:
    "1. Fit straight lines to the linear flank segments of both blade edges\n" +
    "2. Extrapolate both lines upward to their convergent point P_proj (theoretical sharp apex)\n" +
    "3. Draw a vertical line (red) from P_proj down to the ultimate tip T (blue)\n" +
    "4. Output = length l between P_proj and T\n" +
    "Larger l = blunter / more rounded tip (rounding depth).",
  imageKey: "method2",
  csvKey: "method2_csv",
  valueKey: "median_distance_l_nm",
  fallbackKey: "median",
  meanLabel: "Median l",
  meanFmt: (v) => `${fmt(v)} nm`,
  columns: [
    { key: "peak_id", label: "Peak" },
    { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
    { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
    { key: "distance_l_nm", label: "l (nm)", format: (v) => (typeof v === "number" ? fmt(v) : v) },
    { key: "fit_band", label: "Band (nm)" },
  ],
  rowMap: (c) => ({
    peak_id: c.peak_id ?? c.tip_id,
    peak_x: c.peak_location?.[0] ?? c.tip_point?.[0],
    peak_y: c.peak_location?.[1] ?? c.tip_point?.[1],
    distance_l_nm: c.distance_l_nm,
    fit_band: Array.isArray(c.fit_band_nm)
      ? `${c.fit_band_nm[0]}–${c.fit_band_nm[1]}`
      : "—",
  }),
};

/** Method 3 — Included angle at fixed diameter D → θ (Interpretation A) */
const METHOD3 = {
  key: "inscribed_angle",
  title: "Included angle at fixed diameter",
  description:
    "1. Inscribe a circle of predetermined diameter D centred at tip T\n" +
    "2. Find intersections of that circle with left/right blade edges (P_L, P_R)\n" +
    "3. Draw rays from T through P_L and P_R\n" +
    "4. Output = included angle θ between those rays\n" +
    "Interpretation A (locked): rays tip→intersections — not external tangents above the circle.",
  imageKey: "method3",
  csvKey: "method3_csv",
  valueKey: "median",
  fallbackKey: "mean",
  meanLabel: "Median θ",
  meanFmt: (v) => `${fmt(v)}°`,
  columns: [
    { key: "peak_id", label: "Peak" },
    { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
    { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
    { key: "angle_degrees", label: "θ (°)", format: (v) => fmt(v) },
  ],
  rowMap: (c) => ({
    peak_id: c.peak_id ?? c.tip_id,
    peak_x: c.peak_location?.[0] ?? c.tip_point?.[0],
    peak_y: c.peak_location?.[1] ?? c.tip_point?.[1],
    angle_degrees: c.angle_degrees,
  }),
};

/** OpenAI Vision tip-radius fit + protocol constructions on those tips */
const APPROACH3 = {
  key: "approach3_openai_vlm",
  title: "OpenAI Vision tip radius",
  description:
    "1. OpenAI / Vision tip peaks (yellow)\n" +
    "2. Contour around each apex (green)\n" +
    "3. Circle fit → tip radius R in nm (cyan)\n" +
    "Requires OPENAI_API_KEY in backend .env for Vision steps",
  secondaryDescription:
    "1. Identify the ultimate tip T (top blue dot)\n" +
    "2. Project a horizontal (red) line a predefined distance l below T\n" +
    "3. Find intersections with left/right blade edges: P_L and P_R\n" +
    "4. Fit the circumcircle through T, P_L, P_R\n" +
    "5. Output = radius R of that circle",
  imageKey: "method1_approach3",
  secondaryImageKey: "method1_approach3_fixed_distance",
  extraVisuals: [
    {
      imageKey: "method1_approach3_projected_tip",
      titleSuffix: "projected tip distance",
      flowTitle: "Distance from projected tip",
      description:
        "1. Fit straight lines to the linear flank segments of both blade edges\n" +
        "2. Extrapolate both lines upward to convergent point P_proj\n" +
        "3. Draw vertical line (red) from P_proj down to ultimate tip T (blue)\n" +
        "4. Output = length l between P_proj and T",
    },
    {
      imageKey: "method1_approach3_inscribed_angle",
      titleSuffix: "included angle at fixed D",
      flowTitle: "Included angle at fixed diameter (Interp. A)",
      description:
        "1. Inscribe a circle of predetermined diameter D centred at tip T\n" +
        "2. Find intersections with blade edges (P_L, P_R)\n" +
        "3. Draw rays from T through P_L and P_R\n" +
        "4. Output = included angle θ between those rays",
    },
    {
      imageKey: "method1_approach3_d_r_reference",
      titleSuffix: "projected d + inscribed R",
      flowTitle: "Combined reference (d + R)",
      description:
        "1. Project edges of arch (yellow) to a convergent point (angle α)\n" +
        "2. Draw vertical distance d (red) from projected tip down to ultimate tip\n" +
        "3. Trace tip arch (purple) and inscribe circle → radius R\n" +
        "4. Output d (nm) and R (nm)",
    },
  ],
  csvKey: "method1_approach3_csv",
  valueKey: "mean_radius_nm",
  fallbackKey: "median_radius_nm",
  meanLabel: "Mean R",
  meanFmt: (v) => `${fmt(v)} nm`,
  columns: [
    { key: "peak_id", label: "Peak" },
    { key: "peak_x", label: "X", format: (v) => fmt(v, 1) },
    { key: "peak_y", label: "Y", format: (v) => fmt(v, 1) },
    { key: "radius_nm", label: "R (nm)", format: (v) => fmt(v) },
    { key: "vlm_confidence", label: "Conf.", format: (v) => (v == null ? "—" : fmt(v, 2)) },
    { key: "fit_method", label: "Fit" },
  ],
  rowMap: (c) => ({
    peak_id: c.peak_id,
    peak_x: c.peak_location?.[0] ?? c.tip_point?.[0],
    peak_y: c.peak_location?.[1] ?? c.tip_point?.[1],
    radius_nm: c.radius_nm,
    vlm_confidence: c.vlm_confidence,
    fit_method: c.fit_method,
  }),
};

function formatValue(v) {
  if (v == null) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : Number(v).toFixed(4);
  if (typeof v === "object") {
    if (v.value != null) {
      return v.unit ? `${v.value} ${v.unit}` : String(v.value);
    }
    if (v.text) return v.text;
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function ExtractedValuesPanel({ calibration }) {
  const [open, setOpen] = useState(false);
  if (!calibration) return null;
  const combined = calibration.extracted_values || {};
  const zeissAll = calibration.zeiss_all || {};
  const ocr = calibration.ocr || {};
  const ocrValues = ocr.values || {};
  const hasAnything =
    Object.keys(combined).length > 0 ||
    Object.keys(zeissAll).length > 0 ||
    (ocr.raw_text && ocr.raw_text.length > 0);

  if (!hasAnything) return null;

  const combinedRows = Object.entries(combined).map(([k, v]) => ({
    key: k,
    value: formatValue(v),
  }));
  const ocrRows = Object.entries(ocrValues)
    .filter(([k]) => !String(k).startsWith("_") && !String(k).startsWith("line_"))
    .map(([k, v]) => ({ key: k, value: formatValue(v) }));
  const zeissRows = Object.entries(zeissAll).map(([k, v]) => ({
    key: k,
    value: formatValue(v),
  }));

  return (
    <section className="card method-panel sem-values-panel" style={{ marginBottom: "1.25rem" }}>
      <div className="card-header">
        <div>
          <h3>SEM values (OCR + Zeiss metadata)</h3>
          <p className="muted method-desc">
            Engine: {ocr.engine || "—"}
            {" · "}
            OCR lines: {(ocr.lines || []).length}
            {" · "}
            Zeiss keys: {Object.keys(zeissAll).length}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost sem-values-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <div className="sem-values-body">
          {ocr.raw_text ? (
            <p className="protocol-banner-note" style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
              <strong>OCR text:</strong>
              {"\n"}
              {ocr.raw_text}
            </p>
          ) : null}
          {combinedRows.length > 0 && (
            <>
              <h4 style={{ margin: "0.75rem 0 0.35rem", fontSize: "0.9rem" }}>Combined fields</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedRows.map((r) => (
                    <tr key={`c-${r.key}`}>
                      <td>{r.key}</td>
                      <td style={{ wordBreak: "break-word" }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {ocrRows.length > 0 && (
            <>
              <h4 style={{ margin: "0.75rem 0 0.35rem", fontSize: "0.9rem" }}>OCR-parsed</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrRows.map((r) => (
                    <tr key={`o-${r.key}`}>
                      <td>{r.key}</td>
                      <td style={{ wordBreak: "break-word" }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {zeissRows.length > 0 && (
            <>
              <h4 style={{ margin: "0.75rem 0 0.35rem", fontSize: "0.9rem" }}>
                Zeiss SmartSEM ({zeissRows.length})
              </h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {zeissRows.map((r) => (
                    <tr key={`z-${r.key}`}>
                      <td>{r.key}</td>
                      <td style={{ wordBreak: "break-word" }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function TipRadiusBanner({ protocol, tipCondition, calibration, nmPerPixel, aggregation, diagnostics }) {
  const primary = protocol?.method1_primary_nm ?? 50;
  const d3 = protocol?.method3_circle_diameter_nm ?? 100;
  const source = calibration?.calibration_source;
  const approved = protocol?.approved === true;
  const untrusted =
    Number(nmPerPixel) === 1 &&
    (source === "config_default" || source === "tiff_metadata" || !source);
  const median = aggregation?.median_radius_nm;
  const q25 = aggregation?.q25_radius_nm;
  const q75 = aggregation?.q75_radius_nm;
  const multiPeak = diagnostics?.multi_peak || aggregation?.multi_peak;
  const warnings = diagnostics?.warnings || [];
  const spacing = diagnostics?.peak_spacing_nm?.median;

  return (
    <div className={`protocol-banner ${untrusted || !approved ? "pending" : "approved"}`}>
      <strong>Tip Radius Measurement</strong>
      {multiPeak && median != null && (
        <p className="protocol-banner-note">
          Serrated edge — median R = {fmt(median)} nm
          {q25 != null && q75 != null ? ` (IQR ${fmt(q25)}–${fmt(q75)} nm)` : ""}
          {aggregation?.count != null ? ` across ${aggregation.count} tips` : ""}
          . Prefer distribution over a single headline number.
        </p>
      )}
      <p className="protocol-banner-note" style={{ whiteSpace: "pre-line" }}>
        {"Fixed-distance inscribed circle → R (l = " +
          primary +
          " nm)\n" +
          "Distance from projected tip → l\n" +
          "Included angle at fixed diameter → θ (D = " +
          d3 +
          " nm, Interp. A)\n" +
          "OpenAI Vision tip radius (plus constructions on those tips)"}
      </p>
      <p className="protocol-banner-note">
        Scale: {nmPerPixel != null ? `${Number(nmPerPixel).toFixed(4)} nm/px` : "—"}
        {source ? ` (${source})` : ""}
        {" · "}
        Constants: {approved ? "client-approved" : "not yet approved (l / D may be provisional)"}
        {spacing != null ? ` · median peak spacing ${fmt(spacing)} nm` : ""}
      </p>
      {untrusted && (
        <p className="protocol-banner-note">
          Untrusted scale (nm/px≈1). Enter <strong>nm per pixel</strong> in the sidebar or upload a
          calibration file, then re-run — otherwise measurements cannot be trusted.
        </p>
      )}
      {source && String(source).includes("zeiss") && (
        <p className="protocol-banner-note">
          Scale came from embedded Zeiss metadata — spot-check against the SEM header /
          known magnification once; an OCR/tag slip would skew every nm value uniformly.
        </p>
      )}
      {warnings.map((w) => (
        <p key={w} className="protocol-banner-note">
          {w}
        </p>
      ))}
      {tipCondition && (
        <p className="protocol-banner-note">
          Classification (from median R): <strong>{tipCondition}</strong>
          {tipCondition === "sharp" && " — small radius, sharper tip"}
          {tipCondition === "moderate" && " — intermediate tip radius"}
          {tipCondition === "blunt" && " — large radius, more rounded or blunt tip"}
        </p>
      )}
    </div>
  );
}

function methodHeadline(data, def) {
  return (
    data?.[def.valueKey] ??
    data?.median ??
    data?.[def.fallbackKey] ??
    data?.mean ??
    data?.headline_value ??
    null
  );
}

export default function ResultsDashboard({ result }) {
  const bs = result.brainstorming_methods || result.alternative_methods || {};
  const protocol = result.protocol || bs.protocol || {};
  const primaryL = protocol.method1_primary_nm ?? 50;
  const d3 = protocol.method3_circle_diameter_nm ?? 100;
  const diagnostics = bs.diagnostics || {};
  const reconciliation =
    bs.method_reconciliation || diagnostics.method_reconciliation || {};

  const m1 = bs[METHOD1.key] || {};
  const m2 = bs[METHOD2.key] || {};
  const m3 = bs[METHOD3.key] || {};
  const a3 = bs[APPROACH3.key] || {};

  const m1Curves = m1.per_curve || [];
  const m1Failed = m1.failed_curves || [];
  const m2Curves = m2.per_curve || [];
  const m2Failed = m2.failed_curves || [];
  const m3Curves = m3.per_curve || [];
  const a3Curves = a3.per_curve || [];
  const a3Failed = a3.failed_curves || [];

  const m1Val = methodHeadline(m1, METHOD1);
  const m2Val = methodHeadline(m2, METHOD2);
  const m3Val = methodHeadline(m3, METHOD3);
  const a3Val = methodHeadline(a3, APPROACH3);
  // Method 3 summarize_values puts angle under "median" / also check median_angle_deg
  const m3Angle = m3Val ?? m3.median_angle_deg ?? m3.mean_angle_deg;

  const nMarked = m1.n_marked ?? m1Curves.length + m1Failed.length;
  const openaiOk = a3.openai?.ok;
  const openaiErr = a3.openai?.error;

  const failRows = m1Failed.map((c) => ({
    peak_id: c.peak_id,
    peak_x: c.peak_location?.[0],
    peak_y: c.peak_location?.[1],
    radius_nm: c.rejection_reason || c.method1_rejection_reason || "—",
  }));

  const m2FailRows = m2Failed.map((c) => ({
    peak_id: c.peak_id ?? c.tip_id,
    peak_x: c.peak_location?.[0] ?? c.tip_point?.[0],
    peak_y: c.peak_location?.[1] ?? c.tip_point?.[1],
    distance_l_nm: c.rejection_reason || "—",
    fit_band: "—",
  }));

  const reconRows = (reconciliation.per_peak || []).map((r) => ({
    peak_id: r.peak_id,
    method1_R_nm: r.method1_R_nm,
    vision_R_nm: r.vision_R_nm,
    delta_pct: r.delta_pct,
    flag: r.flag,
    note: r.note,
  }));

  const iqrLabel =
    result.aggregation?.q25_radius_nm != null && result.aggregation?.q75_radius_nm != null
      ? `IQR ${fmt(result.aggregation.q25_radius_nm)}–${fmt(result.aggregation.q75_radius_nm)}`
      : m1.iqr
        ? `IQR ${fmt(m1.iqr[0])}–${fmt(m1.iqr[1])}`
        : null;

  return (
    <div className="results">
      <TipRadiusBanner
        protocol={protocol}
        tipCondition={result.tip_condition}
        calibration={result.calibration}
        nmPerPixel={result.nm_per_pixel}
        aggregation={result.aggregation}
        diagnostics={diagnostics}
      />

      <ExtractedValuesPanel calibration={result.calibration} />

      <section className="metrics-grid">
        <article className="metric-card highlight">
          <span className="metric-label">Fixed-distance circle → Median R (l = {primaryL} nm)</span>
          <span className="metric-value">
            {m1Val != null ? `${fmt(m1Val)} nm` : "—"}
          </span>
          <span className="metric-sub">
            {m1.count ?? m1Curves.length} with radius · {nMarked} tips marked
            {iqrLabel ? ` · ${iqrLabel}` : ""}
          </span>
        </article>
        <article className="metric-card highlight">
          <span className="metric-label">Projected tip distance → Median l</span>
          <span className="metric-value">
            {m2Val != null ? `${fmt(m2Val)} nm` : "—"}
          </span>
          <span className="metric-sub">
            {m2.count ?? m2Curves.length} ok
            {m2Failed.length > 0 ? ` · ${m2Failed.length} failed` : ""}
            {" · yellow edges · red l"}
          </span>
        </article>
        <article className="metric-card highlight">
          <span className="metric-label">Included angle → Median θ (D = {d3} nm)</span>
          <span className="metric-value">
            {m3Angle != null ? `${fmt(m3Angle)}°` : "—"}
          </span>
          <span className="metric-sub">
            {m3.count ?? m3Curves.length} tips · cyan circle · yellow rays
          </span>
        </article>
        <article className="metric-card highlight">
          <span className="metric-label">OpenAI Vision tip radius — Mean R</span>
          <span className="metric-value">
            {a3Val != null ? `${fmt(a3Val)} nm` : "—"}
          </span>
          <span className="metric-sub">
            {a3.count ?? a3Curves.length} fitted
            {a3.peak_count != null ? ` / ${a3.peak_count} peaks` : ""}
            {a3.std_radius_nm != null || a3.std != null
              ? ` · σ ${fmt(a3.std_radius_nm ?? a3.std)} nm`
              : ""}
            {openaiOk === false
              ? ` · VLM: ${openaiErr || "unavailable"}`
              : openaiOk
                ? ` · ${a3.openai?.model || "ok"}`
                : ""}
          </span>
        </article>
      </section>

      {m1Failed.length > 0 && (
        <div className="toast" style={{ marginBottom: "1rem" }}>
          Fixed-distance circle marked without R:{" "}
          {m1Failed
            .slice(0, 12)
            .map(
              (c) =>
                `tip ${c.peak_id}: ${c.rejection_reason || c.method1_rejection_reason || "invalid"}`
            )
            .join(" · ")}
          {m1Failed.length > 12 ? ` · +${m1Failed.length - 12} more` : ""}
        </div>
      )}

      {m2Failed.length > 0 && (
        <div className="toast" style={{ marginBottom: "1rem" }}>
          Projected tip distance failed:{" "}
          {m2Failed
            .slice(0, 12)
            .map((c) => `tip ${c.peak_id ?? c.tip_id}: ${c.rejection_reason || "invalid"}`)
            .join(" · ")}
          {m2Failed.length > 12 ? ` · +${m2Failed.length - 12} more` : ""}
        </div>
      )}

      {reconRows.length > 0 && (
        <section className="card card-tint-lavender" style={{ marginBottom: "1rem" }}>
          <div className="card-header">
            <h3>Method disagreement (fixed-distance R vs Vision R)</h3>
            <span className="method-badge">
              {reconciliation.n_high_disagreement ?? 0} high Δ
              {reconciliation.threshold_pct != null
                ? ` (>=${reconciliation.threshold_pct}%)`
                : ""}
            </span>
          </div>
          <PaginatedTable
            rows={reconRows}
            columns={[
              { key: "peak_id", label: "Peak" },
              { key: "method1_R_nm", label: "M1 R (nm)", format: (v) => fmt(v) },
              { key: "vision_R_nm", label: "Vision R (nm)", format: (v) => fmt(v) },
              { key: "delta_pct", label: "Δ %", format: (v) => (v == null ? "—" : fmt(v, 1)) },
              { key: "flag", label: "Flag" },
              { key: "note", label: "Note" },
            ]}
          />
        </section>
      )}

      <ValidationPanel validation={result.validation} files={result.files} />

      <div className="method-panels">
        <MethodPanel
          tint="blue"
          title={METHOD1.title}
          description={METHOD1.description}
          imageKey={METHOD1.imageKey}
          csvKey={METHOD1.csvKey}
          files={result.files}
          summary={{
            count: nMarked,
            mean: m1Val != null ? METHOD1.meanFmt(m1Val) : null,
            meanLabel: `${METHOD1.meanLabel} (l = ${primaryL} nm)`,
          }}
          rows={[...m1Curves.map(METHOD1.rowMap), ...failRows]}
          columns={METHOD1.columns}
        />
        <MethodPanel
          tint="blue"
          title={METHOD2.title}
          description={METHOD2.description}
          imageKey={METHOD2.imageKey}
          csvKey={METHOD2.csvKey}
          files={result.files}
          summary={{
            count: (m2.count ?? m2Curves.length) + m2Failed.length,
            mean: m2Val != null ? METHOD2.meanFmt(m2Val) : null,
            meanLabel: METHOD2.meanLabel,
          }}
          rows={[...m2Curves.map(METHOD2.rowMap), ...m2FailRows]}
          columns={METHOD2.columns}
        />
        <MethodPanel
          tint="blue"
          title={METHOD3.title}
          description={METHOD3.description}
          imageKey={METHOD3.imageKey}
          csvKey={METHOD3.csvKey}
          files={result.files}
          summary={{
            count: m3.count ?? m3Curves.length,
            mean: m3Angle != null ? METHOD3.meanFmt(m3Angle) : null,
            meanLabel: `${METHOD3.meanLabel} (D = ${d3} nm)`,
          }}
          rows={m3Curves.map(METHOD3.rowMap)}
          columns={METHOD3.columns}
        />
        <MethodPanel
          tint="blue"
          title={APPROACH3.title}
          description={
            openaiOk === false
              ? `${APPROACH3.description}\n\nOpenAI status: ${openaiErr || "unavailable — set OPENAI_API_KEY in backend .env"}`
              : APPROACH3.description
          }
          imageKey={APPROACH3.imageKey}
          secondaryImageKey={APPROACH3.secondaryImageKey}
          secondaryDescription={APPROACH3.secondaryDescription}
          secondaryFlowTitle="Fixed-distance inscribed circle → R"
          extraVisuals={APPROACH3.extraVisuals}
          csvKey={APPROACH3.csvKey}
          files={result.files}
          summary={{
            count: (a3.count ?? a3Curves.length) + a3Failed.length,
            mean: a3Val != null ? APPROACH3.meanFmt(a3Val) : null,
            meanLabel: APPROACH3.meanLabel,
          }}
          rows={[
            ...a3Curves.map(APPROACH3.rowMap),
            ...a3Failed.map((c) => ({
              peak_id: c.peak_id,
              peak_x: c.peak_location?.[0],
              peak_y: c.peak_location?.[1],
              radius_nm: c.rejection_reason || "—",
            })),
          ]}
          columns={APPROACH3.columns}
        />
      </div>
    </div>
  );
}
