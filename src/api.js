const API_BASE = import.meta.env.VITE_API_URL || "";

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error("API unreachable");
  return res.json();
}

export async function fetchProtocol() {
  const res = await fetch(`${API_BASE}/api/protocol`);
  if (!res.ok) throw new Error("Could not load protocol");
  return res.json();
}

export async function analyzeImage(image, calibration, groundTruth, protocol) {
  const form = new FormData();
  form.append("image", image);
  if (calibration) form.append("calibration", calibration);
  if (groundTruth) form.append("ground_truth", groundTruth);
  if (protocol) {
    if (protocol.method1_distances_nm?.length) {
      form.append("method1_distances_nm", protocol.method1_distances_nm.join(","));
    }
    if (protocol.method1_primary_nm != null) {
      form.append("method1_primary_nm", String(protocol.method1_primary_nm));
    }
    if (protocol.method2_fit_lo_nm != null && protocol.method2_fit_hi_nm != null) {
      form.append("method2_fit_lo_nm", String(protocol.method2_fit_lo_nm));
      form.append("method2_fit_hi_nm", String(protocol.method2_fit_hi_nm));
    }
    if (protocol.method3_circle_diameter_nm != null) {
      form.append("method3_circle_diameter_nm", String(protocol.method3_circle_diameter_nm));
    }
    if (protocol.approved != null) {
      form.append("protocol_approved", protocol.approved ? "true" : "false");
    }
    if (protocol.approved_by) {
      form.append("protocol_approved_by", protocol.approved_by);
    }
  }

  const res = await fetch(`${API_BASE}/api/analyze`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Analysis failed");
  return data;
}

export async function analyzeSample() {
  const res = await fetch(`${API_BASE}/api/analyze/sample`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Sample analysis failed");
  return data;
}

export function fileUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}
