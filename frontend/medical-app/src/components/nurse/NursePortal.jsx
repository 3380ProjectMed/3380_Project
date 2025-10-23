// src/components/nurse/NursePortal.jsx
import React, { useState } from "react";

// Nurse-specific pieces
import NurseSidebar from "./NurseSidebar";
import NurseDashboard from "./NurseDashboard";

import Schedule from "../doctor/Schedule";
import PatientList from "../doctor/PatientList";
import ClinicalWorkSpace from "../doctor/ClinicalWorkSpace";

// Import doctor css to reuse styles
import "../doctor/DoctorPortal.css";

/**
 * NursePortal
 * - Same high-level shell as the DoctorPortal (sidebar + main content)
 * - Uses NurseDashboard (with Task List + intake emphasis)
 * - Reuses Schedule, PatientList, ClinicalWorkSpace
 */
export default function NursePortal() {
  // Which page is showing
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Shared selections across pages
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ---- Handlers ----
  const handleLogout = () => {
    if (confirm("Log out of Nurse Portal?")) {
      // TODO: clear auth/session here
      // window.location.href = "/login";
      console.log("Nurse logout (hook up to your auth)");
    }
  };

  // From dashboard/schedule -> go to clinical workspace (or intake flow)
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage("clinical");
  };

  // From patient list -> open details (or go to clinical)
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    // setCurrentPage("clinical");
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
    setSelectedAppointment(null);
    setSelectedPatient(null);
  };

  return (
    <div className="doctor-portal">{/* reuse same shell styles */}
      {/* Sidebar */}
      <NurseSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="main-content">
        {/* ✅ Nurse-specific dashboard (Task List, Intake CTA, etc.) */}
        {currentPage === "dashboard" && (
          <NurseDashboard
            setCurrentPage={setCurrentPage}
            onAppointmentClick={handleAppointmentClick}
          />
        )}

        {/* 📅 Reuse schedule */}
        {currentPage === "schedule" && (
          <Schedule onAppointmentClick={handleAppointmentClick} />
        )}

        {/* 👥 Reuse patient list */}
        {currentPage === "patients" && (
          <PatientList
            onPatientClick={handlePatientClick}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
          />
        )}

        {/* 📝 Reuse clinical workspace (nurse will mostly use Vitals/Intake) */}
        {currentPage === "clinical" && (
          <ClinicalWorkSpace
            appointment={selectedAppointment}
            patient={selectedPatient}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}
