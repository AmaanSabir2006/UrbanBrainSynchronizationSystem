import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/zones/")
      .then((response) => {
        setZones(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Fetch Error: ", error);
        setError("Failed to synchronize with PostgreSQL matrix.");
        setLoading(false);
      });
  }, []);

  // Updated badge states for pristine readability against a light white dashboard background
  const getRiskStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return { color: "#D32F2F", bg: "rgba(211, 47, 47, 0.06)", border: "rgba(211, 47, 47, 0.3)" };
      case "medium":
        return { color: "#D97706", bg: "rgba(217, 119, 6, 0.06)", border: "rgba(217, 119, 6, 0.3)" };
      default:
        return { color: "#01411C", bg: "rgba(1, 65, 28, 0.06)", border: "rgba(1, 65, 28, 0.3)" };
    }
  };

  if (loading) {
    return <div style={{ color: "#01411C", fontSize: "16px", fontWeight: "600", fontFamily: "monospace" }}>▶ Synchronizing urban data infrastructure...</div>;
  }

  if (error) {
    return <div style={{ color: "#D32F2F", fontSize: "16px", fontWeight: "600", fontFamily: "monospace" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px" }}>
        {/* Changed text color from white to high-contrast deep green */}
        <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px", color: "#01411C" }}>
          Zones Management Overview
        </h1>
        <p style={{ color: "rgba(1, 65, 28, 0.65)", margin: 0, fontSize: "15px", fontWeight: "500" }}>
          Real-time relational database records pulling from the PostgreSQL core.
        </p>
      </div>

      {/* Top Statistical Summary Panels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "25px", marginBottom: "40px" }}>
        {/* Card 1: Monitored Regions */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "2px solid #01411C", boxShadow: "0 4px 20px rgba(1, 65, 28, 0.03)" }}>
          <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>MONITORED REGIONS</div>
          <div style={{ fontSize: "36px", fontWeight: "800", color: "#01411C" }}>{zones.length}</div>
        </div>
        
        {/* Card 2: Critical Outages */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "2px solid #01411C", boxShadow: "0 4px 20px rgba(1, 65, 28, 0.03)" }}>
          <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>CRITICAL OUTAGES</div>
          <div style={{ fontSize: "36px", fontWeight: "800", color: "#D32F2F" }}>
            {zones.filter(z => z.risk_classification?.toLowerCase() === "high").length}
          </div>
        </div>
      </div>

      {zones.length === 0 ? (
        <div style={{ padding: "40px", border: "2px dashed rgba(1, 65, 28, 0.3)", borderRadius: "12px", textAlign: "center", color: "rgba(1, 65, 28, 0.6)", backgroundColor: "#FFFFFF", fontWeight: "500" }}>
          No zone data detected in the current query.
        </div>
      ) : (
        /* Regional Matrix Grid Section */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "25px" }}>
          {zones.map((zone) => {
            const status = getRiskStyles(zone.risk_classification);
            return (
              <div
                key={zone.zone_id}
                style={{
                  backgroundColor: "#FFFFFF", // Changed from solid black to crisp white
                  border: `2px solid ${status.color}`, // Upgraded line width for structured look
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 10px 25px -5px rgba(1, 65, 28, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: status.color }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <span style={{ color: "rgba(1, 65, 28, 0.5)", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" }}>{zone.zone_id}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "4px 0 0 0", color: "#01411C" }}>{zone.zone_name}</h2>
                  </div>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    color: status.color,
                    backgroundColor: status.bg,
                    border: `1px solid ${status.border}`
                  }}>
                    {zone.risk_classification || "UNKNOWN"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(1, 65, 28, 0.15)", paddingTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "rgba(1, 65, 28, 0.65)", fontWeight: "500" }}>Resident Population</span>
                    <span style={{ fontWeight: "700", color: "#01411C" }}>{Number(zone.population_count || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;