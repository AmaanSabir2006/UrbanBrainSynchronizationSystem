import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard({ onSelectZone }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Queries only the zones table for optimal performance
    axios
      .get("http://127.0.0.1:8000/api/zones/")
      .then((response) => {
        setZones(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Fetch Error: ", error);
        setError("Failed to synchronize with PostgreSQL database.");
        setLoading(false);
      });
  }, []);

  const getRiskStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.06)", border: "rgba(239, 68, 68, 0.2)" };
      case "medium":
        return { color: "#D97706", bg: "rgba(217, 119, 6, 0.06)", border: "rgba(217, 119, 6, 0.2)" };
      default:
        return { color: "#10B981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.2)" };
    }
  };

  // Compute stats dynamically from the zones payload
  const totalPopulation = zones.reduce((acc, zone) => acc + (zone.population_count || 0), 0);
  const criticalZonesCount = zones.filter(z => z.risk_classification?.toLowerCase() === "high").length;

  if (loading) {
    return <div style={{ color: "#01411C", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-mono)", padding: "40px" }}>▶ Synchronizing sector matrices...</div>;
  }

  if (error) {
    return <div style={{ color: "#EF4444", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-mono)", padding: "40px" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: "35px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#01411C", letterSpacing: "-0.5px", margin: "0 0 6px 0" }}>
            Zones Management Overview
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: "14px", fontWeight: "500" }}>
            Real-time telemetry matrices pulling live from PostgreSQL database.
          </p>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#10B981", padding: "6px 12px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)", fontWeight: "700" }}>
          SYSTEM: ONLINE
        </div>
      </div>

      {/* Summary Stat Cards (3 Columns) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "35px" }}>
        
        {/* Card 1: Monitored Regions */}
        <div className="urbs-card" style={{ padding: "24px", display: "flex", flexDirection: "column", borderLeft: "4px solid #01411C" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>MONITORED REGIONS</span>
          <span style={{ fontSize: "36px", fontWeight: "800", color: "#01411C", marginTop: "6px" }}>
            {zones.length}
          </span>
        </div>

        {/* Card 2: Total Protected Population */}
        <div className="urbs-card" style={{ padding: "24px", display: "flex", flexDirection: "column", borderLeft: "4px solid #06B6D4" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>TOTAL POPULATION PROTECTED</span>
          <span style={{ fontSize: "36px", fontWeight: "800", color: "#06B6D4", marginTop: "6px" }}>
            {totalPopulation.toLocaleString()}
          </span>
        </div>

        {/* Card 3: High Risk Zones */}
        <div className="urbs-card" style={{ padding: "24px", display: "flex", flexDirection: "column", borderLeft: "4px solid #EF4444" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>CRITICAL CRISIS ZONES</span>
          <span style={{ fontSize: "36px", fontWeight: "800", color: "#EF4444", marginTop: "6px" }}>
            {criticalZonesCount}
          </span>
        </div>
      </div>

      {/* Regions Grid */}
      {zones.length === 0 ? (
        <div style={{ padding: "50px", border: "1px dashed rgba(1,65,28,0.2)", borderRadius: "12px", textAlign: "center", color: "#64748B" }}>
          No zone records detected in target query.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {zones.map((zone) => {
            const stat = getRiskStyles(zone.risk_classification);
            return (
              <div
                key={zone.zone_id}
                className="urbs-card"
                onClick={() => onSelectZone(zone)}
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer"
                }}
              >
                {/* Thin top colored bar indicator */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: stat.color }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", fontFamily: "var(--font-mono)" }}>
                      {zone.zone_id}
                    </span>
                    <h2 style={{ fontSize: "19px", fontWeight: "700", margin: "4px 0 0 0", color: "#01411C" }}>
                      {zone.zone_name}
                    </h2>
                  </div>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "0.3px",
                    color: stat.color,
                    backgroundColor: stat.bg,
                    border: `1px solid ${stat.border}`
                  }}>
                    {zone.risk_classification || "STABLE"}
                  </span>
                </div>

                <div style={{ borderTop: "1px solid rgba(1, 65, 28, 0.08)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#64748B", fontWeight: "500" }}>Resident Population</span>
                    <span style={{ fontWeight: "700", color: "#0F172A" }}>
                      {Number(zone.population_count || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Population Density Bar Visual */}
                  <div style={{ height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden", marginTop: "4px" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min((zone.population_count || 0) / 500000 * 100, 100)}%`,
                      background: `linear-gradient(90deg, ${stat.color}, #10B981)`,
                      borderRadius: "3px"
                    }} />
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