const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));
const label = (s) => s.replace(/_/g, " ");

const METHOD_LABELS = {
  fixed_distance_circle: "Fixed-distance inscribed circle → R",
  projected_tip_distance: "Distance from projected tip → l",
  inscribed_angle: "Included angle at fixed diameter → θ (Interp. A)",
};

const HIDDEN_KEYS = new Set([
  "left_line", "right_line", "vertical_l_line", "scan_line",
  "left_tangent_line", "right_tangent_line", "tip_arc_angles", "tip_arc_center",
]);

export default function BrainstormingMethods({ methods }) {
  const data = methods || {};
  if (Object.keys(data).length === 0) {
    return <p className="muted">No brainstorming method results.</p>;
  }

  return (
    <div className="alt-methods">
      {Object.entries(data).map(([name, values]) => (
        <div key={name} className="alt-item">
          <h4>{METHOD_LABELS[name] || label(name)}</h4>
          <dl>
            {Object.entries(values)
              .filter(([key]) => !HIDDEN_KEYS.has(key))
              .map(([key, value]) => (
                <div key={key} className="alt-row">
                  <dt>{label(key)}</dt>
                  <dd>
                    {Array.isArray(value)
                      ? `(${value.map((v) => fmt(v, 1)).join(", ")})`
                      : typeof value === "number"
                        ? fmt(value)
                        : String(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
