import React, { useState, useEffect } from 'react';

export default function MacroUrbanDashboard() {
  // Database States
  const [zones, setZones] = useState([]);
  const [allInfrastructures, setAllInfrastructures] = useState([]);
  const [backendError, setBackendError] = useState(null);
  
  // Selection and State Controls
  const [selectedAssetType, setSelectedAssetType] = useState('ALL'); 
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Real-Time MongoDB Snapshot States
  const [redZoneIds, setRedZoneIds] = useState([]);
  const [impactTree, setImpactTree] = useState([]);
  const [activeZoneDetail, setActiveZoneDetail] = useState(null);

  // Normalization logic for varying database asset schemas
  const normalizeAssetData = (rawArray) => {
    return rawArray.map(asset => {
      const name = asset.asset_name || asset.name || 'Unnamed Asset';
      const id = asset.asset_id || asset.id || '';
      const rawType = String(asset.asset_type || asset.type || '').toUpperCase();
      
      let unifiedType = 'OTHER';
      if (rawType.includes('POWER') || rawType.includes('GRID') || rawType.includes('ELECTRIC')) {
        unifiedType = 'POWER_STATION';
      } else if (rawType.includes('WATER') || rawType.includes('FILTRATION') || rawType.includes('PLANT')) {
        unifiedType = 'WATER_PLANT';
      } else if (rawType.includes('FUEL') || rawType.includes('DEPOT') || rawType.includes('RESERVOIR')) {
        unifiedType = 'FUEL_DEPOT';
      }

      return {
        ...asset,
        resolvedName: name,
        resolvedId: id,
        resolvedType: unifiedType
      };
    });
  };

  // Fetch everything dynamically from the databases on mount
  useEffect(() => {
    // 1. Fetch Urban Grid Zones from Database
    fetch('http://127.0.0.1:8000/api/zones/')
      .then((res) => {
        if (!res.ok) throw new Error(`Zones API Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const fetchedZones = Array.isArray(data) ? data : data.results || data.data || [];
        setZones(fetchedZones);
      })
      .catch((err) => {
        setBackendError(prev => prev ? `${prev} | ${err.message}` : `Zones connection failed: ${err.message}`);
      });

    // 2. Fetch Infrastructure Assets from Database
    fetch('http://127.0.0.1:8000/api/infrastructure-assets/')
      .then((res) => {
        if (!res.ok) throw new Error(`Assets API Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let extractedArray = Array.isArray(data) ? data : data.results || data.data || [];
        if (extractedArray.length > 0) {
          setAllInfrastructures(normalizeAssetData(extractedArray));
        } else {
          setBackendError(prev => prev ? `${prev} | No assets found` : "No infrastructure items found.");
        }
      })
      .catch((err) => {
        setBackendError(prev => prev ? `${prev} | ${err.message}` : `Assets connection failed: ${err.message}`);
      });
  }, []);

  const displayedInfrastructures = allInfrastructures.filter(asset => {
    if (selectedAssetType === 'ALL') return true;
    const matchesExplicit = asset.resolvedType === selectedAssetType;
    const matchesRawFallback = String(asset.asset_type || asset.type || '').toUpperCase().includes(selectedAssetType.split('_')[0]);
    return matchesExplicit || matchesRawFallback;
  });

  // Communicates with Django to process/retrieve the simulation state from MongoDB
  const handleExecuteStopSimulation = async () => {
    if (!selectedAssetId) return;
    setIsSimulating(true);
    setActiveZoneDetail(null); 

    const originalAsset = allInfrastructures.find(a => a.resolvedId === selectedAssetId);
    const targetPayloadId = originalAsset?.asset_id || originalAsset?.id || selectedAssetId;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/zone_impact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: targetPayloadId })
      });

      const result = await response.json();

      if (response.ok) {
        // Hydrating state using the document snapshot created in MongoDB
        setRedZoneIds(result.red_zone_ids || []);
        setImpactTree(result.impact_tree || []); 
      } else {
        alert(`Simulation Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to communicate with MongoDB simulation engine:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetGridMatrix = () => {
    setRedZoneIds([]);
    setImpactTree([]);
    setSelectedAssetId('');
    setSelectedAssetType('ALL');
    setActiveZoneDetail(null);
  };

  // Filter out core resource hubs/providers from the diagnostics listing
  const consumerImpactAssets = activeZoneDetail?.disabled_assets?.filter(asset => {
    const type = String(asset.type || '').toUpperCase();
    return !(
      type.includes('POWER') || 
      type.includes('WATER') || 
      type.includes('FUEL') ||
      type.includes('STATION') ||
      type.includes('PLANT') ||
      type.includes('DEPOT')
    );
  }) || [];

  // Helper for risk status styling
  const getRiskBadgeStyles = (riskClass) => {
    const formatClass = String(riskClass || '').toUpperCase();
    if (formatClass.includes('HIGH')) {
      return { border: "1px solid rgba(239, 68, 68, 0.25)", color: "#EF4444", bg: "rgba(239, 68, 68, 0.05)" };
    } else if (formatClass.includes('MEDIUM') || formatClass.includes('MODERATE')) {
      return { border: "1px solid rgba(245, 158, 11, 0.25)", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.05)" };
    } else {
      return { border: "1px solid rgba(16, 185, 129, 0.25)", color: "#10B981", bg: "rgba(16, 185, 129, 0.05)" };
    }
  };

  return (
    <div className="urban-dashboard-wrapper">
      <style>{`
        .urban-dashboard-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background-color: #F8FAFC;
          color: #0F172A;
          font-family: Inter, system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          position: relative;
        }
        
        .dashboard-control-panel {
          display: flex;
          gap: 20px;
          background-color: #FFFFFF;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(1, 65, 28, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          align-items: flex-end;
          margin-bottom: 30px;
        }

        .dropdown-control-group {
          display: flex;
          gap: 16px;
          flex-grow: 1;
        }

        .dropdown-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 8px;
        }

        .dropdown-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .urban-select-dropdown {
          width: 100%;
          padding: 10px 14px;
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #0F172A;
          font-size: 13.5px;
          font-weight: 600;
          box-sizing: border-box;
          outline: none;
          transition: all 0.15s ease-in-out;
          height: 42px;
        }

        .urban-select-dropdown:focus {
          border-color: #01411C;
          box-shadow: 0 0 0 3px rgba(1, 65, 28, 0.06);
        }

        .control-btn {
          padding: 0 24px;
          font-size: 12.5px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          white-space: nowrap;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .action-stop-btn {
          background-color: #E2E8F0;
          color: #94A3B8;
          border: none;
          cursor: not-allowed;
        }

        .action-stop-btn.armed {
          background-color: #EF4444;
          color: #FFFFFF;
          cursor: pointer;
        }

        .action-stop-btn.armed:hover {
          background-color: #DC2626;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }

        .action-reset-btn {
          background-color: #FFFFFF;
          color: #01411C;
          border: 1px solid rgba(1, 65, 28, 0.2);
        }

        .action-reset-btn:hover {
          background-color: rgba(1, 65, 28, 0.04);
          border-color: #01411C;
        }

        .urban-grid-canvas {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .canvas-header {
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(1, 65, 28, 0.08);
          padding-bottom: 15px;
        }

        .canvas-header h2 {
          font-size: 24px;
          color: #01411C;
          margin: 0 0 6px 0;
          font-weight: 850;
          letter-spacing: -0.5px;
        }

        .canvas-header p {
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
        }

        .macro-zones-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .zone-grid-tile {
          background-color: #FFFFFF;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(1, 65, 28, 0.08);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
        }

        .zone-grid-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
          border-color: rgba(1, 65, 28, 0.2);
        }

        .tile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .zone-code-tag {
          font-size: 11px;
          background-color: #F1F5F9;
          padding: 3px 8px;
          border-radius: 5px;
          color: #475569;
          font-family: var(--font-mono), monospace;
          font-weight: 700;
        }

        .zone-risk-pill {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        .zone-display-title {
          font-size: 18px;
          color: #0F172A;
          margin: 4px 0 0 0;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .zone-demographic-row {
          font-size: 12px;
          color: #64748B;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid #F1F5F9;
          padding-top: 10px;
        }

        .tile-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 6px;
        }

        .TILE-STEADY-STATE {
          border-top: 4px solid #10B981;
        }

        .TILE-STEADY-STATE .tile-status-indicator {
          color: #10B981;
        }

        .TILE-ALERT-CRITICAL {
          border-top: 4px solid #EF4444;
          background-color: #FFFDFD;
          cursor: pointer;
          animation: criticalPulse 2.5s infinite ease-in-out;
        }

        .TILE-ALERT-CRITICAL .tile-status-indicator {
          color: #EF4444;
        }

        .live-alert-dot {
          width: 8px;
          height: 8px;
          background-color: #EF4444;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          animation: dotPulse 1.5s infinite;
        }

        .backend-error-banner {
          background-color: #FFFBEB;
          border: 1px dashed #D97706;
          color: #D97706;
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          margin-bottom: 25px;
        }

        /* Backdrop overlay and Slide-in Panel Drawer */
        .drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.15);
          backdrop-filter: blur(4px);
          z-index: 150;
          animation: fadeIn 0.2s ease-out;
        }

        .diagnostic-drawer-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 460px;
          height: 100vh;
          background-color: #FFFFFF;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.08);
          padding: 30px;
          box-sizing: border-box;
          z-index: 200;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .drawer-header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }

        .drawer-header-wrapper h2 {
          font-size: 20px;
          color: #01411C;
          margin: 0 0 6px 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .drawer-sub {
          font-size: 11px;
          color: #64748B;
          margin: 0;
          font-weight: 700;
          text-transform: uppercase;
        }

        .close-drawer-icon {
          background: #F1F5F9;
          border: none;
          color: #64748B;
          font-size: 20px;
          font-weight: 600;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .close-drawer-icon:hover {
          background-color: #E2E8F0;
          color: #0F172A;
        }

        .drawer-scroll-body {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .drawer-stats-card {
          background-color: #F8FAFC;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #E2E8F0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
        }

        .drawer-infrastructure-section h3 {
          font-size: 11px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 14px 0;
          font-weight: 700;
        }

        .outage-nodes-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .infrastructure-outage-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: #FEF2F2;
          padding: 14px;
          border-radius: 8px;
          border: 1px solid #FEE2E2;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.02);
        }

        @keyframes criticalPulse {
          0% { background-color: #FFFFFF; }
          50% { background-color: #FFF5F5; }
          100% { background-color: #FFFFFF; }
        }

        @keyframes dotPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      {backendError && (
        <div className="backend-error-banner">
          ⚠️ <strong>Database Integration Error:</strong> {backendError}
        </div>
      )}

      <header className="dashboard-control-panel">
        <div className="dropdown-control-group">
          <div className="dropdown-wrapper">
            <label className="dropdown-label">Utility Sector Filter</label>
            <select className="urban-select-dropdown" value={selectedAssetType} onChange={(e) => { setSelectedAssetType(e.target.value); setSelectedAssetId(''); }}>
              <option value="ALL">All Utility Sectors</option>
              <option value="POWER_STATION">⚡ Power Generation Stations</option>
              <option value="WATER_PLANT">💧 Water Filtration Plants</option>
              <option value="FUEL_DEPOT">⛽ Fuel Refined Reservoirs</option>
            </select>
          </div>
          <div className="dropdown-wrapper">
            <label className="dropdown-label">Select Infrastructure Node by Name</label>
            <select className="urban-select-dropdown" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
              <option value="">-- Choose Infrastructure Name --</option>
              {displayedInfrastructures.map((infra) => (
                <option key={infra.resolvedId} value={infra.resolvedId}>{infra.resolvedName}</option>
              ))}
            </select>
          </div>
        </div>
        <button className={`control-btn action-stop-btn ${selectedAssetId ? 'armed' : ''}`} onClick={handleExecuteStopSimulation} disabled={!selectedAssetId || isSimulating}>
          {isSimulating ? 'Isolating System...' : '🛑 STOP ASSET'}
        </button>
        <button className="control-btn action-reset-btn" onClick={handleResetGridMatrix}>🔄 RE-ENERGIZE CITY</button>
      </header>

      <main className="urban-grid-canvas">
        <div className="canvas-header">
          <h2>Macro-Urban Operational Risk Grid</h2>
          <p>Isolate an infrastructure node above and click STOP. Affected grid sectors will flag red; click them to extract MongoDB diagnostic logs.</p>
        </div>
        
        <div className="macro-zones-grid">
          {zones.map((zone) => {
            const zoneId = zone.zone_id || zone.id;
            const zoneName = zone.zone_name || zone.name || 'Unknown Grid Zone';
            const riskClass = zone.risk_classification || 'Low';
            const riskStyle = getRiskBadgeStyles(riskClass);
            
            const isCompromised = redZoneIds.includes(zoneId);
            const mongoSnapshot = impactTree.find((z) => z.zone_id === zoneId);
            const assetsInZoneCount = allInfrastructures.filter(a => (a.zone_id || a.zone) === zoneId).length;
            
            return (
              <div 
                key={zoneId} 
                className={`zone-grid-tile ${isCompromised ? 'TILE-ALERT-CRITICAL' : 'TILE-STEADY-STATE'}`} 
                onClick={() => isCompromised && mongoSnapshot && setActiveZoneDetail({ ...mongoSnapshot, metadata: zone })}
              >
                <div className="tile-header">
                  <span className="zone-code-tag">{zoneId}</span>
                  {isCompromised ? (
                    <span className="live-alert-dot"></span>
                  ) : (
                    <span className="zone-risk-pill" style={{
                      backgroundColor: riskStyle.bg,
                      color: riskStyle.color,
                      border: riskStyle.border
                    }}>{riskClass} Risk</span>
                  )}
                </div>
                <h3 className="zone-display-title">{zoneName}</h3>
                
                <div className="zone-demographic-row">
                  <div>📏 Area: {zone.area_sqkm ? `${zone.area_sqkm} sqkm` : 'N/A'}</div>
                  <div>👥 Population: {zone.population_count ? `${Number(zone.population_count).toLocaleString()} citizens` : 'N/A'}</div>
                  <div>⚙️ Infrastructure: {assetsInZoneCount} nodes registered</div>
                </div>

                <p className="tile-status-indicator">
                  {isCompromised ? '⚠️ System Isolation' : '● Operational'}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Slide-In Diagnostics Drawer & Backdrop */}
      {activeZoneDetail && (
        <>
          <div className="drawer-backdrop" onClick={() => setActiveZoneDetail(null)} />
          <aside className="diagnostic-drawer-panel">
            <div className="drawer-header-wrapper">
              <div>
                <h2>{activeZoneDetail.zone_name} Diagnostics</h2>
                <p className="drawer-sub">💾 MongoDB Document Snapshot</p>
              </div>
              <button className="close-drawer-icon" onClick={() => setActiveZoneDetail(null)}>×</button>
            </div>

            <div className="drawer-scroll-body">
              {/* Demographic Information Cards */}
              <div className="drawer-stats-card">
                <div className="stat-item">
                  <span className="stat-label">Zone ID</span>
                  <span className="stat-value">{activeZoneDetail.zone_id}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Risk Classification</span>
                  <span className="stat-value" style={{ 
                    color: getRiskBadgeStyles(activeZoneDetail.metadata?.risk_classification).color 
                  }}>{activeZoneDetail.metadata?.risk_classification || 'Low'}</span>
                </div>
                <div className="stat-item" style={{ gridColumn: "span 2" }}>
                  <span className="stat-label">Total Exposed Population</span>
                  <span className="stat-value">{activeZoneDetail.metadata?.population_count ? `${Number(activeZoneDetail.metadata.population_count).toLocaleString()} citizens` : 'N/A'}</span>
                </div>
              </div>

              {/* Infrastructure Outages List */}
              <div className="drawer-infrastructure-section">
                <h3>Impacted Downstream Services</h3>
                <div className="outage-nodes-list">
                  {consumerImpactAssets.length > 0 ? (
                    consumerImpactAssets.map((asset) => (
                      <div key={asset.asset_id} className="infrastructure-outage-card">
                        <div style={{ fontSize: '20px' }}>🚨</div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#B91C1C' }}>{asset.name}</div>
                          <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '3px' }}>
                            ID: {asset.asset_id} • Type: {asset.type}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '12.5px', color: '#64748B', fontStyle: 'italic' }}>
                      No downstream consumer nodes impacted in this zone sector.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}