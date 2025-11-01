import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Clock, AlertCircle, FileText, Activity,
  Heart, Thermometer, Droplet, Pill, History, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';
import './ClinicalWorkSpace.css';

export default function ClinicalWorkSpace({ appointmentId, onClose }) {
  const [patientData, setPatientData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    vitals: true,
    currentMedications: true,
    chronicConditions: true,
    medicalHistory: false,
    medicationHistory: false,
    previousNotes: false
  });

  useEffect(() => {
    if (appointmentId) {
      fetchPatientDetails();
      fetchNotes();
    }
  }, [appointmentId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-patient-details.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      if (data.success) {
        setPatientData(data);
        // Pre-populate diagnosis if exists
        if (data.visit && data.visit.diagnosis) {
          setDiagnosis(data.visit.diagnosis);
        }
        // Pre-populate note if exists
        if (data.visit && data.visit.treatment) {
          setActiveNote(data.visit.treatment);
        }
      } else if (data.has_visit === false) {
        // Patient hasn't checked in yet - fetch basic patient info
        await fetchBasicPatientInfo();
      } else {
        throw new Error(data.error || 'Failed to load patient data');
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError(err.message || 'Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch basic patient information when no visit exists yet
   */
  const fetchBasicPatientInfo = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

      // First get patient_id from appointment
      const aptResponse = await fetch(
        `${API_BASE}/doctor_api/appointments/get.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );

      if (!aptResponse.ok) {
        throw new Error('Could not fetch appointment details');
      }

      const aptData = await aptResponse.json();
      
      if (aptData.success && aptData.appointment) {
        const patientId = aptData.appointment.patient_id || aptData.appointment.Patient_id;
        
        // Now fetch patient basic info
        const patResponse = await fetch(
          `${API_BASE}/doctor_api/patients/get-by-id.php?patient_id=${patientId}`,
          { credentials: 'include' }
        );

        if (!patResponse.ok) {
          throw new Error('Could not fetch patient information');
        }

        const patData = await patResponse.json();
        
        if (patData.success && patData.patient) {
          // Structure the data to match expected format
          setPatientData({
            success: true,
            has_visit: false,
            visit: {
              appointment_id: appointmentId,
              patient_id: patientId,
              reason: aptData.appointment.reason || aptData.appointment.Reason_for_visit || '',
              status: null,
              diagnosis: null,
              treatment: null
            },
            vitals: {
              blood_pressure: null,
              temperature: null,
              recorded_by: null
            },
            patient: {
              id: patientId,
              name: patData.patient.name,
              dob: patData.patient.dob,
              age: patData.patient.age,
              gender: patData.patient.gender,
              blood_type: patData.patient.bloodType || patData.patient.blood_type,
              allergies: patData.patient.allergies,
              medicalHistory: patData.patient.medicalHistory || [],
              medicationHistory: patData.patient.medicationHistory || [],
              chronicConditions: patData.patient.chronicConditions || [],
              currentMedications: patData.patient.currentMedications || []
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching basic patient info:', err);
      setError('Patient has not checked in yet. Basic information unavailable.');
    }
  };

  const fetchNotes = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-notes.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote.trim()) {
      alert('Please enter a note before saving');
      return;
    }

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const payload = {
        appointment_id: appointmentId,
        note_text: activeNote,
        diagnosis: diagnosis || null
      };

      if (patientData?.visit?.visit_id) {
        payload.visit_id = patientData.visit.visit_id;
      }

      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/save-note.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('Note saved successfully!');
        fetchNotes();
        fetchPatientDetails();
      } else {
        throw new Error(data.error || 'Failed to save note');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Error saving note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="clinical-workspace">
        <div className="workspace-loading">
          <div className="spinner"></div>
          <p>Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (error && !patientData) {
    return (
      <div className="clinical-workspace">
        <div className="workspace-header">
          <h2>Clinical Workspace</h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>
        <div className="workspace-error">
          <AlertCircle size={48} />
          <h3>Unable to Load Patient Information</h3>
          <p>{error}</p>
          <button onClick={fetchPatientDetails} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const patient = patientData?.patient;
  const visit = patientData?.visit;
  const vitals = patientData?.vitals;
  const hasVisit = patientData?.has_visit !== false;

  return (
    <div className="clinical-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="header-info">
          <h2>
            <User size={24} />
            {patient?.name || 'Patient'}
          </h2>
          <div className="patient-meta">
            <span>{patient?.age} years old</span>
            <span>•</span>
            <span>{patient?.gender || 'Unknown'}</span>
            <span>•</span>
            <span>Blood Type: {patient?.blood_type || 'Unknown'}</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-close">
          <X size={20} />
        </button>
      </div>

      <div className="workspace-content">
        {/* Left Column - Patient Information */}
        <div className="workspace-column left-column">
          
          {/* Visit Information */}
          <div className="info-card">
            <h3><Calendar size={20} /> Visit Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Reason for Visit:</span>
                <span className="value">{visit?.reason || 'Not specified'}</span>
              </div>
              {hasVisit && visit?.status && (
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className="value status-badge">{visit.status}</span>
                </div>
              )}
              {!hasVisit && (
                <div className="info-item warning">
                  <AlertCircle size={16} />
                  <span>Patient has not checked in yet. Vitals will be available after check-in.</span>
                </div>
              )}
            </div>
          </div>

          {/* Vitals - Only show if patient has checked in */}
          {hasVisit && (
            <div className="info-card collapsible">
              <div className="card-header" onClick={() => toggleSection('vitals')}>
                <h3><Activity size={20} /> Vital Signs</h3>
                {expandedSections.vitals ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.vitals && (
                <div className="vitals-grid">
                  <div className="vital-item">
                    <Heart className="vital-icon bp" size={24} />
                    <div>
                      <span className="vital-label">Blood Pressure</span>
                      <span className="vital-value">{vitals?.blood_pressure || 'Not recorded'}</span>
                    </div>
                  </div>
                  <div className="vital-item">
                    <Thermometer className="vital-icon temp" size={24} />
                    <div>
                      <span className="vital-label">Temperature</span>
                      <span className="vital-value">{vitals?.temperature ? `${vitals.temperature}°F` : 'Not recorded'}</span>
                    </div>
                  </div>
                  {vitals?.recorded_by && (
                    <div className="vital-footer">
                      Recorded by: {vitals.recorded_by}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Allergies */}
          <div className="info-card alert-card">
            <h3><AlertCircle size={20} /> Allergies</h3>
            <p className="allergy-text">{patient?.allergies || 'No known allergies'}</p>
          </div>

          {/* Current Medications */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('currentMedications')}>
              <h3><Pill size={20} /> Current Medications</h3>
              {expandedSections.currentMedications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.currentMedications && (
              <div className="medications-list">
                {patient?.currentMedications && patient.currentMedications.length > 0 ? (
                  patient.currentMedications.map((med, idx) => (
                    <div key={idx} className="medication-item">
                      <div className="med-name">{med.name}</div>
                      <div className="med-details">{med.frequency}</div>
                      {med.prescribed_by && (
                        <div className="med-prescriber">Prescribed by: {med.prescribed_by}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No current medications</p>
                )}
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('chronicConditions')}>
              <h3><FileText size={20} /> Chronic Conditions</h3>
              {expandedSections.chronicConditions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.chronicConditions && (
              <div className="conditions-list">
                {patient?.chronicConditions && patient.chronicConditions.length > 0 ? (
                  <ul>
                    {patient.chronicConditions.map((condition, idx) => (
                      <li key={idx}>{condition}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No chronic conditions recorded</p>
                )}
              </div>
            )}
          </div>

          {/* Medical History */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('medicalHistory')}>
              <h3><History size={20} /> Medical History</h3>
              {expandedSections.medicalHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.medicalHistory && (
              <div className="history-list">
                {patient?.medicalHistory && patient.medicalHistory.length > 0 ? (
                  patient.medicalHistory.map((item, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-condition">{item.condition}</div>
                      <div className="history-date">{item.diagnosis_date || 'Date unknown'}</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No medical history available</p>
                )}
              </div>
            )}
          </div>

          {/* Medication History */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('medicationHistory')}>
              <h3><Pill size={20} /> Medication History</h3>
              {expandedSections.medicationHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.medicationHistory && (
              <div className="med-history-list">
                {patient?.medicationHistory && patient.medicationHistory.length > 0 ? (
                  patient.medicationHistory.map((med, idx) => (
                    <div key={idx} className="med-history-item">
                      <div className="med-name">{med.drug}</div>
                      <div className="med-notes">{med.notes}</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No medication history available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Clinical Notes */}
        <div className="workspace-column right-column">
          
          {/* Diagnosis Section */}
          <div className="notes-card">
            <h3><FileText size={20} /> Diagnosis</h3>
            <textarea
              className="diagnosis-input"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis..."
              rows={2}
              disabled={!hasVisit}
            />
            {!hasVisit && (
              <p className="input-warning">
                <AlertCircle size={14} /> Patient must check in before adding diagnosis
              </p>
            )}
          </div>

          {/* Clinical Notes */}
          <div className="notes-card">
            <h3><FileText size={20} /> Clinical Notes</h3>
            <textarea
              className="notes-textarea"
              value={activeNote}
              onChange={(e) => setActiveNote(e.target.value)}
              placeholder="Enter your clinical notes here..."
              rows={12}
              disabled={!hasVisit}
            />
            <div className="notes-actions">
              <button 
                onClick={handleSaveNote} 
                className="btn-save"
                disabled={saving || !activeNote.trim() || !hasVisit}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Note'}
              </button>
              <button 
                onClick={() => {
                  setActiveNote('');
                  setDiagnosis('');
                }} 
                className="btn-clear"
                disabled={!hasVisit}
              >
                Clear
              </button>
            </div>
            {!hasVisit && (
              <p className="input-warning">
                <AlertCircle size={14} /> Patient must check in before adding notes
              </p>
            )}
          </div>

          {/* Previous Notes */}
          <div className="notes-card collapsible">
            <div className="card-header" onClick={() => toggleSection('previousNotes')}>
              <h3><History size={20} /> Previous Visit Notes</h3>
              {expandedSections.previousNotes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.previousNotes && (
              <div className="previous-notes">
                {notes.length > 0 ? (
                  notes.map((note, idx) => (
                    <div key={idx} className="note-item">
                      <div className="note-header">
                        <span className="note-date">
                          {note.visit_date ? new Date(note.visit_date).toLocaleDateString() : 'Unknown date'}
                        </span>
                        <span className="note-doctor">{note.doctor_name}</span>
                      </div>
                      {note.diagnosis && (
                        <div className="note-diagnosis">
                          <strong>Diagnosis:</strong> {note.diagnosis}
                        </div>
                      )}
                      <div className="note-text">{note.note_text || note.treatment || 'No notes'}</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No previous visit notes</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}