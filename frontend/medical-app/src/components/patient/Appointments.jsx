import React, { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, ChevronRight, X, User, FileText, Thermometer, Activity } from 'lucide-react';
import './Appointments.css';
import api from '../../patientapi.js';

export default function Appointments(props) {
  const { loading, upcomingAppointments = [], appointmentHistory = [], setShowBookingModal, handleCancelAppointment } = props;
  const [showVisitSummary, setShowVisitSummary] = useState(false);
  const [visitDetails, setVisitDetails] = useState(null);
  const [visitLoading, setVisitLoading] = useState(false);

  const handleViewSummary = async (appointment) => {
    // Only show summary for completed visits
    if (appointment.item_type !== 'Visit') {
      return;
    }

    setVisitLoading(true);
    try {
      const response = await api.visits.getVisitById(appointment.id);
      if (response.success) {
        setVisitDetails(response.data);
        setShowVisitSummary(true);
      }
    } catch (error) {
      console.error('Error fetching visit details:', error);
    } finally {
      setVisitLoading(false);
    }
  };

  return (
    <div className="portal-content">
      <h1 className="page-title">Appointments</h1>

      <button className="btn btn-primary btn-large" onClick={() => setShowBookingModal(true)}>
        <Plus className="icon" /> Book New Appointment
      </button>

      {loading ? (
        <div className="appointments-loading">
          <div className="appointments-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      ) : (
        <>
          {/* UPCOMING APPOINTMENTS SECTION */}
          <div className="patient-appointments-section">
            <h2>Upcoming Appointments</h2>
            {upcomingAppointments.length === 0 ? (
              <div className="appointments-empty-state">
                <Calendar style={{ width: '4rem', height: '4rem', color: 'var(--forth-color)' }} />
                <h3>No Upcoming Appointments</h3>
                <p>You don't have any scheduled appointments at this time.</p>
              </div>
            ) : (
              <div className="appointments-list">
                {upcomingAppointments.map(apt => (
                  <div key={apt.appointment_id} className="appointment-card">
                    {/* LEFT SECTION - Doctor Info */}
                    <div className="appointment-doctor-info">
                      <div className="doctor-avatar">
                        {apt.doctor_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR'}
                      </div>
                      <h3>{apt.doctor_name}</h3>
                      {apt.specialty_name && (
                        <span className="specialty-label">{apt.specialty_name}</span>
                      )}
                    </div>

                    {/* MIDDLE SECTION - Appointment Details */}
                    <div className="appointment-details">
                      <p>
                        <Calendar className="appointments-small-icon" />
                        {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p>
                        <Clock className="appointments-small-icon" />
                        {new Date(apt.appointment_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                      <p>
                        <MapPin className="appointments-small-icon" />
                        {apt.office_name}
                      </p>
                    </div>

                    {/* RIGHT SECTION - Actions */}
                    <div className="appointment-actions">
                      <span className={`patient-status-badge ${apt.status?.toLowerCase?.() ?? 'scheduled'}`}>
                        {apt.status ?? 'Scheduled'}
                      </span>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleCancelAppointment(apt.appointment_id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* APPOINTMENT HISTORY SECTION */}
          <div className="patient-appointments-section">
            <h2>Appointment History</h2>
            {appointmentHistory.length === 0 ? (
              <div className="appointments-empty-state">
                <FileText style={{ width: '4rem', height: '4rem', color: 'var(--forth-color)' }} />
                <h3>No Appointment History</h3>
                <p>Your past appointments will appear here.</p>
              </div>
            ) : (
              <div className="history-list">
                {appointmentHistory.map(apt => (
                  <div key={apt.id} className="history-item">
                    <div className="history-item-content">
                      <h4>{apt.doctor_name}</h4>
                      <p className="history-item-date">
                        {new Date(apt.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="history-item-reason">{apt.reason}</p>
                      {apt.item_type && (
                        <span className="item-type-badge">{apt.item_type}</span>
                      )}
                    </div>
                    {apt.item_type === 'Visit' ? (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleViewSummary(apt)}
                        disabled={visitLoading}
                      >
                        {visitLoading ? 'Loading...' : 'View Summary'} 
                        <ChevronRight className="appointments-small-icon" />
                      </button>
                    ) : (
                      <span className="appointments-text-muted">No summary available</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* VISIT SUMMARY MODAL */}
      {showVisitSummary && visitDetails && (
        <div className="modal-overlay" onClick={() => setShowVisitSummary(false)}>
          <div className="modal-content visit-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FileText className="icon" />
                Visit Summary
              </h2>
              <button className="modal-close" onClick={() => setShowVisitSummary(false)}>
                <X className="icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="visit-info-grid">
                <div className="visit-info-item">
                  <div className="visit-info-label">
                    <Calendar className="appointments-small-icon" /> Date
                  </div>
                  <div className="visit-info-value">
                    {new Date(visitDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className="visit-info-item">
                  <div className="visit-info-label">
                    <User className="appointments-small-icon" /> Doctor
                  </div>
                  <div className="visit-info-value">
                    {visitDetails.doctor_name}
                    {visitDetails.specialty_name && (
                      <div className="patient-specialty">{visitDetails.specialty_name}</div>
                    )}
                  </div>
                </div>

                {visitDetails.office_name && (
                  <div className="visit-info-item">
                    <div className="visit-info-label">
                      <MapPin className="appointments-small-icon" /> Office
                    </div>
                    <div className="visit-info-value">
                      {visitDetails.office_name}
                      {visitDetails.office_address && (
                        <div className="patient-address">{visitDetails.office_address}</div>
                      )}
                    </div>
                  </div>
                )}

                {visitDetails.diagnosis && (
                  <div className="visit-info-item">
                    <div className="visit-info-label">
                      <FileText className="appointments-small-icon" /> Diagnosis
                    </div>
                    <div className="visit-info-value">{visitDetails.diagnosis}</div>
                  </div>
                )}

                {visitDetails.treatment && (
                  <div className="visit-info-item">
                    <div className="visit-info-label">
                      <FileText className="appointments-small-icon" /> Treatment
                    </div>
                    <div className="visit-info-value">{visitDetails.treatment}</div>
                  </div>
                )}

                {visitDetails.temperature && (
                  <div className="visit-info-item">
                    <div className="visit-info-label">
                      <Thermometer className="appointments-small-icon" /> Temperature
                    </div>
                    <div className="visit-info-value">{visitDetails.temperature}°F</div>
                  </div>
                )}

                {visitDetails.blood_pressure && (
                  <div className="visit-info-item">
                    <div className="visit-info-label">
                      <Activity className="appointments-small-icon" /> Blood Pressure
                    </div>
                    <div className="visit-info-value">{visitDetails.blood_pressure} mmHg</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}