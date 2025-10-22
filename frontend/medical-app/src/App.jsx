// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider.jsx";

import LandingPage from "./components/LandingPage.jsx";
import PatientPortal from "./components/patient/PatientPortal.jsx";
import DoctorPortal from "./components/doctor/DoctorPortal.jsx";
import LoginPage from "./components/LoginPage.jsx"; // <-- adjust path if yours differs

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/patientportal"
        element={
          <RequireRole roles={["PATIENT", "ADMIN"]}>
            <PatientPortal />
          </RequireRole>
        }
      />
      <Route
        path="/doctor"
        element={
          <RequireRole roles={["DOCTOR", "ADMIN"]}>
            <DoctorPortal />
          </RequireRole>
        }
      />
      {/* Optional: neutral entry that bounces users to their role home */}
      <Route path="/portal" element={<AutoPortal />} />
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ---- Helpers (kept here for a single-file drop-in) ---- */

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;

  if (roles && !roles.includes(user.role)) {
    // bounce to the correct home for their role
    const home =
      user.role === "DOCTOR" ? "/doctor" :
      user.role === "ADMIN"  ? "/admin"  :
      "/patientportal";
    return <Navigate to={home} replace />;
  }
  return children;
}

function AutoPortal() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const home =
    user.role === "DOCTOR" ? "/doctor" :
    user.role === "ADMIN"  ? "/admin"  :
    "/patientportal";

  return <Navigate to={home} replace />;
}
