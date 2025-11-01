import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx'; // <-- adjust path if needed

import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Schedule from './Schedule';
import PatientList from './PatientList';
import ClinicalWorkSpace from './ClinicalWorkSpace';
import Reports from './Report';     
import Profile from './Profile';    
import Referral from './Referral';
import './DoctorPortal.css';

function DoctorPortal() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedClinicalTab, setSelectedClinicalTab] = useState('notes');

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;

    try {
      await logout();           // calls /api/logout.php
    } catch (e) {
      console.warn('Logout failed (continuing to route home):', e);
    } finally {
      navigate('/', { replace: true }); // back to LandingPage
    }
  };

  const handleAppointmentClick = async (appointment) => {
    // Immediately set selected appointment so UI navigates quickly
    setSelectedAppointment(appointment);
    setCurrentPage('clinical');

    // Try to infer a patient identifier from common appointment fields
    const rawPatientId = appointment?.patientId || appointment?.Patient_id || appointment?.patient_id || appointment?.PatientID || appointment?.patientID || appointment?.PatientID || appointment?.PatientId || appointment?.Patient || null;

    // If a patient id-like value exists, request patient details from backend
    if (rawPatientId) {
      try {
        // The backend accepts either numeric patient_id or an id like 'P001' via `id`.
        // Prefer sending `id` when the raw value contains non-digits, otherwise send `patient_id`.
        const numericMatch = String(rawPatientId).match(/(\d+)/);
        const useIdParam = /\D/.test(String(rawPatientId));
        const param = useIdParam ? `id=${encodeURIComponent(String(rawPatientId))}` : `patient_id=${encodeURIComponent(numericMatch ? numericMatch[0] : String(rawPatientId))}`;

        const res = await fetch(`/doctor_api/patients/get-by-id.php?${param}`, { credentials: 'include' });
        const json = await res.json();
        if (json && json.success) {
          setSelectedPatient(json.patient);
        } else {
          // If patient not found, clear or leave as null
          console.warn('Patient fetch failed', json?.error);
          setSelectedPatient(null);
        }
      } catch (e) {
        console.error('Failed to fetch patient for appointment', e);
        setSelectedPatient(null);
      }
    } else {
      // No patient identifier available on the appointment object
      setSelectedPatient(null);
    }
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedAppointment(null);
  };

  return (
    <div className="doctor-portal">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard
            setCurrentPage={setCurrentPage}
            onAppointmentClick={handleAppointmentClick}
          />
        )}

        {currentPage === 'schedule' && (
          <Schedule onAppointmentClick={handleAppointmentClick} />
        )}

        {currentPage === 'patients' && (
          <PatientList
            onPatientClick={handlePatientClick}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
          />
        )}

        {currentPage === 'clinical' && (
          <ClinicalWorkSpace
            appointment={selectedAppointment}
            patient={selectedPatient}
            onBack={handleBackToDashboard}
            selectedTab={selectedClinicalTab}
            setSelectedTab={setSelectedClinicalTab}
          />
        )}

        {currentPage === 'reports' && <Reports />}  
  {currentPage === 'referrals' && <Referral />}
  {currentPage === 'profile' && <Profile />}  
      </main>
    </div>
  );
}

export default DoctorPortal;
