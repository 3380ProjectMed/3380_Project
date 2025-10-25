// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider.jsx";

import LandingPage from "./components/LandingPage.jsx";
import PatientPortal from "./components/patient/PatientPortal.jsx";
import DoctorPortal from "./components/doctor/DoctorPortal.jsx";
import ReceptionistPortal from "./components/receptionist/ReceptionistPortal.jsx";
import LoginPage from "./components/LoginPage.jsx";

/**
 * App Component - Main Application Router
 * 
 * Handles routing for all user roles:
 * - Public: Landing page and login
 * - PATIENT: Patient portal
 * - DOCTOR: Doctor portal
 * - RECEPTIONIST: Receptionist portal (NEW)
 * - ADMIN: Admin portal (if implemented)
 * - NURSE: Nurse portal (if implemented)
 */
export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Patient Portal - Requires PATIENT or ADMIN role */}
      <Route
        path="/patientportal"
        element={
          <RequireRole roles={["PATIENT", "ADMIN"]}>
            <PatientPortal />
          </RequireRole>
        }
      />
      
      {/* Doctor Portal - Requires DOCTOR or ADMIN role */}
      <Route
        path="/doctor"
        element={
          <RequireRole roles={["DOCTOR", "ADMIN"]}>
            <DoctorPortal />
          </RequireRole>
        }
      />
      
      {/* Receptionist Portal - Requires RECEPTIONIST or ADMIN role */}
      <Route
        path="/receptionist"
        element={
          <RequireRole roles={["RECEPTIONIST", "ADMIN"]}>
            <ReceptionistPortal />
          </RequireRole>
        }
      />
      
      {/* Optional: Nurse Portal (if implemented) */}
      {/* <Route
        path="/nurse"
        element={
          <RequireRole roles={["NURSE", "ADMIN"]}>
            <NursePortal />
          </RequireRole>
        }
      /> */}
      
      {/* Optional: Admin Portal (if implemented) */}
      {/* <Route
        path="/admin"
        element={
          <RequireRole roles={["ADMIN"]}>
            <AdminPortal />
          </RequireRole>
        }
      /> */}
      
      {/* Neutral entry point - redirects to role-based portal */}
      <Route path="/portal" element={<AutoPortal />} />
      
      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * RequireRole Component
 * 
 * Protected route wrapper that checks user authentication and role
 * Redirects to login if not authenticated
 * Redirects to correct portal if wrong role
 * 
 * @param {Array} roles - Allowed roles for this route
 * @param {ReactNode} children - Component to render if authorized
 */
function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: '#0077b6',
            marginBottom: '0.5rem'
          }}>
            Loading...
          </div>
          <div style={{ color: '#6b7280' }}>
            Checking authentication
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  // Check if user has required role (compare normalized values)
  const userRoleNorm = (user?.role || '').toString().toUpperCase();
  if (roles) {
    const allowed = roles.map(r => r.toString().toUpperCase());
    if (!allowed.includes(userRoleNorm)) {
      // Redirect to the correct home for their role
      const home = getRoleHomePage(userRoleNorm);
      return <Navigate to={home} replace />;
    }
  }

  // User is authenticated and has correct role - render children
  return children;
}

/**
 * AutoPortal Component
 * 
 * Automatically redirects authenticated users to their role-specific portal
 * Useful for generic /portal entry point
 */
function AutoPortal() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const home = getRoleHomePage(user?.role);
  return <Navigate to={home} replace />;
}

/**
 * Get home page path for a given role
 * 
 * @param {String} role - User role from user_account.role
 * @returns {String} - Path to role's home page
 */
function getRoleHomePage(role) {
  const r = (role || '').toString().toUpperCase();
  const roleRoutes = {
    PATIENT: "/patientportal",
    DOCTOR: "/doctor",
    RECEPTIONIST: "/receptionist",
    NURSE: "/nurse",
    ADMIN: "/admin"
  };

  return roleRoutes[r] || "/patientportal";
}