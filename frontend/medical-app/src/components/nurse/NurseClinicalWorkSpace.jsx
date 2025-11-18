// src/components/nurse/NurseClinicalWorkspace.jsx - UPDATED WITH STATUS HANDLING
import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Save, X, CheckCircle, User, Calendar, Plus, Edit2, Trash2, Pill } from 'lucide-react';
import './NurseClinicalWorkSpace.css';

/**
 * NurseClinicalWorkspace - Vitals Recording with Status Updates
 * 
 * When vitals are saved, appointment status automatically changes to "Ready"
 */
function NurseClinicalWorkspace({ selectedPatient, onClose, onSave }) {
  const formatChicagoDate = (date, options = {}) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      ...options
    }).format(new Date(date));
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [vitals, setVitals] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    present_illnesses: ''
  });

  // Allergy management states
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergyForm, setAllergyForm] = useState({
    allergy_text: '',
    notes: ''
  });
  const [availableAllergies, setAvailableAllergies] = useState([]);

  // Medication management states
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    notes: '',
    type: 'history'
  });

  // General management states
  const [managementLoading, setManagementLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient?.visit_id || selectedPatient?.appointment_id) {
      fetchPatientDetails();
    }
  }, [selectedPatient]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

      const params = new URLSearchParams();
      if (selectedPatient.visit_id) {
        params.append('visit_id', selectedPatient.visit_id);
      } else if (selectedPatient.appointment_id) {
        params.append('appointment_id', selectedPatient.appointment_id);
      }

      const response = await fetch(
        `${API_BASE}/nurse_api/clinical/get-patient-details.php?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patient details');
      }

      const data = await response.json();

      if (data.success) {
        setPatientData(data);

        // Pre-fill existing vitals from visit data
        if (data.visit) {
          const bp = data.visit.blood_pressure || '';
          const [systolic, diastolic] = bp.includes('/') ? bp.split('/') : ['', ''];

          setVitals(prev => ({
            ...prev,
            blood_pressure_systolic: systolic || '',
            blood_pressure_diastolic: diastolic || '',
            temperature: data.visit.temperature || '',
            present_illnesses: data.visit.present_illnesses || ''
          }));
        }
      } else {
        setError(data.error || 'Failed to load patient data');
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVitalChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const validateVitals = () => {
    const errors = [];

    const systolic = parseInt(vitals.blood_pressure_systolic);
    const diastolic = parseInt(vitals.blood_pressure_diastolic);
    
    if (vitals.blood_pressure_systolic && (systolic < 70 || systolic > 200)) {
      errors.push('Systolic BP should be between 70-200 mmHg');
    }
    if (vitals.blood_pressure_diastolic && (diastolic < 40 || diastolic > 130)) {
      errors.push('Diastolic BP should be between 40-130 mmHg');
    }

    const temp = parseFloat(vitals.temperature);
    if (vitals.temperature && (temp < 95 || temp > 106)) {
      errors.push('Temperature should be between 95-106°F');
    }

    return errors;
  };

  const handleSave = async () => {
    try {
      const validationErrors = validateVitals();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }

      const hasVitals = vitals.blood_pressure_systolic || vitals.temperature;
      
      if (!hasVitals) {
        setError('Please enter at least blood pressure or temperature');
        return;
      }

      setSaving(true);
      setError(null);

      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

      const blood_pressure = (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic)
        ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`
        : null;

      const payload = {
        visit_id: patientData.visit?.visit_id,
        appointment_id: patientData.visit?.appointment_id,
        blood_pressure,
        temperature: vitals.temperature || null,
        present_illnesses: vitals.present_illnesses || null
      };

      const response = await fetch(
        `${API_BASE}/nurse_api/clinical/save-vitals.php`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Update patient data with saved vitals AND new status
        setPatientData(prevData => ({
          ...prevData,
          visit: {
            ...prevData.visit,
            blood_pressure: blood_pressure,
            temperature: vitals.temperature,
            present_illnesses: vitals.present_illnesses,
            status: data.new_status || 'Ready'
          }
        }));
        
        // Notify parent with full update info
        if (onSave) {
          onSave({
            visit_id: patientData.visit?.visit_id,
            appointment_id: patientData.visit?.appointment_id,
            new_status: data.new_status || 'Ready'
          });
        }

        // Keep success message for 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError(data.error || 'Failed to save vitals');
      }
    } catch (err) {
      console.error('Error saving vitals:', err);
      setError('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Allergy management functions
  const loadAvailableAllergies = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-allergies.php`);
      const data = await response.json();
      if (data.success) {
        setAvailableAllergies(data.allergy_codes || []);
      }
    } catch (error) {
      console.error('Error loading allergies:', error);
    }
  };

  const handleAddAllergy = async (e) => {
    e.preventDefault();
    if (!allergyForm.allergy_text.trim()) return;

    setManagementLoading(true);
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-allergies.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientData.patient.patient_id,
          allergy_text: allergyForm.allergy_text,
          notes: allergyForm.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        setAllergyForm({ allergy_text: '', notes: '' });
        setShowAllergyForm(false);
        // Refresh patient data
        await fetchPatientDetails();
        alert('Allergy added successfully!');
      } else {
        alert('Error adding allergy: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding allergy:', error);
      alert('Error adding allergy');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleRemoveAllergy = async (allergyId, allergyCode) => {
    if (!confirm('Are you sure you want to remove this allergy?')) return;

    setManagementLoading(true);
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const params = new URLSearchParams({
        patient_id: patientData.patient.patient_id
      });
      
      if (allergyId) params.append('allergy_id', allergyId);
      if (allergyCode) params.append('allergy_code', allergyCode);

      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-allergies.php?${params}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await fetchPatientDetails();
        alert('Allergy removed successfully!');
      } else {
        alert('Error removing allergy: ' + data.error);
      }
    } catch (error) {
      console.error('Error removing allergy:', error);
      alert('Error removing allergy');
    } finally {
      setManagementLoading(false);
    }
  };

  // Medication management functions
  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!medicationForm.medication_name.trim()) return;

    setManagementLoading(true);
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-medications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientData.patient.patient_id,
          ...medicationForm
        })
      });

      const data = await response.json();
      if (data.success) {
        setMedicationForm({
          medication_name: '',
          dosage: '',
          frequency: '',
          route: 'Oral',
          notes: '',
          type: 'history'
        });
        setShowMedicationForm(false);
        await fetchPatientDetails();
        alert('Medication added successfully!');
      } else {
        alert('Error adding medication: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Error adding medication');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleRemoveMedication = async (medicationId, type = 'prescription') => {
    if (!confirm('Are you sure you want to remove this medication?')) return;

    setManagementLoading(true);
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const params = new URLSearchParams({ type });
      
      if (type === 'prescription') {
        params.append('prescription_id', medicationId);
      } else {
        params.append('drug_id', medicationId);
      }

      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-medications.php?${params}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await fetchPatientDetails();
        alert('Medication removed successfully!');
      } else {
        alert('Error removing medication: ' + data.error);
      }
    } catch (error) {
      console.error('Error removing medication:', error);
      alert('Error removing medication');
    } finally {
      setManagementLoading(false);
    }
  };

  // Load available allergies on component mount
  useEffect(() => {
    loadAvailableAllergies();
  }, []);

  if (loading) {
    return (
      <div className="clinical-workspace loading">
        <div className="loading-spinner">Loading patient data...</div>
      </div>
    );
  }

  if (error && !patientData) {
    return (
      <div className="clinical-workspace error">
        <div className="error-box">
          <AlertCircle size={48} />
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={onClose} className="btn-close">Close</button>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="clinical-workspace error">
        <div className="error-box">
          <AlertCircle size={48} />
          <h2>No Patient Selected</h2>
          <p>Please select a patient from your schedule</p>
          <button onClick={onClose} className="btn-close">Close</button>
        </div>
      </div>
    );
  }

  const patient = patientData.patient;
  const visit = patientData.visit;

  return (
    <div className="clinical-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="header-left">
          <Activity size={28} />
          <div className="header-title">
            <h1>Record Vitals</h1>
            <p>Patient Vitals Assessment</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-close-header">
          <X size={24} />
        </button>
      </div>

      {/* Patient Info Bar */}
      <div className="patient-info-bar">
        <div className="info-item">
          <User size={18} />
          <div>
            <strong>{patient.name}</strong>
            <span>{patient.age}y, {patient.gender}</span>
          </div>
        </div>
        <div className="info-item">
          <Calendar size={18} />
          <div>
            <strong>{visit.reason_for_visit || visit.reason || 'Not specified'}</strong>
            <span>{formatChicagoDate(visit.date)}</span>
          </div>
        </div>
        {patient.allergies && patient.allergies !== 'None' && (
          <div className="info-item alert">
            <AlertCircle size={18} />
            <div>
              <strong>ALLERGIES:</strong>
              <span>{patient.allergies}</span>
            </div>
          </div>
        )}
      </div>

      {/* Previously Saved Vitals/Notes */}
      {(visit.blood_pressure || visit.temperature || visit.present_illnesses) && (
        <div className="saved-vitals-section">
          <h3>📋 Previously Recorded</h3>
          <div className="saved-vitals-grid">
            {visit.blood_pressure && (
              <div className="saved-vital">
                <span className="vital-label">Blood Pressure:</span>
                <span className="vital-value">{visit.blood_pressure}</span>
              </div>
            )}
            {visit.temperature && (
              <div className="saved-vital">
                <span className="vital-label">Temperature:</span>
                <span className="vital-value">{visit.temperature}°F</span>
              </div>
            )}
            {visit.present_illnesses && (
              <div className="saved-vital full-width">
                <span className="vital-label">Chief Complaints / Present Illnesses:</span>
                <div className="vital-value notes">{visit.present_illnesses}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Allergies */}
      <div className="allergies-section">
        <div className="section-header">
          <h3>🚨 Allergies</h3>
          <button 
            className="btn-add-item" 
            onClick={() => setShowAllergyForm(true)}
            disabled={managementLoading}
          >
            <Plus size={16} />
            Add Allergy
          </button>
        </div>
        
        <div className="allergies-grid">
          {/* Specific Allergies */}
          {patientData?.allergies?.specific_allergies?.map((allergy, index) => (
            <div key={index} className="allergy-item">
              <div className="allergy-main">
                <span className="allergy-name">{allergy.allergies_text}</span>
                {allergy.notes && (
                  <span className="allergy-notes">({allergy.notes})</span>
                )}
              </div>
              <div className="item-actions">
                <span className="allergy-date">Added: {formatChicagoDate(allergy.created_at)}</span>
                <button 
                  className="btn-remove"
                  onClick={() => handleRemoveAllergy(allergy.app_id, null)}
                  disabled={managementLoading}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          
          {/* General Allergy (fallback) */}
          {patientData?.allergies?.general_allergy?.map((allergy, index) => (
            <div key={index} className="allergy-item general">
              <div className="allergy-main">
                <span className="allergy-name">{allergy.allergies_text}</span>
                <span className="allergy-type">(General Record)</span>
              </div>
              <div className="item-actions">
                <button 
                  className="btn-remove"
                  onClick={() => handleRemoveAllergy(null, allergy.allergies_code)}
                  disabled={managementLoading}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          
          {/* No allergies message */}
          {(!patientData?.allergies?.specific_allergies?.length && !patientData?.allergies?.general_allergy?.length) && (
            <div className="no-items-message">
              No known allergies recorded
            </div>
          )}
        </div>

        {/* Add Allergy Form */}
        {showAllergyForm && (
          <div className="add-item-form">
            <h4>Add New Allergy</h4>
            <form onSubmit={handleAddAllergy}>
              <div className="form-row">
                <select
                  value={allergyForm.allergy_text}
                  onChange={(e) => setAllergyForm(prev => ({ ...prev, allergy_text: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select existing allergy...</option>
                  {availableAllergies.map(allergy => (
                    <option key={allergy.allergies_code} value={allergy.allergies_text}>
                      {allergy.allergies_text}
                    </option>
                  ))}
                </select>
                <span className="form-or">OR</span>
                <input
                  type="text"
                  placeholder="Enter new allergy"
                  value={allergyForm.allergy_text}
                  onChange={(e) => setAllergyForm(prev => ({ ...prev, allergy_text: e.target.value }))}
                  className="form-input"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={allergyForm.notes}
                onChange={(e) => setAllergyForm(prev => ({ ...prev, notes: e.target.value }))}
                className="form-input"
              />
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={managementLoading}>
                  {managementLoading ? 'Adding...' : 'Add Allergy'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowAllergyForm(false);
                    setAllergyForm({ allergy_text: '', notes: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Current Medications */}
      <div className="medications-section">
        <div className="section-header">
          <h3>💊 Current Medications</h3>
          <button 
            className="btn-add-item" 
            onClick={() => setShowMedicationForm(true)}
            disabled={managementLoading}
          >
            <Pill size={16} />
            Add Medication
          </button>
        </div>
        
        {/* Active Prescriptions */}
        {patientData?.medications?.current_prescriptions?.length > 0 && (
          <div className="medications-subsection">
            <h4>Active Prescriptions</h4>
            <div className="medications-grid">
              {patientData.medications.current_prescriptions.map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="med-header">
                    <div className="med-name">{med.medication_name}</div>
                    <button 
                      className="btn-remove"
                      onClick={() => handleRemoveMedication(med.prescription_id, 'prescription')}
                      disabled={managementLoading}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="med-details">
                    {med.dosage && <span className="med-dosage">{med.dosage}</span>}
                    {med.frequency && <span className="med-frequency">{med.frequency}</span>}
                    {med.route && <span className="med-route">{med.route}</span>}
                  </div>
                  {med.prescribed_by && (
                    <div className="med-prescriber">Prescribed by: {med.prescribed_by}</div>
                  )}
                  <div className="med-dates">
                    Start: {formatChicagoDate(med.start_date)}
                    {med.end_date && ` | End: ${formatChicagoDate(med.end_date)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Medication History */}
        {patientData?.medications?.medication_history?.length > 0 && (
          <div className="medications-subsection">
            <h4>Medication History</h4>
            <div className="medications-grid">
              {patientData.medications.medication_history.map((med, index) => (
                <div key={index} className="medication-item history">
                  <div className="med-header">
                    <div className="med-name">{med.drug_name}</div>
                    <button 
                      className="btn-remove"
                      onClick={() => handleRemoveMedication(med.drug_id, 'history')}
                      disabled={managementLoading}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="med-frequency">{med.frequency}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* No medications message */}
        {(!patientData?.medications?.current_prescriptions?.length && !patientData?.medications?.medication_history?.length) && (
          <div className="no-items-message">
            No medications recorded
          </div>
        )}

        {/* Add Medication Form */}
        {showMedicationForm && (
          <div className="add-item-form">
            <h4>Add New Medication</h4>
            <form onSubmit={handleAddMedication}>
              <input
                type="text"
                placeholder="Medication name *"
                value={medicationForm.medication_name}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, medication_name: e.target.value }))}
                className="form-input"
                required
              />
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg)"
                  value={medicationForm.dosage}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g., Twice daily)"
                  value={medicationForm.frequency}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <select
                  value={medicationForm.route}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, route: e.target.value }))}
                  className="form-select"
                >
                  <option value="Oral">Oral</option>
                  <option value="Injection">Injection</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhaled">Inhaled</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={medicationForm.type}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, type: e.target.value }))}
                  className="form-select"
                >
                  <option value="history">Add to History</option>
                  <option value="prescription">Add as Prescription</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={medicationForm.notes}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                className="form-input"
              />
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={managementLoading}>
                  {managementLoading ? 'Adding...' : 'Add Medication'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowMedicationForm(false);
                    setMedicationForm({
                      medication_name: '',
                      dosage: '',
                      frequency: '',
                      route: 'Oral',
                      notes: '',
                      type: 'history'
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="workspace-content">
        <div className="vitals-grid-simple">
          {/* Blood Pressure */}
          <div className="form-section">
            <h3>📊 Blood Pressure</h3>
            <div className="bp-inputs">
              <div className="form-group">
                <label>Systolic</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={vitals.blood_pressure_systolic}
                    onChange={(e) => handleVitalChange('blood_pressure_systolic', e.target.value)}
                    placeholder="120"
                    min="70"
                    max="200"
                  />
                  <span className="unit">mmHg</span>
                </div>
              </div>
              <span className="bp-separator">/</span>
              <div className="form-group">
                <label>Diastolic</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={vitals.blood_pressure_diastolic}
                    onChange={(e) => handleVitalChange('blood_pressure_diastolic', e.target.value)}
                    placeholder="80"
                    min="40"
                    max="130"
                  />
                  <span className="unit">mmHg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="form-section">
            <h3>🌡️ Temperature</h3>
            <div className="form-group">
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => handleVitalChange('temperature', e.target.value)}
                  placeholder="98.6"
                  min="95"
                  max="106"
                />
                <span className="unit">°F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Present Illnesses */}
        <div className="form-section full-width">
          <h3>📋 Chief Complaints / Present Illnesses</h3>
          <div className="form-group">
            <textarea
              value={vitals.present_illnesses}
              onChange={(e) => handleVitalChange('present_illnesses', e.target.value)}
              placeholder="Patient reports headache, dizziness, nausea..."
              rows={4}
            />
            <small className="helper-text">
              Document patient's current symptoms and complaints
            </small>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="workspace-footer">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>✅ Vitals saved! Patient ready for doctor.</span>
          </div>
        )}

        <div className="footer-actions">
          <button onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save size={18} />
                Save Vitals & Mark Ready
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NurseClinicalWorkspace;