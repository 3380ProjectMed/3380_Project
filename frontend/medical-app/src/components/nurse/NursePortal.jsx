import React, { useState } from "react";
import NurseSidebar from "./NurseSidebar";
import NurseDashboard from "./NurseDashboard";
import NurseSchedule from "./NurseSchedule";
import NursePatients from "./NursePatients";
import NurseClinicalWorkSpace from "./NurseClinicalWorkSpace";
import NurseProfile from "./NurseProfile";
import NurseReport from "./NurseReport";
import "./NursePortal.css";

export default function NursePortal() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogout = () => {
    if (confirm("Log out of Nurse Portal?")) {
      window.location.href = "/login";
    }
  };

  return (
    <div className="nurse-portal">
      <NurseSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <main className="nurse-main">
        {currentPage === "dashboard" && <NurseDashboard setCurrentPage={setCurrentPage} />}
        {currentPage === "schedule" && <NurseSchedule />}
        {currentPage === "patients" && <NursePatients />}
        {currentPage === "clinical" && <NurseClinicalWorkSpace />}
        {currentPage === "profile" && <NurseProfile />}
  {currentPage === "reports" && <NurseReport />}
      </main>
    </div>
  );
}
