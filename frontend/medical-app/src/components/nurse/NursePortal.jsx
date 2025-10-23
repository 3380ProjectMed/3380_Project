// src/components/nurse/NursePortal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import NurseSidebar from "./NurseSidebar.jsx";
import NurseDashboard from "./NurseDashboard.jsx";

// Reuse visual components from doctor (no CSS import)
import Schedule from "../doctor/Schedule.jsx";
import PatientList from "../doctor/PatientList.jsx";
import ClinicalWorkSpace from "../doctor/ClinicalWorkSpace.jsx";

import "./NursePortal.css";

export default function NursePortal() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any auth your app uses (adjust as needed)
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage("clinical");
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
    setSelectedAppointment(null);
    setSelectedPatient(null);
  };

  return (
    <div className="nurse-portal">
      <NurseSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <main className="nurse-main-content">
        {currentPage === "dashboard" && (
          <NurseDashboard
            setCurrentPage={setCurrentPage}
            onAppointmentClick={handleAppointmentClick}
          />
        )}

        {currentPage === "schedule" && (
          <Schedule onAppointmentClick={handleAppointmentClick} />
        )}

        {currentPage === "patients" && (
          <PatientList
            onPatientClick={handlePatientClick}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
          />
        )}

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
