import React, { useState, useEffect } from 'react';
import './ClinicalWorkSpace.css';
import { 
  FileText, 
  Activity, 
  Clock, 
  User, 
  Calendar, 
  AlertCircle,
  Heart,
  Thermometer,
  Save,
  X,
  ArrowLeft,
  Pill,
  TestTube,
  Clipboard
} from 'lucide-react';

/**
 * ClinicalWorkSpace Component
 * 
 * Main workspace for doctors to:
 * - View patient visit details (created when patient checks in)
 * - View vitals recorded by nurses (read-only)
 * - Write clinical notes
 * - View patient history
 * 
 * Props:
 * @param {Object} appointment - Selected appointment with patient info
 * @param {Function} onBack - Navigate back to previous page
 */
function ClinicalWorkSpace({ appointment, onBack }) {
  const [currentTab, setCurrentTab] = useState('notes');
  const [clinicalNote, setClinicalNote] = useState('');
  const [currentVisit, setCurrentVisit] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [medicalHistoryList, setMedicalHistoryList] = useState([]);
  const [medicationHistoryList, setMedicationHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [currentVitals, setCurrentVitals] = useState({});

  // Extract appointment ID from various possible formats
  const appointmentId = appointment?.id || 
                       appointment?.Appointment_id || 
                       appointment?.appointment_id || 
                       null;

  const patientId = appointment?.patientId || 
                   appointment?.Patient_id || 
                   appointment?.patient_id ||
                   null;

  /**
   * Fetch current visit (if patient has checked in)
   */
  const fetchCurrentVisit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!appointmentId) {
        throw new Error('No appointment ID available');
      }

      const res = await fetch(
        `/doctor_api/clinical/get-patient-details.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );
      
      const json = await res.json();
      
      if (json.success && json.has_visit) {
        setCurrentVisit(json.visit);
        setCurrentVitals(json.vitals || {});
        setPatientInfo(json.patient);
        setHasCheckedIn(true);
        
        // Pre-fill note if there's existing treatment text
        if (json.visit.treatment) {
          setClinicalNote(json.visit.treatment);
        }
      } else if (json.has_visit === false) {
        // Patient hasn't checked in yet
        setHasCheckedIn(false);
        setError('Patient has not checked in yet. Vitals and visit details will appear after check-in.');
      } else {
        throw new Error(json.error || 'Failed to load visit');
      }
    } catch (err) {
      console.error('Failed to fetch visit', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch patient history (all previous visits)
   */
  const fetchPatientHistory = async () => {
    if (!patientId) return;
    
    try {
      const res = await fetch(
        `/doctor_api/clinical/get-notes.php?patient_id=${patientId}`,
        { credentials: 'include' }
      );
      const json = await res.json();
      
      if (json.success) {
        setVisitHistory(json.notes || []);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  /**
   * Fetch patient medications
   */
  const fetchMedications = async () => {
    if (!patientId) return;
    
    try {
      // Use the clinical patient-details endpoint (proxied) so we get
      // medical/medication history and current medications in one call.
      const res = await fetch(
        `/doctor_api/clinical/get-patient-details.php?patient_id=${patientId}`,
        { credentials: 'include' }
      );
      const json = await res.json();
      
      if (json.success) {
        setMedications(json.patient.currentMedications || []);
        setConditions(json.patient.chronicConditions || []);
        // optional: medical history (past diagnoses / procedures)
        setMedicalHistoryList(json.patient.medicalHistory || []);
        // optional: medication history (past meds and durations)
        setMedicationHistoryList(json.patient.medicationHistory || []);
        // If the clinical endpoint included vitals and a most recent visit, use them
        if (json.vitals) {
          setCurrentVitals(json.vitals || {});
        }
      }
    } catch (err) {
      console.error('Failed to fetch medications', err);
    }
  };

  /**
   * Save clinical note to PatientVisit.Treatment
   */
  const handleSaveNote = async () => {
    if (!currentVisit) {
      alert('Cannot save note: No visit record found. Patient must check in first.');
      return;
    }

    if (!clinicalNote.trim()) {
      alert('Please enter a note before saving.');
      return;
    }

    try {
      const payload = {
        visit_id: currentVisit.visit_id,
        appointment_id: currentVisit.appointment_id,
        note_text: clinicalNote
      };

      const res = await fetch('/doctor_api/clinical/save-note.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      
      if (json.success) {
        alert('Clinical note saved successfully!');
        // Refresh the visit to show updated info
        fetchCurrentVisit();
        fetchPatientHistory(); // Refresh history
      } else {
        alert('Failed to save note: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Save note failed', err);
      alert('Network error while saving note');
    }
  };

  // Load data on mount
  useEffect(() => {
    if (appointmentId) {
      fetchCurrentVisit();
    }
    if (patientId) {
      fetchPatientHistory();
      fetchMedications();
    }
  }, [appointmentId, patientId]);

  /**
   * NOTES TAB - Clinical documentation
   */
  const NotesTab = () => (
    <div className="notes-tab">
      {!hasCheckedIn ? (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <p>Patient has not checked in yet. Clinical notes can be added after check-in.</p>
        </div>
      ) : (
        <>
          <div className="note-templates">
            <h4>Quick Templates</h4>
            <div className="template-buttons">
              <button 
                className="template-btn"
                onClick={() => setClinicalNote('Chief Complaint:\n\nHistory of Present Illness:\n\nPhysical Examination:\n\nAssessment:\n\nPlan:\n')}
              >
                SOAP Note
              </button>
              <button 
                className="template-btn"
                onClick={() => setClinicalNote('Patient presents for follow-up visit.\n\nCurrent status:\n\nMedication review:\n\nRecommendations:\n')}
              >
                Follow-up
              </button>
              <button 
                className="template-btn"
                onClick={() => setClinicalNote('Annual physical examination\n\nReview of Systems:\n- Constitutional:\n- Cardiovascular:\n- Respiratory:\n- GI:\n\nScreenings performed:\n')}
              >
                Annual Physical
              </button>
            </div>
          </div>

          <div className="note-editor">
            <div className="editor-header">
              <h4>Clinical Note</h4>
              <span className="note-date">{new Date().toLocaleDateString()}</span>
            </div>
            <textarea
              className="note-textarea"
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="Begin typing your clinical note here...

Use templates above for structured documentation."
            />
          </div>

          <div className="note-actions">
            <button className="btn-save" onClick={handleSaveNote}>
              <Save size={18} />
              Save Note
            </button>
            <button className="btn-cancel" onClick={() => setClinicalNote('')}>
              <X size={18} />
              Clear
            </button>
          </div>

          {currentVisit && currentVisit.last_updated && (
            <div className="note-metadata">
              <small>
                Last updated: {new Date(currentVisit.last_updated).toLocaleString()} 
                {currentVisit.updated_by && ` by ${currentVisit.updated_by}`}
              </small>
            </div>
          )}
        </>
      )}

      {/* Previous Notes Section */}
      <div className="previous-notes">
        <h4>Recent Visit Notes</h4>
        {visitHistory.length === 0 ? (
          <div className="empty">No previous notes found</div>
        ) : (
          visitHistory.map((v, idx) => (
            <div key={idx} className="note-card">
              <div className="note-card-header">
                <span className="note-date">
                  {v.date ? new Date(v.date).toLocaleDateString() : 'Unknown date'}
                </span>
                <span className="note-provider">{v.doctor_name || 'Unknown doctor'}</span>
              </div>
              <div className="note-card-body">
                <strong>{v.reason || 'Visit'}</strong>
                {v.diagnosis && (
                  <div className="note-diagnosis">
                    <em>Diagnosis:</em> {typeof v.diagnosis === 'string' ? v.diagnosis : JSON.stringify(v.diagnosis)}
                  </div>
                )}
                <p className="note-preview">{v.note_text || v.treatment || 'No notes recorded'}</p>
              </div>
            </div>
          ))
        )}
      </div>
          </div>
  );

  /**
   * VITALS TAB - View vitals recorded by nurses (read-only)
   */
  const VitalsTab = () => (
    <div className="vitals-tab">
      {!hasCheckedIn ? (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <p>Patient has not checked in yet. Vitals will appear after nursing staff records them.</p>
        </div>
      ) : (
        <>
          <div className="vitals-info-banner">
            <AlertCircle size={18} />
            <span>Vitals are recorded by nursing staff and are read-only for doctors</span>
          </div>

          <div className="vitals-grid">
            {/* Blood Pressure */}
            <div className="vital-card readonly">
              <div className="vital-icon">
                <Heart size={24} />
              </div>
              <label>Blood Pressure</label>
              <div className="vital-value">
                {currentVitals.blood_pressure || currentVisit?.vitals?.blood_pressure || 'Not recorded'}
              </div>
              <span className="vital-unit">mmHg</span>
            </div>

            {/* Temperature */}
            <div className="vital-card readonly">
              <div className="vital-icon">
                <Thermometer size={24} />
              </div>
              <label>Temperature</label>
              <div className="vital-value">
                {currentVitals.temperature ? `${currentVitals.temperature}°F` : (currentVisit?.vitals?.temperature ? `${currentVisit.vitals.temperature}°F` : 'Not recorded')}
              </div>
              <span className="vital-unit">°F</span>
            </div>
          </div>

          {(currentVitals.recorded_by || currentVisit?.vitals?.recorded_by) && (
            <div className="vitals-recorded-by">
              <small>Recorded by: {currentVitals.recorded_by || currentVisit.vitals.recorded_by}</small>
            </div>
          )}
        </>
      )}

      {/* Vital Signs History */}
      <div className="vitals-history">
        <h4>Recent Vitals</h4>
        <div className="vitals-history-table">
          <div className="history-row header">
            <span>Date</span>
            <span>BP</span>
            <span>Temp</span>
            <span>Recorded By</span>
          </div>
          {visitHistory.length === 0 ? (
            <div className="history-row"><span className="empty">No vitals recorded</span></div>
          ) : (
            visitHistory.map((v, i) => (
              <div key={i} className="history-row">
                <span>{v.date ? new Date(v.date).toLocaleDateString() : '-'}</span>
                <span>{v.blood_pressure || '-'}</span>
                <span>{v.temperature ? `${v.temperature}°F` : '-'}</span>
                <span>{v.recorded_by || '-'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  /**
   * HISTORY TAB - Patient medical history
   */
  const HistoryTab = () => (
    <div className="history-tab">
      {/* Chronic Conditions */}
      <div className="history-section">
        <h4>
          <Clipboard size={20} />
          Chronic Conditions
        </h4>
        <div className="condition-list">
          {conditions.length === 0 ? (
            <div className="empty">No chronic conditions recorded</div>
          ) : (
            conditions.map((condition, index) => (
              <div key={index} className="condition-tag">
                {condition}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Current Medications */}
      <div className="history-section">
        <h4>
          <Pill size={20} />
          Current Medications
        </h4>
        <div className="medication-list">
          {medications.length === 0 ? (
            <div className="empty">No current medications</div>
          ) : (
            medications.map((med, index) => (
              <div key={index} className="medication-item">
                <div className="med-icon">💊</div>
                <div>
                  <strong>
                    {typeof med === 'string' ? med : (med.medication_name || 'Medication')}
                  </strong>
                  {typeof med !== 'string' && med.dosage && (
                    <div className="med-info">{med.dosage}</div>
                  )}
                  {typeof med !== 'string' && med.frequency && (
                    <div className="med-info">{med.frequency}</div>
                  )}
                  {typeof med !== 'string' && med.prescribed_by && (
                    <div className="med-info">Prescribed by: {med.prescribed_by}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Medical History (past diagnoses / procedures) */}
      <div className="history-section">
        <h4>
          <Clipboard size={20} />
          Medical History
        </h4>
        <div className="medical-history-list">
          {medicalHistoryList.length === 0 ? (
            <div className="empty">No past medical history recorded</div>
          ) : (
            medicalHistoryList.map((h, i) => (
              <div key={i} className="medical-history-item">
                <strong>{h.condition || h.Condition_Name || ''}</strong>
                {h.diagnosis_date && (
                  <div className="mh-date">Diagnosed: {new Date(h.diagnosis_date).toLocaleDateString()}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Medication History (previous/long-term drugs) */}
      <div className="history-section">
        <h4>
          <TestTube size={20} />
          Medication History
        </h4>
        <div className="medication-history-list">
          {medicationHistoryList.length === 0 ? (
            <div className="empty">No medication history recorded</div>
          ) : (
            medicationHistoryList.map((m, idx) => (
              <div key={idx} className="med-history-item">
                <strong>{m.drug || m.Drug_name || ''}</strong>
                {m.notes && <div className="mh-notes">{m.notes}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Visit History */}
      <div className="history-section">
        <h4>
          <Clock size={20} />
          Visit History
        </h4>
        <div className="visit-timeline">
          {visitHistory.length === 0 ? (
            <div className="empty">No visit history found</div>
          ) : (
            visitHistory.map((v, idx) => {
              const date = v.date ? new Date(v.date).toLocaleDateString() : 'Unknown date';
              const title = v.reason || 'Visit';
              const diagnosis = typeof v.diagnosis === 'string' ? v.diagnosis : (v.diagnosis ? JSON.stringify(v.diagnosis) : '');
              const noteText = v.note_text || v.treatment || '';

              return (
                <div className="visit-item" key={idx}>
                  <div className="visit-date">{date}</div>
                  <div className="visit-content">
                    <strong>{title}</strong>
                    {diagnosis && <div className="visit-diagnosis">Diagnosis: {diagnosis}</div>}
                    {noteText && <p>{noteText}</p>}
                    {v.blood_pressure && (
                      <div className="visit-vitals">
                        <small>Vitals: BP {v.blood_pressure}</small>
                        {v.temperature && <small>, Temp {v.temperature}°F</small>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lab Results */}
      <div className="history-section">
        <h4>
          <TestTube size={20} />
          Recent Lab Results
        </h4>
        <div className="lab-results">
          <div className="empty">No recent lab results</div>
        </div>
      </div>
    </div>
  );

  /**
   * Render tab content based on currentTab
   */
  const renderTabContent = () => {
    switch (currentTab) {
      case 'notes':
        return <NotesTab />;
      case 'vitals':
        return <VitalsTab />;
      case 'history':
        return <HistoryTab />;
      default:
        return <NotesTab />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="clinical-workspace">
        <div className="loading-state">
          <Activity size={48} className="spinning" />
          <p>Loading patient visit...</p>
        </div>
      </div>
    );
  }

  // Use patient info from current visit or appointment
  const displayPatient = patientInfo || {
    name: appointment?.patientName || 'Unknown Patient',
    age: null,
    gender: '',
    dob: '',
    blood_type: '',
    allergies: ''
  };

  return (
    <div className="clinical-workspace">
      {/* Back Button */}
      {onBack && (
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      )}

      {/* Error Banner */}
      {error && !hasCheckedIn && (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Patient Header Card */}
      <div className="patient-header">
        <div className="patient-header-left">
          <div className="patient-avatar">
            <User size={32} />
          </div>
          <div className="patient-info">
            <h2>{displayPatient.name}</h2>
            <div className="patient-meta">
              {displayPatient.age && (
                <span><User size={14} /> {displayPatient.age} yrs</span>
              )}
              {displayPatient.gender && (
                <span>{displayPatient.gender}</span>
              )}
              {displayPatient.dob && (
                <span><Calendar size={14} /> DOB: {displayPatient.dob}</span>
              )}
              {displayPatient.blood_type && (
                <span>🩸 {displayPatient.blood_type}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="patient-header-right">
          <div className="appointment-info">
            <div className="info-item">
              <Clock size={16} />
              <span>{appointment?.time || 'No time'}</span>
            </div>
            <div className="info-item">
              <FileText size={16} />
              <span>{appointment?.reason || currentVisit?.reason || 'No reason'}</span>
            </div>
            {currentVisit && (
              <div className="info-item">
                <span className={`status-badge status-${currentVisit.status?.toLowerCase().replace(' ', '-')}`}>
                  {currentVisit.status}
                </span>
              </div>
            )}
            {!hasCheckedIn && (
              <div className="info-item">
                <span className="status-badge status-pending">
                  Not Checked In
                </span>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Allergies Alert */}
      {displayPatient.allergies && displayPatient.allergies !== 'None' && displayPatient.allergies !== 'No Known Allergies' && (
        <div className="allergies-alert">
          <AlertCircle size={20} />
          <span><strong>ALLERGIES:</strong> {displayPatient.allergies}</span>
        </div>
      )}

      {/* Visit Info Banner (when checked in) */}
      {hasCheckedIn && currentVisit && (
        <div className="visit-info-banner">
          <div className="visit-info-item">
            <strong>Department:</strong> {currentVisit.department || 'N/A'}
          </div>
          <div className="visit-info-item">
            <strong>Visit Date:</strong> {currentVisit.date ? new Date(currentVisit.date).toLocaleString() : 'N/A'}
          </div>
          {currentVisit.nurse_name && (
            <div className="visit-info-item">
              <strong>Nurse:</strong> {currentVisit.nurse_name}
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab-btn ${currentTab === 'notes' ? 'active' : ''}`}
          onClick={() => setCurrentTab('notes')}
        >
          <FileText size={18} />
          Visit Notes
        </button>
        <button
          className={`tab-btn ${currentTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setCurrentTab('vitals')}
        >
          <Activity size={18} />
          Vitals
        </button>
        <button
          className={`tab-btn ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentTab('history')}
        >
          <Clock size={18} />
          History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ClinicalWorkSpace;