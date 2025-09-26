import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

export default function App() {
  // ====== State Management ======
  const [cves, setCves] = useState([]);          // Stores CVE data
  const [loading, setLoading] = useState(true);  // Loading state
  const [error, setError] = useState(null);      // Error messages
  const [expandedRows, setExpandedRows] = useState({}); // Tracks expanded rows in table
  const [severityCounts, setSeverityCounts] = useState({}); // Severity distribution counts

  // Colors for pie chart
  const COLORS = ["#f87171", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#e2e8f0"];

  // ====== Data Fetching ======
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/cves")  // Calls backend Flask API
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        // Filter & sort by most recent
        const sortedData = data
          .filter((item) => item.published !== "N/A")
          .sort((a, b) => new Date(b.published) - new Date(a.published));

        setCves(sortedData);

        // Count CVEs by severity for pie chart
        const counts = {};
        sortedData.forEach((item) => {
          const severity = item.severity || "Unknown";
          counts[severity] = (counts[severity] || 0) + 1;
        });
        setSeverityCounts(counts);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to fetch CVE data. Please try again later.");
        setLoading(false);
      });
  }, []);

  // ====== Row Expansion (Show More / Less) ======
  const toggleRow = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // ====== Pie Chart Data ======
  const pieData = Object.entries(severityCounts).map(([key, value]) => ({
    name: key,
    value,
  }));

  // Assign severity colors for table display
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL": return "#f87171";
      case "HIGH": return "#facc15";
      case "MEDIUM": return "#34d399";
      case "LOW": return "#60a5fa";
      default: return "#e2e8f0"; // Unknown/other
    }
  };

  // ====== UI Rendering ======
  return (
    <div style={{ backgroundColor: "#0f172a", color: "white", minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>Threat Intelligence Dashboard</h1>
      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "20px" }}>
        Last updated: {new Date().toLocaleString()}
      </p>

      {/* Loading / Error / Empty States */}
      {loading ? (
        <p>Loading CVE data...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : cves.length === 0 ? (
        <p>No CVE data available.</p>
      ) : (
        <>
          {/* ====== Severity Pie Chart ====== */}
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Severity Levels</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ====== CVE Data Table ====== */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ backgroundColor: "#1e293b" }}>
                <th style={{ border: "1px solid #334155", padding: "10px" }}>CVE ID</th>
                <th style={{ border: "1px solid #334155", padding: "10px" }}>Summary</th>
                <th style={{ border: "1px solid #334155", padding: "10px" }}>Published</th>
                <th style={{ border: "1px solid #334155", padding: "10px" }}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {cves.map((cve, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#0f172a" : "#1e293b" }}>
                  <td style={{ border: "1px solid #334155", padding: "10px" }}>
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa", textDecoration: "underline" }}
                    >
                      {cve.id}
                    </a>
                  </td>
                  <td style={{ border: "1px solid #334155", padding: "10px" }}>
                    {expandedRows[index] || cve.summary.length < 150
                      ? cve.summary
                      : cve.summary.slice(0, 150) + "..."}
                    {cve.summary.length > 150 && (
                      <button
                        onClick={() => toggleRow(index)}
                        style={{
                          marginLeft: "10px",
                          background: "none",
                          color: "#60a5fa",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        {expandedRows[index] ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </td>
                  <td style={{ border: "1px solid #334155", padding: "10px" }}>
                    {cve.published !== "N/A"
                      ? new Date(cve.published).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td style={{ border: "1px solid #334155", padding: "10px", color: getSeverityColor(cve.severity) }}>
                    {cve.severity || "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
