import React, { useState, useEffect } from 'react';
import './NursePatients.css';
import { getNursePatients } from '../../api/nurse';
import NurseVitalsModal from './NurseVitalsModal';

export default function NursePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNursePatients(searchTerm, 1, 50);
      setPatients(data.items || []);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients();
  };

  const openVitalsModal = (patient) => {
    setSelectedPatient(patient);
    setShowVitalsModal(true);
  };

  const closeVitalsModal = () => {
    setShowVitalsModal(false);
    setSelectedPatient(null);
  };

  const handleVitalsSaved = (data) => {
    console.log('Vitals saved successfully:', data);
    // Optionally refresh patient list or show success message
    closeVitalsModal();
  };

  if (loading) {
    return (
      <div className="nurse-patients">
        <div className="loading">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="nurse-patients">
      <div className="patients-header">
        <h1>Patient Management</h1>
        <p>Manage patient vitals, allergies, and medications</p>
      </div>

      <div className="patients-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="patients-list">
        {patients.length === 0 ? (
          <div className="no-patients">
            <p>No patients found</p>
          </div>
        ) : (
          <div className="patients-table">
            <div className="table-header">
              <div className="col-name">Patient Name</div>
              <div className="col-dob">Date of Birth</div>
              <div className="col-gender">Gender</div>
              <div className="col-actions">Actions</div>
            </div>
            
            {patients.map((patient) => (
              <div key={patient.patient_id} className="table-row">
                <div className="col-name">
                  <strong>{patient.first_name} {patient.last_name}</strong>
                  {patient.patient_id && <div className="patient-id">ID: {patient.patient_id}</div>}
                </div>
                <div className="col-dob">
                  {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
                </div>
                <div className="col-gender">
                  {patient.gender || 'N/A'}
                </div>
                <div className="col-actions">
                  <button
                    onClick={() => openVitalsModal(patient)}
                    className="btn-vitals"
                  >
                    Edit Clinical Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Vitals Modal */}
      {showVitalsModal && selectedPatient && (
        <NurseVitalsModal
          patient={selectedPatient}
          appointment={null} // No specific appointment for general patient management
          appointmentId={null}
          visitId={null}
          patientId={selectedPatient.patient_id}
          onClose={closeVitalsModal}
          onSaved={handleVitalsSaved}
        />
      )}
    </div>
  );
}