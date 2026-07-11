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
      const data = await fn();
      setResult(data);
      const name = data.source_path?.split("/").pop() || "image";
      setStatus(`Analysis complete — ${name}`);
    } catch (err) {
      setError(err.message);
      setStatus("Analysis failed — try again");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = (image, calibration, groundTruth, protocol) =>
    run(() => analyzeImage(image, calibration, groundTruth, protocol));

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
              <span className={`tip-badge ${result.tip_condition}`}>
                {result.tip_condition} tip
              </span>
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
