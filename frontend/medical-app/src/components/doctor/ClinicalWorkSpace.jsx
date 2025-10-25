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
  Wind,
  Droplet,
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
 * - View patient details from appointment
 * - Write clinical notes
 * - Record vitals
 * - View patient history
 * - Prescribe medications
 * - Order lab tests
 * 
 * Props:
 * @param {Object} appointment - Selected appointment with patient info
 * @param {Object} patient - Detailed patient information (optional)
 * @param {Function} onBack - Navigate back to previous page
 */
function ClinicalWorkSpace({ appointment, patient, onBack }) {
  const [currentTab, setCurrentTab] = useState('notes');
  const [clinicalNote, setClinicalNote] = useState('');
  const [recentNotes, setRecentNotes] = useState([]);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });
  const [vitalsHistory, setVitalsHistory] = useState([]);
  // localPatient holds patient data fetched as a fallback when parent doesn't pass a `patient` prop
  const [localPatient, setLocalPatient] = useState(null);

  // Try to infer patient and appointment identifiers and names from multiple
  // possible field names the API might return. This makes the component
  // resilient to differences in backend naming (snake_case, camelCase,
  // prefixed names like Patient_id, Appointment_id, etc.).
  const inferredPatientId = (
    patient?.id ||
    appointment?.patientId ||
    appointment?.Patient_id ||
    appointment?.patient_id ||
    appointment?.PatientID ||
    appointment?.patientID ||
    null
  );

  const inferredPatientName = (
    patient?.name ||
    appointment?.patientName ||
    appointment?.patient_name ||
    appointment?.PatientName ||
    'No Patient Selected'
  );

  const inferredAppointmentId = (
    appointment?.id ||
    appointment?.Appointment_id ||
    appointment?.appointment_id ||
    appointment?.AppointmentID ||
    appointment?.appointmentID ||
    null
  );

  // Minimal defaults when `patient` or `appointment` props are not provided.
  // Keep defaults small to avoid embedding large mock data in the component.
  const defaultPatient = {
    id: inferredPatientId,
    name: inferredPatientName,
    dob: patient?.dob || '',
    age: patient?.age || null,
    gender: patient?.gender || '',
    bloodType: patient?.bloodType || '',
    allergies: patient?.allergies || '',
    chronicConditions: patient?.chronicConditions || [],
    currentMedications: patient?.currentMedications || [],
    lastVisit: patient?.lastVisit || '',
    insuranceProvider: patient?.insuranceProvider || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    labs: patient?.labs || []
  };

  // Prefer the `patient` prop (provided by parent). If not provided but we
  // fetched a `localPatient`, use that. Otherwise fall back to defaults.
  const currentPatient = patient
    ? { ...defaultPatient, ...patient }
    : localPatient
      ? { ...defaultPatient, ...localPatient }
      : defaultPatient;

  // Normalize appointment object so downstream code can rely on consistent keys
  const currentAppointment = {
    id: inferredAppointmentId,
    time: appointment?.time || appointment?.Appointment_time || appointment?.Time || '',
    reason: appointment?.reason || appointment?.Reason_for_visit || appointment?.Reason || '',
    status: appointment?.status || appointment?.Status || '',
    ...appointment
  };

  /**
   * Handle vital sign input change
   */
  const handleVitalChange = (field, value) => {
    setVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Save clinical note
   */
  const handleSaveNote = () => {
    // Send to backend API (save-note.php). Backend resolves doctor from session.
    (async () => {
      try {
        const payload = {
          appointment_id: currentAppointment.id ?? null,
          patient_id: currentPatient.id,
          note_text: clinicalNote,
          treatment: clinicalNote
        };

        const res = await fetch('http://localhost:8080/doctor_api/clinical/save-note.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json && json.success) {
          alert('Clinical note saved successfully!');
          // refresh notes
          fetchNotes();
          setClinicalNote('');
        } else {
          alert('Failed to save note: ' + (json?.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Save note failed', err);
        alert('Network error while saving note');
      }
    })();
  };

  /**
   * Save vitals
   */
  const handleSaveVitals = () => {
    // Doctors should not save vitals here. Vitals are recorded by nursing staff.
    alert('Only nursing staff can record vitals. Vitals are read-only for doctors.');
  };

  // Fetch recent notes for patient or appointment
  const fetchNotes = async () => {
      try {
      const pid = currentPatient.id;
      // backend expects numeric patient_id; prefer appointment_id when available
      let qs = '';
      if (currentAppointment.id) {
        qs = `appointment_id=${encodeURIComponent(currentAppointment.id)}`;
      } else if (pid && /^\d+$/.test(String(pid))) {
        qs = `patient_id=${encodeURIComponent(String(pid))}`;
      } else if (pid) {
        // try to extract numeric portion from IDs like 'P001'
        const m = String(pid).match(/(\d+)/);
        if (m) qs = `patient_id=${encodeURIComponent(m[1])}`;
      }

      if (!qs) {
        console.warn('ClinicalWorkSpace: no numeric patient_id or appointment_id available to fetch notes');
        setRecentNotes([]);
        return;
      }

      const res = await fetch(`http://localhost:8080/doctor_api/clinical/get-notes.php?${qs}`, { credentials: 'include' });
      const json = await res.json();
      if (json && json.success) setRecentNotes(json.notes || []);
      else setRecentNotes([]);
    } catch (err) {
      console.error('Failed to fetch notes', err);
      setRecentNotes([]);
    }
  };

  /**
   * Fetch patient details from backend when not provided via props.
   * This is a fallback so the workspace can populate when only an
   * appointment object is passed from the parent.
   */
  const fetchPatient = async () => {
    try {
      // If we already have a patient id, skip fetching
      if (currentPatient.id) return;

      // Try to infer patient id from appointment fields
      const raw = appointment?.patientId || appointment?.Patient_id || appointment?.patient_id || appointment?.PatientID || appointment?.patientID || appointment?.Patient || null;
      if (!raw) return;

      const numericMatch = String(raw).match(/(\d+)/);
      const useIdParam = /\D/.test(String(raw));
      const param = useIdParam ? `id=${encodeURIComponent(String(raw))}` : `patient_id=${encodeURIComponent(numericMatch ? numericMatch[0] : String(raw))}`;

      const res = await fetch(`/api/doctor_api/patients/get-by-id.php?${param}`, { credentials: 'include' });
      const json = await res.json();
      if (json && json.success) {
        // merge fetched patient into currentPatient state by mutating via setRecentNotes side-effect
        // but ClinicalWorkSpace receives `patient` as prop; to keep simple, if parent didn't pass patient
        // we can update local variables by copying values into stateful areas that rely on currentPatient.
        // The simplest is to setRecentNotes/ vitals won't change; instead we rely on the parent to pass patient when available.
        // However, to immediately reflect patient info in the header, we patch the DOM by updating a small local state.
        // Add a lightweight localPatient state if not present.
        setLocalPatient(prev => ({ ...(prev || {}), ...json.patient }));
      }
    } catch (err) {
      console.error('Failed to fetch patient details', err);
    }
  };

  const fetchVitals = async () => {
      try {
      const pid = currentPatient.id;
      // prefer numeric patient_id; fall back to appointment id if available
      let qs = '';
      if (currentAppointment.id) {
        qs = `appointment_id=${encodeURIComponent(currentAppointment.id)}`;
      } else if (pid && /^\d+$/.test(String(pid))) {
        qs = `patient_id=${encodeURIComponent(String(pid))}`;
      } else if (pid) {
        const m = String(pid).match(/(\d+)/);
        if (m) qs = `patient_id=${encodeURIComponent(m[1])}`;
      }

      if (!qs) {
        console.warn('ClinicalWorkSpace: no numeric patient_id or appointment_id available to fetch vitals');
        setVitalsHistory([]);
        return;
      }

      const res = await fetch(`http://localhost:8080/doctor_api/clinical/get-vitals.php?${qs}`, { credentials: 'include' });
      const json = await res.json();
      if (json && json.success) setVitalsHistory(json.vitals || []);
      else setVitalsHistory([]);
    } catch (err) {
      console.error('Failed to fetch vitals', err);
      setVitalsHistory([]);
    }
  };

  useEffect(() => {
    // fetch notes, vitals, and patient fallback when component mounts or patient changes
    fetchPatient();
    fetchNotes();
    fetchVitals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatient.id]);

  /**
   * NOTES TAB - Clinical documentation
   */
  const NotesTab = () => (
    <div className="notes-tab">
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

      {/* Previous Notes Section */}
      <div className="previous-notes">
        <h4>Recent Visit Notes</h4>
        {recentNotes.length === 0 ? (
          <div className="empty">No previous notes found</div>
        ) : (
          recentNotes.map((n, idx) => (
            <div key={idx} className="note-card">
              <div className="note-card-header">
                <span className="note-date">{n.date || ''}</span>
                <span className="note-provider">{n.doctor_name || ''}</span>
              </div>
              <p className="note-preview">{n.note_text || n.diagnosis || ''}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  /**
   * VITALS TAB - Record patient vital signs
   */
  const VitalsTab = () => (
    <div className="vitals-tab">
      <div className="vitals-grid">
        {/* Blood Pressure */}
        <div className="vital-card">
          <div className="vital-icon">
            <Heart size={24} />
          </div>
          <label>Blood Pressure</label>
          <input
            type="text"
            placeholder="120/80"
            value={vitals.bloodPressure}
            onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
          />
          <span className="vital-unit">mmHg</span>
        </div>

        {/* Heart Rate */}
        <div className="vital-card">
          <div className="vital-icon">
            <Activity size={24} />
          </div>
          <label>Heart Rate</label>
          <input
            type="number"
            placeholder="72"
            value={vitals.heartRate}
            onChange={(e) => handleVitalChange('heartRate', e.target.value)}
          />
          <span className="vital-unit">bpm</span>
        </div>

        {/* Temperature */}
        <div className="vital-card">
          <div className="vital-icon">
            <Thermometer size={24} />
          </div>
          <label>Temperature</label>
          <input
            type="number"
            step="0.1"
            placeholder="98.6"
            value={vitals.temperature}
            onChange={(e) => handleVitalChange('temperature', e.target.value)}
          />
          <span className="vital-unit">°F</span>
        </div>

        {/* Respiratory Rate */}
        <div className="vital-card">
          <div className="vital-icon">
            <Wind size={24} />
          </div>
          <label>Respiratory Rate</label>
          <input
            type="number"
            placeholder="16"
            value={vitals.respiratoryRate}
            onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
          />
          <span className="vital-unit">breaths/min</span>
        </div>

        {/* Oxygen Saturation */}
        <div className="vital-card">
          <div className="vital-icon">
            <Droplet size={24} />
          </div>
          <label>O₂ Saturation</label>
          <input
            type="number"
            placeholder="98"
            value={vitals.oxygenSaturation}
            onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
          />
          <span className="vital-unit">%</span>
        </div>

        {/* Weight */}
        <div className="vital-card">
          <div className="vital-icon">
            <User size={24} />
          </div>
          <label>Weight</label>
          <input
            type="number"
            placeholder="170"
            value={vitals.weight}
            onChange={(e) => handleVitalChange('weight', e.target.value)}
          />
          <span className="vital-unit">lbs</span>
        </div>
      </div>

      <button className="btn-save-vitals" disabled title="Only nursing staff can record vitals">
        <Save size={18} />
        Vitals (nurses only)
      </button>

      {/* Vital Signs History */}
      <div className="vitals-history">
        <h4>Recent Vitals</h4>
        <div className="vitals-history-table">
          <div className="history-row header">
            <span>Date</span>
            <span>BP</span>
            <span>HR</span>
            <span>Temp</span>
            <span>SpO₂</span>
          </div>
          {vitalsHistory.length === 0 ? (
            <div className="history-row"><span className="empty">No vitals recorded</span></div>
          ) : (
            vitalsHistory.map((v, i) => (
              <div key={i} className="history-row">
                <span>{v.date || ''}</span>
                <span>{v.blood_pressure || '-'}</span>
                <span>{v.heart_rate || '-'}</span>
                <span>{v.temperature ? `${v.temperature}°F` : '-'}</span>
                <span>{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '-'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  /**
   * HISTORY TAB - Patient medical history and past visits
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
          {currentPatient.chronicConditions.map((condition, index) => (
            <div key={index} className="condition-tag">
              {condition}
            </div>
          ))}
        </div>
      </div>

  {/* Current Medications */}
      <div className="history-section">
        <h4>
          <Pill size={20} />
          Current Medications
        </h4>
        <div className="medication-list">
          {currentPatient.currentMedications.map((med, index) => (
            <div key={index} className="medication-item">
              <div className="med-icon">💊</div>
              <div>
                <strong>{typeof med === 'string' ? med : (med.name || med.medication_name || 'Medication')}</strong>
                {typeof med !== 'string' && med.frequency && <div className="med-info">{med.frequency}</div>}
                {typeof med !== 'string' && med.prescribed_by && <div className="med-info">Prescribed by: {med.prescribed_by}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visit History (driven from PatientVisit via backend) */}
      <div className="history-section">
        <h4>
          <Clock size={20} />
          Visit History
        </h4>
        <div className="visit-timeline">
          {((currentPatient.medicalHistory && currentPatient.medicalHistory.length > 0) ? currentPatient.medicalHistory : recentNotes).length === 0 ? (
            <div className="empty">No visit history found</div>
          ) : (
            (currentPatient.medicalHistory && currentPatient.medicalHistory.length > 0 ? currentPatient.medicalHistory : recentNotes).map((v, idx) => {
              // Attempt to extract a date from common fields returned by PatientVisit
              const rawDate = v.date || v.visit_date || v.Date || v.created_at || v.timestamp || v.visitTimestamp || '';
              const date = rawDate ? new Date(rawDate).toLocaleDateString() : 'Unknown date';
              const title = v.diagnosis || v.reason || v.treatment || v.note_title || 'Visit';
              const noteText = v.note_text || v.notes || v.treatment || '';

              // Try to find vitals for this visit by matching appointment_id or date
              const relatedVitals = vitalsHistory.filter(h => {
                if (!h) return false;
                // match by explicit visit id if provided
                if (v.id && (h.patient_visit_id === v.id || h.visit_id === v.id || h.patientVisitId === v.id)) return true;
                // match by appointment id
                if (v.appointment_id && (h.appointment_id === v.appointment_id || h.appointmentId === v.appointment_id)) return true;
                // match by date (loose)
                const hv = h.date || h.visit_date || h.created_at || h.timestamp || '';
                if (hv && rawDate) {
                  try {
                    const d1 = new Date(hv).toDateString();
                    const d2 = new Date(rawDate).toDateString();
                    if (d1 === d2) return true;
                  } catch (e) {
                    // ignore parse errors
                  }
                }
                return false;
              });

              return (
                <div className="visit-item" key={idx}>
                  <div className="visit-date">{date}</div>
                  <div className="visit-content">
                    <strong>{title}</strong>
                    {noteText && <p>{noteText}</p>}

                    {relatedVitals.length > 0 && (
                      <div className="visit-vitals">
                        <small>Recorded Vitals:</small>
                        <div className="vitals-inline">
                          {relatedVitals.map((rv, j) => (
                            <div className="vitals-set" key={j}>
                              <span>BP: {rv.blood_pressure || rv.bloodPressure || '-'}</span>
                              <span>HR: {rv.heart_rate || rv.heartRate || '-'}</span>
                              <span>Temp: {rv.temperature ? `${rv.temperature}°F` : '-'}</span>
                              <span>SpO₂: {rv.oxygen_saturation || rv.spO2 || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lab Results (no static mock data) */}
      <div className="history-section">
        <h4>
          <TestTube size={20} />
          Recent Lab Results
        </h4>
        <div className="lab-results">
          {currentPatient.labs && currentPatient.labs.length > 0 ? (
            currentPatient.labs.map((lab, idx) => (
              <div className="lab-item" key={idx}>
                <span className="lab-name">{lab.name || lab.testName || 'Lab Test'}</span>
                <span className="lab-value">{lab.value || lab.result || ''}</span>
                <span className={`lab-status ${lab.status ? lab.status.toLowerCase() : 'unknown'}`}>
                  {lab.status || ''}
                </span>
              </div>
            ))
          ) : (
            <div className="empty">No recent lab results</div>
          )}
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

  return (
    <div className="clinical-workspace">
      {/* Back Button */}
      {onBack && (
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      )}

      {/* Patient Header Card */}
      <div className="patient-header">
        <div className="patient-header-left">
          <div className="patient-avatar">
            <User size={32} />
          </div>
          <div className="patient-info">
            <h2>{currentPatient.name}</h2>
            <div className="patient-meta">
              <span><User size={14} /> {currentPatient.age} yrs, {currentPatient.gender}</span>
              <span><Calendar size={14} /> DOB: {currentPatient.dob}</span>
              <span>🩸 {currentPatient.bloodType}</span>
            </div>
          </div>
        </div>
        
        <div className="patient-header-right">
          <div className="appointment-info">
            <div className="info-item">
              <Clock size={16} />
              <span>{currentAppointment.time}</span>
            </div>
            <div className="info-item">
              <FileText size={16} />
              <span>{currentAppointment.reason}</span>
            </div>
            <div className="info-item">
              <span className={`status-badge status-${currentAppointment.status?.toLowerCase().replace(' ', '-')}`}>
                {currentAppointment.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Allergies Alert */}
      {currentPatient.allergies && currentPatient.allergies !== 'None' && (
        <div className="allergies-alert">
          <AlertCircle size={20} />
          <span><strong>ALLERGIES:</strong> {currentPatient.allergies}</span>
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