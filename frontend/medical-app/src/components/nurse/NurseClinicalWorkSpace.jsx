// src/components/nurse/NurseClinicalWorkspace.jsx - SIMPLIFIED VERSION
import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Save, X, CheckCircle, User, Calendar } from 'lucide-react';
import './NurseClinicalWorkSpace.css';

/**
 * NurseClinicalWorkspace - SIMPLIFIED Vitals Recording
 * 
 * Only uses existing database columns:
 * - blood_pressure
 * - temperature  
 * - present_illnesses
 */
function NurseClinicalWorkspace({ selectedPatient, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Simplified vitals - only what exists in DB
  const [vitals, setVitals] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    present_illnesses: ''
  });

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
        `${API_BASE}/doctor_api/clinical/get-patient-details.php?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patient details');
      }

      const data = await response.json();

      if (data.success) {
        setPatientData(data);

        // Pre-fill existing vitals
        if (data.vitals) {
          const bp = data.vitals.blood_pressure || '';
          const [systolic, diastolic] = bp.split('/');

          setVitals(prev => ({
            ...prev,
            blood_pressure_systolic: systolic || '',
            blood_pressure_diastolic: diastolic || '',
            temperature: data.vitals.temperature || '',
            present_illnesses: data.visit?.present_illnesses || ''
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

    // Blood pressure validation
    const systolic = parseInt(vitals.blood_pressure_systolic);
    const diastolic = parseInt(vitals.blood_pressure_diastolic);
    
    if (vitals.blood_pressure_systolic && (systolic < 70 || systolic > 200)) {
      errors.push('Systolic BP should be between 70-200 mmHg');
    }
    if (vitals.blood_pressure_diastolic && (diastolic < 40 || diastolic > 130)) {
      errors.push('Diastolic BP should be between 40-130 mmHg');
    }

    // Temperature validation
    const temp = parseFloat(vitals.temperature);
    if (vitals.temperature && (temp < 95 || temp > 106)) {
      errors.push('Temperature should be between 95-106°F');
    }

    return errors;
  };

  const handleSave = async () => {
    try {
      // Validate vitals
      const validationErrors = validateVitals();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }

      // At least BP or temp is required
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

      // Format blood pressure
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
        
        // Notify parent
        if (onSave) {
          onSave(patientData.visit?.visit_id);
        }

        // Auto-close after 1.5 seconds
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
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
            <strong>{visit.reason}</strong>
            <span>{new Date(visit.date).toLocaleDateString()}</span>
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

      {/* Main Content - SIMPLIFIED */}
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
            <span>Vitals saved successfully! Patient ready for doctor.</span>
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
                Save Vitals
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NurseClinicalWorkspace;
