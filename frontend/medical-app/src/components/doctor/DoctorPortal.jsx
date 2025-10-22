import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx'; // <-- adjust path if needed

import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Schedule from './Schedule';
import PatientList from './PatientList';
import ClinicalWorkSpace from './ClinicalWorkSpace';
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

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage('clinical');
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedAppointment(null);
    setSelectedPatient(null);
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

        {currentPage === 'report' && (
          <ClinicalWorkSpace
            appointment={selectedAppointment}
            patient={selectedPatient}
            onBack={handleBackToDashboard}
            selectedTab={selectedClinicalTab}
            setSelectedTab={setSelectedClinicalTab}
          />
        )}
      </main>
    </div>
  );
}

export default DoctorPortal;
