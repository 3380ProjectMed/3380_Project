import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';

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
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed (continuing to route home):', e);
    } finally {
      navigate('/', { replace: true });
    }
  };

  const handleAppointmentClick = async (appointment) => {
    // Store the appointment for reference
    setSelectedAppointment(appointment);
    setCurrentPage('clinical');

    // Try to infer a patient identifier from common appointment fields
    const rawPatientId = appointment?.patientId || 
                        appointment?.Patient_id || 
                        appointment?.patient_id || 
                        appointment?.PatientID || 
                        appointment?.patientID || 
                        appointment?.PatientId || 
                        appointment?.Patient || 
                        null;

    // Optionally fetch patient details (though ClinicalWorkSpace will fetch it via appointmentId)
    if (rawPatientId) {
      try {
        const numericMatch = String(rawPatientId).match(/(\d+)/);
        const useIdParam = /\D/.test(String(rawPatientId));
        const param = useIdParam 
          ? `id=${encodeURIComponent(String(rawPatientId))}` 
          : `patient_id=${encodeURIComponent(numericMatch ? numericMatch[0] : String(rawPatientId))}`;

        const res = await fetch(`/doctor_api/patients/get-by-id.php?${param}`, { 
          credentials: 'include' 
        });
        const json = await res.json();
        
        if (json && json.success) {
          setSelectedPatient(json.patient);
        } else {
          console.warn('Patient fetch failed', json?.error);
          setSelectedPatient(null);
        }
      } catch (e) {
        console.error('Failed to fetch patient for appointment', e);
        setSelectedPatient(null);
      }
    } else {
      setSelectedPatient(null);
    }
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedAppointment(null);
    setSelectedPatient(null);
  };

  // Extract appointmentId from selectedAppointment
  const getAppointmentId = () => {
    if (!selectedAppointment) return null;
    
    // Try different possible field names for appointment ID
    let apptId = selectedAppointment.appointment_id || 
                 selectedAppointment.Appointment_id || 
                 selectedAppointment.appointmentId || 
                 selectedAppointment.id ||
                 null;
    
    // Strip the "A" prefix if present (e.g., "A1002" -> "1002")
    if (apptId && typeof apptId === 'string') {
      apptId = apptId.replace(/^A/i, '');
    }
    
    return apptId;
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
            setCurrentPage={setCurrentPage}  
          />
        )}

        {currentPage === 'clinical' && selectedAppointment && (
          <ClinicalWorkSpace
            appointmentId={getAppointmentId()}
            onClose={handleBackToDashboard}
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