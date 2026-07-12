import { useCallback, useEffect, useState } from "react";
import { analyzeImage, analyzeSample, checkHealth } from "./api";
import Sidebar from "./components/Sidebar";
import ResultsDashboard from "./components/ResultsDashboard";

export default function App() {
  const [status, setStatus] = useState("Connecting to API…");
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    checkHealth()
      .then(() => {
        setApiOnline(true);
        setStatus("Connected");
      })
      .catch(() => {
        setApiOnline(false);
        setStatus("API offline — start backend on port 8000");
      });
  }, []);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      console.group("▶ Pipeline start");
      console.log("Waiting for /api/analyze …");
      const data = await fn();
      setResult(data);

      const fdc = data.brainstorming_methods?.fixed_distance_circle || {};
      const stages = data.debug_stages || data.brainstorming_methods?.debug_stages || {};
      const tip = data.tip_condition;
      const tipNote =
        tip === "sharp"
          ? "Small radius = sharper tip"
          : tip === "blunt"
            ? "Large radius = more rounded or blunt tip"
            : tip === "moderate"
              ? "Intermediate tip radius"
              : "";

      console.groupEnd();

      // —— 1. Analyze image ——
      console.group("1/4 ANALYZE IMAGE");
      console.log("stage:", stages.stage1_analyze_image);
      console.log("calibration:", data.calibration);
      console.log("nm_per_pixel:", data.nm_per_pixel);
      console.log("OCR:", data.calibration?.ocr);
      console.log("extracted_values:", data.calibration?.extracted_values);
      console.log("zeiss_all keys:", Object.keys(data.calibration?.zeiss_all || {}));
      console.log("shapes_detected:", data.shapes_detected, "shapes_passed:", data.shapes_passed);
      if (stages.stage1_analyze_image?.calibration_warning || Number(data.nm_per_pixel) === 1) {
        console.warn("ISSUE HERE? nm/px≈1 — enter nm per pixel before trusting R100");
      } else {
        console.log("OK — image loaded with scale");
      }
      console.groupEnd();

      // —— 2. Detect points ——
      console.group("2/4 DETECT POINTS (all ridge peaks → apex + L/R at l)");
      console.log("stage:", stages.stage2_detect_points);
      console.log(
        "candidates:",
        stages.stage2_detect_points?.n_candidates,
        "with R100:",
        stages.stage2_detect_points?.n_with_r100
      );
      const points = stages.stage2_detect_points?.points || [];
      if (!points.length) {
        console.warn("ISSUE HERE? No Method-1 points — tip not hard-valid or Method 1 never ran");
      }
      points.forEach((p) => {
        console.log(
          `tip ${p.tip_id}: apex=`,
          p.apex,
          "left=",
          p.left,
          "right=",
          p.right,
          "found_all_three=",
          p.found_all_three,
          "reason=",
          p.rejection_reason
        );
        if (!p.found_all_three) {
          console.warn(
            `ISSUE HERE? tip ${p.tip_id} missing intersection(s) — often wrong nm/px (l_px=${p.l_px})`
          );
        }
      });
      console.log("R100 ok:", fdc.per_curve?.length, "failed/marked:", fdc.failed_curves?.length);
      console.groupEnd();

      // —— 3. Mark points ——
      console.group("3/4 MARK POINTS (method1.png — all tips on curve)");
      console.log("stage:", stages.stage3_mark_points);
      console.log("method1 image:", data.files?.method1);
      (stages.stage3_mark_points?.marks || []).forEach((m) => {
        console.log(`tip ${m.tip_id} draw flags:`, m);
        if (!m.will_draw_apex && !m.will_draw_left && !m.will_draw_right) {
          console.warn(`ISSUE HERE? tip ${m.tip_id} — nothing to mark on the image`);
        }
      });
      if (!(stages.stage3_mark_points?.marks || []).length) {
        console.warn("ISSUE HERE? No marks — blank method1 overlay");
      }
      console.groupEnd();

      // —— 4. Proceed (radius + sharp/blunt) ——
      console.group("4/4 PROCEED (circle radius + classification)");
      console.log("stage:", stages.stage4_proceed_radius);
      console.log("tip_condition:", tip, tipNote ? `(${tipNote})` : "");
      console.log(
        "median R (nm):",
        fdc.median_radius_nm ?? fdc.median ?? fdc.mean_radius_nm
      );
      console.log("n_marked:", fdc.n_marked, "count with R:", fdc.count);
      console.log("per_curve:", fdc.per_curve);
      const m2 = data.brainstorming_methods?.projected_tip_distance || {};
      const m3 = data.brainstorming_methods?.inscribed_angle || {};
      console.log("Method 2 projected l:", m2.count, "median:", m2.median_distance_l_nm ?? m2.median);
      console.log("Method 2 image:", data.files?.method2);
      console.log("Method 3 angle:", m3.count, "median:", m3.median ?? m3.median_angle_deg);
      console.log("Method 3 image:", data.files?.method3);
      const a3 = data.brainstorming_methods?.approach3_openai_vlm || {};
      console.log(
        "Approach 3 OpenAI circle-fit:",
        a3.count,
        "mean:",
        a3.mean_radius_nm ?? a3.mean,
        "std:",
        a3.std_radius_nm ?? a3.std,
        "peaks:",
        a3.peak_count,
        "openai:",
        a3.openai
      );
      console.log("Approach 3 image:", data.files?.method1_approach3);
      (stages.stage4_proceed_radius?.radii || []).forEach((r) => {
        if (r.valid) {
          console.log(`tip ${r.tip_id}: R=${r.radius_nm} nm center=`, r.center);
        } else {
          console.warn(`ISSUE HERE? tip ${r.tip_id} radius failed:`, r.rejection_reason);
        }
      });
      if (!tip) {
        console.warn("ISSUE HERE? No tip_condition — no valid R to classify sharp/blunt");
      }
      console.groupEnd();

      console.group("Full analysis data");
      console.log("protocol:", data.protocol);
      console.log("fixed_distance_circle:", fdc);
      console.log("debug_stages:", stages);
      console.log("FULL RESULT:", data);
      console.groupEnd();

      setStatus("Analysis complete");
    } catch (err) {
      console.error("Analysis failed (before/during pipeline):", err);
      setError(err.message);
      setStatus("Analysis failed — try again");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = (image, calibration, groundTruth, protocol, nmPerPixel) =>
    run(() => analyzeImage(image, calibration, groundTruth, protocol, nmPerPixel));

  const handleSample = () => run(analyzeSample);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-brand">
          <div className="brand-icon">T</div>
          <span className="brand-name">Tip Radius</span>
        </div>
        <nav className="site-nav" aria-label="Sections">
          <span>ANALYSIS</span>
          <span>METHODS</span>
          <span>RESULTS</span>
        </nav>
        <span className={`api-pill ${apiOnline ? "online" : "offline"}`}>
          {apiOnline ? "API online" : "API offline"}
        </span>
      </header>

      <div className="app">
        <Sidebar
          apiOnline={apiOnline}
          loading={loading}
          onAnalyze={handleAnalyze}
          onSample={handleSample}
        />
        <main className="main">
          <header className="topbar">
            <div>
              <p className="section-label">MEASUREMENT DASHBOARD</p>
              <h2>Analysis results</h2>
              <p className="status-line">{status}</p>
            </div>
            {result?.tip_condition && (
              <div className="tip-condition">
                <span className={`tip-badge ${result.tip_condition}`}>
                  {result.tip_condition} tip
                </span>
                <p className="tip-condition-note">
                  {result.tip_condition === "sharp" && "Small radius = sharper tip"}
                  {result.tip_condition === "moderate" && "Intermediate tip radius"}
                  {result.tip_condition === "blunt" && "Large radius = more rounded or blunt tip"}
                </p>
              </div>
            )}
          </header>

          {error && <div className="toast">{error}</div>}

          {loading && (
            <div className="loading">
              <div className="spinner" />
              <p>Running analysis pipeline…</p>
            </div>
          )}

          {!loading && !result && (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <h3>No analysis yet</h3>
              <p>Upload a metal tip SEM image, or run the built-in sample.</p>
            </div>
          )}

          {!loading && result && <ResultsDashboard result={result} />}
        </main>
      </div>
    </div>
  );
}
