import React, { useState } from 'react';
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
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });

  // Mock patient data if not provided through appointment
  const mockPatient = {
    id: appointment?.patientId || 'P001',
    name: appointment?.patientName || 'No Patient Selected',
    dob: '1985-06-15',
    age: 38,
    gender: 'Male',
    bloodType: 'O+',
    allergies: appointment?.allergies || 'Penicillin',
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    currentMedications: [
      'Metformin 500mg - Twice daily',
      'Lisinopril 10mg - Once daily'
    ],
    lastVisit: '2023-09-15',
    insuranceProvider: 'Blue Cross Blue Shield',
    phone: '(555) 123-4567',
    email: 'patient@email.com'
  };

  const currentPatient = patient || mockPatient;
  const currentAppointment = appointment || {
    time: 'No appointment data',
    reason: 'Walk-in',
    status: 'In Progress'
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
    // TODO: Send to backend API
    console.log('Saving note:', {
      patientId: currentPatient.id,
      appointmentId: appointment?.id,
      note: clinicalNote,
      vitals: vitals,
      timestamp: new Date().toISOString()
    });
    alert('Clinical note saved successfully!');
  };

  /**
   * Save vitals
   */
  const handleSaveVitals = () => {
    // TODO: Send to backend API
    console.log('Saving vitals:', vitals);
    alert('Vitals saved successfully!');
  };

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
        <div className="note-card">
          <div className="note-card-header">
            <span className="note-date">Last Visit: {currentPatient.lastVisit}</span>
            <span className="note-provider">Dr. Lastname</span>
          </div>
          <p className="note-preview">
            Patient presented for routine follow-up. Blood pressure well controlled on current medications. 
            HbA1c improved to 6.8%. Continue current treatment plan.
          </p>
        </div>
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

      <button className="btn-save-vitals" onClick={handleSaveVitals}>
        <Save size={18} />
        Save Vitals
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
          <div className="history-row">
            <span>2023-09-15</span>
            <span>128/82</span>
            <span>74</span>
            <span>98.4°F</span>
            <span>99%</span>
          </div>
          <div className="history-row">
            <span>2023-08-10</span>
            <span>132/84</span>
            <span>76</span>
            <span>98.6°F</span>
            <span>98%</span>
          </div>
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
              <span>{med}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visit History */}
      <div className="history-section">
        <h4>
          <Clock size={20} />
          Visit History
        </h4>
        <div className="visit-timeline">
          <div className="visit-item">
            <div className="visit-date">2023-09-15</div>
            <div className="visit-content">
              <strong>Follow-up: Hypertension & Diabetes</strong>
              <p>BP: 128/82, HbA1c: 6.8% - Well controlled. Continue current medications.</p>
            </div>
          </div>
          <div className="visit-item">
            <div className="visit-date">2023-08-10</div>
            <div className="visit-content">
              <strong>Routine Check-up</strong>
              <p>Patient doing well. Medication adherence good. Discussed diet and exercise.</p>
            </div>
          </div>
          <div className="visit-item">
            <div className="visit-date">2023-06-05</div>
            <div className="visit-content">
              <strong>Lab Review</strong>
              <p>Lipid panel improved. Liver function normal. Continue statin therapy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Results */}
      <div className="history-section">
        <h4>
          <TestTube size={20} />
          Recent Lab Results
        </h4>
        <div className="lab-results">
          <div className="lab-item">
            <span className="lab-name">HbA1c</span>
            <span className="lab-value">6.8%</span>
            <span className="lab-status normal">Normal</span>
          </div>
          <div className="lab-item">
            <span className="lab-name">Cholesterol</span>
            <span className="lab-value">185 mg/dL</span>
            <span className="lab-status normal">Normal</span>
          </div>
          <div className="lab-item">
            <span className="lab-name">Blood Glucose</span>
            <span className="lab-value">102 mg/dL</span>
            <span className="lab-status normal">Normal</span>
          </div>
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