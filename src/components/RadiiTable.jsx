import { fileUrl } from "../api";
import PaginatedTable from "./PaginatedTable";

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));

const COLUMNS = [
  { key: "peak_id", label: "Peak" },
  { key: "shape_id", label: "Shape" },
  { key: "radius_nm", label: "Radius (nm)", format: (v) => fmt(v) },
  { key: "radius_angstrom", label: "Radius (Å)", format: (v) => fmt(v, 1) },
  { key: "opening_angle_deg", label: "Opening angle (°)", format: (v) => fmt(v, 1) },
  { key: "confidence_score", label: "Confidence", format: (v) => fmt(v, 2) },
];

export default function RadiiTable({ rows, files }) {
  return (
    <section className="card card-tint-blue">
      <div className="card-header">
        <h3>Per-peak radius measurements</h3>
        {files?.radii && <a className="link-btn" href={fileUrl(files.radii)} download>Download CSV</a>}
      </div>
      <PaginatedTable rows={rows} columns={COLUMNS} />
    </section>
  );
}
