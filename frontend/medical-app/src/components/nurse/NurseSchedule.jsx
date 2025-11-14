import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import './NurseSchedule.css';

function NurseSchedule({ onPatientClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('all');

  // NEW: optional time filter (HH:MM, empty means “use shift times”)
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const currentDateStr = useMemo(
    () => currentDate.toISOString().split('T')[0],
    [currentDate]
  );

  useEffect(() => {
    fetchDailySchedule();
  }, [currentDate, startTime, endTime]);

  const fetchDailySchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ date: currentDateStr });
      if (startTime) params.append('start_time', startTime); // backend adds :00 if needed
      if (endTime)   params.append('end_time',   endTime);

      const API_BASE =
        (import.meta.env && import.meta.env.VITE_API_BASE)
          ? import.meta.env.VITE_API_BASE
          : '';

      const response = await fetch(
        `${API_BASE}/nurse_api/schedule/get-nurse-daily-schedule.php?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch schedule`);
      }

      const data = await response.json();

      if (data.success) {
        setScheduleData(data);

        // If no explicit filter set, default the time pickers to current filter
        if (!startTime && data.time_filter?.start) {
          setStartTime(data.time_filter.start);
        }
        if (!endTime && data.time_filter?.end) {
          setEndTime(data.time_filter.end);
        }
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
    setCurrentDate(new Date());
  };

  const handleDateChange = (e) => {
    const value = e.target.value; // "YYYY-MM-DD"
    if (!value) return;
    // Force midnight in local time
    setCurrentDate(new Date(value + 'T00:00:00'));
  };

  const handlePatientClick = (appointment) => {
    if (onPatientClick) {
      onPatientClick({
        visit_id: appointment.visit_id,
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        patient_name: appointment.patient_name,
      });
    }
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
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  // --- loading / error states unchanged ---
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
      {/* Header with Date Navigation + Date Picker */}
      <div className="schedule-header">
        <div className="date-navigation">
          <button
            onClick={goToPreviousDay}
            className="nav-button"
            aria-label="Previous day"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="date-display">
            <h1>{formatDate(currentDate)}</h1>
            <div className="date-controls">
              <input
                type="date"
                value={currentDateStr}
                onChange={handleDateChange}
              />
              {!isToday() && (
                <button onClick={goToToday} className="today-button">
                  Today
                </button>
              )}
            </div>
          </div>

          <button
            onClick={goToNextDay}
            className="nav-button"
            aria-label="Next day"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Work Schedule Info + Time Filters */}
        {working && work_schedule && (
          <div className="work-info">
            <div className="work-time">
              <Clock size={20} />
              <span>
                {work_schedule.start_time} - {work_schedule.end_time}
              </span>
            </div>
            <div className="work-location">
              <span className="office-badge">{work_schedule.office_name}</span>
              <span className="office-address">
                {work_schedule.city}, {work_schedule.state}
              </span>
            </div>

            {/* NEW: Time range filter */}
            <div className="time-filter">
              <label>
                From:
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label>
                To:
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
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
                    {/* Status Indicator */}
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

                    {/* Time */}
                    <div className="appointment-time">
                      <Clock size={18} />
                      <span>{appointment.appointment_time}</span>
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
                      <strong>Chief Complaint:</strong>
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