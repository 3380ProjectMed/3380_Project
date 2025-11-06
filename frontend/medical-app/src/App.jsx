// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider.jsx";

import LandingPage from "./components/LandingPage.jsx";
import PatientPortal from "./components/patient/PatientPortal.jsx";
import DoctorPortal from "./components/doctor/DoctorPortal.jsx";
import LoginPage from "./components/LoginPage.jsx";
import SignUp  from "./components/SignUp.jsx";

// Nurse module
import NursePortal from "./components/nurse/NursePortal.jsx";
import NurseDashboard from "./components/nurse/NurseDashboard.jsx";
import NurseIntake from "./components/nurse/NurseIntake.jsx";

// Admin module
import AdminPortal from "./components/admin/AdminPortal.jsx";

// Receptionist module
import ReceptionistPortal from "./components/receptionist/ReceptionistPortal.jsx";
import ReceptionistDashboard from "./components/receptionist/ReceptionistDashboard.jsx";


import "./App.css";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={
        <RequireRole roles={["ADMIN"]}>
          <AdminPortal />
        </RequireRole>
      } />
      <Route path="/signup" element={<SignUp />} />

      {/* Patient */}
      <Route
        path="/patientportal"
        element={
          <RequireRole roles={["PATIENT"]}>
            <PatientPortal />
          </RequireRole>
        }
      />

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <RequireRole roles={["DOCTOR"]}>
            <DoctorPortal />
          </RequireRole>
        }
      />

      {/* Nurse (nested) */}
      <Route
        path="/nurse"
        element={
          <RequireRole roles={["NURSE"]}>
            <NursePortal /> {/* should render an <Outlet /> inside */}
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<NurseDashboard />} />
        <Route path="intake/:appointmentId" element={<NurseIntake />} />
      </Route>

      {/* Receptionist (nested) */}
      <Route
        path="/receptionist"
        element={
          <RequireRole roles={["RECEPTIONIST"]}>
            <ReceptionistPortal /> {/* should render an <Outlet /> inside */}
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionistDashboard />} />
        <Route path="check-in" element={<CheckIn />} />
      </Route>

      {/* Neutral entry that bounces users to their role home */}
      <Route path="/portal" element={<AutoPortal />} />

      {/* Single 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ---- Helpers ---- */

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;

  const role = String(user.role || '').toUpperCase();

  if (roles && !roles.map(r => String(r).toUpperCase()).includes(role)) {
    // Redirect to their appropriate home instead of login
    return <Navigate to={homeFor(role)} replace />;
  }
  
  return children;
}

function AutoPortal() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeFor(user.role)} replace />;
}

function homeFor(role) {
  const upperRole = String(role || '').toUpperCase();
  switch (upperRole) {
    case "ADMIN": return "/admin";            
    case "DOCTOR": return "/doctor";
    case "NURSE": return "/nurse";
    case "RECEPTIONIST": return "/receptionist";
    case "PATIENT":
    default:
      return "/patientportal";
  }
}