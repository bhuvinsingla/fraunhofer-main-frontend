export default function TiltWarning({ tilt }) {
  if (!tilt || (tilt.tilt_angle_deg == null && !tilt.warning && !tilt.applied)) return null;

  const angle = tilt.tilt_angle_deg ?? 60;
  const applied = Boolean(tilt.applied);

  return (
    <aside className="tilt-warning" role="alert">
      <div className="tilt-warning-header">
        <span className="tilt-warning-badge">{applied ? "Tilt scaled" : "Projected only"}</span>
        <h3>
          {applied
            ? "Measurement warning — foreshortening scale applied"
            : "Stage tilt recorded — no blind 2× correction"}
        </h3>
      </div>
      {!applied ? (
        <p>
          Metadata reports stage tilt ≈ <strong>{angle}°</strong> with tilt correction off.
          Measurements are reported as <code>projected_*</code> values. A blind{" "}
          <code>1/cos({angle}°)</code> scale is <strong>not</strong> applied until the
          measurement plane and tilt axis are confirmed.
        </p>
      ) : (
        <p>
          Foreshortening scale applied:{" "}
          <code>
            L<sub>true</sub> = L<sub>image</sub> / cos({angle}°)
          </code>
          {tilt.scale_factor != null && <> → ×{Number(tilt.scale_factor).toFixed(2)}</>}
        </p>
      )}
      {tilt.nm_per_pixel_raw != null && (
        <p className="tilt-meta">
          Scale: {Number(tilt.nm_per_pixel_raw).toFixed(4)} nm/px
          {tilt.applied && tilt.nm_per_pixel_corrected != null && (
            <> → {Number(tilt.nm_per_pixel_corrected).toFixed(4)} nm/px</>
          )}
        </p>
      )}
    </aside>
  );
}
