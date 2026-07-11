const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

export default function MetricsGrid({ result }) {
  const bs = result.brainstorming_methods || result.alternative_methods || {};
  const fdc = bs.fixed_distance_circle || {};
  const ptd = bs.projected_tip_distance || {};
  const ia = bs.inscribed_angle || {};
  const tipVal = bs.tip_validation || {};
  const bv = bs.blade_value?.blade_value || {};

  const m1 = fdc.median_radius_nm ?? fdc.headline_value ?? fdc.mean_radius_nm;
  const m2 = ptd.median_distance_l_nm ?? ptd.headline_value ?? ptd.mean_distance_l_nm;
  const m3 = ia.median_angle_deg ?? ia.headline_value ?? ia.mean_angle_deg;

  return (
    <section className="metrics-grid">
      <article className="metric-card highlight research-card">
        <span className="metric-label">Blade Value — D / l / α</span>
        <span className="metric-value">
          {bv.inscribed_diameter_nm != null ? `${fmt(bv.inscribed_diameter_nm)} nm` : "—"}
        </span>
        <span className="metric-sub">
          l {bv.distance_to_tip_nm != null ? `${fmt(bv.distance_to_tip_nm)} nm` : "—"}
          {" · "}
          α {bv.included_angle_deg != null ? `${fmt(bv.included_angle_deg)}°` : "—"}
          {" · "}
          {bs.blade_value?.n_tips ?? 0} tips
        </span>
      </article>
      <article className="metric-card">
        <span className="metric-label">Method 1 — Median R100</span>
        <span className="metric-value">
          {m1 != null ? `${fmt(m1)} nm` : "—"}
        </span>
        <span className="metric-sub">
          {fdc.count ?? 0} tips · {tipVal.n_accepted ?? "—"}/{tipVal.n_detected_candidates ?? "—"} accepted
        </span>
      </article>
      <article className="metric-card">
        <span className="metric-label">Method 2 — Median l</span>
        <span className="metric-value">
          {m2 != null ? `${fmt(m2)} nm` : "—"}
        </span>
        <span className="metric-sub">{ptd.count ?? 0} tips (separate metric)</span>
      </article>
      <article className="metric-card">
        <span className="metric-label">Method 3 — Median θ100</span>
        <span className="metric-value">
          {m3 != null ? `${fmt(m3)}°` : "—"}
        </span>
        <span className="metric-sub">{ia.count ?? 0} tips (angle, not radius)</span>
      </article>
    </section>
  );
}
