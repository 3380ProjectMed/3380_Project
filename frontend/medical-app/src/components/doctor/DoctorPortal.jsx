import React, { useState } from 'react';
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

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      console.log('Logging out...');
      // Add logout logic here
    }
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
            onAppointmentClick={(apt) => {
              setSelectedAppointment(apt);
              setCurrentPage('clinical');
            }}
          />
        )}
        
        {currentPage === 'schedule' && (
          <Schedule 
            onAppointmentClick={(apt) => {
              setSelectedAppointment(apt);
              setCurrentPage('clinical');
            }}
          />
        )}
        
        {currentPage === 'patients' && <PatientList />}
        
        {currentPage === 'clinical' && (
          <ClinicalWorkSpace 
            appointment={selectedAppointment}
            onBack={handleBackToDashboard}
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