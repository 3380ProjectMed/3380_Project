import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Schedule from './Schedule';
import PatientList from './PatientList';
import ClinicalWorkSpace from './ClinicalWorkSpace';
import './DoctorPortal.css';
// import Report from './Report';

/**
 * DoctorPortal - Main container component for the doctor's workspace
 * 
 * This component manages:
 * - Page navigation (dashboard, schedule, patients, clinical)
 * - Shared state between components (selected appointment, current patient)
 * - User authentication/logout
 * 
 * State Management:
 * - currentPage: Which page is currently displayed
 * - selectedAppointment: Currently selected appointment (passed to Clinical workspace)
 * - selectedPatient: Currently selected patient (for patient details)
 */
function DoctorPortal() {
  // Navigation state - controls which page is displayed
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Shared data state - used across multiple components
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedClinicalTab, setSelectedClinicalTab] = useState('notes');

  /**
   * Handle user logout
   * TODO: Implement actual logout logic:
   * - Clear authentication tokens
   * - Clear localStorage/sessionStorage
   * - Call logout API endpoint
   * - Redirect to login page
   */
  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      // Clear any stored data
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('doctorData');
      
      // Redirect to login
      // window.location.href = '/login';
      
      console.log('Logout functionality - implement with your auth system');
    }
  };

  /**
   * Handle appointment selection from Dashboard
   * When user clicks an appointment, navigate to clinical workspace
   */
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage('clinical');
  };

  /**
   * Handle patient selection from PatientList
   * Opens patient details/summary
   */
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    // Could also navigate to clinical workspace with this patient
    // setCurrentPage('clinical');
  };

  /**
   * Navigate back to dashboard
   * Can be called from any child component
   */
  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedAppointment(null);
    setSelectedPatient(null);
  };

  return (
    <div className="doctor-portal">
      {/* 
        Sidebar - Fixed navigation on the left
        Props:
        - currentPage: highlights the active menu item
        - setCurrentPage: function to change pages
        - onLogout: logout handler
      */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
      
      {/* 
        Main Content Area - Changes based on currentPage
        Positioned to the right of the sidebar
      */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard 
            setCurrentPage={setCurrentPage}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        
        {currentPage === 'schedule' && (
          <Schedule 
            onAppointmentClick={handleAppointmentClick}
          />
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
          />
        )}
        {currentPage === 'report' && (
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

export default DoctorPortal;