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
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const handleLogout = () => {
    window.location.href = "/login";
  };

  return (
    <div className="nurse-portal">
      <NurseSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

      <main className="nurse-main">
        {currentPage === "dashboard" && <NurseDashboard setCurrentPage={setCurrentPage} />}
        {currentPage === "schedule" && (
          <NurseSchedule onOpenClinical={(appointmentId, visitId) => {
            setSelectedAppointmentId(appointmentId);
            setSelectedVisitId(visitId ?? null);
            setCurrentPage('clinical');
          }} />
        )}
        {currentPage === "patients" && <NursePatients onOpenClinical={(appointmentId, visitId) => { setSelectedAppointmentId(appointmentId); setSelectedVisitId(visitId ?? null); setCurrentPage('clinical'); }} />}
        {currentPage === "clinical" && <NurseClinicalWorkSpace appointmentId={selectedAppointmentId} visitId={selectedVisitId} />}
        {currentPage === "profile" && <NurseProfile />}
        {currentPage === "reports" && <NurseReport />}
      </main>
    </div>
  );
}
