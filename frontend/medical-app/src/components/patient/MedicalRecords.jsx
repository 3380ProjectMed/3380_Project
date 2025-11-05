import React, { useState, useEffect } from 'react';
import './MedicalRecords.css';
import * as api from '../../patientapi.js';

export default function MedicalRecords(props) {
  const { loading, vitalsHistory = [], medications = [], allergies = [], conditions = [], onRefresh } = props;
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
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
        const data = await api.medicalRecords.getAllAvailableAllergies();
        if (data.success) {
          setAllAvailableAllergies(data.data);
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
      const data = await api.medicalRecords.addMedication(medicationForm);
      if (data.success) {
        setMedicationForm({
          medication_name: '',
          dosage: '',
          frequency: '',
          drug_name: '',
          duration_frequency: ''
        });
        setShowMedicationForm(false);
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
      const data = await api.medicalRecords.updateAllergy({ allergy_text: allergyText });
      if (data.success) {
        setAllergyForm({
          allergy_text: '',
          selected_allergy: ''
        });
        setShowAllergyForm(false);
        onRefresh && onRefresh(); // Refresh the medical records
      } else {
        alert('Error updating allergy: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating allergy:', error);
      alert('Error updating allergy');
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
            <h3>Vitals</h3>
            {vitalsHistory.length === 0 ? <p className="text-gray">No vitals on file</p> : (
              <ul>
                {vitalsHistory.map((v, i) => (<li key={i}>{v.label}: {v.value}</li>))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Medications</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowMedicationForm(!showMedicationForm)}
              >
                {showMedicationForm ? 'Cancel' : 'Add Medication'}
              </button>
            </div>
            
            {showMedicationForm && (
              <form onSubmit={handleAddMedication} className="record-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Medication Name:</label>
                    <input
                      type="text"
                      value={medicationForm.medication_name}
                      onChange={(e) => setMedicationForm({...medicationForm, medication_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Dosage:</label>
                    <input
                      type="text"
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Frequency:</label>
                    <input
                      type="text"
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration & Frequency:</label>
                    <input
                      type="text"
                      value={medicationForm.duration_frequency}
                      onChange={(e) => setMedicationForm({...medicationForm, duration_frequency: e.target.value})}
                      placeholder="Optional - for history tracking"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success">Add Medication</button>
              </form>
            )}
            
            {medications.length === 0 ? <p className="text-gray">No medications recorded</p> : (
              <ul>
                {medications.map((m, i) => (<li key={i}>{m.name} — {m.frequency}</li>))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Allergies</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAllergyForm(!showAllergyForm)}
              >
                {showAllergyForm ? 'Cancel' : 'Update Allergy'}
              </button>
            </div>
            
            {showAllergyForm && (
              <form onSubmit={handleAddAllergy} className="record-form">
                <div className="form-group">
                  <label>Select from existing allergies:</label>
                  <select
                    value={allergyForm.selected_allergy}
                    onChange={(e) => setAllergyForm({...allergyForm, selected_allergy: e.target.value, allergy_text: ''})}
                  >
                    <option value="">Choose an allergy...</option>
                    {allAvailableAllergies.map((allergy) => (
                      <option key={allergy.code} value={allergy.text}>
                        {allergy.text}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ textAlign: 'center', margin: '10px 0', color: '#666' }}>
                  — OR —
                </div>
                
                <div className="form-group">
                  <label>Enter new allergy:</label>
                  <input
                    type="text"
                    value={allergyForm.allergy_text}
                    onChange={(e) => setAllergyForm({...allergyForm, allergy_text: e.target.value, selected_allergy: ''})}
                    placeholder="Type a new allergy"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={!allergyForm.selected_allergy && !allergyForm.allergy_text.trim()}
                >
                  Update Allergy
                </button>
              </form>
            )}
            
            {allergies.length === 0 ? <p className="text-gray">No allergies recorded</p> : (
              <ul>{allergies.map((a, i) => (<li key={i}>{typeof a === 'string' ? a : a.name}</li>))}</ul>
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
    </div>
  );
}
