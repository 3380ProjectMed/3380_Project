import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Calendar, Clock, AlertCircle, FileText, Activity,
  Heart, Thermometer, Droplet, Pill, History, Save, X, ChevronDown, ChevronUp,
  Plus, Trash2, Edit2
} from 'lucide-react';
import './ClinicalWorkSpace.css';

/**
 * ClinicalWorkSpace Component
 * 
 * Can be initialized with either:
 * - appointmentId: For viewing/editing a specific appointment
 * - patientId: For viewing patient chart without specific appointment
 * - patient: Patient object with full details (from PatientList)
 */
export default function ClinicalWorkSpace({ appointmentId, patientId, patient, onClose }) {
  const [patientData, setPatientData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [presentIllnesses, setPresentIllnesses] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);
  
  // Treatment management
  const [treatmentCatalog, setTreatmentCatalog] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [showTreatmentSelector, setShowTreatmentSelector] = useState(false);
  
  // Prescription management
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    refills_allowed: 0,
    notes: ''
  });
  
  const [expandedSections, setExpandedSections] = useState({
    vitals: true,
    treatments: true,
    currentMedications: true,
    chronicConditions: true,
    medicalHistory: false,
    medicationHistory: false,
    previousNotes: false
  });

  useEffect(() => {
    // If patient object is provided directly (from PatientList), use it
    if (patient) {
      setPatientData({
        success: true,
        has_visit: false,
        patient: patient,
        visit: {
          patient_id: patient.patient_id || patient.id,
          reason: '',
          status: null,
          diagnosis: null
        },
        vitals: {
          blood_pressure: null,
          temperature: null,
          recorded_by: null
        },
        treatments: []
      });
      setLoading(false);
      fetchTreatmentCatalog();
      if (patient.patient_id || patient.id) {
        fetchNotesByPatientId(patient.patient_id || patient.id);
      }
    } 
    // If appointmentId is provided, fetch by appointment
    else if (appointmentId) {
      fetchPatientDetails();
      fetchNotes();
      fetchTreatmentCatalog();
    }
    // If only patientId is provided, fetch by patient
    else if (patientId) {
      fetchPatientDetailsByPatientId();
      fetchNotesByPatientId(patientId);
      fetchTreatmentCatalog();
    }
  }, [appointmentId, patientId, patient]);

  // Alert helper: { message, type }
  const showAlert = (message, type = 'success', timeout = 4000) => {
    setAlert({ message, type });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), timeout);
  };

  useEffect(() => {
    return () => {
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []);

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
        
        if (data.visit && data.visit.diagnosis) {
          setDiagnosis(data.visit.diagnosis);
        }
        if (data.visit && data.visit.present_illnesses) {
          setPresentIllnesses(data.visit.present_illnesses);
        }
        
        if (data.treatments && Array.isArray(data.treatments)) {
          setSelectedTreatments(data.treatments);
        }
      } else if (data.has_visit === false) {
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

  const fetchPatientDetailsByPatientId = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-patient-details.php?patient_id=${patientId}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPatientData(data);
        
        if (data.visit && data.visit.diagnosis) {
          setDiagnosis(data.visit.diagnosis);
        }
        if (data.visit && data.visit.present_illnesses) {
          setPresentIllnesses(data.visit.present_illnesses);
        }
        
        if (data.treatments && Array.isArray(data.treatments)) {
          setSelectedTreatments(data.treatments);
        }
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

  const fetchBasicPatientInfo = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

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
        
        const patResponse = await fetch(
          `${API_BASE}/doctor_api/patients/get-by-id.php?patient_id=${patientId}`,
          { credentials: 'include' }
        );

        if (!patResponse.ok) {
          throw new Error('Could not fetch patient information');
        }

        const patData = await patResponse.json();
        
        if (patData.success && patData.patient) {
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
            treatments: [],
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

  const fetchNotesByPatientId = async (pid) => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-notes.php?patient_id=${pid}`,
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

  const fetchTreatmentCatalog = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-treatment.php`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTreatmentCatalog(data.treatments || []);
      }
    } catch (err) {
      console.error('Error fetching treatment catalog:', err);
    }
  };

  const handleSaveDiagnosis = async () => {
    if (!diagnosis.trim()) {
      showAlert('Please enter a diagnosis before saving', 'error');
      return;
    }

    // Check if we have a visit to save to
    if (!patientData?.visit?.visit_id && !appointmentId) {
      showAlert('Cannot save diagnosis: No active visit or appointment', 'error');
      return;
    }

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const payload = {
        diagnosis: diagnosis,
        present_illnesses: presentIllnesses || null
      };

      if (patientData?.visit?.visit_id) {
        payload.visit_id = patientData.visit.visit_id;
      } else if (appointmentId) {
        payload.appointment_id = appointmentId;
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
        showAlert('Diagnosis saved successfully!', 'success');
        if (appointmentId) {
          fetchNotes();
          fetchPatientDetails();
        } else if (patientId) {
          fetchNotesByPatientId(patientId);
          fetchPatientDetailsByPatientId();
        }
      } else {
        throw new Error(data.error || 'Failed to save diagnosis');
      }
    } catch (err) {
      console.error('Error saving diagnosis:', err);
      showAlert('Error saving diagnosis: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTreatment = (treatment) => {
    const exists = selectedTreatments.find(t => t.treatment_id === treatment.treatment_id);
    if (!exists) {
      setSelectedTreatments([...selectedTreatments, {
        treatment_id: treatment.treatment_id,
        treatment_name: treatment.treatment_name,
        description: treatment.description,
        quantity: 1,
        cost_each: treatment.default_cost,
        notes: ''
      }]);
    }
    setShowTreatmentSelector(false);
  };

  const handleRemoveTreatment = (index) => {
    setSelectedTreatments(selectedTreatments.filter((_, i) => i !== index));
  };

  const handleUpdateTreatment = (index, field, value) => {
    const updated = [...selectedTreatments];
    updated[index][field] = value;
    setSelectedTreatments(updated);
  };

  const handleSaveTreatments = async () => {
    if (!patientData?.visit?.visit_id) {
      showAlert('Patient must check in before adding treatments', 'error');
      return;
    }

    if (selectedTreatments.length === 0) {
      showAlert('Please add at least one treatment', 'error');
      return;
    }

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/save-treatment.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visit_id: patientData.visit.visit_id,
            treatments: selectedTreatments
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showAlert('Treatments saved successfully!', 'success');
        if (appointmentId) {
          fetchPatientDetails();
          fetchNotes();
        } else if (patientId) {
          fetchPatientDetailsByPatientId();
          fetchNotesByPatientId(patientId);
        }
      } else {
        throw new Error(data.error || 'Failed to save treatments');
      }
    } catch (err) {
      console.error('Error saving treatments:', err);
      showAlert('Error saving treatments: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!prescriptionForm.medication_name.trim()) {
      showAlert('Please enter medication name', 'error');
      return;
    }

    const currentPatientId = patientData?.patient?.id || patientData?.visit?.patient_id || patientId;
    if (!currentPatientId) {
      showAlert('Cannot save prescription: No patient ID available', 'error');
      return;
    }

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const payload = {
        ...prescriptionForm,
        patient_id: currentPatientId,
        appointment_id: appointmentId || null,
        prescription_id: editingPrescription?.id || 0
      };

      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/save-prescription.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showAlert('Prescription saved successfully!', 'success');
        setShowPrescriptionForm(false);
        setEditingPrescription(null);
        setPrescriptionForm({
          medication_name: '',
          dosage: '',
          frequency: '',
          route: 'Oral',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          refills_allowed: 0,
          notes: ''
        });
        if (appointmentId) {
          fetchPatientDetails();
        } else if (patientId) {
          fetchPatientDetailsByPatientId();
        } else if (patient) {
          // Reload patient data
          fetchPatientDetailsByPatientId(currentPatientId);
        }
      } else {
        throw new Error(data.error || 'Failed to save prescription');
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      showAlert('Error saving prescription: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm('Are you sure you want to delete this prescription?')) {
      return;
    }

    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/delete-prescription.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prescription_id: prescriptionId })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showAlert('Prescription deleted successfully!', 'success');
        if (appointmentId) {
          fetchPatientDetails();
        } else if (patientId) {
          fetchPatientDetailsByPatientId();
        } else if (patient) {
          fetchPatientDetailsByPatientId(patient.patient_id || patient.id);
        }
      } else {
        throw new Error(data.error || 'Failed to delete prescription');
      }
    } catch (err) {
      console.error('Error deleting prescription:', err);
      showAlert('Error deleting prescription: ' + err.message, 'error');
    }
  };

  const handleEditPrescription = (med) => {
    setEditingPrescription(med);
    setPrescriptionForm({
      medication_name: med.name,
      dosage: med.frequency.split(' - ')[0] || '',
      frequency: med.frequency.split(' - ')[1] || '',
      route: med.route || 'Oral',
      start_date: med.start_date,
      end_date: med.end_date || '',
      refills_allowed: med.refills_allowed || 0,
      notes: med.instructions || ''
    });
    setShowPrescriptionForm(true);
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
          <button onClick={() => {
            if (appointmentId) fetchPatientDetails();
            else if (patientId) fetchPatientDetailsByPatientId();
          }} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const patientInfo = patientData?.patient;
  const visit = patientData?.visit;
  const vitals = patientData?.vitals;
  const hasVisit = patientData?.has_visit !== false;

  return (
    <div className="clinical-workspace">
      {alert && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : alert.type === 'error' ? 'alert-error' : 'alert-info'}`} role="status">
          <div className="alert-message">{alert.message}</div>
          <button className="btn-icon" onClick={() => setAlert(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="workspace-header">
        {/* <div className="header-info"> */}
          <h2>
            <User size={24} />
            {patientInfo?.name || 'Patient'}
          </h2>
          <div className="patient-meta">
            <span>{patientInfo?.age} years old</span>
            <span>•</span>
            <span>{patientInfo?.gender || 'Unknown'}</span>
            <span>•</span>
            <span>Blood Type: {patientInfo?.blood_type || 'Unknown'}</span>
          </div>
        {/* </div> */}
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
                <span className="value">{visit?.reason || 'Chart Review'}</span>
              </div>
              {hasVisit && visit?.status && (
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className="value status-badge">{visit.status}</span>
                </div>
              )}
              {!hasVisit && appointmentId && (
                <div className="info-item warning">
                  <AlertCircle size={16} />
                  <span>Patient has not checked in yet. Vitals will be available after check-in.</span>
                </div>
              )}
            </div>
          </div>

          {/* Vitals */}
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
            <p className="allergy-text">{patientInfo?.allergies || 'No known allergies'}</p>
          </div>

          {/* Current Medications */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('currentMedications')}>
              <h3><Pill size={20} /> Current Medications</h3>
              {expandedSections.currentMedications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.currentMedications && (
              <div>
                <button 
                  onClick={() => setShowPrescriptionForm(true)} 
                  className="btn-add-small"
                  style={{ marginBottom: '10px' }}
                >
                  <Plus size={16} /> Add Prescription
                </button>
                <div className="medications-list">
                  {patientInfo?.currentMedications && patientInfo.currentMedications.length > 0 ? (
                    patientInfo.currentMedications.map((med, idx) => (
                      <div key={idx} className="medication-item">
                        <div className="med-name">{med.name}</div>
                        <div className="med-details">{med.frequency}</div>
                        {med.prescribed_by && (
                          <div className="med-prescriber">Prescribed by: {med.prescribed_by}</div>
                        )}
                        <div className="med-actions">
                          <button onClick={() => handleEditPrescription(med)} className="btn-icon">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeletePrescription(med.id)} className="btn-icon-danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No current medications</p>
                  )}
                </div>
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
                {patientInfo?.medicalHistory && patientInfo.medicalHistory.length > 0 ? (
                  patientInfo.medicalHistory.map((item, idx) => (
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
                {patientInfo?.medicationHistory && patientInfo.medicationHistory.length > 0 ? (
                  patientInfo.medicationHistory.map((med, idx) => (
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

        {/* Right Column - Clinical Actions */}
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
              disabled={!hasVisit && appointmentId}
            />
            
            <h4 style={{ marginTop: '15px', marginBottom: '5px' }}>Present Illnesses</h4>
            <textarea
              className="diagnosis-input"
              value={presentIllnesses}
              onChange={(e) => setPresentIllnesses(e.target.value)}
              placeholder="Enter present illnesses..."
              rows={2}
              disabled={!hasVisit && appointmentId}
            />
            
            <div className="notes-actions">
              <button 
                onClick={handleSaveDiagnosis} 
                className="btn-save"
                disabled={saving || !diagnosis.trim() || (!hasVisit && appointmentId)}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Diagnosis'}
              </button>
            </div>
            {!hasVisit && appointmentId && (
              <p className="input-warning">
                <AlertCircle size={14} /> Patient must check in before adding diagnosis
              </p>
            )}
          </div>

          {/* Treatments Section */}
          {hasVisit && (
            <div className="notes-card">
              <div className="card-header-with-action">
                <h3><Activity size={20} /> Treatments</h3>
                <button 
                  onClick={() => setShowTreatmentSelector(!showTreatmentSelector)} 
                  className="btn-add-small"
                >
                  <Plus size={16} /> Add Treatment
                </button>
              </div>
              
              {showTreatmentSelector && (
                <div className="treatment-selector">
                  <select 
                    onChange={(e) => {
                      const treatment = treatmentCatalog.find(t => t.treatment_id === parseInt(e.target.value));
                      if (treatment) handleAddTreatment(treatment);
                    }}
                    defaultValue=""
                  >
                    <option value="">Select a treatment...</option>
                    {treatmentCatalog.map(t => (
                      <option key={t.treatment_id} value={t.treatment_id}>
                        {t.treatment_name} 
                        {/* - ${t.cost} should doctor know the price as well? */}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="treatments-list">
                {selectedTreatments.length > 0 ? (
                  selectedTreatments.map((treatment, idx) => (
                    <div key={idx} className="treatment-item">
                      <div className="treatment-header">
                        <strong>{treatment.treatment_name}</strong>
                        <button onClick={() => handleRemoveTreatment(idx)} className="btn-icon-danger">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="treatment-controls">
                        {/* <div className="input-group">
                          <label>Quantity:</label>
                          <input 
                            type="number" 
                            min="1"
                            value={treatment.quantity}
                            onChange={(e) => handleUpdateTreatment(idx, 'quantity', parseInt(e.target.value))}
                          />
                        </div> */}
                        {/* <div className="input-group">
                          <label>Cost Each:</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={treatment.cost_each}
                            onChange={(e) => handleUpdateTreatment(idx, 'cost_each', parseFloat(e.target.value))}
                          />
                        </div> */}
                      </div>
                      <div className="input-group">
                        <label>Notes:</label>
                        <input 
                          type="text"
                          value={treatment.notes}
                          onChange={(e) => handleUpdateTreatment(idx, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                        />
                      </div>
                      {/* <div className="treatment-total">
                        Total: ${(treatment.quantity * treatment.cost_each).toFixed(2)}
                      </div> */}
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No treatments selected</p>
                )}
              </div>
              
              {selectedTreatments.length > 0 && (
                <div className="notes-actions">
                  <button 
                    onClick={handleSaveTreatments} 
                    className="btn-save"
                    disabled={saving}
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Treatments'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prescription Form Modal */}
          {showPrescriptionForm && (
            <div className="modal-overlay" onClick={() => setShowPrescriptionForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingPrescription ? 'Edit Prescription' : 'New Prescription'}</h3>
                  <button onClick={() => {
                    setShowPrescriptionForm(false);
                    setEditingPrescription(null);
                  }} className="btn-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Medication Name *</label>
                    <input 
                      type="text"
                      value={prescriptionForm.medication_name}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, medication_name: e.target.value})}
                      placeholder="Enter medication name"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Dosage</label>
                      <input 
                        type="text"
                        value={prescriptionForm.dosage}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})}
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div className="form-group">
                      <label>Frequency</label>
                      <input 
                        type="text"
                        value={prescriptionForm.frequency}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, frequency: e.target.value})}
                        placeholder="e.g., twice daily"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Route</label>
                      <select 
                        value={prescriptionForm.route}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, route: e.target.value})}
                      >
                        <option value="Oral">Oral</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="Topical">Topical</option>
                        <option value="Inhalation">Inhalation</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Refills Allowed</label>
                      <input 
                        type="number"
                        min="0"
                        value={prescriptionForm.refills_allowed}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, refills_allowed: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input 
                        type="date"
                        value={prescriptionForm.start_date}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, start_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input 
                        type="date"
                        value={prescriptionForm.end_date}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Instructions/Notes</label>
                    <textarea 
                      rows={3}
                      value={prescriptionForm.notes}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => {
                    setShowPrescriptionForm(false);
                    setEditingPrescription(null);
                  }} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSavePrescription} className="btn-save" disabled={saving}>
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Prescription'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                      {note.note_text && (
                        <div className="note-text">
                          <strong>Treatments:</strong> {note.note_text}
                        </div>
                      )}
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