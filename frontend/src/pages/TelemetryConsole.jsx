import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Custom SVG Sparkline Trend Chart Renderer
function Sparkline({ history = [] }) {
  if (history.length < 2) {
    return (
      <div style={{ 
        height: "40px", 
        color: "#94A3B8", 
        fontSize: "11px", 
        fontStyle: "italic", 
        marginTop: "15px",
        display: "flex",
        alignItems: "center"
      }}>
        Awaiting telemetry historical trends...
      </div>
    );
  }

  const width = 220;
  const height = 40;

  const minData = Math.min(...history);
  const maxData = Math.max(...history);

  // Add a small buffer around min/max values to fit the trend nicely without flatlining
  const minVal = Math.max(0, minData - 5);
  const maxVal = maxData + 5;
  const range = maxVal - minVal || 10;

  // Map values array to coordinate string points
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  // Path data for the colored fill area under the line
  const pathData = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(" ");

  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div style={{ marginTop: "15px", borderTop: "1px dashed rgba(1, 65, 28, 0.08)", paddingTop: "12px" }}>
      <span style={{ fontSize: "10px", color: "#64748B", fontWeight: "700", display: "block", marginBottom: "6px" }}>WATER LEVEL TREND (LAST 12 CYCLES)</span>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <svg width={width} height={height} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparklineGrad)" />
          <polyline fill="none" stroke="#01411C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
          <circle cx={width} cy={height - ((history[history.length - 1] - minVal) / (maxVal - minVal)) * height} r="4" fill="#01411C" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", fontSize: "9px", color: "#64748B", lineHeight: "1.3" }}>
          <span><strong>Min:</strong> {Math.min(...history).toFixed(1)} cm</span>
          <span><strong>Max:</strong> {Math.max(...history).toFixed(1)} cm</span>
        </div>
      </div>
    </div>
  );
}

export default function TelemetryConsole() {
  const [sensors, setSensors] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States for Compose Panel
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('INFO');
  const [selectedZone, setSelectedZone] = useState('GLOBAL');
  
  // Temporary slider values so the slider moves smoothly without firing requests instantly
  const [tempLevels, setTempLevels] = useState({});

  const refreshTelemetryData = () => {
    axios.get("http://127.0.0.1:8000/api/telemetry-console/")
      .then((res) => {
        const fetchedSensors = res.data?.sensors || [];
        setSensors(fetchedSensors);
        setBroadcasts(res.data?.broadcasts || []);
        
        // Populate temp slider values
        const initialTemp = {};
        fetchedSensors.forEach(s => {
          initialTemp[s.zone_id] = s.telemetry?.water_level_cm || 0;
        });
        setTempLevels(initialTemp);
        setLoading(false);
      })
      .catch((err) => {
        console.error("MongoDB fetch failure, seeding mockup panel:", err);
        // Fallback demo data if DB server is offline
        const mockSensors = [
          { zone_id: "Z003", telemetry: { water_level_cm: 45.8 }, history: [40, 42, 45, 45.8] },
          { zone_id: "Z005", telemetry: { water_level_cm: 184.2 }, history: [160, 175, 180, 184.2] },
          { zone_id: "Z009", telemetry: { water_level_cm: 92.1 }, history: [80, 85, 90, 92.1] }
        ];
        setSensors(mockSensors);
        setTempLevels({ Z003: 45.8, Z005: 184.2, Z009: 92.1 });
        setBroadcasts([
          { timestamp: new Date().toISOString(), zone_id: "Z005", message: "Mock Alert: Heavy rainfall predicted near Walled City.", severity: "WARNING", operator: "admin" }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshTelemetryData();

    // Auto-poll telemetry from MongoDB database every 10 seconds
    const pollInterval = setInterval(() => {
      refreshTelemetryData();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleSliderDrag = (zoneId, val) => {
    setTempLevels(prev => ({
      ...prev,
      [zoneId]: parseFloat(val)
    }));
  };

  const handleUpdateSensorDB = (zoneId, val) => {
    axios.post("http://127.0.0.1:8000/api/telemetry-console/", {
      action: "update_sensor",
      zone_id: zoneId,
      water_level: parseFloat(val)
    })
      .then(() => {
        refreshTelemetryData();
      })
      .catch(() => {
        // Local state fallback if DB is offline
        setSensors(prev => prev.map(s => {
          if (s.zone_id === zoneId) {
            const currentHistory = s.history || [];
            return { 
              ...s, 
              telemetry: { water_level_cm: parseFloat(val) },
              history: [...currentHistory.slice(-11), parseFloat(val)]
            };
          }
          return s;
        }));
      });
  };

  const handlePublishBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    axios.post("http://127.0.0.1:8000/api/telemetry-console/", {
      action: "create_broadcast",
      message: broadcastMsg,
      severity: broadcastSeverity,
      zone_id: selectedZone
    })
      .then(() => {
        setBroadcastMsg('');
        refreshTelemetryData();
      })
      .catch(() => {
        // Local state fallback
        const mockBroadcast = {
          timestamp: new Date().toISOString(),
          zone_id: selectedZone,
          message: broadcastMsg,
          severity: broadcastSeverity,
          operator: "admin"
        };
        setBroadcasts(prev => [mockBroadcast, ...prev]);
        setBroadcastMsg('');
      });
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.06)", border: "rgba(239, 68, 68, 0.2)" };
      case "WARNING":
        return { color: "#D97706", bg: "rgba(217, 119, 6, 0.06)", border: "rgba(217, 119, 6, 0.2)" };
      default: // INFO
        return { color: "#0284C7", bg: "rgba(2, 132, 199, 0.06)", border: "rgba(2, 132, 199, 0.2)" };
    }
  };

  if (loading) {
    return <div style={{ color: "#01411C", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-mono)", padding: "40px" }}>▶ Loading MongoDB real-time telemetry console...</div>;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: "35px", borderBottom: "1px solid rgba(1, 65, 28, 0.12)", paddingBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#01411C", margin: 0, letterSpacing: "-0.8px" }}>
          Live Telemetry & Broadcast Console
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", marginTop: "6px" }}>
          Simulating real-time sensor metrics and broadcasting alerts logged directly to MongoDB.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px", alignItems: "start" }}>
        
        {/* Left Side: Sensor Telemetry Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "700" }}>Active Water Level Sensors</h3>
          
          {sensors.map((sensor) => {
            const currentVal = tempLevels[sensor.zone_id] || 0;
            const isAlarm = currentVal >= 120; // Flag critical height

            return (
              <div 
                key={sensor.zone_id} 
                className="urbs-card" 
                style={{ 
                  padding: "24px",
                  borderLeft: `4px solid ${isAlarm ? "#EF4444" : "#10B981"}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "var(--font-mono)" }}>SENSOR_ID: {sensor.zone_id}_H2O</span>
                    <h4 style={{ fontSize: "18px", color: "#0F172A", margin: "4px 0 0 0" }}>Zone {sensor.zone_id} Sensor</h4>
                  </div>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "800",
                    color: isAlarm ? "#EF4444" : "#10B981",
                    background: isAlarm ? "rgba(239, 68, 68, 0.06)" : "rgba(16, 185, 129, 0.06)",
                    border: `1px solid ${isAlarm ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)"}`
                  }}>
                    {isAlarm ? "CRITICAL OUTFLOW" : "NORMAL DEPTH"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", borderTop: "1px solid rgba(1, 65, 28, 0.08)", paddingTop: "15px" }}>
                  {/* Gauge display */}
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>WATER SENSOR HEIGHT</div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: isAlarm ? "#EF4444" : "#01411C", marginTop: "4px" }}>
                      {currentVal.toFixed(1)} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748B" }}>cm</span>
                    </div>
                  </div>

                  {/* Read-Only Visual Capacity Bar */}
                  <div style={{ display: "flex", flexDirection: "column", justifyHeight: "100%", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748B", marginBottom: "6px" }}>
                      <span>SENSOR CAPACITY UTILIZATION</span>
                      <strong>{Math.round(currentVal / 250 * 100)}%</strong>
                    </div>
                    <div style={{ 
                      width: "100%", 
                      height: "8px", 
                      backgroundColor: "#E2E8F0", 
                      borderRadius: "4px", 
                      overflow: "hidden" 
                    }}>
                      <div style={{ 
                        width: `${Math.min(100, (currentVal / 250 * 100))}%`, 
                        height: "100%", 
                        backgroundColor: isAlarm ? "#EF4444" : "#01411C",
                        transition: "width 0.4s ease-out"
                      }} />
                    </div>
                  </div>
                </div>

                {/* SVG trend history sparkline */}
                <Sparkline history={sensor.history || []} />

              </div>
            );
          })}
        </div>

        {/* Right Side: Emergency Broadcast Center */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Compose Alert Form */}
          <div className="urbs-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "700", marginBottom: "15px", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px" }}>
              Publish Emergency Alert
            </h3>
            <form onSubmit={handlePublishBroadcast} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#64748B", fontWeight: "700" }}>BROADCAST MSG</label>
                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Enter alert notes to broadcast to MongoDB..."
                  style={{ width: "100%", height: "70px", padding: "10px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", outline: "none", marginTop: "4px", resize: "none" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#64748B", fontWeight: "700" }}>SEVERITY LEVEL</label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", marginTop: "4px" }}
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#64748B", fontWeight: "700" }}>TARGET ZONE</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", marginTop: "4px" }}
                  >
                    <option value="GLOBAL">Global Broadcast</option>
                    <option value="Z003">Zone Z003</option>
                    <option value="Z005">Zone Z005</option>
                    <option value="Z009">Zone Z009</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "10px", background: "#01411C", color: "#FFFFFF", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}
              >
                SUBMIT BROADCAST TO MONGODB
              </button>
            </form>
          </div>

          {/* Past Alerts Ledger feed */}
          <div className="urbs-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "14px", color: "#01411C", fontWeight: "700", marginBottom: "15px", borderBottom: "1px solid rgba(1,65,28,0.1)", paddingBottom: "10px" }}>
              MongoDB Emergency Alert Logs
            </h3>
            
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px" }}>
              {broadcasts.length === 0 ? (
                <span style={{ color: "#94A3B8", fontStyle: "italic", fontSize: "12px" }}>No alert broadcasts found in MongoDB.</span>
              ) : (
                broadcasts.map((log, idx) => {
                  const style = getSeverityStyles(log.severity);
                  return (
                    <div key={idx} style={{ padding: "10px", borderRadius: "6px", background: "#F8FAFC", borderLeft: `4px solid ${style.color}`, border: "1px solid #E2E8F0", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#94A3B8" }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: style.color }}>{log.severity}</span>
                      </div>
                      <div style={{ color: "#0F172A", fontWeight: "500" }}>{log.message}</div>
                      <div style={{ fontSize: "9px", color: "#94A3B8", marginTop: "6px", textAlign: "right" }}>
                        Scope: {log.zone_id} • Operator: {log.operator}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}