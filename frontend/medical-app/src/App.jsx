import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import clinicLogo from '/logo.jpg'
import LandingPage from "./components/LandingPage.jsx";
import PatientPortal from "./components/PatientPortal";
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/patientportal" element={<PatientPortal />} />
    </Routes>
  );
}

