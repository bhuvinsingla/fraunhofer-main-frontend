import { fileUrl } from "../api";

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

/**
 * Blade Value table from brainstorming / transcript:
 * Included Angle α · Inscribed Diameter D · Distance to Tip l · Area under curve A
 */
export default function BladeValueTable({ bladeValue, files }) {
  if (!bladeValue?.per_tip?.length) return null;

  const rows = bladeValue.per_tip;
  const avg = bladeValue.blade_value || {};
  const csv = files?.blade_value_csv ? fileUrl(files.blade_value_csv) : null;

  return (
    <section className="card blade-value-card">
      <div className="card-header">
        <h3>Blade Value</h3>
        {csv && (
          <a className="link-btn" href={csv} download>
            Download CSV
          </a>
        )}
      </div>
      <p className="muted blade-value-note">
        Per-tip metrics on hard-valid arches, then mean → Blade Value (transcript).
        α = TLS flank angle · D = 2·R at primary l · l = projected tip distance · A = flank deviation (nm²).
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Peak ID</th>
              <th>Included Angle α (°)</th>
              <th>Inscribed Diameter D (nm)</th>
              <th>Distance to Tip l (nm)</th>
              <th>Area under curve A (nm²)</th>
              <th>θ100 (°)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tip_id}>
                <td>Tip {r.tip_id}</td>
                <td>{fmt(r.included_angle_deg, 2)}</td>
                <td>{fmt(r.inscribed_diameter_nm, 2)}</td>
                <td>{fmt(r.distance_to_tip_nm, 2)}</td>
                <td>{fmt(r.area_under_curve_nm2, 1)}</td>
                <td>{fmt(r.angle_D100_deg, 2)}</td>
              </tr>
            ))}
            <tr className="blade-avg-row">
              <td>AVERAGE (Blade Value)</td>
              <td>{fmt(avg.included_angle_deg, 2)}</td>
              <td>{fmt(avg.inscribed_diameter_nm, 2)}</td>
              <td>{fmt(avg.distance_to_tip_nm, 2)}</td>
              <td>{fmt(avg.area_under_curve_nm2, 1)}</td>
              <td>{fmt(avg.angle_D100_deg, 2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
