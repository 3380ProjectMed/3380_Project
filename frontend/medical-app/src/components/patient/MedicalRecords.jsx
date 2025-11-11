import React, { useState, useEffect } from 'react';
import './MedicalRecords.css';
import { medicalRecordsAPI } from '../../patientapi.js';

export default function MedicalRecords(props) {
  const { loading, vitalsHistory = [], medications = [], allergies = [], conditions = [], onRefresh } = props;
  
  // Debug logging
  console.log('MedicalRecords props:', { 
    loading, 
    vitalsCount: vitalsHistory.length, 
    medicationsCount: medications.length, 
    allergiesCount: allergies.length, 
    conditionsCount: conditions.length,
    conditions,
    allergies 
  });
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [allAvailableAllergies, setAllAvailableAllergies] = useState([]);
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    drug_name: '',
    duration_frequency: ''
  });
  const [allergyForm, setAllergyForm] = useState({
    allergy_text: '',
    selected_allergy: ''
  });

  // Load available allergies when component mounts
  useEffect(() => {
    const loadAvailableAllergies = async () => {
      try {
        console.log('Loading available allergies...');
        const data = await medicalRecordsAPI.getAllAvailableAllergies();
        console.log('Allergies API response:', data);
        if (data.success) {
          setAllAvailableAllergies(data.data);
        } else {
          console.error('Failed to load allergies:', data.message);
        }
      } catch (error) {
        console.error('Error loading allergies:', error);
      }
    };
    
    loadAvailableAllergies();
  }, []);

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      const data = await medicalRecordsAPI.addMedication(medicationForm);
      if (data.success) {
        setMedicationForm({
          medication_name: '',
          dosage: '',
          frequency: '',
          drug_name: '',
          duration_frequency: ''
        });
        setShowMedicationModal(false);
        onRefresh && onRefresh(); // Refresh the medical records
      } else {
        alert('Error adding medication: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Error adding medication');
    }
  };

  const handleAddAllergy = async (e) => {
    e.preventDefault();
    try {
      const allergyText = allergyForm.selected_allergy || allergyForm.allergy_text;
      const data = await medicalRecordsAPI.updateAllergy({ allergy_text: allergyText });
      if (data.success) {
        setAllergyForm({
          allergy_text: '',
          selected_allergy: ''
        });
        setShowAllergyModal(false);
        onRefresh && onRefresh(); // Refresh the medical records
      } else {
        alert('Error updating allergy: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating allergy:', error);
      alert('Error updating allergy');
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        const data = await medicalRecordsAPI.deleteMedication(medicationId);
        if (data.success) {
          onRefresh && onRefresh(); // Refresh the medical records
        } else {
          alert('Error deleting medication: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting medication:', error);
        alert('Error deleting medication');
      }
    }
  };

  const handleDeleteAllergy = async (allergyId) => {
    if (window.confirm('Are you sure you want to remove this allergy?')) {
      try {
        const data = await medicalRecordsAPI.deleteAllergy(allergyId);
        if (data.success) {
          onRefresh && onRefresh(); // Refresh the medical records
        } else {
          alert('Error removing allergy: ' + data.message);
        }
      } catch (error) {
        console.error('Error removing allergy:', error);
        alert('Error removing allergy');
      }
    }
  };

  return (
    <div className="portal-content">
      <h1 className="page-title">Medical Records</h1>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="records-grid">
          <div className="record-card">
            <h3>Vaccinations</h3>
            {vitalsHistory.length === 0 ? <p className="text-gray">No vaccinations on file</p> : (
              <ul>
                {vitalsHistory.map((v, i) => (
                  <li key={i}>
                    <strong>{v.vaccine}</strong> - Given: {v.date_given}
                    {v.booster_due && <span> | Booster Due: {v.booster_due}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <h3>Medications</h3>
            <button 
              className="btn btn-primary btn-sm record-add-btn"
              onClick={() => setShowMedicationModal(true)}
            >
              Add Medication
            </button>
            
            {medications.length === 0 ? <p className="text-gray">No medications recorded</p> : (
              <ul className="medication-list">
                {medications.map((m, i) => (
                  <li key={i} className="medication-item">
                    <span>{m.name} — {m.frequency}</span>
                    {m.id && (
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteMedication(m.id)}
                        title="Delete medication"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <h3>Allergies</h3>
            <button 
              className="btn btn-primary btn-sm record-add-btn"
              onClick={() => setShowAllergyModal(true)}
            >
              Update Allergy
            </button>
            
            {allergies.length === 0 ? <p className="text-gray">No allergies recorded</p> : (
              <ul className="allergy-list">
                {allergies.map((a, i) => (
                  <li key={i} className="allergy-item">
                    <span>{typeof a === 'string' ? a : (a.allergy || a.name)}</span>
                    {a.id && (
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteAllergy(a.id)}
                        title="Remove allergy"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <h3>Conditions</h3>
            {conditions.length === 0 ? <p className="text-gray">No conditions recorded</p> : (
              <ul>{conditions.map((c, i) => (<li key={i}>{c.name}</li>))}</ul>
            )}
          </div>
        </div>
      )}

      {/* Medication Modal */}
      {showMedicationModal && (
        <div className="modal-overlay" onClick={() => setShowMedicationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Medication</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowMedicationModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddMedication} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Medication Name</label>
                  <input
                    type="text"
                    value={medicationForm.medication_name}
                    onChange={(e) => setMedicationForm({...medicationForm, medication_name: e.target.value})}
                    required
                    placeholder="Enter medication name"
                  />
                </div>
                <div className="form-group">
                  <label>Dosage</label>
                  <input
                    type="text"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                    required
                    placeholder="e.g., 10mg"
                  />
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <input
                    type="text"
                    value={medicationForm.frequency}
                    onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                    required
                    placeholder="e.g., Once daily, Twice a day"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="text"
                    value={medicationForm.duration_frequency}
                    onChange={(e) => setMedicationForm({...medicationForm, duration_frequency: e.target.value})}
                    placeholder="e.g. since 2020"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowMedicationModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allergy Modal */}
      {showAllergyModal && (
        <div className="modal-overlay" onClick={() => setShowAllergyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Allergy Information</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowAllergyModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddAllergy} className="modal-form">
              <div className="form-group">
                <label>Select from existing allergies</label>
                <select
                  value={allergyForm.selected_allergy}
                  onChange={(e) => setAllergyForm({...allergyForm, selected_allergy: e.target.value, allergy_text: ''})}
                  className="form-select"
                >
                  <option value="">Choose an allergy...</option>
                  {allAvailableAllergies.map((allergy) => (
                    <option key={allergy.code} value={allergy.text}>
                      {allergy.text}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-divider">
                <span>OR</span>
              </div>
              
              <div className="form-group">
                <label>Enter new allergy</label>
                <input
                  type="text"
                  value={allergyForm.allergy_text}
                  onChange={(e) => setAllergyForm({...allergyForm, allergy_text: e.target.value, selected_allergy: ''})}
                  placeholder="Type a new allergy"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAllergyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!allergyForm.selected_allergy && !allergyForm.allergy_text.trim()}
                >
                  Update Allergy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
