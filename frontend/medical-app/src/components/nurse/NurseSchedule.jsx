import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import NurseClinicalWorkspace from './NurseClinicalWorkSpace';
import NurseVitalsModal from './NurseVitalsModal';
import './NurseSchedule.css';

function NurseSchedule() {
  const getCurrentChicagoTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
  };

  const formatChicagoDate = (date, options = {}) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      ...options
    }).format(new Date(date));
  };

  const formatTimeStringChicago = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const [currentDate, setCurrentDate] = useState(getCurrentChicagoTime());
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Clinical workspace state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showClinicalWorkspace, setShowClinicalWorkspace] = useState(false);
  
  // Enhanced vitals modal state
  const [showEnhancedVitalsModal, setShowEnhancedVitalsModal] = useState(false);

  const currentDateStr = useMemo(
    () => currentDate.toISOString().split('T')[0],
    [currentDate]
  );

  useEffect(() => {
    fetchDailySchedule();
  }, [currentDate]);

  const fetchDailySchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

      const response = await fetch(
        `${API_BASE}/nurse_api/schedule/get-nurse-daily-schedule.php?date=${currentDateStr}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch schedule`);
      }

      const data = await response.json();

      if (data.success) {
        setScheduleData(data);
      } else {
        setError(data.error || 'Failed to load schedule');
      }
    } catch (err) {
      console.error('Error fetching nurse schedule:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = (appointment) => {
    setSelectedPatient({
      visit_id: appointment.visit_id,
      appointment_id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      patient_name: appointment.patient_name,
      // Add more appointment data for the enhanced modal
      patient_first_name: appointment.patient_name?.split(' ')[0] || '',
      patient_last_name: appointment.patient_name?.split(' ')[1] || '',
      appointment_date: appointment.appointment_date,
      office_name: appointment.office_name
    });
    
    // Use the enhanced vitals modal by default
    // You can add a toggle or preference here to switch between interfaces
    setShowEnhancedVitalsModal(true);
  };

  const handleCloseClinicalWorkspace = () => {
    setShowClinicalWorkspace(false);
    setSelectedPatient(null);
  };

  const handleCloseEnhancedVitalsModal = () => {
    setShowEnhancedVitalsModal(false);
    setSelectedPatient(null);
  };

  const handleVitalsSaved = (visitId) => {
    fetchDailySchedule();
    console.log('Vitals saved for visit:', visitId);
  };

  const handleEnhancedVitalsSaved = (data) => {
    fetchDailySchedule();
    console.log('Enhanced vitals saved:', data);
    handleCloseEnhancedVitalsModal();
  };

  const goToPreviousDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(getCurrentChicagoTime());
  };

  const handleDateSelect = (e) => {
    const selectedDate = new Date(e.target.value + 'T00:00:00');
    setCurrentDate(selectedDate);
    setShowCalendar(false);
  };

  const getAppointmentsToDisplay = () => {
    if (!scheduleData?.appointments) return [];
    switch (selectedView) {
      case 'needs_vitals':
        return scheduleData.appointments.waiting_for_vitals || [];
      case 'ready':
        return scheduleData.appointments.ready_for_doctor || [];
      default:
        return scheduleData.appointments.all || [];
    }
  };

  const formatDate = (date) =>
    formatChicagoDate(date, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const isToday = () => {
    const today = getCurrentChicagoTime();
    return formatChicagoDate(currentDate, {year: 'numeric', month: '2-digit', day: '2-digit'}) === 
           formatChicagoDate(today, {year: 'numeric', month: '2-digit', day: '2-digit'});
  };

  // Show clinical workspace as full-screen overlay
  if (showClinicalWorkspace) {
    return (
      <NurseClinicalWorkspace
        selectedPatient={selectedPatient}
        onClose={handleCloseClinicalWorkspace}
        onSave={handleVitalsSaved}
      />
    );
  }

  // Show enhanced vitals modal (new workflow)
  if (showEnhancedVitalsModal && selectedPatient) {
    return (
      <div className="nurse-schedule">
        {/* Background content */}
        <div className="schedule-content" style={{ filter: 'blur(2px)', pointerEvents: 'none' }}>
          <div className="schedule-header">
            <h1>Schedule - Enhanced Vitals Modal Active</h1>
          </div>
        </div>
        
        {/* Enhanced Vitals Modal */}
        <NurseVitalsModal
          patient={{
            first_name: selectedPatient.patient_first_name,
            last_name: selectedPatient.patient_last_name,
            name: selectedPatient.patient_name
          }}
          appointment={{
            Appointment_date: selectedPatient.appointment_date,
            office_name: selectedPatient.office_name
          }}
          appointmentId={selectedPatient.appointment_id}
          visitId={selectedPatient.visit_id}
          patientId={selectedPatient.patient_id}
          onClose={handleCloseEnhancedVitalsModal}
          onSaved={handleEnhancedVitalsSaved}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="nurse-schedule loading">
        <div className="loading-spinner">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nurse-schedule error">
        <div className="error-message">
          <AlertCircle size={48} />
          <h2>Error Loading Schedule</h2>
          <p>{error}</p>
          <button onClick={fetchDailySchedule}>Retry</button>
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="nurse-schedule error">
        <div className="error-message">
          <AlertCircle size={48} />
          <h2>No Schedule Data</h2>
          <p>Unable to load schedule information</p>
        </div>
      </div>
    );
  }

  const appointments = getAppointmentsToDisplay();
  const { working, work_schedule, summary } = scheduleData;

  return (
    <div className="nurse-schedule">
      {/* Header with Date Navigation */}
      <div className="schedule-header">
        <div className="date-navigation">
          <button onClick={goToPreviousDay} className="nav-button" aria-label="Previous day">
            <ChevronLeft size={24} />
          </button>
          
          <div className="date-display">
            <h1>{formatDate(currentDate)}</h1>
            <div className="date-actions">
              {!isToday() && (
                <button onClick={goToToday} className="today-button">
                  Today
                </button>
              )}
              <button 
                onClick={() => setShowCalendar(!showCalendar)} 
                className="calendar-button"
                aria-label="Select date"
              >
                <Calendar size={18} />
                Select Date
              </button>
            </div>
            
            {/* Calendar Picker Dropdown */}
            {showCalendar && (
              <div className="calendar-dropdown">
                <input
                  type="date"
                  value={currentDateStr}
                  onChange={handleDateSelect}
                  className="date-picker"
                />
              </div>
            )}
          </div>
          
          <button onClick={goToNextDay} className="nav-button" aria-label="Next day">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Work Schedule Info */}
        {working && work_schedule && (
          <div className="work-info">
            <div className="work-location">
              <span className="office-badge">{work_schedule.office_name}</span>
              <span className="office-address">{work_schedule.city}, {work_schedule.state}</span>
            </div>
          </div>
        )}
      </div>

      {/* Not Working Today */}
      {!working && (
        <div className="not-working-message">
          <Clock size={48} />
          <h2>Not Scheduled</h2>
          <p>You are not scheduled to work on {scheduleData.day_of_week}</p>
        </div>
      )}

      {/* Working - Show Patient Queue */}
      {working && (
        <>
          {/* Summary Stats */}
          <div className="schedule-summary">
            <div className="stat-card">
              <Users size={24} />
              <div className="stat-content">
                <span className="stat-value">{summary.total}</span>
                <span className="stat-label">Total Patients</span>
              </div>
            </div>
            <div className="stat-card warning">
              <AlertCircle size={24} />
              <div className="stat-content">
                <span className="stat-value">{summary.needs_vitals}</span>
                <span className="stat-label">Need Vitals</span>
              </div>
            </div>
            <div className="stat-card success">
              <CheckCircle size={24} />
              <div className="stat-content">
                <span className="stat-value">{summary.completed_vitals}</span>
                <span className="stat-label">Ready for Doctor</span>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="view-filters">
            <button
              className={`filter-tab ${selectedView === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedView('all')}
            >
              All Patients ({summary.total})
            </button>
            <button
              className={`filter-tab ${selectedView === 'needs_vitals' ? 'active' : ''}`}
              onClick={() => setSelectedView('needs_vitals')}
            >
              <AlertCircle size={16} />
              Need Vitals ({summary.needs_vitals})
            </button>
            <button
              className={`filter-tab ${selectedView === 'ready' ? 'active' : ''}`}
              onClick={() => setSelectedView('ready')}
            >
              <CheckCircle size={16} />
              Ready ({summary.completed_vitals})
            </button>
          </div>

          {/* Patient Queue */}
          <div className="patient-queue">
            {appointments.length === 0 ? (
              <div className="empty-queue">
                <Users size={48} />
                <h3>No Patients Yet</h3>
                <p>
                  {selectedView === 'needs_vitals' && 'No patients waiting for vitals'}
                  {selectedView === 'ready' && 'No patients ready for doctor'}
                  {selectedView === 'all' && 'No patients assigned to you today'}
                </p>
              </div>
            ) : (
              <div className="patient-cards">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.visit_id}
                    className={`patient-card ${appointment.needs_vitals ? 'needs-vitals' : 'vitals-complete'}`}
                    onClick={() => handlePatientClick(appointment)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handlePatientClick(appointment);
                    }}
                  >
                    {/* Appointment Number and Status */}
                    <div className="card-header">
                      <div className="appointment-number">
                        <span className="appt-id-badge">#{appointment.appointment_id}</span>
                      </div>
                      <div className="card-status">
                        {appointment.needs_vitals ? (
                          <span className="status-badge warning">
                            <AlertCircle size={16} />
                            Needs Vitals
                          </span>
                        ) : (
                          <span className="status-badge success">
                            <CheckCircle size={16} />
                            Ready
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="appointment-time">
                      <Clock size={18} />
                      <span>{formatTimeStringChicago(appointment.appointment_time)}</span>
                    </div>

                    {/* Patient Info */}
                    <div className="patient-info">
                      <h3>{appointment.patient_name}</h3>
                      <div className="patient-meta">
                        <span>{appointment.age}y</span>
                        <span>•</span>
                        <span>{appointment.gender}</span>
                      </div>
                    </div>

                    {/* Doctor Assignment */}
                    <div className="doctor-info">
                      <div className="doctor-name">
                        <strong>Dr. {appointment.doctor_name?.split(' ').pop()}</strong>
                      </div>
                      <div className="doctor-specialty">{appointment.specialty}</div>
                    </div>

                    {/* Reason */}
                    <div className="visit-reason">
                      <strong>Symptoms:</strong>
                      <p>{appointment.reason || 'Not specified'}</p>
                    </div>

                    {/* Vitals Preview (if recorded) */}
                    {appointment.vitals_recorded && (
                      <div className="vitals-preview">
                        {appointment.blood_pressure && (
                          <span className="vital">
                            <strong>BP:</strong> {appointment.blood_pressure}
                          </span>
                        )}
                        {appointment.temperature && (
                          <span className="vital">
                            <strong>Temp:</strong> {appointment.temperature}°F
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Hint */}
                    <div className="card-action">
                      {appointment.needs_vitals ? (
                        <span>Click to record vitals →</span>
                      ) : (
                        <span>Click to view details →</span>
                      )}
                    </div>
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

export default NurseSchedule;