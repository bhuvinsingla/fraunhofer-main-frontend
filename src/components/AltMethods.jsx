const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));
const label = (s) => s.replace(/_/g, " ");

export default function AltMethods({ methods }) {
  if (!methods || Object.keys(methods).length === 0) {
    return <p className="muted">No alternative method results.</p>;
  }

  return (
    <div className="alt-methods">
      {Object.entries(methods).map(([name, data]) => (
        <div key={name} className="alt-item">
          <h4>{label(name)}</h4>
          <dl>
            {Object.entries(data).map(([key, value]) => (
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
