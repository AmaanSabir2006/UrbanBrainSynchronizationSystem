import React from "react";

export default function Sidebar({ currentView, setCurrentView }) {
  // Navigation manifest tracking both unique routing targets and custom SVG paths
  const navigationItems = [
    { 
      id: "zones", 
      label: "Zones Control Matrix", 
      category: "Core Operations",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      )
    },
    { 
      id: "resources", 
      label: "Resource Forecast", 
      category: "Core Operations",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
    { 
      id: "disasters", 
      label: "Disaster Impact Matrix", 
      category: "Risk Assessment",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    { 
      id: "evacuation", 
      label: "Evacuation Plans", 
      category: "Risk Assessment",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
          <line x1="9" y1="3" x2="9" y2="18"></line>
          <line x1="15" y1="6" x2="15" y2="21"></line>
        </svg>
      )
    },
    { 
      id: "telemetry", 
      label: "Live Telemetry Console", 
      category: "Simulations",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    { 
      id: "zone-impact", 
      label: "Macro-Urban Risk Grid", 
      category: "Simulations",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      )
    },
    { 
      id: "allocation", 
      label: "Dynamic Budget Allocation", 
      category: "Financials",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      )
    },
    { 
      id: "map", 
      label: "Transit Network Map", 
      category: "Logistics",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
          <line x1="9" y1="3" x2="9" y2="18"></line>
          <line x1="15" y1="6" x2="15" y2="21"></line>
        </svg>
      )
    },
    { 
      id: "assets-graph", 
      label: "Asset Dependency Graph", 
      category: "Logistics",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      )
    },
  ];

  const categories = ["Core Operations", "Risk Assessment", "Simulations", "Financials", "Logistics"];

  return (
    <aside style={{
      width: "280px",
      height: "100%",
      backgroundColor: "#FFFFFF",
      borderRight: "1px solid rgba(1, 65, 28, 0.08)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      boxSizing: "border-box",
      gap: "24px",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    }}>
      <style>{`
        .sidebar-nav-btn {
          width: 100%;
          text-align: left;
          padding: 11px 14px;
          margin: 3px 0;
          background-color: transparent;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 3px solid transparent;
        }
        .sidebar-nav-btn:hover {
          background-color: rgba(1, 65, 28, 0.04);
          color: #01411C;
        }
        .sidebar-nav-btn.active {
          background-color: #01411C;
          color: #FFFFFF;
          border-left: 3px solid #10B981;
          box-shadow: 0 4px 12px rgba(1, 65, 28, 0.1);
        }
        .sidebar-nav-btn svg {
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .sidebar-nav-btn.active svg {
          opacity: 1;
        }
        .category-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94A3B8;
          font-weight: 800;
          margin-bottom: 8px;
          padding-left: 8px;
        }
      `}</style>

      {categories.map((category) => (
        <div key={category} style={{ display: "flex", flexDirection: "column" }}>
          <span className="category-title">{category}</span>
          {navigationItems
            .filter((item) => item.category === category)
            .map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-btn ${currentView === item.id ? "active" : ""}`}
                onClick={() => setCurrentView(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
        </div>
      ))}
    </aside>
  );
}