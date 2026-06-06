import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AdminAuth from "./pages/AdminAuth"; 
import Dashboard from "./pages/Dashboard";
import ResourceForecast from "./pages/ResourceForecast";
import DisasterImpact from "./pages/DisasterImpact";
import FuelSimulation from "./pages/FuelSimulation";
import BudgetAllocation from "./pages/BudgetAllocation";
import TransitMap from "./pages/TransitMap";
import AssetDependencyGraph from "./pages/AssetDependencyGraph";
// Maintained your specific filename spelling (Dasboard) to prevent build failures
import MacroUrbanDashboard from "./pages/MacroUrbanDasboard"; 

function App() {
  // 1. Session Gatekeeper State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("urbs_auth_session") === "true";
  });

  const [currentView, setCurrentView] = useState("zones");

  // 2. Authentication Callback Methods
  const handleLoginSuccess = () => {
    localStorage.setItem("urbs_auth_session", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("urbs_auth_session");
    setIsAuthenticated(false);
  };

  // 3. SECURITY GATE CHECK
  if (!isAuthenticated) {
    return <AdminAuth onLoginSuccess={handleLoginSuccess} />;
  }

  // 4. AUTHORIZED WORKSPACE
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      width: "100vw", 
      height: "100vh", 
      backgroundColor: "#FFFFFF", 
      overflow: "hidden"
    }}>
      <Navbar onLogout={handleLogout} />
      
      {/* Main Workspace Frame */}
      <div style={{ 
        display: "flex", 
        flex: 1, 
        width: "100%",
        height: "calc(100vh - 75px)", 
        overflow: "hidden" 
      }}>
        {/* Sidebar Navigation */}
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        
        {/* Main Component Scroll Container */}
        <div style={{ 
          flex: 1, 
          padding: "40px", 
          overflowY: "auto", 
          height: "100%",
          backgroundColor: "#FFFFFF" 
        }}>
          {currentView === "zones" && <Dashboard />}
          {currentView === "resources" && <ResourceForecast />}
          {currentView === "disasters" && <DisasterImpact />}
          
          {/* ⛽ Fuel Cascade Simulator Option */}
          {currentView === "simulation" && <FuelSimulation />}
          
          {/* 🏢 Macro-Urban Operational Risk Grid Option */}
          {currentView === "zone-impact" && <MacroUrbanDashboard />}
          
          {currentView === "allocation" && <BudgetAllocation/>}
          {currentView === "map" && <TransitMap/>}
          {currentView === "assets-graph" && <AssetDependencyGraph/>}
        </div>
      </div>
    </div>
  );
}

export default App;