import { useEffect, useState } from "react";
import axios from "axios";

function DisasterImpact() {
  const [impactLogs, setImpactLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/disaster_impact/")
      .then((res) => { setImpactLogs(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#01411C", fontWeight: "600", fontFamily: "monospace" }}>▶ Analyzing catastrophe impact coordinates...</div>;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px" }}>
        {/* Swapped text header color to crisp high-contrast deep green */}
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#01411C", margin: "0 0 8px 0" }}>Live Critical Disaster Impact Streams</h1>
        <p style={{ color: "rgba(1, 65, 28, 0.65)", fontSize: "15px", margin: 0, fontWeight: "500" }}>Intersecting active emergencies with vulnerable citizen coordinates and core grid configurations.</p>
      </div>

      {impactLogs.length === 0 ? (
        <div style={{ padding: "40px", border: "2px dashed rgba(1, 65, 28, 0.3)", borderRadius: "12px", textAlign: "center", color: "rgba(1, 65, 28, 0.6)", backgroundColor: "#FFFFFF", fontWeight: "500" }}>No active disaster threats detected inside the system matrix.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {impactLogs.map((log, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: "#FFFFFF", // Upgraded to clean tactical white background
                border: "2px solid #01411C", // Unified deep green structural border framing
                borderRadius: "12px", 
                padding: "24px", 
                borderLeft: "6px solid #01411C",
                boxShadow: "0 10px 25px -5px rgba(1, 65, 28, 0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <span style={{ color: "rgba(1, 65, 28, 0.5)", fontSize: "11px", fontWeight: "700", fontFamily: "monospace" }}>EVENT ID: #{log.event_id}</span>
                  <h2 style={{ color: "#01411C", fontSize: "22px", margin: "4px 0 0 0", fontWeight: "800" }}>{log.event_type} — CRISIS SEVERITY LEVEL {log.severity_level}</h2>
                </div>
                <span style={{ color: "#D32F2F", background: "rgba(211, 47, 47, 0.06)", padding: "6px 14px", border: "1px solid rgba(211, 47, 47, 0.2)", borderRadius: "6px", fontSize: "12px", fontWeight: "800" }}>{log.status}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", borderTop: "1px solid rgba(1, 65, 28, 0.15)", paddingTop: "20px" }}>
                <div>
                  <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "12px", fontWeight: "700" }}>TARGET REGION</div>
                  <div style={{ color: "#01411C", fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>{log.zone_name} ({log.zone_id})</div>
                </div>
                <div>
                  <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "12px", fontWeight: "700" }}>TOTAL EXPOSED POPULATION</div>
                  <div style={{ color: "#01411C", fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>{Number(log.total_population).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "12px", fontWeight: "700" }}>HIGH-RISK VULNERABLE CITIZENS</div>
                  {/* Calibrated alert amber for optimal readability against white card panels */}
                  <div style={{ color: "#D97706", fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>{Number(log.elderly_count || 0) + Number(log.mobility_impaired_count || 0)}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "12px", fontWeight: "700" }}>INFRASTRUCTURE NODES IN PERIL</div>
                  {/* High contrast dark blue for dynamic graph elements */}
                  <div style={{ color: "#1D4ED8", fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>{log.assets_at_risk} Nodes</div>
                </div>
                <div>
                  <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "12px", fontWeight: "700" }}>EVACUATION PROTOCOL</div>
                  <div style={{ color: log.evacuation_status === "STUCK" ? "#D32F2F" : "#15803D", fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>{log.evacuation_status}</div>
                </div>
                {log.current_water_level_cm > 0 && (
                  <div>
                    <div style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "12px", fontWeight: "700" }}>WATER HEIGHT LEVEL</div>
                    <div style={{ color: "#1D4ED8", fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>{log.current_water_level_cm} cm</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DisasterImpact;