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
                      {apt.item_type && <span className="item-type-badge">{apt.item_type}</span>}
                    </div>
                    {apt.item_type === 'Visit' ? (
                      <button 
                        className="btn btn-link" 
                        onClick={() => handleViewSummary(apt)}
                        disabled={visitLoading}
                      >
                        {visitLoading ? 'Loading...' : 'View Summary'} <ChevronRight className="small-icon" />
                      </button>
                    ) : (
                      <span className="text-muted">No summary available</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Visit Summary Modal */}
      {showVisitSummary && visitDetails && (
        <div className="modal-overlay" onClick={() => setShowVisitSummary(false)}>
          <div className="modal-content visit-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Visit Summary</h2>
              <button className="modal-close" onClick={() => setShowVisitSummary(false)}>
                <X className="icon" />
              </button>
            </div>
            <div className="modal-body">
              <div className="visit-info-grid">
                <div className="visit-info-item">
                  <div className="info-label">
                    <Calendar className="small-icon" /> Date
                  </div>
                  <div className="info-value">
                    {new Date(visitDetails.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="visit-info-item">
                  <div className="info-label">
                    <User className="small-icon" /> Doctor
                  </div>
                  <div className="info-value">
                    {visitDetails.doctor_name}
                    {visitDetails.specialty_name && (
                      <div className="specialty">{visitDetails.specialty_name}</div>
                    )}
                  </div>
                </div>

                {visitDetails.office_name && (
                  <div className="visit-info-item">
                    <div className="info-label">
                      <MapPin className="small-icon" /> Office
                    </div>
                    <div className="info-value">
                      {visitDetails.office_name}
                      {visitDetails.office_address && (
                        <div className="address">{visitDetails.office_address}</div>
                      )}
                    </div>
                  </div>
                )}

                {visitDetails.diagnosis && (
                  <div className="visit-info-item">
                    <div className="info-label">
                      <FileText className="small-icon" /> Diagnosis
                    </div>
                    <div className="info-value">{visitDetails.diagnosis}</div>
                  </div>
                )}

                {visitDetails.treatment && (
                  <div className="visit-info-item">
                    <div className="info-label">
                      <FileText className="small-icon" /> Treatment
                    </div>
                    <div className="info-value">{visitDetails.treatment}</div>
                  </div>
                )}

                {visitDetails.temperature && (
                  <div className="visit-info-item">
                    <div className="info-label">
                      <Thermometer className="small-icon" /> Temperature
                    </div>
                    <div className="info-value">{visitDetails.temperature}°F</div>
                  </div>
                )}

                {visitDetails.blood_pressure && (
                  <div className="visit-info-item">
                    <div className="info-label">
                      <Activity className="small-icon" /> Blood Pressure
                    </div>
                    <div className="info-value">{visitDetails.blood_pressure} mmHg</div>
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
