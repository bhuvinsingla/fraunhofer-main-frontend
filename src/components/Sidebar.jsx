import { useEffect, useRef, useState } from "react";
import { fetchProtocol } from "../api";

const PIPELINE = [
  "Per-image scale-bar calibration",
  "CLAHE + bilateral preprocess",
  "Multi-algorithm consensus edges",
  "Geometric tip gates + ridge grouping",
  "Method 1 / 2 / 3 (separate, nm-based)",
  "Median summary of accepted tips",
];

const DEFAULT_PROTOCOL = {
  method1_distances_nm: [25, 50, 100, 200],
  method1_primary_nm: 100,
  method2_fit_lo_nm: 50,
  method2_fit_hi_nm: 200,
  method3_circle_diameter_nm: 100,
  approved: false,
  approved_by: "",
};

export default function Sidebar({ apiOnline, loading, onAnalyze, onSample }) {
  const [image, setImage] = useState(null);
  const [calibration, setCalibration] = useState(null);
  const [groundTruth, setGroundTruth] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [protocol, setProtocol] = useState(DEFAULT_PROTOCOL);
  const imageRef = useRef();
  const calRef = useRef();
  const gtRef = useRef();

  useEffect(() => {
    if (!apiOnline) return;
    fetchProtocol()
      .then((data) => {
        const p = data.protocol || {};
        const band = p.method2_fit_band_nm || [50, 200];
        setProtocol({
          method1_distances_nm: p.method1_distances_nm || [25, 50, 100, 200],
          method1_primary_nm: p.method1_primary_nm ?? 100,
          method2_fit_lo_nm: band[0] ?? 50,
          method2_fit_hi_nm: band[1] ?? 200,
          method3_circle_diameter_nm: p.method3_circle_diameter_nm ?? 100,
          approved: Boolean(p.approved),
          approved_by: p.approved_by || "",
        });
      })
      .catch(() => {});
  }, [apiOnline]);

  const pickImage = (file) => {
    if (file) setImage(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickImage(e.dataTransfer.files[0]);
  };

  const distancesStr = (protocol.method1_distances_nm || []).join(", ");

  return (
    <aside className="sidebar">
      <section className="panel upload-panel">
        <h2>Upload image</h2>
        <div
          className={`dropzone ${dragging ? "dragover" : ""}`}
          onClick={() => imageRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="dropzone-title">Drop SEM image here</p>
          <p className="dropzone-hint">PNG, JPG, or TIFF</p>
          <button type="button" className="btn btn-outline" onClick={(e) => { e.stopPropagation(); imageRef.current?.click(); }}>
            Browse files
          </button>
          <input ref={imageRef} type="file" accept=".png,.jpg,.jpeg,.tif,.tiff,image/*" hidden onChange={(e) => pickImage(e.target.files[0])} />
        </div>

        {image && (
          <div className="file-chip">
            <span>{image.name}</span>
            <button type="button" className="icon-btn" onClick={() => setImage(null)} aria-label="Remove file">&times;</button>
          </div>
        )}

        <div className="optional-uploads">
          <label className="field">
            <span>Scale-bar calibration (JSON/CSV)</span>
            <input ref={calRef} type="file" accept=".json,.csv" onChange={(e) => setCalibration(e.target.files[0] || null)} />
          </label>
          <label className="field">
            <span>Ground truth (optional)</span>
            <input ref={gtRef} type="file" accept=".json,.csv" onChange={(e) => setGroundTruth(e.target.files[0] || null)} />
          </label>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!image || loading || !apiOnline}
            onClick={() => onAnalyze(image, calibration, groundTruth, protocol)}
          >
            Run analysis
          </button>
          <button type="button" className="btn btn-outline" disabled={loading || !apiOnline} onClick={onSample}>
            Try sample image
          </button>
        </div>
      </section>

      <section className={`panel protocol-panel ${protocol.approved ? "protocol-approved" : "protocol-pending"}`}>
        <h2>Measurement protocol</h2>
        <p className="protocol-note">
          Proposed defaults — approve <em>l</em>, fit band, and <em>D</em> with the client before treating as a lab standard.
        </p>

        <div className="protocol-fields">
          <div className="protocol-group">
            <h3 className="protocol-group-title">Method 1</h3>
            <label className="field">
              <span>Distances l (nm)</span>
              <input
                type="text"
                value={distancesStr}
                onChange={(e) => {
                  const parts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                  setProtocol((p) => ({
                    ...p,
                    method1_distances_nm: parts.map(Number).filter((n) => !Number.isNaN(n)),
                  }));
                }}
              />
            </label>
            <label className="field">
              <span>Primary (nm)</span>
              <input
                type="number"
                min={1}
                value={protocol.method1_primary_nm}
                onChange={(e) => setProtocol((p) => ({ ...p, method1_primary_nm: Number(e.target.value) }))}
              />
            </label>
          </div>

          <div className="protocol-group">
            <h3 className="protocol-group-title">Method 2</h3>
            <div className="field-row">
              <label className="field">
                <span>Band lo (nm)</span>
                <input
                  type="number"
                  min={0}
                  value={protocol.method2_fit_lo_nm}
                  onChange={(e) => setProtocol((p) => ({ ...p, method2_fit_lo_nm: Number(e.target.value) }))}
                />
              </label>
              <label className="field">
                <span>Band hi (nm)</span>
                <input
                  type="number"
                  min={0}
                  value={protocol.method2_fit_hi_nm}
                  onChange={(e) => setProtocol((p) => ({ ...p, method2_fit_hi_nm: Number(e.target.value) }))}
                />
              </label>
            </div>
          </div>

          <div className="protocol-group">
            <h3 className="protocol-group-title">Method 3</h3>
            <label className="field">
              <span>Circle D (nm)</span>
              <input
                type="number"
                min={1}
                value={protocol.method3_circle_diameter_nm}
                onChange={(e) => setProtocol((p) => ({ ...p, method3_circle_diameter_nm: Number(e.target.value) }))}
              />
            </label>
          </div>
        </div>

        <label className="protocol-approval">
          <input
            type="checkbox"
            checked={protocol.approved}
            onChange={(e) => setProtocol((p) => ({ ...p, approved: e.target.checked }))}
          />
          <span>Client has approved these values</span>
        </label>

        {protocol.approved && (
          <label className="field protocol-approved-by">
            <span>Approved by</span>
            <input
              type="text"
              value={protocol.approved_by}
              placeholder="Name / organisation"
              onChange={(e) => setProtocol((p) => ({ ...p, approved_by: e.target.value }))}
            />
          </label>
        )}
      </section>

      <section className="panel pipeline-panel">
        <h2>Hybrid pipeline</h2>
        <ol className="pipeline-steps">
          {PIPELINE.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
