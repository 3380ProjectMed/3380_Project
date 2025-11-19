import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import Sidebar from './Sidebar';
import ReceptionistDashboard from './ReceptionistDashboard';
import OfficeSchedule from './OfficeSchedule';
import PatientSearch from './PatientSearch';
import AppointmentBooking from './AppointmentBooking';
import PaymentProcessing from './PaymentProcessing';
import ReceptionistProfile from './ReceptionistProfile';
import './ReceptionistPortal.css';

/**
 * ReceptionistPortal Component
 * 
 * Main container for receptionist staff portal
 * Handles navigation between different receptionist pages
 * Role: Front desk operations (scheduling, patient check-in, payments)
 * 
 * Database Tables Used:
 * - Staff (Staff_id, staff_email)
 * - work_schedule (staff_id, office_id) - determines receptionist's office
 * - Office (Office_ID, Name)
 * - Appointment (Appointment_id, Patient_id, Doctor_id, Office_id)
 * - Patient (Patient_ID, InsuranceID)
 * - patient_insurance (copay, deductible_individ, coinsurance_rate_pct)
 */
function ReceptionistPortal() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [officeInfo, setOfficeInfo] = useState({ id: null, name: 'Loading...' });
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Fetch receptionist's office from work_schedule via backend API
  useEffect(() => {
    const fetchOfficeInfo = async () => {
      try {
        const response = await fetch('/receptionist_api/dashboard/today.php', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.office) {
          setOfficeInfo({
            id: data.office.id,
            name: data.office.name
          });
        } else {
          console.error('Failed to fetch office info from API');
        }
      } catch (error) {
        console.error('Failed to fetch office info:', error);
      }
    };

    fetchOfficeInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed (continuing to route home):', e);
    } finally {
      navigate('/', { replace: true });
    }
  };

  /**
   * Navigate to appointment booking with pre-selected patient
   * @param {Object} patient - Patient object from Patient table
   */
  const handleBookAppointment = (patient) => {
    setSelectedPatient(patient);
    setCurrentPage('booking');
  };

  /**
   * Navigate to payment processing with selected appointment
   * @param {Object} appointment - Appointment with patient and insurance data
   */
  const handleProcessPayment = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage('payment');
  };

  /**
   * Handle appointment click from schedule
   */
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  /**
   * Handle time slot selection from schedule
   * Navigates to booking page with pre-filled doctor, date, and time
   */
  const handleSelectTimeSlot = (slotData) => {
    setSelectedTimeSlot(slotData);
    setCurrentPage('booking');
  };

  /**
   * Handle editing an existing appointment
   * Navigates to booking page with appointment data for editing
   */
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setCurrentPage('booking');
  };

  return (
    <div className="receptionist-portal">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        officeName={officeInfo.name}
        officeId={officeInfo.id}
      />
      
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <ReceptionistDashboard
            setCurrentPage={setCurrentPage}
            onProcessPayment={handleProcessPayment}
            officeId={officeInfo.id}
            officeName={officeInfo.name}
          />
        )}
        
        {currentPage === 'schedule' && (
          <OfficeSchedule
            onAppointmentClick={handleAppointmentClick}
            onBookAppointment={() => setCurrentPage('booking')}
            onSelectTimeSlot={handleSelectTimeSlot}
            onEditAppointment={handleEditAppointment}
            officeId={officeInfo.id}
            officeName={officeInfo.name}
          />
        )}
        
        {currentPage === 'patients' && (
          <PatientSearch
            onBookAppointment={handleBookAppointment}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
          />
        )}
        
        {currentPage === 'booking' && (
          <AppointmentBooking
            preSelectedPatient={selectedPatient}
            preSelectedTimeSlot={selectedTimeSlot}
            editingAppointment={editingAppointment}
            onBack={() => {
              setCurrentPage('dashboard');
              setSelectedPatient(null);
              setSelectedTimeSlot(null);
              setEditingAppointment(null);
            }}
            onSuccess={() => {
              setCurrentPage('schedule');
              setSelectedPatient(null);
              setSelectedTimeSlot(null);
              setEditingAppointment(null);
            }}
            officeId={officeInfo.id}
            officeName={officeInfo.name}
          />
        )}
        
        {currentPage === 'payment' && (
          <PaymentProcessing
            preSelectedAppointment={selectedAppointment}
            onBack={() => setCurrentPage('dashboard')}
            onSuccess={() => {
              setCurrentPage('dashboard');
              setSelectedAppointment(null);
            }}
            officeId={officeInfo.id}
            officeName={officeInfo.name}
          />
        )}

        {currentPage === 'profile' && (
          <ReceptionistProfile />
        )}
      </main>
    </div>
  );
}

export default ReceptionistPortal;