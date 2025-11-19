import React, { useState } from "react";
import NurseSidebar from "./NurseSidebar";
import NurseDashboard from "./NurseDashboard";
import NurseSchedule from "./NurseSchedule";
import NurseProfile from "./NurseProfile";
import "./NursePortal.css";

export default function NursePortal() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogout = () => {
    window.location.href = "/login";
  };

  return (
    <div className="nurse-portal">
      <NurseSidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        onLogout={handleLogout} 
      />
      
      <main className="nurse-main">
        {currentPage === "dashboard" && (
          <NurseDashboard setCurrentPage={setCurrentPage} />
        )}
        
        {currentPage === "schedule" && (
          <NurseSchedule />
        )}
        
        {currentPage === "profile" && (
          <NurseProfile />
        )}
      </main>
    </div>
  );
}