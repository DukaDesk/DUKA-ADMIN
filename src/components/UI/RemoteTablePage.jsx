import { useEffect, useState } from "react";

function recordsFrom(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  for (const key of ["data", "items", "merchants", "listings", "subscriptions", "events", "flags", "plans"]) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
}

function labelFor(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (value) => value.toUpperCase());
}

function display(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function RemoteTablePage({ title, description, load, rowKey = "id" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    load()
      .then((response) => {
        if (active) setRows(recordsFrom(response));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load this resource.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [load]);

  const columns = rows.length ? Object.keys(rows[0]).slice(0, 7) : [];

  return (
    <section>
      <h2 style={{ margin: 0, color: "var(--navy)", fontSize: 24 }}>{title}</h2>
      <p style={{ color: "var(--gray-500)", margin: "8px 0 24px" }}>{description}</p>
      {loading && <p aria-live="polite">Loading…</p>}
      {error && <div role="alert" style={{ color: "var(--red)", background: "#FEF2F2", padding: 16, borderRadius: 8 }}>{error}</div>}
      {!loading && !error && rows.length === 0 && <p>No records were returned by the API.</p>}
      {!loading && !error && rows.length > 0 && (
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead><tr>{columns.map((column) => <th key={column} style={{ textAlign: "left", padding: 14, fontSize: 12, color: "var(--gray-500)", borderBottom: "1px solid var(--gray-200)" }}>{labelFor(column)}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row[rowKey] || index}>{columns.map((column) => <td key={column} style={{ padding: 14, borderBottom: "1px solid var(--gray-100)", fontSize: 13, color: "var(--gray-700)" }}>{display(row[column])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
