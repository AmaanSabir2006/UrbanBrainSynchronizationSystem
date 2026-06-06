import { useState, useEffect } from "react";

// 1. Accept the onLogout callback prop passed down from App.jsx
function Navbar({ onLogout }) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      height: "75px",
      backgroundColor: "#FFFFFF", 
      borderBottom: "2px solid #01411C", 
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", // Pushes identity to left and logout to right
      padding: "0 40px",
      position: "relative",
      boxShadow: "0 4px 20px rgba(1, 65, 28, 0.05)",
      zIndex: 100,
      boxSizing: "border-box"
    }}>
      
      {/* Brand Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{
          width: "10px",
          height: "10px",
          backgroundColor: "#01411C",
          borderRadius: "50%",
          boxShadow: pulse ? "0 0 10px 4px rgba(1, 65, 28, 0.3)" : "0 0 4px 1px rgba(1, 65, 28, 0.1)",
          transition: "box-shadow 0.3s ease"
        }} />
        
        <div>
          <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "3px", fontFamily: "monospace", color: "#01411C" }}>
            URBS
          </span>
          <span style={{
            color: "rgba(1, 65, 28, 0.6)",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            marginLeft: "12px",
            borderLeft: "1px solid rgba(1, 65, 28, 0.2)",
            paddingLeft: "12px"
          }}>
            URBAN BRAIN SYNCHRONIZATION SYSTEM
          </span>
        </div>
      </div>

      {/* 2. Interactive Session Termination Control */}
      <div>
        <button 
          onClick={onLogout}
          style={{
            background: "transparent",
            color: "#01411C",
            border: "1px solid #01411C",
            padding: "8px 18px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            fontFamily: "monospace",
            transition: "all 0.2s ease-in-out"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#01411C";
            e.target.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = "#01411C";
          }}
        >
          TERMINATE SESSION
        </button>
      </div>

    </div>
  );
}

export default Navbar;