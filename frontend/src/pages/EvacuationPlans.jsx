import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

export default function EvacuationPlans() {
  const [activeEvents, setActiveEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [historicalPlans, setHistoricalPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', isError: false });

  // Neo4j Graph States
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [activePathNodeIds, setActivePathNodeIds] = useState([]);
  const [activePathLinkSignatures, setActivePathLinkSignatures] = useState([]);
  const [affectedZoneIds, setAffectedZoneIds] = useState([]);
  const [targetZoneIds, setTargetZoneIds] = useState([]);

  // Responsive graph width tracking
  const [graphWidth, setGraphWidth] = useState(600);
  const graphContainerRef = useRef(null);

  const loadInitialData = () => {
    // Fetch active emergencies from PostgreSQL
    axios.get("http://127.0.0.1:8000/api/active-events/")
      .then(res => setActiveEvents(res.data))
      .catch(err => console.error("Failed to load active disaster events:", err));

    // Fetch previously cached plans
    axios.get("http://127.0.0.1:8000/api/evacuation-plans/")
      .then(res => setHistoricalPlans(res.data))
      .catch(err => console.error("Failed to load cached evacuation plans:", err));

    // Fetch live Neo4j zone grid map
    axios.get("http://127.0.0.1:8000/api/zones_graph/")
      .then(res => setGraphData(res.data))
      .catch(err => console.error("Failed to load Neo4j zone network graph:", err));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate graph dimensions dynamically when container sizes shift
  useEffect(() => {
    if (graphContainerRef.current) {
      setGraphWidth(graphContainerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (graphContainerRef.current) {
        setGraphWidth(graphContainerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [graphData]);

  // Track active routes and paint styles on the graph when a simulation result arrives
  useEffect(() => {
    if (simulationResult && simulationResult.evacuation_routes) {
      const routes = simulationResult.evacuation_routes;
      
      // 1. Gather all nodes lying along any of the active shortest paths
      const pathNodeIds = routes.map(r => r.path).flat();
      setActivePathNodeIds(pathNodeIds);

      // 2. Build directional link signatures ("SourceNode->TargetNode") to match graph edges
      const linkSigs = [];
      routes.forEach(route => {
        for (let i = 0; i < route.path.length - 1; i++) {
          const u = route.path[i];
          const v = route.path[i + 1];
          linkSigs.push(`${u}->${v}`);
          linkSigs.push(`${v}->${u}`); // Safe bidirectional matching
        }
      });
      setActivePathLinkSignatures(linkSigs);

      // 3. Keep track of affected origins and safe destinations
      setAffectedZoneIds(simulationResult.disaster_profile?.affected_zones || []);
      setTargetZoneIds(routes.map(r => r.target_zone));
    } else {
      setActivePathNodeIds([]);
      setActivePathLinkSignatures([]);
      setAffectedZoneIds([]);
      setTargetZoneIds([]);
    }
  }, [simulationResult]);

  const handleGeneratePlan = (e) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setLoading(true);
    setSimulationResult(null);
    setAlertMsg({ text: '', isError: false });

    axios.post("http://127.0.0.1:8000/api/evacuation-plans/generate/", { event_id: selectedEventId })
      .then((res) => {
        setSimulationResult(res.data);
        setAlertMsg({ text: "✓ Evacuation transaction processed successfully. Plan cached to PostgreSQL.", isError: false });
        loadInitialData(); // Refresh history table
      })
      .catch((err) => {
        setAlertMsg({ text: err.response?.data?.error || "Handshake timeout during pathfinding.", isError: true });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Check if a link is part of the highlighted route path
  const isLinkInActiveRoute = (link) => {
    if (activePathLinkSignatures.length === 0) return false;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return activePathLinkSignatures.includes(`${sourceId}->${targetId}`);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "35px", borderBottom: "1px solid rgba(1, 65, 28, 0.12)", paddingBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#01411C", margin: 0, letterSpacing: "-0.8px" }}>
          Evacuation Protocol & Command Brain
        </h1>
      </div>

      {alertMsg.text && (
        <div style={{
          marginBottom: "25px",
          padding: "14px 18px",
          borderRadius: "8px",
          backgroundColor: alertMsg.isError ? "rgba(239, 68, 68, 0.06)" : "rgba(16, 185, 129, 0.06)",
          color: alertMsg.isError ? "#B91C1C" : "#065F46",
          border: `1px solid ${alertMsg.isError ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)"}`,
          fontSize: "13px",
          fontWeight: "600"
        }}>
          {alertMsg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "30px", alignItems: "start" }}>
        
        {/* Left Side: Simulation Trigger Form, Live Map & Active Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Generator Form */}
          <div className="urbs-card" style={{ padding: "24px", backgroundColor: "#FFFFFF", border: "1px solid rgba(1,65,28,0.08)", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "800", margin: "0 0 15px 0" }}>Generate Evacuation Plan</h3>
            <form onSubmit={handleGeneratePlan} style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase" }}>Select Active Emergency Event</label>
                <select 
                  value={selectedEventId} 
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: "8px", height: "42px", outline: "none", fontSize: "13px", fontWeight: "600" }}
                  required
                >
                  <option value="">-- Choose Active Crisis Event --</option>
                  {activeEvents.map(ev => (
                    <option key={ev.event_id} value={ev.event_id}>
                      #{ev.event_id} - {ev.event_type} (Severity: {ev.severity_level})
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                disabled={loading || !selectedEventId}
                style={{
                  height: "42px",
                  padding: "0 24px",
                  backgroundColor: loading ? "#94A3B8" : "#01411C",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "750",
                  fontSize: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s"
                }}
              >
                {loading ? "COMPILING SYSTEM..." : "RUN COMMAND BRAIN"}
              </button>
            </form>
          </div>

          {/* Interactive Graph Visualizer */}
          <div 
            className="urbs-card" 
            ref={graphContainerRef}
            style={{ 
              padding: "24px", 
              backgroundColor: "#FFFFFF", 
              border: "1px solid rgba(1,65,28,0.08)", 
              borderRadius: "12px", 
              boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
              overflow: "hidden"
            }}
          >
            <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "800", margin: "0 0 4px 0" }}>
              Live Evacuation Graph Network
            </h3>
            <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 15px 0" }}>
              Topology map synced from Neo4j. Disaster sectors blink red, safe shelters show green, and routed pathways flow with amber particles.
            </p>
            <div style={{ 
              width: "100%", 
              height: "360px", 
              border: "1px solid #E2E8F0", 
              borderRadius: "8px", 
              backgroundColor: "#F8FAFC",
              overflow: "hidden" 
            }}>
              {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                  graphData={graphData}
                  nodeId="id"
                  width={graphWidth - 2} // Fit inside container border
                  height={358}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name || '';
                    const fontSize = 11.5 / globalScale;
                    ctx.font = `700 ${fontSize}px Sans-Serif`;
                    
                    const isOrigin = affectedZoneIds.includes(node.id);
                    const isTarget = targetZoneIds.includes(node.id);
                    const isPathNode = activePathNodeIds.includes(node.id);
                    
                    // Draw node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, (isOrigin || isTarget || isPathNode) ? 7 : 4.5, 0, 2 * Math.PI, false);
                    
                    if (isOrigin) {
                      ctx.fillStyle = '#EF4444'; // Red for crisis origin
                    } else if (isTarget) {
                      ctx.fillStyle = '#10B981'; // Emerald Green for safe shelter
                    } else if (isPathNode) {
                      ctx.fillStyle = '#F59E0B'; // Amber for active path
                    } else {
                      ctx.fillStyle = '#94A3B8'; // Slate Gray for idle nodes
                    }
                    ctx.fill();

                    // Render node labels
                    ctx.fillStyle = (isOrigin || isTarget || isPathNode) ? '#0F172A' : '#64748B';
                    ctx.fillText(label, node.x + 9, node.y + 3);
                  }}
                  linkColor={(link) => isLinkInActiveRoute(link) ? '#F59E0B' : 'rgba(1, 65, 28, 0.08)'}
                  linkWidth={(link) => isLinkInActiveRoute(link) ? 3.5 : 1}
                  linkDirectionalParticles={(link) => isLinkInActiveRoute(link) ? 3 : 0}
                  linkDirectionalParticleSpeed={0.012}
                  linkDirectionalParticleWidth={2.5}
                  linkDirectionalParticleColor={() => '#F59E0B'}
                />
              ) : (
                <div style={{ color: "#94A3B8", fontStyle: "italic", fontSize: "13px", padding: "40px", textAlign: "center", display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                  🔄 Synchronizing Neo4j active node network...
                </div>
              )}
            </div>
          </div>

          {/* Path & Audit results display */}
          {simulationResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Verdict Indicator */}
              <div className="urbs-card" style={{ 
                padding: "20px", 
                borderLeft: `4px solid ${simulationResult.survival_audit.verdict === "GO" ? "#10B981" : "#EF4444"}`,
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid rgba(1,65,28,0.08)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.01)"
              }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase" }}>Operational Survival Verdict</div>
                <div style={{ 
                  fontSize: "28px", 
                  fontWeight: "900", 
                  marginTop: "6px", 
                  color: simulationResult.survival_audit.verdict === "GO" ? "#10B981" : "#EF4444" 
                }}>
                  {simulationResult.survival_audit.verdict === "GO" ? "● SYSTEM GO" : "● SYSTEM NO-GO"}
                </div>
                <p style={{ fontSize: "12.5px", color: "#64748B", margin: "8px 0 0 0" }}>
                  {simulationResult.survival_audit.verdict === "GO" 
                    ? "Lahore emergency logistics confirms supply reserves are fully adequate to support fleeing citizens for 72 hours."
                    : "Warning: Logistics audit reports resource deficits. Deployed supplies are insufficient to support evacuees."}
                </p>
              </div>

              {/* Evacuee Demographics */}
              <div className="urbs-card" style={{ padding: "20px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(1,65,28,0.08)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#01411C", fontSize: "14px", fontWeight: "800" }}>Total Relocation Population Exposure</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#64748B", fontWeight: "750" }}>TOTAL EVACUEES</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>
                      {simulationResult.survival_audit.total_evacuees.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#64748B", fontWeight: "750" }}>VULNERABLE ELDERLY</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#D97706" }}>
                      {simulationResult.survival_audit.total_elderly.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#64748B", fontWeight: "750" }}>MOBILITY IMPAIRED</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#EF4444" }}>
                      {simulationResult.survival_audit.total_mobility_impaired.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safe Routing Paths details */}
              <div className="urbs-card" style={{ padding: "20px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(1,65,28,0.08)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "#01411C", fontSize: "14px", fontWeight: "800" }}>Safe Corridor Mapping</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {simulationResult.evacuation_routes.map((route, idx) => (
                    <div key={idx} style={{ padding: "14px", borderRadius: "8px", border: "1px solid #F1F5F9", backgroundColor: "#F8FAFC" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "750", color: "#64748B" }}>ORIGIN SECTOR: {route.origin_zone}</span>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#01411C" }}>
                          ⏱ {route.time_minutes} MINS ({route.distance_km} km)
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "10px" }}>
                        Destination: {route.shelter_name}
                      </div>
                      {route.path.length > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "11px" }}>
                          <span style={{ color: "#64748B" }}>Corridor:</span>
                          {route.path.map((node, nIdx) => (
                            <React.Fragment key={nIdx}>
                              <span style={{ backgroundColor: "#01411C", color: "#FFFFFF", padding: "2px 6px", borderRadius: "4px", fontWeight: "700", fontFamily: "monospace" }}>
                                {node}
                              </span>
                              {nIdx < route.path.length - 1 && <span style={{ color: "#94A3B8" }}>➔</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "#EF4444", fontSize: "11px", fontWeight: "750" }}>
                          🚨 Danger corridors blocked. Zone fully isolated. Request aerial assistance.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Side: 72-Hour Supply Audit checklist & History ledger */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          <div className="urbs-card" style={{ padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(1,65,28,0.08)", minHeight: "260px" }}>
            <h3 style={{ fontSize: "16px", color: "#01411C", fontWeight: "800", margin: "0 0 15px 0", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px" }}>
              72-Hour Survival Logistics Audit
            </h3>
            
            {simulationResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {simulationResult.survival_audit.checklist.map((item, idx) => (
                  <div key={idx} style={{ 
                    padding: "14px", 
                    borderRadius: "8px", 
                    border: `1px solid ${item.status === "DEFICIT" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)"}`,
                    backgroundColor: item.status === "DEFICIT" ? "rgba(239, 68, 68, 0.02)" : "rgba(16, 185, 129, 0.02)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A" }}>{item.resource_type} RESERVES</span>
                      <span style={{ 
                        fontSize: "10px", 
                        fontWeight: "800", 
                        color: item.status === "DEFICIT" ? "#EF4444" : "#10B981" 
                      }}>
                        {item.status === "DEFICIT" ? "⚠️ SHORTAGE" : "✓ ADEQUATE"}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                      <div>
                        <span style={{ color: "#64748B" }}>Current Stock:</span>{" "}
                        <strong style={{ color: "#0F172A" }}>{item.current_stock.toLocaleString()} {item.unit}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748B" }}>Required (72h):</span>{" "}
                        <strong style={{ color: "#0F172A" }}>{item.required_amount.toLocaleString()} {item.unit}</strong>
                      </div>
                    </div>
                    {item.status === "DEFICIT" && (
                      <div style={{ marginTop: "10px", fontSize: "11px", color: "#B91C1C", fontWeight: "700", borderTop: "1px dashed rgba(239, 68, 68, 0.2)", paddingTop: "8px" }}>
                        Shortfall Deficit: -{item.deficit.toLocaleString()} {item.unit} (Must dispatch immediately)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#94A3B8", fontStyle: "italic", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
                Select an active disaster event and execute the Command Brain to audit reserves.
              </div>
            )}
          </div>

          {/* Historical Cached Plans registry list */}
          <div className="urbs-card" style={{ padding: "20px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(1, 65, 28, 0.08)" }}>
            <h3 style={{ fontSize: "14px", color: "#01411C", fontWeight: "800", margin: "0 0 15px 0", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px" }}>
              Cached Evacuation Plans Ledger
            </h3>
            <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {historicalPlans.length === 0 ? (
                <span style={{ color: "#94A3B8", fontStyle: "italic", fontSize: "12px" }}>No evacuation logs cached in PostgreSQL.</span>
              ) : (
                historicalPlans.map((plan, idx) => (
                  <div key={idx} style={{ padding: "10px", borderRadius: "6px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: "11.5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", color: "#0F172A" }}>Zone: {plan.zone_name} ({plan.zone})</span>
                      <span style={{ fontWeight: "800", color: "#10B981" }}>{plan.status}</span>
                    </div>
                    <div>Threat: <strong>{plan.disaster_type}</strong></div>
                    <div>Assembly Point: <strong>{plan.assembly_point_name}</strong></div>
                    <div style={{ fontSize: "10px", color: "#64748B", marginTop: "5px", fontFamily: "monospace" }}>
                      Route: {plan.primary_route_id}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}