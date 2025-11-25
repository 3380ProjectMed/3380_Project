import React from 'react';
import { X } from 'lucide-react';
import './DayAppointmentsModal.css';

function DayAppointmentsModal({ isOpen, onClose, date, appointments, onAppointmentClick }) {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(dateStr);
    let dt;
    if (ymd) {
      const y = parseInt(ymd[1], 10);
      const m = parseInt(ymd[2], 10) - 1;
      const d = parseInt(ymd[3], 10);
      dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' }).format(dt);
    }

    dt = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' }).format(dt);
  };

  const handleAppointmentClick = (appointment) => {
    onClose(); 
    onAppointmentClick(appointment); 
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            Appointments for {formatDate(date)}
          </h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {appointments.length === 0 ? (
            <div className="no-appointments-message">
              <p>No appointments scheduled for this day.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className="appointment-card"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="appointment-card-header">
                    <span className="appointment-card-time">
                      {appointment.appointment_time ? appointment.appointment_time.substring(0, 5) : 'TBD'}
                    </span>
                    <span className="appointment-card-location">
                      {appointment.office_name}
                    </span>
                  </div>
                  <div className="appointment-card-body">
                    <h3 className="appointment-card-patient">
                      {appointment.patient_name || 'Patient'}
                    </h3>
                    {appointment.reason && (
                      <p className="appointment-card-reason">
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                  <div className="appointment-card-footer">
                    <span className="appointment-card-action">
                      Click to view details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DayAppointmentsModal;
