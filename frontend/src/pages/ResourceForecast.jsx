import { useEffect, useState } from "react";
import axios from "axios";

function ResourceForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulator multipliers mapped by resource_id
  const [multipliers, setMultipliers] = useState({});

  // Fetch forecasts and persistent refill logs from the backend databases
  const refreshDashboardData = () => {
    Promise.all([
      axios.get("http://127.0.0.1:8000/api/resource-forecast/"),
      axios.get("http://127.0.0.1:8000/api/resource-refill/")
    ])
      .then(([forecastRes, logsRes]) => {
        setForecasts(forecastRes.data);
        setSystemLogs(logsRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("DB Fetch error, falling back to mock environment:", err);
        // Fallback mockup data if the local DB server or virtual environment is offline
        setForecasts([
          { resource_id: "RES-FUEL-01", resource_type: "FUEL", current_level: 2800000, max_capacity: 4000000, critical_threshold: 800000, avg_daily_consumption: 46500.00, days_until_empty: 60.22, days_until_critical: 44.09 },
          { resource_id: "RES-H2O-99", resource_type: "WATER", current_level: 45000000, max_capacity: 60000000, critical_threshold: 10000000, avg_daily_consumption: 453333.33, days_until_empty: 99.26, days_until_critical: 77.21 },
          { resource_id: "RES-FOOD-12", resource_type: "FOOD", current_level: 85000, max_capacity: 150000, critical_threshold: 20000, avg_daily_consumption: 1600.00, days_until_empty: 53.13, days_until_critical: 40.63 },
          { resource_id: "RES-MED-04", resource_type: "MEDICAL", current_level: 12000, max_capacity: 30000, critical_threshold: 5000, avg_daily_consumption: 450.00, days_until_empty: 26.67, days_until_critical: 15.56 }
        ]);
        setSystemLogs([
          { refill_id: 1, resource_id: "RES-MED-04", resource_type: "MEDICAL", refill_date: new Date().toISOString(), refill_amount: 18000, refill_cost: 150000, operator_notes: "Mocked Refill Session Log Entry" }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshDashboardData();
  }, []);

  const handleMultiplierChange = (resId, val) => {
    setMultipliers(prev => ({
      ...prev,
      [resId]: val
    }));
  };

  const handleInitiateRefill = (resId, resourceType, maxCap, currentLevel) => {
    const refillVolume = maxCap - currentLevel;
    
    // Estimate cost dynamically based on item types (price per unit)
    let unitPrice = 0.5;
    if (resourceType === "FUEL") unitPrice = 1.8;
    else if (resourceType === "WATER") unitPrice = 0.05;
    else if (resourceType === "MEDICAL") unitPrice = 120.0;

    const estimatedCost = refillVolume * unitPrice;

    axios.post("http://127.0.0.1:8000/api/resource-refill/", {
      resource_id: resId,
      refill_amount: refillVolume,
      refill_cost: estimatedCost,
      operator_notes: `Emergency replenishment of ${resourceType}.`
    })
      .then(() => {
        // Reset local simulation slider to 1.0x on refill
        setMultipliers(prev => ({ ...prev, [resId]: 1.0 }));
        
        // Force refresh from PostgreSQL database
        refreshDashboardData();
      })
      .catch((err) => {
        console.error("Failed to execute database transaction:", err);
        alert("Replenishment transaction failed. Retrying local simulations...");
        
        // Local UI state fallback refill to keep simulator working without DB
        setForecasts(prevForecasts => 
          prevForecasts.map(item => {
            if (item.resource_id === resId) {
              const cleanEmpty = Math.round(maxCap / item.avg_daily_consumption * 100) / 100;
              const cleanCritical = Math.round((maxCap - item.critical_threshold) / item.avg_daily_consumption * 100) / 100;
              return {
                ...item,
                current_level: maxCap,
                days_until_empty: cleanEmpty,
                days_until_critical: cleanCritical
              };
            }
            return item;
          })
        );
        setMultipliers(prev => ({ ...prev, [resId]: 1.0 }));
      });
  };

  const getResourceLabel = (type) => {
    switch (type?.toUpperCase()) {
      case "FUEL":
        return "Strategic Fuel Reserve";
      case "WATER":
        return "Municipal Grid Water";
      case "FOOD":
        return "Emergency Food Depot";
      case "MEDICAL":
        return "Medical Supplies Depot";
      default:
        return `${type} Supply Depot`;
    }
  };

  if (loading) {
    return (
      <div style={{ color: "#01411C", fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "700", padding: "40px" }}>
        ▶ RUNNING RUN-RATE PROJECTION MODELS...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: "35px", borderBottom: "1px solid rgba(1, 65, 28, 0.12)", paddingBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#01411C", margin: 0, letterSpacing: "-0.8px" }}>
          Resource Runway & Depletion Analytics
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", marginTop: "6px" }}>
          What-if simulation modeling depletion trajectories based on current operational consumption velocities.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "30px", alignItems: "start" }}>
        
        {/* Left Side: Cards Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {forecasts.map((item) => {
            const mult = multipliers[item.resource_id] || 1.0;
            
            // Recompute values based on simulator slider multiplier
            const simulatedBurn = item.avg_daily_consumption * mult;
            const simulatedEmpty = Math.round((item.current_level / simulatedBurn) * 100) / 100;
            const simulatedCritical = Math.round(((item.current_level - item.critical_threshold) / simulatedBurn) * 100) / 100;

            const isUrgent = simulatedCritical <= 30;
            const isWarning = simulatedCritical > 30 && simulatedCritical <= 60;
            
            let statusColor = "#10B981"; // Safe Green
            let statusLabel = "RUNWAY HEALTHY";
            if (isUrgent) {
              statusColor = "#EF4444"; // Urgent Red
              statusLabel = "CRITICAL HORIZON ALERT";
            } else if (isWarning) {
              statusColor = "#D97706"; // Warning Orange
              statusLabel = "WARNING RUNWAY LIMIT";
            }

            // Fallback max capacity if not supplied by database schema
            const maxCapacity = item.max_capacity || item.current_level * 1.5;
            
            // Calculate Required Refill Capital based on current volume deficit
            const volumeNeeded = maxCapacity - item.current_level;
            let unitPrice = 0.5;
            if (item.resource_type === "FUEL") unitPrice = 1.8;
            else if (item.resource_type === "WATER") unitPrice = 0.05;
            else if (item.resource_type === "MEDICAL") unitPrice = 120.0;
            const requiredRefillCapital = volumeNeeded * unitPrice;

            return (
              <div 
                key={item.resource_id} 
                className="urbs-card"
                style={{ 
                  padding: "26px", 
                  position: "relative",
                  borderLeft: `4px solid ${statusColor}`
                }}
              >
                {/* Top Meta Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#64748B", fontSize: "12px", fontWeight: "700" }}>
                    {item.resource_id}
                  </span>
                  <span style={{ 
                    color: statusColor, 
                    background: `${statusColor}0D`, 
                    border: `1px solid ${statusColor}40`,
                    padding: "3px 8px", 
                    borderRadius: "4px", 
                    fontSize: "10px", 
                    fontWeight: "800"
                  }}>
                    {statusLabel}
                  </span>
                </div>
                
                {/* Dynamic Title */}
                <h3 style={{ color: "#01411C", margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800" }}>
                  {getResourceLabel(item.resource_type)}
                </h3>

                {/* Sub layout: 2 Columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px", borderTop: "1px solid rgba(1, 65, 28, 0.08)", paddingTop: "20px" }}>
                  
                  {/* Left Column: Readouts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Current Level Volume:</span>
                      <strong style={{ color: "#0F172A" }}>{Number(item.current_level).toLocaleString()} Units</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Burn Velocity:</span>
                      <strong style={{ color: "#EF4444", fontFamily: "var(--font-mono)" }}>
                        -{parseFloat(simulatedBurn).toLocaleString(undefined, {minimumFractionDigits: 1})} / day
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Exhaustion Horizon:</span>
                      <strong style={{ color: "#0F172A" }}>{simulatedEmpty} Days</strong>
                    </div>
                    
                    {/* Required Refill Capital Indicator */}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Required Refill Capital:</span>
                      <strong style={{ color: "#D97706" }}>
                        PKR {Math.round(requiredRefillCapital).toLocaleString()}
                      </strong>
                    </div>
                    
                    {/* Days to Critical Alert Pod */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      backgroundColor: `${statusColor}0A`,
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: `1px solid ${statusColor}1A`,
                      marginTop: "6px"
                    }}>
                      <span style={{ color: statusColor, fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px" }}>
                        DAYS TO CRITICAL ALERT
                      </span>
                      <span style={{ color: statusColor, fontWeight: "900", fontSize: "15px" }}>
                        {simulatedCritical} Days
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Simulator Sliders & Dispatch Actions */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "1px solid rgba(1, 65, 28, 0.08)", paddingLeft: "30px" }}>
                    
                    {/* What-If Slider Control */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", color: "#01411C", marginBottom: "8px", letterSpacing: "0.5px" }}>
                        <span>WHAT-IF SCENARIO MULTIPLIER</span>
                        <span style={{ color: mult > 1.0 ? "#D97706" : "#10B981" }}>{mult.toFixed(1)}x Burn Rate</span>
                      </div>
                      <input 
                        type="range" 
                        min="1.0" 
                        max="3.0" 
                        step="0.1" 
                        value={mult} 
                        onChange={(e) => handleMultiplierChange(item.resource_id, parseFloat(e.target.value))}
                        style={{ 
                          width: "100%", 
                          accentColor: "#01411C",
                          cursor: "ew-resize"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#64748B", marginTop: "4px" }}>
                        <span>1.0x Normal</span>
                        <span>2.0x High</span>
                        <span>3.0x Extreme</span>
                      </div>
                    </div>

                    {/* Replenish dispatch button */}
                    {isUrgent ? (
                      <button
                        onClick={() => handleInitiateRefill(item.resource_id, item.resource_type, maxCapacity, item.current_level)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: "#EF4444",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          cursor: "pointer",
                          marginTop: "20px",
                          boxShadow: "0 0 12px rgba(239, 68, 68, 0.25)"
                        }}
                      >
                        🚨 DISPATCH EMERGENCY REFILL
                      </button>
                    ) : isWarning ? (
                      <button
                        onClick={() => handleInitiateRefill(item.resource_id, item.resource_type, maxCapacity, item.current_level)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: "transparent",
                          color: "#D97706",
                          border: "1px solid #D97706",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          letterSpacing: "0.5px",
                          cursor: "pointer",
                          marginTop: "20px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => { e.target.style.background = "rgba(217, 119, 6, 0.05)"; }}
                        onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                      >
                        Initiate Buffer Replenish
                      </button>
                    ) : null}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Persistent Database Refill Log Console */}
        <div className="urbs-card" style={{ padding: "20px", background: "#FFFFFF", minHeight: "350px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "14px", color: "#01411C", fontWeight: "700", marginBottom: "15px", borderBottom: "1px solid rgba(1,65,28,0.1)", paddingBottom: "10px" }}>
            Refill Transaction Ledger
          </h3>
          
          <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "#64748B", maxHeight: "450px" }}>
            {systemLogs.length === 0 ? (
              <span style={{ color: "#94A3B8", fontStyle: "italic" }}>No refill operations logged in PostgreSQL database.</span>
            ) : (
              systemLogs.map((log) => (
                <div key={log.refill_id} style={{ padding: "10px", borderRadius: "6px", background: "#F8FAFC", borderLeft: "3px solid #10B981", lineHeight: "1.4", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "9px", color: "#94A3B8", marginBottom: "4px" }}>
                    {new Date(log.refill_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <strong style={{ color: "#0F172A" }}>{log.resource_id} ({getResourceLabel(log.resource_type)})</strong>
                  <div style={{ marginTop: "4px" }}>Volume Filled: <span style={{ color: "#10B981", fontWeight: "bold" }}>+{Number(log.refill_amount).toLocaleString()}</span> Units</div>
                  <div style={{ color: "#01411C", fontWeight: "700" }}>Refill Cost: PKR {Math.round(log.refill_cost).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ResourceForecast;