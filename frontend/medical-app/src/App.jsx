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
// import AdminPortal from "./components/admin/AdminPortal.jsx";

import AdminPortal from "./components/admin/AdminPortal.jsx";
// --- ADMIN module (disabled) ---
// import AdminPortal from "./components/admin/AdminPortal.jsx";
// import AdminDashboard from "./components/admin/AdminDashboard.jsx";
// import UsersPage from "./components/admin/UsersPage.jsx";

// --- RECEPTIONIST module (disabled) ---
// import ReceptionPortal from "./components/reception/ReceptionPortal.jsx";
// import ReceptionDashboard from "./components/reception/ReceptionDashboard.jsx";
// import CheckIn from "./components/reception/CheckIn.jsx";

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
      <Route path ="/signup" element={<SignUp />} />

      {/* Patient */}
      <Route
        path="/patientportal"
        element={
          <RequireRole roles={["PATIENT"] /* ,"ADMIN" disabled */}>
            <PatientPortal />
          </RequireRole>
        }
      />

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <RequireRole roles={["DOCTOR"] /* ,"ADMIN" disabled */}>
            <DoctorPortal />
          </RequireRole>
        }
      />

      {/* Nurse (nested) */}
      <Route
        path="/nurse"
        element={
          <RequireRole roles={["NURSE"] /* ,"ADMIN" disabled */}>
            <NursePortal /> {/* should render an <Outlet /> inside */}
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<NurseDashboard />} />
        <Route path="intake/:appointmentId" element={<NurseIntake />} />
      </Route>

      {/* --- Admin (disabled) ---
      <Route
        path="/admin"
        element={
          <RequireRole roles={["ADMIN"]}>
            <AdminPortal />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      */}

      {/* --- Receptionist (disabled) ---
      <Route
        path="/reception"
        element={
          <RequireRole roles={["RECEPTIONIST", "ADMIN"]}>
            <ReceptionPortal />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionDashboard />} />
        <Route path="check-in" element={<CheckIn />} />
      </Route>
      */}

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

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
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
  switch (role) {
    // case "ADMIN": return "/admin";            // disabled
    case "DOCTOR": return "/doctor";
    case "NURSE": return "/nurse";
    // case "RECEPTIONIST": return "/reception"; // disabled
    case "PATIENT":
    default:
      return "/patientportal";
  }
}
