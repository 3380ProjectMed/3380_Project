import React from 'react';
import { Plus, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import './Appointments.css';

export default function Appointments(props) {
  const { loading, upcomingAppointments = [], appointmentHistory = [], setShowBookingModal, handleCancelAppointment } = props;

  return (
    <div className="portal-content">
      <h1 className="page-title">Appointments</h1>

      <button className="btn btn-primary btn-large" onClick={() => setShowBookingModal(true)}>
        <Plus className="icon" /> Book New Appointment
      </button>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="appointments-section">
            <h2>Upcoming Appointments</h2>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray">No upcoming appointments</p>
            ) : (
              <div className="appointments-list">
                {upcomingAppointments.map(apt => (
                  <div key={apt.appointment_id} className="appointment-card">
                    <div className="appointment-header">
                      <div>
                        <h3>{apt.doctor_name}</h3>
                        <p>{apt.specialty_name}</p>
                      </div>
                      <span className={`status-badge ${apt.status?.toLowerCase?.() ?? 'scheduled'}`}>
                        {apt.status ?? 'Scheduled'}
                      </span>
                    </div>
                    <div className="appointment-body">
                      <p><Calendar className="small-icon" /> {new Date(apt.appointment_date).toLocaleDateString()}</p>
                      <p><Clock className="small-icon" /> {new Date(apt.appointment_date).toLocaleTimeString()}</p>
                      <p><MapPin className="small-icon" /> {apt.office_name}</p>
                    </div>
                    <div className="appointment-footer">
                      <button className="btn btn-danger btn-small" onClick={() => handleCancelAppointment(apt.appointment_id)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="appointments-section">
            <h2>Appointment History</h2>
            {appointmentHistory.length === 0 ? (
              <p className="text-gray">No appointment history</p>
            ) : (
              <div className="history-list">
                {appointmentHistory.map(apt => (
                  <div key={apt.id} className="history-item">
                    <div>
                      <h4>{apt.doctor_name}</h4>
                      <p>{new Date(apt.date).toLocaleDateString()} — {apt.reason}</p>
                    </div>
                    <button className="btn btn-link">View Summary <ChevronRight className="small-icon" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
