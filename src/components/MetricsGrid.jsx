const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

/** PDF brainstorming Methods 1–3 summary cards. */
export default function MetricsGrid({ result }) {
  const bs = result.brainstorming_methods || result.alternative_methods || {};
  const protocol = result.protocol || bs.protocol || {};
  const primaryL = protocol.method1_primary_nm ?? 50;
  const d3 = protocol.method3_circle_diameter_nm ?? 100;

  const fdc = bs.fixed_distance_circle || {};
  const ptd = bs.projected_tip_distance || {};
  const ia = bs.inscribed_angle || {};

  const m1 = fdc.median_radius_nm ?? fdc.headline_value ?? fdc.mean_radius_nm ?? fdc.median;
  const m2 = ptd.median_distance_l_nm ?? ptd.headline_value ?? ptd.mean_distance_l_nm ?? ptd.median;
  const m3 = ia.median_angle_deg ?? ia.headline_value ?? ia.mean_angle_deg ?? ia.median;

  return (
    <section className="metrics-grid">
      <article className="metric-card highlight">
        <span className="metric-label">Fixed-distance circle → R (l = {primaryL} nm)</span>
        <span className="metric-value">
          {m1 != null ? `${fmt(m1)} nm` : "—"}
        </span>
        <span className="metric-sub">
          {fdc.count ?? 0} tips · small R = sharper · large R = blunt
        </span>
      </article>
      <article className="metric-card highlight">
        <span className="metric-label">Projected tip distance → l</span>
        <span className="metric-value">
          {m2 != null ? `${fmt(m2)} nm` : "—"}
        </span>
        <span className="metric-sub">
          {ptd.count ?? 0} tips · P_proj → T · larger l = blunter
        </span>
      </article>
      <article className="metric-card highlight">
        <span className="metric-label">Included angle → θ (D = {d3} nm)</span>
        <span className="metric-value">
          {m3 != null ? `${fmt(m3)}°` : "—"}
        </span>
        <span className="metric-sub">
          {ia.count ?? 0} tips · Interp. A · rays T→P_L / T→P_R
        </span>
      </article>
    </section>
  );
}
