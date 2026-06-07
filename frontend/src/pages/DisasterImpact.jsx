import { useEffect, useState } from "react";
import axios from "axios";

function DisasterImpact() {
  const [impactLogs, setImpactLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/disaster_impact/")
      .then((res) => { 
        setImpactLogs(res.data); 
        setLoading(false); 
      })
      .catch((err) => {
        console.error("Failed to load active disaster telemetry:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: "#01411C", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-mono)", padding: "40px" }}>▶ Analyzing catastrophe impact coordinates...</div>;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: "35px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#01411C", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
          Live Critical Disaster Impact Streams
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", margin: 0, fontWeight: "500" }}>
          Intersecting active emergencies with real-time MongoDB telemetry and PG-SQL structural schemas.
        </p>
      </div>

      {impactLogs.length === 0 ? (
        <div style={{ padding: "50px", border: "1px dashed rgba(1, 65, 28, 0.2)", borderRadius: "12px", textAlign: "center", color: "#64748B", backgroundColor: "#FFFFFF", fontWeight: "500" }}>
          ✓ No active disaster threats detected inside the system matrix.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {impactLogs.map((log, index) => {
            // Calculate dynamic relief capital estimate
            const requiredCapital = (log.total_population * 150) + (log.severity_level * 2000000);

            return (
              <div 
                key={index} 
                className="urbs-card"
                style={{ 
                  padding: "26px", 
                  borderLeft: "6px solid #EF4444"
                }}
              >
                {/* Top Title Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", fontFamily: "var(--font-mono)" }}>
                      EVENT ID: #{log.event_id}
                    </span>
                    <h2 style={{ color: "#0F172A", fontSize: "20px", margin: "4px 0 0 0", fontWeight: "800" }}>
                      {log.event_type} — CRISIS SEVERITY LEVEL {log.severity_level}
                    </h2>
                  </div>
                  <span style={{ color: "#EF4444", background: "rgba(239, 68, 68, 0.06)", padding: "6px 14px", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "6px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {log.status}
                  </span>
                </div>

                {/* Technical Grid Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", borderTop: "1px solid rgba(1, 65, 28, 0.08)", paddingTop: "20px", marginBottom: "20px" }}>
                  <div>
                    <div style={{ color: "#64748B", fontSize: "11px", fontWeight: "700" }}>TARGET REGION</div>
                    <div style={{ color: "#01411C", fontSize: "15px", fontWeight: "700", marginTop: "4px" }}>{log.zone_name} ({log.zone_id})</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: "11px", fontWeight: "700" }}>EXPOSED POPULATION</div>
                    <div style={{ color: "#0F172A", fontSize: "15px", fontWeight: "700", marginTop: "4px" }}>{Number(log.total_population).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: "11px", fontWeight: "700" }}>HIGH-RISK CITIZENS</div>
                    <div style={{ color: "#D97706", fontSize: "15px", fontWeight: "700", marginTop: "4px" }}>
                      {Number(log.elderly_count || 0) + Number(log.mobility_impaired_count || 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: "11px", fontWeight: "700" }}>UTILITY NODES IN PERIL</div>
                    <div style={{ color: "#06B6D4", fontSize: "15px", fontWeight: "700", marginTop: "4px" }}>{log.assets_at_risk} Nodes</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: "11px", fontWeight: "700" }}>EVACUATION PROTOCOL</div>
                    <div style={{ color: log.evacuation_status === "STUCK" ? "#EF4444" : "#10B981", fontSize: "15px", fontWeight: "700", marginTop: "4px" }}>
                      {log.evacuation_status}
                    </div>
                  </div>
                  {log.current_water_level_cm > 0 && (
                    <div>
                      <div style={{ color: "#64748B", fontSize: "11px", fontWeight: "700" }}>TELEMETRY WATER LEVEL</div>
                      <div style={{ color: "#3B82F6", fontSize: "15px", fontWeight: "700", marginTop: "4px" }}>{log.current_water_level_cm} cm</div>
                    </div>
                  )}
                </div>

                {/* Bottom Budget Projection Ribbon */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  borderTop: "1px dashed #E2E8F0", 
                  paddingTop: "20px" 
                }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "700" }}>RELIEF BUDGET ESTIMATE</div>
                    <strong style={{ color: "#D97706", fontSize: "18px", fontFamily: "var(--font-mono)" }}>
                      PKR {requiredCapital.toLocaleString()}
                    </strong>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", fontStyle: "italic", background: "#F1F5F9", padding: "6px 12px", borderRadius: "4px" }}>
                    Authorize Funding on Allocation Tab
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DisasterImpact;