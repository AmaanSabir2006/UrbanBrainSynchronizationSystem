import { useEffect, useState } from "react";
import axios from "axios";

function FuelSimulation() {
  const [simData, setSimData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/fuel_failure/")
      .then((res) => { setSimData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#01411C", fontWeight: "600", fontFamily: "monospace" }}>▶ Initializing cascading structural simulator components...</div>;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px" }}>
        {/* Header switched from white to high-visibility deep green */}
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#01411C", margin: "0 0 8px 0" }}>What-If Infrastructure Cascade Simulator</h1>
        <p style={{ color: "rgba(1, 65, 28, 0.65)", fontSize: "15px", margin: 0, fontWeight: "500" }}>Evaluating relational dependency risks when key resources cross critical alert metrics.</p>
      </div>

      {/* Main Table Container Wrapper - Transformed to Tactical Light Card */}
      <div style={{ background: "#FFFFFF", border: "2px solid #01411C", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(1, 65, 28, 0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            {/* Header Row background updated to soft tactical green tint with deep green font color */}
            <tr style={{ background: "rgba(1, 65, 28, 0.06)", color: "#01411C", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #01411C" }}>
              <th style={{ padding: "18px 24px" }}>Asset Name</th>
              <th style={{ padding: "18px 24px" }}>Asset Classification</th>
              <th style={{ padding: "18px 24px" }}>Dependency Channel</th>
              <th style={{ padding: "18px 24px" }}>Critical Node Connection</th>
              <th style={{ padding: "18px 24px" }}>Risk Analysis Status</th>
            </tr>
          </thead>
          <tbody>
            {simData.map((row, i) => (
              /* Border lines and primary row font updated for clear reading against white backgrounds */
              <tr key={i} style={{ borderBottom: "1px solid rgba(1, 65, 28, 0.15)", color: "#01411C", fontSize: "14px" }}>
                <td style={{ padding: "18px 24px", fontWeight: "700", color: "#01411C" }}>{row.asset_name}</td>
                <td style={{ padding: "18px 24px", color: "rgba(1, 65, 28, 0.65)", fontWeight: "500" }}>{row.asset_type.replace('_', ' ')}</td>
                <td style={{ padding: "18px 24px", color: "#01411C", fontWeight: "700", fontFamily: "monospace" }}>{row.dependency_type}</td>
                <td style={{ padding: "18px 24px", fontWeight: "500" }}>{row.dependent_on_asset}</td>
                <td style={{ padding: "18px 24px" }}>
                  {/* Calibrated conditional state status colors to safely contrast with light panels */}
                  <span style={{
                    padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "800",
                    background: row.simulation_result === "AT RISK" ? "rgba(211, 47, 47, 0.06)" : "rgba(1, 65, 28, 0.06)",
                    color: row.simulation_result === "AT RISK" ? "#D32F2F" : "#01411C",
                    border: row.simulation_result === "AT RISK" ? "1px solid rgba(211, 47, 47, 0.2)" : "1px solid rgba(1, 65, 28, 0.2)"
                  }}>
                    {row.simulation_result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FuelSimulation;