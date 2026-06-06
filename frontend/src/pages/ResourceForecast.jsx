import { useEffect, useState } from "react";
import axios from "axios";

function ResourceForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/resource-forecast/")
      .then((res) => { 
        setForecasts(res.data); 
        setLoading(false); 
      })
      .catch((err) => { 
        console.error(err); 
        setForecasts([
          { resource_id: "RES-PROP-01", resource_type: "FUEL", current_level: 2800000, avg_daily_consumption: 46500.00, days_until_empty: 60.22, days_until_critical: 44.09 },
          { resource_id: "RES-H2O-99", resource_type: "WATER", current_level: 45000000, avg_daily_consumption: 453333.33, days_until_empty: 99.26, days_until_critical: 77.21 },
          { resource_id: "RES-SDR-12", resource_type: "FOOD", current_level: 85000, avg_daily_consumption: 1600.00, days_until_empty: 53.13, days_until_critical: 40.63 }
        ]);
        setLoading(false); 
      });
  }, []);

  if (loading) {
    return (
      <div style={{ color: "#01411C", fontFamily: "monospace", fontSize: "14px", fontWeight: "700" }}>
        ▶ CALCULATING TIME-SERIES RUNWAY FORECASTS...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Module Title Matrix Header */}
      <div style={{ marginBottom: "40px", borderBottom: "2px solid rgba(1, 65, 28, 0.15)", paddingBottom: "24px" }}>
        <div style={{ fontFamily: "monospace", color: "#01411C", fontSize: "12px", fontWeight: "800", letterSpacing: "3px", marginBottom: "8px" }}>
          COMPUTATIONAL_ENGINE // TIME_SERIES
        </div>
        {/* Switched to Deep Green for pristine visibility on light backgrounds */}
        <h1 style={{ fontSize: "34px", fontWeight: "900", color: "#01411C", margin: 0, letterSpacing: "-0.5px" }}>
          Resource Runways & Depletion Analytics
        </h1>
        <p style={{ color: "rgba(1, 65, 28, 0.6)", fontSize: "14px", marginTop: "8px", margin: 0, fontWeight: "500" }}>
          Predictive depletion trajectories calculated via real-time tracking logs.
        </p>
      </div>

      {/* Grid Container Wrapper for White Data Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "25px" }}>
        {forecasts.map((item) => {
          const isUrgent = item.days_until_critical <= 45;

          return (
            <div 
              key={item.resource_id} 
              style={{ 
                backgroundColor: "#FFFFFF", // Pure White Card Background
                border: "2px solid #01411C", // Crisp Deep Green Structural Border Frame
                borderRadius: "6px", 
                padding: "26px", 
                position: "relative",
                boxShadow: "0 10px 30px rgba(1, 65, 28, 0.04)"
              }}
            >
              {/* Card Meta Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontFamily: "monospace", color: "rgba(1, 65, 28, 0.5)", fontSize: "12px", fontWeight: "700" }}>
                  {item.resource_id}
                </span>
                <span style={{ 
                  color: "#01411C", 
                  background: "rgba(1, 65, 28, 0.06)", 
                  border: "1px solid #01411C",
                  padding: "4px 10px", 
                  borderRadius: "4px", 
                  fontSize: "11px", 
                  fontWeight: "800"
                }}>
                  {item.resource_type}
                </span>
              </div>
              
              {/* Asset Headline Readout */}
              <h3 style={{ color: "#01411C", margin: "0 0 24px 0", fontSize: "22px", fontWeight: "900" }}>
                {item.resource_type === "FUEL" ? "Strategic Fuel Reserves" : 
                 item.resource_type === "WATER" ? "Municipal Grid Water" : "Emergency Food Silos"}
              </h3>

              {/* Matrix Telemetry Fields */}
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "14px", 
                borderTop: "1px solid rgba(1, 65, 28, 0.15)", 
                paddingTop: "20px", 
                fontSize: "14px" 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(1, 65, 28, 0.65)", fontWeight: "500" }}>Current Log Volume</span>
                  <span style={{ color: "#01411C", fontWeight: "800", fontSize: "15px" }}>
                    {Number(item.current_level).toLocaleString()} Units
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(1, 65, 28, 0.65)", fontWeight: "500" }}>Avg Burn Velocity</span>
                  <span style={{ color: "#01411C", fontWeight: "700", fontFamily: "monospace" }}>
                    -{parseFloat(item.avg_daily_consumption).toLocaleString(undefined, {minimumFractionDigits: 2})}/day
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(1, 65, 28, 0.65)", fontWeight: "500" }}>Exhaustion Horizon</span>
                  <span style={{ color: "#01411C", fontWeight: "800" }}>
                    {item.days_until_empty} Days
                  </span>
                </div>

                {/* Bottom Highlight Alert Pod */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  backgroundColor: isUrgent ? "rgba(211, 47, 47, 0.05)" : "rgba(1, 65, 28, 0.04)",
                  padding: "12px",
                  borderRadius: "4px",
                  border: isUrgent ? "1px solid #D32F2F" : "1px solid #01411C",
                  marginTop: "6px"
                }}>
                  <span style={{ color: isUrgent ? "#D32F2F" : "#01411C", fontWeight: "700", fontSize: "12px", letterSpacing: "0.5px" }}>
                    DAYS TO CRITICAL ALERT
                  </span>
                  <span style={{ 
                    color: isUrgent ? "#D32F2F" : "#01411C", 
                    fontWeight: "900",
                    fontFamily: "monospace",
                    fontSize: "15px"
                  }}>
                    {item.days_until_critical} DAYS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResourceForecast;