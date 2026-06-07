import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ZoneDetails({ zone, onBack }) {
  const [assets, setAssets] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Asset Filter Tab State
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    Promise.all([
      axios.get("http://127.0.0.1:8000/api/assets_graph/"),
      axios.get("http://127.0.0.1:8000/api/disaster_impact/")
    ])
      .then(([assetsRes, disastersRes]) => {
        // Filter assets belonging to this zone
        const allNodes = assetsRes.data?.nodes || [];
        const zoneAssets = allNodes.filter(node => 
          node.data?.zone?.toLowerCase() === zone.zone_name?.toLowerCase() ||
          node.data?.zone?.toLowerCase() === zone.zone_id?.toLowerCase()
        );
        setAssets(zoneAssets);

        // Filter disasters affecting this zone
        const activeDisasters = disastersRes.data || [];
        const zoneDisasters = activeDisasters.filter(d => 
          d.zone_id === zone.zone_id
        );
        setDisasters(zoneDisasters);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching details:", err);
        setError("Failed to synchronize zone database records.");
        setLoading(false);
      });
  }, [zone]);

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "OPERATIONAL":
        return { color: "#10B981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.2)", bar: "#10B981" };
      case "DEGRADED":
      case "MAINTENANCE":
        return { color: "#D97706", bg: "rgba(217, 119, 6, 0.06)", border: "rgba(217, 119, 6, 0.2)", bar: "#D97706" };
      default: // OFFLINE
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.06)", border: "rgba(239, 68, 68, 0.2)", bar: "#EF4444" };
    }
  };

  const getRiskStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.06)", border: "rgba(239, 68, 68, 0.2)", dot: "#EF4444" };
      case "medium":
        return { color: "#D97706", bg: "rgba(217, 119, 6, 0.06)", border: "rgba(217, 119, 6, 0.2)", dot: "#D97706" };
      default:
        return { color: "#10B981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.2)", dot: "#10B981" };
    }
  };

  const riskStyle = getRiskStyles(zone.risk_classification);

  // Filter assets locally based on user selection tab
  const filteredAssets = assets.filter(asset => {
    if (activeTab === 'ALL') return true;
    const type = asset.data?.asset_type?.toUpperCase() || '';
    if (activeTab === 'POWER') return type.includes('POWER') || type.includes('GRID');
    if (activeTab === 'WATER') return type.includes('WATER') || type.includes('PLANT');
    return !type.includes('POWER') && !type.includes('GRID') && !type.includes('WATER') && !type.includes('PLANT');
  });

  // Calculate demographics (fallback ratio if no active disaster data)
  const isDisaster = disasters.length > 0;
  const elderlyCount = isDisaster ? disasters[0].elderly_count : Math.round(zone.population_count * 0.08);
  const mobilityCount = isDisaster ? disasters[0].mobility_impaired_count : Math.round(zone.population_count * 0.03);

  if (loading) {
    return <div style={{ color: "#01411C", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-mono)", padding: "40px" }}>▶ Synchronizing sector telemetry...</div>;
  }

  if (error) {
    return <div style={{ color: "#EF4444", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-mono)", padding: "40px" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", fontFamily: "var(--font-body)" }}>
      
      {/* Sleek Breadcrumb / Back Navigation Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <button 
          onClick={onBack}
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(1, 65, 28, 0.12)",
            color: "#01411C",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            borderRadius: "6px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = "#01411C"; }}
          onMouseLeave={(e) => { e.target.style.borderColor = "rgba(1, 65, 28, 0.12)"; }}
        >
          ← Back to Monitor Grid
        </button>
        <span style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#64748B", fontWeight: "700", fontFamily: "var(--font-mono)" }}>
          SYSTEM // ZONES / DETAIL / {zone.zone_id}
        </span>
      </div>

      {/* Main Header Presentation */}
      <div style={{ marginBottom: "35px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#01411C", letterSpacing: "-0.8px", margin: 0 }}>
          {zone.zone_name} Sector Profile
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", marginTop: "6px" }}>
          Consolidated structural asset mapping and real-time operational diagnostics.
        </p>
      </div>

      {/* Three-Column Horizontal Metrics Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "35px" }}>
        <div className="urbs-card" style={{ padding: "20px", borderLeft: "4px solid #01411C" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>TOTAL RESIDENT BASE</span>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#01411C", marginTop: "4px" }}>
            {Number(zone.population_count || 0).toLocaleString()}
          </div>
        </div>
        
        <div className="urbs-card" style={{ padding: "20px", borderLeft: `4px solid ${riskStyle.color}` }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>SECTOR RISK BOUNDARY</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            <span style={{ width: "8px", height: "8px", background: riskStyle.dot, borderRadius: "50%" }} />
            <span style={{ fontSize: "22px", fontWeight: "800", color: riskStyle.color, textTransform: "uppercase" }}>
              {zone.risk_classification || "LOW"}
            </span>
          </div>
        </div>

        <div className="urbs-card" style={{ padding: "20px", borderLeft: "4px solid #06B6D4" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>ASSETS DEPLOYED</span>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#06B6D4", marginTop: "4px" }}>
            {assets.length} <span style={{ fontSize: "14px", color: "#64748B", fontWeight: "500" }}>Grid Components</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout Block */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", alignItems: "start" }}>
        
        {/* Left Side: Demographic Care & Active Disasters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Demographic Care Monitor */}
          <div className="urbs-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "700", marginBottom: "20px", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px" }}>
              Vulnerable Citizens Index
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Elderly Care Support</span>
                  <span style={{ fontWeight: "700", color: "#0F172A" }}>{elderlyCount.toLocaleString()} Citizens</span>
                </div>
                <div style={{ height: "4px", background: "#E2E8F0", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${(elderlyCount / zone.population_count) * 100}%`, background: "#D97706", borderRadius: "2px" }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Mobility Impaired Services</span>
                  <span style={{ fontWeight: "700", color: "#0F172A" }}>{mobilityCount.toLocaleString()} Citizens</span>
                </div>
                <div style={{ height: "4px", background: "#E2E8F0", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${(mobilityCount / zone.population_count) * 100}%`, background: "#EF4444", borderRadius: "2px" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Active Emergency Broadcast Center */}
          <div className="urbs-card" style={{ 
            padding: "24px", 
            background: isDisaster ? "rgba(239, 68, 68, 0.02)" : "#FFFFFF",
            borderLeft: isDisaster ? "4px solid #EF4444" : "4px solid #10B981"
          }}>
            <h3 style={{ fontSize: "16px", color: isDisaster ? "#EF4444" : "#01411C", fontWeight: "700", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              {isDisaster && <span style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%", display: "inline-block", animation: "pulse-cyan 1.5s infinite" }} />}
              Active Operations Center
            </h3>
            
            {!isDisaster ? (
              <div style={{ fontSize: "14px", color: "#10B981", fontWeight: "600" }}>
                ✓ No active disaster vectors affecting this region.
              </div>
            ) : (
              disasters.map((d, index) => (
                <div key={index} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "6px", padding: "12px 16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#EF4444", fontFamily: "var(--font-mono)" }}>CRITICAL OPERATIONAL RISK ALERT</div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#EF4444", marginTop: "4px" }}>{d.event_type} - LEVEL {d.severity_level}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", borderTop: "1px dashed rgba(239,68,68,0.15)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Evacuation Status:</span>
                      <strong style={{ color: "#EF4444" }}>{d.evacuation_status}</strong>
                    </div>
                    {d.current_water_level_cm > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Water Height:</span>
                        <strong style={{ color: "#0F172A" }}>{d.current_water_level_cm} cm</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Assets Directory Grid with Tab Filters */}
        <div className="urbs-card" style={{ padding: "24px" }}>
          
          {/* Header & Tab Selector Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid #E2E8F0", paddingBottom: "15px" }}>
            <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "700", margin: 0 }}>
              Sector Infrastructure Inventory
            </h3>
            
            <div style={{ display: "flex", gap: "6px" }}>
              {['ALL', 'POWER', 'WATER', 'OTHER'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? "#01411C" : "transparent",
                    color: activeTab === tab ? "#FFFFFF" : "#64748B",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Infrastructure Grid */}
          {filteredAssets.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
              No infrastructure components found matching this filter category.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {filteredAssets.map((asset) => {
                const status = getStatusStyle(asset.data?.status);
                
                // Capacity safety parsing
                const max = asset.data?.max_capacity || 10000;
                const current = asset.data?.capacity || 0;
                const capPercent = Math.min((current / max) * 100, 100);

                return (
                  <div 
                    key={asset.id} 
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      position: "relative",
                      overflow: "hidden",
                      padding: "16px 16px 16px 20px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
                    }}
                  >
                    {/* Status side bar strip */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: status.bar }} />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#64748B", fontWeight: "700" }}>{asset.id}</span>
                        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "2px 0 0 0" }}>{asset.data?.label}</h4>
                      </div>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "9px",
                        fontWeight: "800",
                        color: status.color,
                        backgroundColor: status.bg,
                        border: `1px solid ${status.border}`
                      }}>
                        {asset.data?.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>
                      <span>Classification:</span>
                      <strong style={{ color: "#0F172A" }}>{asset.data?.asset_type?.replace('_', ' ')}</strong>
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: "10px", marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>
                        <span>Capacity Utilized</span>
                        <strong>{current.toLocaleString()} / {max.toLocaleString()} Units</strong>
                      </div>
                      <div style={{ height: "4px", background: "#F1F5F9", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${capPercent}%`, background: status.bar, borderRadius: "2px" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}