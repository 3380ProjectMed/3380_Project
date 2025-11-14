// src/components/nurse/NurseSchedule.jsx - SIMPLIFIED with Expandable Cards
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import './NurseSchedule.css';

function NurseSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('all');
  
  // Expanded card state
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    present_illnesses: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

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
    if (expandedCardId === appointment.visit_id) {
      // Collapse if clicking same card
      setExpandedCardId(null);
      resetForm();
    } else {
      // Expand and pre-fill existing vitals
      setExpandedCardId(appointment.visit_id);
      
      const bp = appointment.blood_pressure || '';
      const [systolic, diastolic] = bp.split('/');
      
      setVitalsForm({
        blood_pressure_systolic: systolic || '',
        blood_pressure_diastolic: diastolic || '',
        temperature: appointment.temperature || '',
        present_illnesses: appointment.present_illnesses || ''
      });
      
      setSaveError(null);
    }
  };

  const resetForm = () => {
    setVitalsForm({
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      temperature: '',
      present_illnesses: ''
    });
    setSaveError(null);
  };

  const handleVitalChange = (field, value) => {
    setVitalsForm(prev => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const validateVitals = () => {
    const errors = [];
    const systolic = parseInt(vitalsForm.blood_pressure_systolic);
    const diastolic = parseInt(vitalsForm.blood_pressure_diastolic);
    
    if (vitalsForm.blood_pressure_systolic && (systolic < 70 || systolic > 200)) {
      errors.push('Systolic BP: 70-200 mmHg');
    }
    if (vitalsForm.blood_pressure_diastolic && (diastolic < 40 || diastolic > 130)) {
      errors.push('Diastolic BP: 40-130 mmHg');
    }
    
    const temp = parseFloat(vitalsForm.temperature);
    if (vitalsForm.temperature && (temp < 95 || temp > 106)) {
      errors.push('Temperature: 95-106°F');
    }
    
    return errors;
  };

  const handleSaveVitals = async (visitId) => {
    try {
      const validationErrors = validateVitals();
      if (validationErrors.length > 0) {
        setSaveError(validationErrors.join('. '));
        return;
      }

      const hasVitals = vitalsForm.blood_pressure_systolic || vitalsForm.temperature;
      if (!hasVitals) {
        setSaveError('Please enter at least blood pressure or temperature');
        return;
      }

      setSaving(true);
      setSaveError(null);

      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

      const blood_pressure = (vitalsForm.blood_pressure_systolic && vitalsForm.blood_pressure_diastolic)
        ? `${vitalsForm.blood_pressure_systolic}/${vitalsForm.blood_pressure_diastolic}`
        : null;

      const payload = {
        visit_id: visitId,
        blood_pressure,
        temperature: vitalsForm.temperature || null,
        present_illnesses: vitalsForm.present_illnesses || null
      };

      const response = await fetch(
        `${API_BASE}/nurse_api/vitals/save-vitals.php`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        // Close card and refresh
        setExpandedCardId(null);
        resetForm();
        fetchDailySchedule();
      } else {
        setSaveError(data.error || 'Failed to save vitals');
      }
    } catch (err) {
      console.error('Error saving vitals:', err);
      setSaveError('Network error: ' + err.message);
    } finally {
      setSaving(false);
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
            {!isToday() && (
              <button onClick={goToToday} className="today-button">
                Today
              </button>
            )}
          </div>
          
          <button onClick={goToNextDay} className="nav-button" aria-label="Next day">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Work Schedule Info */}
        {working && work_schedule && (
          <div className="work-info">
            <div className="work-time">
              <Clock size={20} />
              <span>{work_schedule.start_time} - {work_schedule.end_time}</span>
            </div>
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
                {appointments.map((appointment) => {
                  const isExpanded = expandedCardId === appointment.visit_id;
                  
                  return (
                    <div
                      key={appointment.visit_id}
                      className={`patient-card ${appointment.needs_vitals ? 'needs-vitals' : 'vitals-complete'} ${isExpanded ? 'expanded' : ''}`}
                    >
                      {/* Card Header - Always Visible */}
                      <div 
                        className="card-header"
                        onClick={() => handlePatientClick(appointment)}
                        role="button"
                        tabIndex={0}
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

                        {/* Vitals Preview (if recorded and not expanded) */}
                        {!isExpanded && appointment.vitals_recorded && (
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
                          {isExpanded ? (
                            <span>Click to collapse ↑</span>
                          ) : appointment.needs_vitals ? (
                            <span>Click to record vitals →</span>
                          ) : (
                            <span>Click to view/edit vitals →</span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Form - Shows when clicked */}
                      {isExpanded && (
                        <div className="vitals-form">
                          <div className="form-header">
                            <h4>📋 Record Vitals</h4>
                            <button 
                              className="close-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCardId(null);
                                resetForm();
                              }}
                            >
                              <X size={20} />
                            </button>
                          </div>

                          {/* Blood Pressure */}
                          <div className="form-row">
                            <label>Blood Pressure</label>
                            <div className="bp-inputs">
                              <input
                                type="number"
                                placeholder="120"
                                value={vitalsForm.blood_pressure_systolic}
                                onChange={(e) => handleVitalChange('blood_pressure_systolic', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                min="70"
                                max="200"
                              />
                              <span>/</span>
                              <input
                                type="number"
                                placeholder="80"
                                value={vitalsForm.blood_pressure_diastolic}
                                onChange={(e) => handleVitalChange('blood_pressure_diastolic', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                min="40"
                                max="130"
                              />
                              <span className="unit">mmHg</span>
                            </div>
                          </div>

                          {/* Temperature */}
                          <div className="form-row">
                            <label>Temperature</label>
                            <div className="temp-input">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="98.6"
                                value={vitalsForm.temperature}
                                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                min="95"
                                max="106"
                              />
                              <span className="unit">°F</span>
                            </div>
                          </div>

                          {/* Present Illnesses */}
                          <div className="form-row">
                            <label>Present Illnesses / Symptoms</label>
                            <textarea
                              placeholder="Patient reports headache, dizziness..."
                              value={vitalsForm.present_illnesses}
                              onChange={(e) => handleVitalChange('present_illnesses', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              rows={3}
                            />
                          </div>

                          {/* Error Message */}
                          {saveError && (
                            <div className="form-error">
                              <AlertCircle size={16} />
                              <span>{saveError}</span>
                            </div>
                          )}

                          {/* Save Button */}
                          <button
                            className="save-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveVitals(appointment.visit_id);
                            }}
                            disabled={saving}
                          >
                            {saving ? (
                              <>Saving...</>
                            ) : (
                              <>
                                <Save size={18} />
                                Save Vitals
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NurseSchedule;