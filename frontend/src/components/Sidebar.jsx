import React from "react";

export default function Sidebar({ currentView, setCurrentView }) {
  // Navigation manifest tracking both unique routing targets
  const navigationItems = [
    { id: "zones", label: "Zones Control Matrix", category: "Core Operations" },
    { id: "resources", label: "Resource Forecast", category: "Core Operations" },
    { id: "disasters", label: "Disaster Impact Matrix", category: "Risk Assessment" },
    { id: "simulation", label: "Fuel Cascade Simulator", category: "Simulations" },
    { id: "zone-impact", label: "Macro-Urban Risk Grid", category: "Simulations" },
    { id: "allocation", label: "Dynamic Budget Allocation", category: "Financials" },
    { id: "map", label: "Transit Network Map", category: "Logistics" },
    { id: "assets-graph", label: "Asset Dependency Graph", category: "Logistics" },
  ];

  // Grouping items by their operational category
  const categories = ["Core Operations", "Risk Assessment", "Simulations", "Financials", "Logistics"];

  return (
    <aside style={{
      width: "280px",
      height: "100%",
      backgroundColor: "#FFFFFF",
      borderRight: "1px solid rgba(1, 65, 28, 0.12)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      boxSizing: "border-box",
      gap: "24px"
    }}>
      <style>{`
        .sidebar-nav-btn {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          margin: 4px 0;
          background-color: transparent;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-nav-btn:hover {
          background-color: rgba(1, 65, 28, 0.04);
          color: #01411C;
        }
        .sidebar-nav-btn.active {
          background-color: #01411C;
          color: #FFFFFF;
        }
        .category-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9ca3af;
          font-weight: 700;
          margin-bottom: 6px;
          padding-left: 4px;
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
                {item.label}
              </button>
            ))}
        </div>
      ))}
    </aside>
  );
}