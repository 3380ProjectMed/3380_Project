import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider.jsx";

import NurseSidebar from "./NurseSidebar.jsx";
import NurseDashboard from "./NurseDashboard.jsx";

import Schedule from "../doctor/Schedule.jsx";
import PatientList from "../doctor/PatientList.jsx";
import ClinicalWorkSpace from "../doctor/ClinicalWorkSpace.jsx";

import "../doctor/DoctorPortal.css";

export default function NursePortal() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const navigate = useNavigate();
  const auth = useAuth(); // { user, login, logout, ... } in your project

  /**
   * Fully log out:
   * - Call backend /api/logout.php (optional but recommended to kill session)
   * - Call AuthProvider.logout() if available
   * - Clear localStorage fallback
   * - Navigate to /login
   */
  const handleLogout = async () => {
    const ok = window.confirm("Log out of Nurse Portal?");
    if (!ok) return;

    try {
      // 1) Tell backend to destroy PHP session (ignore if you don't have this)
      await fetch("/api/logout.php", {
        method: "POST",
        credentials: "include",
      }).catch(() => { /* ignore network error for dev */ });

      // 2) AuthProvider logout if provided
      if (auth?.logout) {
        await auth.logout();
      }

      // 3) Fallback: clear any local storage keys you use
      localStorage.removeItem("auth");
      localStorage.removeItem("user");

      // 4) Redirect to login
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      // Even on failure, send the user to login to avoid a dead end
      navigate("/login", { replace: true });
    }
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage("clinical");
  };

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
    <div className="doctor-portal">
      <NurseSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <main className="main-content">
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
