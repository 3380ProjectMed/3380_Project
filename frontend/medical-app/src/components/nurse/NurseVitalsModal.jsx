import React, { useState, useEffect } from 'react';
import './NursePatients.css';
import { getNursePatientClinicalDetails, getAllergyCodes, saveNurseVitalsAndAllergies } from '../../api/nurse';

export default function NurseVitalsModal({ patient, appointment, appointmentId, visitId, patientId, onClose, onSaved }) {
  // Chicago timezone helper function
  const formatChicagoDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Vitals state
  const [vitals, setVitals] = useState({
    bp: '',
    hr: '',
    temp: '',
    spo2: '',
    height: '',
    weight: '',
    notes: ''
  });

  // Allergies state
  const [allergies, setAllergies] = useState([]);
  const [availableAllergyCodes, setAvailableAllergyCodes] = useState([]);
  const [newAllergyId, setNewAllergyId] = useState('');
  const [newAllergyNotes, setNewAllergyNotes] = useState('');

  // Medications state
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosageAndFrequency: ''
  });

  // Load data on mount
  useEffect(() => {
    if (patientId) {
      loadPatientClinicalData();
      loadAllergyCodes();
    }
  }, [patientId, appointmentId]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const loadPatientClinicalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getNursePatientClinicalDetails(patientId, appointmentId);
      
      if (data.success) {
        setVitals(data.vitals || {
          bp: '', hr: '', temp: '', spo2: '', height: '', weight: '', notes: ''
        });
        setAllergies(data.allergies || []);
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error('Error loading patient clinical data:', err);
      setError('Failed to load patient data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadAllergyCodes = async () => {
    try {
      const data = await getAllergyCodes();
      if (data.success) {
        setAvailableAllergyCodes(data.allergyCodes || []);
      }
    } catch (err) {
      console.error('Error loading allergy codes:', err);
    }
  };

  const handleVitalChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const addAllergy = () => {
    if (!newAllergyId || newAllergyId === '') return;
    
    const allergyCode = availableAllergyCodes.find(code => code.id === parseInt(newAllergyId));
    if (!allergyCode) return;

    // Check if allergy already exists
    if (allergies.some(allergy => allergy.allergyId === parseInt(newAllergyId))) return;

    const newAllergy = {
      allergyId: parseInt(newAllergyId),
      name: allergyCode.name,
      notes: newAllergyNotes
    };

    setAllergies(prev => [...prev, newAllergy]);
    setNewAllergyId('');
    setNewAllergyNotes('');
  };

  const removeAllergy = (index) => {
    setAllergies(prev => prev.filter((_, i) => i !== index));
  };

  const updateAllergyNotes = (index, notes) => {
    setAllergies(prev => prev.map((allergy, i) => 
      i === index ? { ...allergy, notes } : allergy
    ));
  };

  const addMedication = () => {
    if (!newMedication.name.trim()) return;

    setMedications(prev => [...prev, { ...newMedication }]);
    setNewMedication({ name: '', dosageAndFrequency: '' });
  };

  const removeMedication = (index) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    setMedications(prev => prev.map((medication, i) => 
      i === index ? { ...medication, [field]: value } : medication
    ));
  };

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    
    if (!appointmentId) {
      setError('Appointment ID missing');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        patientId: patientId,
        appointmentId: appointmentId,
        visitId: visitId,
        vitals: vitals,
        allergies: allergies,
        medications: medications
      };

      await saveNurseVitalsAndAllergies(payload);
      
      if (onSaved) onSaved({
        appointmentId,
        visitId,
        vitals,
        allergies,
        medications
      });
      
      onClose && onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save patient data');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading patient data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => onClose && onClose()}>
      <div className="modal-content vitals-modal-expanded" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Patient Clinical Details — {patient?.first_name || patient?.name?.split(' ')[0] || 'Patient'} {patient?.last_name || patient?.name?.split(' ')[1] || ''}</h2>
          <button className="modal-close" onClick={() => onClose && onClose()} aria-label="Close">✕</button>
        </div>
        
        <div style={{ color: '#666', marginBottom: 16 }}>
          Appointment #{appointmentId} — {appointment?.Appointment_date ? formatChicagoDateTime(appointment.Appointment_date) : ''} 
          {appointment?.office_name ? ` @ ${appointment.office_name}` : ''}
        </div>
        
        {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}
        
        <form className="modal-form vitals-form-expanded" onSubmit={handleSave}>
          {/* Vitals Section */}
          <div className="section">
            <h3>Vitals</h3>
            <div className="vitals-grid-expanded">
              <label>
                Blood Pressure
                <input 
                  value={vitals.bp} 
                  onChange={e => handleVitalChange('bp', e.target.value)} 
                  placeholder="e.g., 120/80" 
                />
              </label>
              <label>
                Heart Rate
                <input 
                  value={vitals.hr} 
                  onChange={e => handleVitalChange('hr', e.target.value)} 
                  placeholder="e.g., 72" 
                />
              </label>
              <label>
                Temperature
                <input 
                  value={vitals.temp} 
                  onChange={e => handleVitalChange('temp', e.target.value)} 
                  placeholder="e.g., 98.6" 
                />
              </label>
              <label>
                O2 Saturation
                <input 
                  value={vitals.spo2} 
                  onChange={e => handleVitalChange('spo2', e.target.value)} 
                  placeholder="e.g., 98%" 
                />
              </label>
              <label>
                Height
                <input 
                  value={vitals.height} 
                  onChange={e => handleVitalChange('height', e.target.value)} 
                  placeholder="e.g., 5'8&quot;" 
                />
              </label>
              <label>
                Weight
                <input 
                  value={vitals.weight} 
                  onChange={e => handleVitalChange('weight', e.target.value)} 
                  placeholder="e.g., 150 lbs" 
                />
              </label>
            </div>
            <label>
              Notes / Chief Complaints
              <textarea 
                value={vitals.notes} 
                onChange={e => handleVitalChange('notes', e.target.value)} 
                placeholder="Patient reports..."
                rows={3}
              />
            </label>
          </div>

          {/* Allergies Section */}
          <div className="section">
            <h3>Allergies</h3>
            {allergies.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No recorded allergies</p>
            ) : (
              <div className="allergies-list">
                {allergies.map((allergy, index) => (
                  <div key={index} className="allergy-item">
                    <div className="allergy-info">
                      <strong>{allergy.name}</strong>
                      <input 
                        value={allergy.notes} 
                        onChange={e => updateAllergyNotes(index, e.target.value)}
                        placeholder="Notes (e.g., rash, hives)"
                        style={{ marginTop: 4 }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeAllergy(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="add-allergy">
              <select 
                value={newAllergyId} 
                onChange={e => setNewAllergyId(e.target.value)}
              >
                <option value="">Select allergy to add...</option>
                {availableAllergyCodes
                  .filter(code => !allergies.some(allergy => allergy.allergyId === code.id))
                  .map(code => (
                    <option key={code.id} value={code.id}>{code.name}</option>
                  ))
                }
              </select>
              <input 
                value={newAllergyNotes} 
                onChange={e => setNewAllergyNotes(e.target.value)}
                placeholder="Notes (optional)"
              />
              <button type="button" onClick={addAllergy} disabled={!newAllergyId}>
                Add Allergy
              </button>
            </div>
          </div>

          {/* Medications Section */}
          <div className="section">
            <h3>Current Medications</h3>
            {medications.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No recorded medications</p>
            ) : (
              <div className="medications-list">
                {medications.map((medication, index) => (
                  <div key={index} className="medication-item">
                    <div className="medication-info">
                      <input 
                        value={medication.name} 
                        onChange={e => updateMedication(index, 'name', e.target.value)}
                        placeholder="Medication name"
                        style={{ marginBottom: 4 }}
                      />
                      <input 
                        value={medication.dosageAndFrequency} 
                        onChange={e => updateMedication(index, 'dosageAndFrequency', e.target.value)}
                        placeholder="Dosage and frequency (e.g., 10mg once daily)"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeMedication(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="add-medication">
              <input 
                value={newMedication.name} 
                onChange={e => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Medication name"
              />
              <input 
                value={newMedication.dosageAndFrequency} 
                onChange={e => setNewMedication(prev => ({ ...prev, dosageAndFrequency: e.target.value }))}
                placeholder="Dosage and frequency"
              />
              <button type="button" onClick={addMedication} disabled={!newMedication.name.trim()}>
                Add Medication
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => onClose && onClose()} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
