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

  return (
    <div className="urban-dashboard-wrapper">
      <style>{`
        .urban-dashboard-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; background-color: #FFFFFF; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; box-sizing: border-box; position: relative; }
        .dashboard-control-panel { display: flex; gap: 16px; background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid rgba(1, 65, 28, 0.12); align-items: center; z-index: 100; }
        .dropdown-control-group { display: flex; gap: 12px; flex-grow: 1; }
        .dropdown-wrapper { display: flex; flex-direction: column; flex: 1; gap: 6px; }
        .dropdown-label { font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; }
        .urban-select-dropdown { width: 100%; padding: 10px 14px; background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; color: #111827; font-size: 14px; font-weight: 500; box-sizing: border-box; outline: none; transition: all 0.2s ease; height: 42px; }
        .urban-select-dropdown:focus { border-color: #01411C; box-shadow: 0 0 0 3px rgba(1, 65, 28, 0.1); }
        .control-btn { padding: 0 28px; font-size: 13px; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; height: 42px; display: flex; align-items: center; justify-content: center; margin-top: 17px; }
        .action-stop-btn { background-color: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
        .action-stop-btn.armed { background-color: #ef4444; color: #ffffff; cursor: pointer; }
        .action-stop-btn.armed:hover { background-color: #dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
        .action-reset-btn { background-color: #ffffff; color: #374151; border: 1px solid #d1d5db; }
        .action-reset-btn:hover { background-color: #f9fafb; border-color: #01411C; color: #01411C; }
        .urban-grid-canvas { margin-top: 32px; flex-grow: 1; }
        .canvas-header h2 { font-size: 22px; color: #111827; margin: 0 0 4px 0; font-weight: 700; }
        .canvas-header p { font-size: 14px; color: #6b7280; margin: 0 0 24px 0; }
        .macro-zones-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        .zone-grid-tile { background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid rgba(1, 65, 28, 0.12); transition: all 0.2s ease; }
        .tile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .zone-code-tag { font-size: 11px; background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #4b5563; font-family: monospace; font-weight: 600; }
        .zone-display-title { font-size: 16px; color: #111827; margin: 0 0 6px 0; font-weight: 600; }
        .status-label { font-size: 12px; margin: 0; font-weight: 500; }
        .TILE-STEADY-STATE { border-left: 4px solid #10b981; }
        .TILE-STEADY-STATE .status-label { color: #059669; }
        .TILE-ALERT-CRITICAL { border-left: 4px solid #ef4444; background-color: #fef2f2; border-color: #fca5a5; cursor: pointer; animation: criticalPulse 2s infinite ease-in-out; }
        .TILE-ALERT-CRITICAL:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(239, 68, 68, 0.12); }
        .TILE-ALERT-CRITICAL .status-label { color: #dc2626; font-weight: 700; }
        .live-alert-dot { width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; }
        .backend-error-banner { background-color: #fffaf0; border: 1px dashed #dd6b20; color: #dd6b20; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; margin-bottom: 20px; }
        .diagnostic-drawer-panel { position: absolute; top: 0; right: 0; width: 420px; height: 100%; background-color: #ffffff; border-left: 1px solid #e5e7eb; box-shadow: -12px 0 30px rgba(0, 0, 0, 0.05); padding: 28px 24px; box-sizing: border-box; z-index: 200; display: flex; flex-direction: column; }
        .drawer-header-wrapper { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; }
        .drawer-header-wrapper h2 { font-size: 18px; color: #111827; margin: 0 0 4px 0; font-weight: 700; }
        .drawer-sub { font-size: 12px; color: #059669; margin: 0; font-weight: 600; }
        .close-drawer-icon { background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; line-height: 20px; }
        .close-drawer-icon:hover { color: #111827; }
        .drawer-scroll-body { flex-grow: 1; overflow-y: auto; margin-top: 20px; }
        .drawer-infrastructure-section h3 { font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; font-weight: 700; }
        .outage-nodes-list { display: flex; flex-direction: column; gap: 10px; }
        .infrastructure-outage-card { display: flex; align-items: center; gap: 12px; background-color: #fff5f5; padding: 12px; border-radius: 6px; border: 1px solid #fee2e2; }
        @keyframes criticalPulse { 0% { background-color: #fef2f2; } 50% { background-color: #fee2e2; } 100% { background-color: #fef2f2; } }
      `}</style>
      
      {backendError && (
        <div className="backend-error-banner">
          ⚠️ <strong>Database Integration Error:</strong> {backendError}
        </div>
      )}

      <header className="dashboard-control-panel">
        <div className="dropdown-control-group">
          <div className="dropdown-wrapper">
            <label className="dropdown-label">Asset Type Filter</label>
            <select className="urban-select-dropdown" value={selectedAssetType} onChange={(e) => { setSelectedAssetType(e.target.value); setSelectedAssetId(''); }}>
              <option value="ALL">All Utility Sectors</option>
              <option value="POWER_STATION">⚡ Power Generation Stations</option>
              <option value="WATER_PLANT">💧 Water Filtration Plants</option>
              <option value="FUEL_DEPOT">⛽ Fuel Refined Reservoirs</option>
            </select>
          </div>
          <div className="dropdown-wrapper">
            <label className="dropdown-label">Select Infrastructure by Name</label>
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
          <p>Isolate an infrastructure structure by name above and click STOP. Affected grid sectors will flag red; click them to extract MongoDB diagnostic logs.</p>
        </div>
        <div className="macro-zones-grid">
          {zones.map((zone) => {
            // Support varying field formats coming from database entities (e.g., zone_id vs id)
            const zoneId = zone.zone_id || zone.id;
            const zoneName = zone.zone_name || zone.name || 'Unknown Grid Zone';
            
            const isCompromised = redZoneIds.includes(zoneId);
            const mongoSnapshot = impactTree.find((z) => z.zone_id === zoneId);
            
            return (
              <div key={zoneId} className={`zone-grid-tile ${isCompromised ? 'TILE-ALERT-CRITICAL' : 'TILE-STEADY-STATE'}`} onClick={() => isCompromised && mongoSnapshot && setActiveZoneDetail(mongoSnapshot)}>
                <div className="tile-header">
                  <span className="zone-code-tag">{zoneId}</span>
                  {isCompromised && <span className="live-alert-dot"></span>}
                </div>
                <h3 className="zone-display-title">{zoneName}</h3>
                <p className="status-label">{isCompromised ? '⚠️ SYSTEM ISOLATION' : '🟢 OPERATIONAL'}</p>
              </div>
            );
          })}
        </div>
      </main>

      {activeZoneDetail && (
        <aside className="diagnostic-drawer-panel">
          <div className="drawer-header-wrapper">
            <div>
              <h2>{activeZoneDetail.zone_name} Diagnostics</h2>
              <p className="drawer-sub">💾 MongoDB Real-Time Document Extraction Log</p>
            </div>
            <button className="close-drawer-icon" onClick={() => setActiveZoneDetail(null)}>×</button>
          </div>

          <div className="drawer-scroll-body">
            <div className="drawer-infrastructure-section">
              <h3>Affected Downstream Consumers</h3>
              <div className="outage-nodes-list">
                {consumerImpactAssets.length > 0 ? (
                  consumerImpactAssets.map((asset) => (
                    <div key={asset.asset_id} className="infrastructure-outage-card">
                      <div>
                        <div style={{fontWeight: '700', fontSize: '13px'}}>{asset.name}</div>
                        <div style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>{asset.asset_id} • {asset.type}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{fontSize: '12px', color: '#666'}}>No downstream consumer nodes impacted.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}