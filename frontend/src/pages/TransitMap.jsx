import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const TransitMap = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [startZone, setStartZone] = useState('');
  const [endZone, setEndZone] = useState('');
  
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [totalDistance, setTotalDistance] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/zones_graph/')
      .then((res) => res.json())
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading graph map data:", err);
        setLoading(false);
      });
  }, []);

  const handleComputeRoute = () => {
    if (!startZone || !endZone) {
      alert("Please choose an Origin and Destination first.");
      return;
    }

    fetch(`http://127.0.0.1:8000/api/shortest-path/?start=${startZone}&end=${endZone}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.path && data.path.length > 0) {
          setHighlightedNodes(data.path);
          setTotalDistance(data.total_distance);
        } else {
          alert("No optimal path could be found between those coordinates.");
          setHighlightedNodes([]);
          setTotalDistance(null);
        }
      })
      .catch((err) => {
        console.error("API Router connection breakdown:", err);
        alert("Could not reach the routing server engine.");
      });
  };

  // Helper utility function to check if a link connects two consecutive path nodes
  const isLinkInShortestPath = (link) => {
    if (!highlightedNodes || highlightedNodes.length === 0) return false;

    // Safely extract string IDs whether link is a primitive string or a pre-compiled object
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    const sourceIndex = highlightedNodes.indexOf(sourceId);
    const targetIndex = highlightedNodes.indexOf(targetId);

    // If both nodes exist in our path sequential link list
    if (sourceIndex !== -1 && targetIndex !== -1) {
      return Math.abs(sourceIndex - targetIndex) === 1;
    }
    return false;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#01411C', fontSize: '14px', fontWeight: '700' }}>
        SYNCHRONIZING URBAN BRAIN GRAPH MATRIX...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#F8F9FA', position: 'relative' }}>
      
      {/* Control Strip Layout Wrapper */}
      <div style={{ padding: '20px 35px', background: '#FFFFFF', display: 'flex', gap: '25px', alignItems: 'center', borderBottom: '2px solid rgba(1, 65, 28, 0.1)', zIndex: 10 }}>
        <div>
          <div style={{ color: '#01411C', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>
            ROUTE ROUTER OPERATIONAL LAYER
          </div>
          <div style={{ width: '30px', height: '2px', backgroundColor: '#01411C' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#01411C' }}>ORIGIN:</label>
          <select value={startZone} onChange={(e) => setStartZone(e.target.value)} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(1, 65, 28, 0.2)', color: '#01411C', fontWeight: '700', fontSize: '12px', outline: 'none' }}>
            <option value="">Select Start Zone</option>
            {graphData.nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#01411C' }}>DESTINATION:</label>
          <select value={endZone} onChange={(e) => setEndZone(e.target.value)} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(1, 65, 28, 0.2)', color: '#01411C', fontWeight: '700', fontSize: '12px', outline: 'none' }}>
            <option value="">Select Target Zone</option>
            {graphData.nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
        </div>

        <button onClick={handleComputeRoute} style={{ padding: '9px 22px', borderRadius: '4px', background: '#01411C', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
          COMPUTE OPTIMAL ROUTE
        </button>
      </div>

      {/* Floating Metrics Monitor panel element */}
      {totalDistance !== null && (
        <div style={{ position: 'absolute', top: '110px', right: '30px', background: '#FFFFFF', border: '2px solid #01411C', borderRadius: '6px', padding: '15px 25px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)', zIndex: 100 }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#01411C', letterSpacing: '1px', marginBottom: '4px' }}>
            COMPUTING METRICS LOG
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#111111' }}>
            {totalDistance} <span style={{ fontSize: '14px', color: '#555555', fontWeight: '700' }}>km</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', marginTop: '4px' }}>
            Total Path Hops: {highlightedNodes.length - 1} Links
          </div>
        </div>
      )}

      {/* Primary Rendering Engine Frame */}
      <div style={{ flexGrow: 1, position: 'relative', width: '100%', height: '100%' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeId="id"
          width={window.innerWidth - 300}
          height={window.innerHeight - 85}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name || '';
            const fontSize = 13 / globalScale;
            ctx.font = `700 ${fontSize}px Sans-Serif`;
            
            // Highlight node if it's the specific start node, end node, or inside the shortest path sequence array
            const isStart = node.id === startZone;
            const isEnd = node.id === endZone;
            const isPartOfPath = highlightedNodes.includes(node.id);
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, (isStart || isEnd || isPartOfPath) ? 8 : 5.5, 0, 2 * Math.PI, false);
            
            // Assign specific colors based on selection states
            if (isStart || isEnd) {
              ctx.fillStyle = '#D97706'; // Chosen endpoints glow amber gold instantly
            } else if (isPartOfPath) {
              ctx.fillStyle = '#D97706'; // Connecting path points turn amber gold on execution
            } else {
              ctx.fillStyle = '#01411C'; // Default unselected state corporate green
            }
            ctx.fill();

            ctx.fillStyle = (isStart || isEnd || isPartOfPath) ? '#000000' : '#555555';
            ctx.fillText(label, node.x + ((isStart || isEnd || isPartOfPath) ? 12 : 10), node.y + 3);
          }}
          linkColor={(link) => isLinkInShortestPath(link) ? '#D97706' : 'rgba(1, 65, 28, 0.15)'}
          linkWidth={(link) => isLinkInShortestPath(link) ? 5 : 1.5}
          linkDirectionalArrows={true}
          linkDirectionalArrowLength={(link) => isLinkInShortestPath(link) ? 6 : 3}
        />
      </div>
    </div>
  );
};

export default TransitMap;