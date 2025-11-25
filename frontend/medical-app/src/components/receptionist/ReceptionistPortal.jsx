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

function ReceptionistPortal() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [officeInfo, setOfficeInfo] = useState({ id: null, name: 'Loading...' });

  const { logout, user } = useAuth();
  const navigate = useNavigate();

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

  const handleBookAppointment = (patient) => {
    setSelectedPatient(patient);
    setCurrentPage('booking');
  };

  const handleProcessPayment = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPage('payment');
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleSelectTimeSlot = (slotData) => {
    setSelectedTimeSlot(slotData);
    setCurrentPage('booking');
  };

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