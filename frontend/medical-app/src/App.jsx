// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import PatientPortal from "./components/PatientPortal.jsx";

// Nurse module
import NursePortal from "./components/nurse/NursePortal.jsx";
import NurseDashboard from "./components/nurse/NurseDashboard.jsx";
import NurseIntake from "./components/nurse/NurseIntake.jsx";

import "./App.css";

export default function App() {
  return (
    <Routes>
      {/* Existing app routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/patientportal" element={<PatientPortal />} />

      {/* Nurse routes */}
      <Route path="/nurse" element={<NursePortal />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<NurseDashboard />} />
        <Route path="intake/:appointmentId" element={<NurseIntake />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
