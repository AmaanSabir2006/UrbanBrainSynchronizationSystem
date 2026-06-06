import React, { useState, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";

export default function AssetDependencyGraph() {
  // Master tracking states for raw backend data stream
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  
  // Active states rendered inside the React Flow canvas viewport
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Interactive Filter States
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [availableZones, setAvailableZones] = useState([]);

  useEffect(() => {
    // Using your working backend path string structure
    fetch("http://127.0.0.1:8000/api/assets_graph/")
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with status code: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const incomingNodes = data && data.nodes ? data.nodes : [];
        const incomingEdges = data && data.edges ? data.edges : [];

        setAllNodes(incomingNodes);
        setAllEdges(incomingEdges);

        // Dynamically discover all unique operational zones inside your dataset
        const zones = incomingNodes
          .map(node => node.data?.zone)
          .filter(zoneName => zoneName && zoneName.trim() !== "");
        
        // Remove duplicates using Set collections
        setAvailableZones([...new Set(zones)]);

        // Initial paint: Default to showing the global system map
        setNodes(incomingNodes);
        setEdges(incomingEdges);
        setLoading(false);
      })
      .catch((err) => {
        console.error("LOG: Matrix fetch processing failure:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [setNodes, setEdges]);

  // Trigger filtering mechanism whenever the admin updates the zone dropdown selection
  useEffect(() => {
    if (selectedZone === "ALL") {
      setNodes(allNodes);
      setEdges(allEdges);
    } else {
      // 1. Isolate target nodes matching selected zone criteria
      const filteredNodes = allNodes.filter(node => node.data?.zone === selectedZone);
      const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

      // 2. Clear out loose floating dependency lines whose endpoints are hidden
      const filteredEdges = allEdges.filter(edge => 
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
      );

      setNodes(filteredNodes);
      setEdges(filteredEdges);
    }
    // Close metadata panel when swapping filters to keep current panel synchronized
    setSelectedAsset(null); 
  }, [selectedZone, allNodes, allEdges, setNodes, setEdges]);

  const onNodeClick = (event, node) => {
    setSelectedAsset(node.data);
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Dynamic Header Frame Layout */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        borderBottom: "1px solid #E2E8F0", 
        paddingBottom: "16px" 
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", color: "#01411C", fontWeight: "800" }}>
            Infrastructure Asset Dependency Canvas
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B" }}>
            Live system topology map queried directly from relational infrastructure schemas.
          </p>
        </div>

        {/* 🎛️ Operational Zone Selector Dropdown Panel */}
        {!loading && !error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "900", color: "#01411C", letterSpacing: "1px" }}>
              FILTER SECTOR:
            </span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "4px",
                border: "2px solid #01411C",
                backgroundColor: "#FFFFFF",
                color: "#01411C",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 2px 4px rgba(1, 65, 28, 0.05)"
              }}
            >
              <option value="ALL">All Grid Sectors (Global View)</option>
              {availableZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone} Sector Matrix
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "40px", color: "#01411C", fontWeight: "bold", fontSize: "15px" }}>
          🔄 Syncing city network infrastructure matrix...
        </div>
      ) : error ? (
        <div style={{ padding: "20px", backgroundColor: "#FEE2E2", color: "#B91C1C", borderRadius: "6px", fontSize: "14px", fontWeight: "600" }}>
          ⚠️ Backend Connection Error: {error}.
        </div>
      ) : (
        <div style={{ 
          display: "flex", 
          width: "100%", 
          height: "65vh", 
          border: "2px solid #01411C", 
          borderRadius: "8px", 
          overflow: "hidden", 
          position: "relative" 
        }}>
          
          <div style={{ flex: 1, height: "100%" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
            >
              <Background color="#CBD5E1" gap={16} size={1} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          {/* Meta Drawer Sliding Panel */}
          {selectedAsset && (
            <div style={{
              width: "300px", height: "100%", backgroundColor: "#FFFFFF",
              borderLeft: "2px solid #01411C", padding: "20px", position: "absolute",
              right: 0, top: 0, zIndex: 10, boxShadow: "-4px 0 15px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h4 style={{ margin: 0, color: "#01411C", letterSpacing: "0.5px" }}>Asset Metadata</h4>
                <button onClick={() => setSelectedAsset(null)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: "16px", fontWeight: "bold", color: "#01411C" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <p style={{ margin: 0 }}><strong>Name:</strong> {selectedAsset.label}</p>
                <p style={{ margin: 0 }}><strong>Type:</strong> {selectedAsset.asset_type}</p>
                <p style={{ margin: 0 }}><strong>Zone:</strong> <span style={{ backgroundColor: "rgba(1, 65, 28, 0.1)", padding: "2px 6px", borderRadius: "4px", color: "#01411C", fontWeight: "bold" }}>{selectedAsset.zone}</span></p>
                <p style={{ margin: 0 }}><strong>Capacity:</strong> {selectedAsset.capacity} Units</p>
                <p style={{ margin: 0 }}><strong>Status:</strong> {selectedAsset.status}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}