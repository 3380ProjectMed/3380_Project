// src/components/nurse/NurseClinicalWorkspace.jsx - UPDATED WITH STATUS HANDLING
import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Save, X, CheckCircle, User, Calendar, Plus, Edit2, Trash2, Pill, Heart, Thermometer } from 'lucide-react';
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
    custom_allergy: '',
    notes: '',
    use_custom: false
  });
  const [availableAllergies, setAvailableAllergies] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]); // For multiple selection

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
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  // Helper function to show notifications
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000); // Auto-hide after 5 seconds
  };

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
        console.log('Patient details loaded:', data);
        console.log('Current prescriptions:', data.medications?.current_prescriptions);
        console.log('Medication history:', data.medications?.medication_history);
        
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

  const handleAddAllergy = async (allergyText, notes = '') => {
    if (!allergyText.trim()) return;

    setManagementLoading(true);
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-allergies.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientData.patient.patient_id,
          allergy_text: allergyText,
          notes: notes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add allergy');
      }
      
      return data;
    } catch (error) {
      console.error('Error adding allergy:', error);
      throw error;
    } finally {
      setManagementLoading(false);
    }
  };

  const handleAddMultipleAllergies = async (e) => {
    e.preventDefault();
    
    const allergiesToAdd = [];
    
    // Add selected allergies with individual notes if provided, or general notes
    selectedAllergies.forEach(allergyText => {
      allergiesToAdd.push({ 
        text: allergyText, 
        notes: allergyForm.notes || '' // Use shared notes for selected allergies
      });
    });
    
    // Add custom allergy if specified
    if (allergyForm.use_custom && allergyForm.custom_allergy.trim()) {
      allergiesToAdd.push({ 
        text: allergyForm.custom_allergy.trim(), 
        notes: allergyForm.notes || ''
      });
    }
    
    if (allergiesToAdd.length === 0) {
      showNotification('error', 'Please select at least one allergy or enter a custom allergy');
      return;
    }

    setManagementLoading(true);
    let successCount = 0;
    let updatedCount = 0;
    let errors = [];

    try {
      // Add allergies one by one
      for (const allergy of allergiesToAdd) {
        try {
          const result = await handleAddAllergy(allergy.text, allergy.notes);
          if (result.updated) {
            updatedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          // Check if it's a duplicate error
          const errorMessage = error.message;
          if (errorMessage.includes('already recorded')) {
            errors.push(`${allergy.text}: Already exists for this patient`);
          } else {
            errors.push(`${allergy.text}: ${errorMessage}`);
          }
        }
      }

      // Reset form and refresh data
      setAllergyForm({ allergy_text: '', custom_allergy: '', notes: '', use_custom: false });
      setSelectedAllergies([]);
      setShowAllergyForm(false);
      await fetchPatientDetails();

      // Show results with notifications instead of alerts
      if (successCount > 0 || updatedCount > 0) {
        let message = '';
        if (successCount > 0) {
          message += `${successCount} ${successCount === 1 ? 'allergy' : 'allergies'} added`;
        }
        if (updatedCount > 0) {
          if (message) message += ', ';
          message += `${updatedCount} ${updatedCount === 1 ? 'allergy' : 'allergies'} updated`;
        }
        message += ' successfully!';
        
        if (errors.length > 0) {
          showNotification('error', `Some allergies had errors: ${errors.join(', ')}`);
        } else {
          showNotification('success', message);
        }
      } else {
        showNotification('error', 'Failed to add allergies: ' + errors.join(', '));
      }
    } catch (error) {
      console.error('Error in batch allergy addition:', error);
      showNotification('error', 'Error adding allergies');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleRemoveAllergy = async (allergyId, allergyCode) => {
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
        showNotification('success', 'Allergy removed successfully!');
      } else {
        showNotification('error', 'Error removing allergy: ' + data.error);
      }
    } catch (error) {
      console.error('Error removing allergy:', error);
      showNotification('error', 'Error removing allergy');
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
      
      const requestData = {
        patient_id: patientData.patient.patient_id,
        ...medicationForm
      };
      
      console.log('Adding medication with data:', requestData);
      console.log('Medication type:', medicationForm.type);
      
      const response = await fetch(`${API_BASE}/nurse_api/clinical/manage-medications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Server response:', data);
      
      if (data.success) {
        const currentType = medicationForm.type; // Preserve the type for success message
        console.log('Successfully added medication of type:', currentType);
        
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
        
        let successMessage;
        if (data.fallback && currentType === 'prescription') {
          successMessage = 'Warning: Prescription failed, medication added to history instead.';
          showNotification('error', successMessage);
        } else if (currentType === 'prescription') {
          successMessage = 'Active prescription added successfully!';
          showNotification('success', successMessage);
        } else {
          successMessage = 'Medication added to history successfully!';
          showNotification('success', successMessage);
        }
      } else {
        showNotification('error', 'Error adding medication: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      showNotification('error', 'Error adding medication');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleRemoveMedication = async (medicationId, type = 'prescription') => {
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
        showNotification('success', 'Medication removed successfully!');
      } else {
        showNotification('error', 'Error removing medication: ' + data.error);
      }
    } catch (error) {
      console.error('Error removing medication:', error);
      showNotification('error', 'Error removing medication');
    } finally {
      setManagementLoading(false);
    }
  };

  // Helper functions for multiple allergy selection
  const toggleAllergySelection = (allergyText) => {
    setSelectedAllergies(prev => {
      if (prev.includes(allergyText)) {
        return prev.filter(a => a !== allergyText);
      } else {
        return [...prev, allergyText];
      }
    });
  };

  const resetAllergyForm = () => {
    setAllergyForm({ allergy_text: '', custom_allergy: '', notes: '', use_custom: false });
    setSelectedAllergies([]);
    setShowAllergyForm(false);
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
            <div key={index} className="allergy-item">
              <div className="allergy-main">
                <span className="allergy-name">{allergy.allergies_text}</span>
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
            <h4>Add Allergies</h4>
            <form onSubmit={handleAddMultipleAllergies}>
              
              {/* Available Allergies Selection */}
              <div className="form-section">
                <label className="form-label">Select Known Allergies:</label>
                <div className="allergies-checklist">
                  {availableAllergies.map(allergy => (
                    <label key={allergy.allergies_code} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedAllergies.includes(allergy.allergies_text)}
                        onChange={() => toggleAllergySelection(allergy.allergies_text)}
                        disabled={managementLoading}
                      />
                      <span className="checkbox-label">{allergy.allergies_text}</span>
                    </label>
                  ))}
                  
                  {/* Other/Custom option */}
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={allergyForm.use_custom}
                      onChange={(e) => setAllergyForm(prev => ({ ...prev, use_custom: e.target.checked }))}
                      disabled={managementLoading}
                    />
                    <span className="checkbox-label">Other (specify below)</span>
                  </label>
                </div>
              </div>

              {/* Custom Allergy Input */}
              {allergyForm.use_custom && (
                <div className="form-section">
                  <label className="form-label">Custom Allergy:</label>
                  <input
                    type="text"
                    placeholder="Enter specific allergy"
                    value={allergyForm.custom_allergy}
                    onChange={(e) => setAllergyForm(prev => ({ ...prev, custom_allergy: e.target.value }))}
                    className="form-input"
                    disabled={managementLoading}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="form-section">
                <label className="form-label">Notes (optional):</label>
                <input
                  type="text"
                  placeholder="Additional notes for selected allergies"
                  value={allergyForm.notes}
                  onChange={(e) => setAllergyForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  disabled={managementLoading}
                />
              </div>

              {/* Selected Count */}
              {(selectedAllergies.length > 0 || (allergyForm.use_custom && allergyForm.custom_allergy.trim())) && (
                <div className="selection-summary">
                  <strong>Selected: </strong>
                  {selectedAllergies.length > 0 && <span>{selectedAllergies.length} known allergies</span>}
                  {selectedAllergies.length > 0 && allergyForm.use_custom && allergyForm.custom_allergy.trim() && <span>, </span>}
                  {allergyForm.use_custom && allergyForm.custom_allergy.trim() && <span>1 custom allergy</span>}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={managementLoading}>
                  {managementLoading ? 'Adding...' : 'Add Selected Allergies'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={resetAllergyForm}
                  disabled={managementLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Active Prescriptions Section */}
      <div className="medications-section">
        <div className="section-header">
          <h3>💊 Current Medications (Active Prescriptions)</h3>
          <button 
            className="btn-add-item" 
            onClick={() => {
              setMedicationForm(prev => ({ ...prev, type: 'prescription' }));
              setShowMedicationForm(true);
            }}
            disabled={managementLoading}
            title="Add Active Prescription"
          >
            <Pill size={16} />
            Add Prescription
          </button>
        </div>
        
        {/* Active Prescriptions List */}
        {patientData?.medications?.current_prescriptions?.length > 0 ? (
          <div className="medications-grid">
            {patientData.medications.current_prescriptions.map((med, index) => (
              <div key={index} className="medication-item prescription">
                <div className="med-header">
                  <div className="med-name">{med.medication_name}</div>
                  <div className="med-status active">ACTIVE</div>
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemoveMedication(med.prescription_id, 'prescription')}
                    disabled={managementLoading}
                    title="Remove prescription"
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
                {med.notes && <div className="med-notes">{med.notes}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-items-message">
            No active prescriptions
          </div>
        )}
      </div>

      {/* Medication History Section */}
      <div className="medications-section">
        <div className="section-header">
          <h3>📋 Medication History</h3>
          <button 
            className="btn-add-item secondary" 
            onClick={() => {
              setMedicationForm(prev => ({ ...prev, type: 'history' }));
              setShowMedicationForm(true);
            }}
            disabled={managementLoading}
            title="Add to Medication History"
          >
            <Plus size={16} />
            Add to History
          </button>
        </div>
        
        {/* Medication History List */}
        {patientData?.medications?.medication_history?.length > 0 ? (
          <div className="medications-grid">
            {patientData.medications.medication_history.map((med, index) => (
              <div key={index} className="medication-item history">
                <div className="med-header">
                  <div className="med-name">{med.drug_name}</div>
                  <div className="med-status history">HISTORY</div>
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemoveMedication(med.drug_id, 'history')}
                    disabled={managementLoading}
                    title="Remove from history"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="med-frequency">{med.frequency}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-items-message">
            No medication history recorded
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
        {/* Vital Signs Display - Doctor Style */}
        <div className="info-card">
          <div className="card-header">
            <h3><Activity size={20} /> Vital Signs</h3>
          </div>
          <div className="vitals-grid">
            <div className="vital-item">
              <Heart className="vital-icon bp" size={24} />
              <div>
                <span className="vital-label">Blood Pressure</span>
                <span className="vital-value">
                  {visit.blood_pressure || 'Not recorded'}
                </span>
              </div>
            </div>
            <div className="vital-item">
              <Thermometer className="vital-icon temp" size={24} />
              <div>
                <span className="vital-label">Temperature</span>
                <span className="vital-value">
                  {visit.temperature ? `${visit.temperature}°F` : 'Not recorded'}
                </span>
              </div>
            </div>
            {visit.blood_pressure || visit.temperature ? (
              <div className="vital-footer">
                Recorded by: Tina Nguyen
              </div>
            ) : null}
          </div>
        </div>

        {/* Vitals Input Form */}
        <div className="info-card">
          <div className="card-header">
            <h3><Edit2 size={20} /> Record Vitals</h3>
          </div>
          <div className="vitals-input-content">
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

              {/* Present Illnesses */}
              <div className="form-section full-width">
                <div className="section-header">
                  <h3>📋 Chief Complaints / Present Illnesses</h3>
                  {vitals.present_illnesses && (
                    <button
                      type="button"
                      onClick={() => setVitals(prev => ({ ...prev, present_illnesses: '' }))}
                      className="delete-btn"
                      title="Clear chief complaints"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
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

        {notification && (
          <div className={`alert alert-${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
            <button 
              className="notification-close" 
              onClick={() => setNotification(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ×
            </button>
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