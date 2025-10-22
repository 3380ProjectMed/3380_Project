import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Calendar, Mail, AlertCircle, FileText } from 'lucide-react';
import './PatientList.css';
/**
 * PatientList Component
 * 
 * Displays a searchable list of all patients with detailed information
 * Features:
 * - Search by patient name or ID
 * - Patient details sidebar on row click
 * - Allergy highlighting (red for allergies, green for none)
 * - Recent activity and appointment history
 * 
 * Props:
 * @param {Function} onPatientClick - Handler when patient is clicked (optional)
 * @param {Object} selectedPatient - Currently selected patient (optional)
 * @param {Function} setSelectedPatient - Set selected patient (optional)
 */
function PatientList({ onPatientClick, selectedPatient: externalSelectedPatient, setSelectedPatient: externalSetSelectedPatient }) {
  // Local state for search and selected patient
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedPatient, setLocalSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Patients list comes from the API
  const [patients, setPatients] = useState([]);

  // Use external state if provided, otherwise use local state
  const selectedPatient = externalSelectedPatient || localSelectedPatient;
  const setSelectedPatient = externalSetSelectedPatient || setLocalSelectedPatient;

  /**
   * Filter patients based on search term
   * Searches in: name and patient ID
   */
  // Filter patients (search by name or ID).
  const filteredPatients = useMemo(() => {
    const source = patients || [];
    if (!searchTerm.trim()) return source;

    const searchLower = searchTerm.toLowerCase();
    return source.filter(patient =>
      (patient.name && patient.name.toLowerCase().includes(searchLower)) ||
      (patient.id && patient.id.toLowerCase().includes(searchLower))
    );
  }, [searchTerm, patients]);

  // Load all patients for the doctor on mount
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: derive doctor_id from auth; hardcoded for now
        const doctorId = 201;
        const res = await fetch(`http://localhost:8080/doctor_api/patients/get-all.php?doctor_id=${doctorId}`);
        const payload = await res.json();
        if (payload.success) {
          setPatients(payload.patients);
        } else {
          setError(payload.error || 'Failed to load patients');
        }
      } catch (err) {
        console.error('Error fetching patients', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, []);

  // Search by ID using the API (if the input looks like an ID)
  const handleSearchKeyPress = async (e) => {
    if (e.key !== 'Enter') return;
    const q = searchTerm.trim();
    if (!q) return;

    // If user typed an ID (P### or numeric), query the API get-by-id.php
    const isId = /^P?\d+$/i.test(q);
    if (isId) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/patients/get-by-id.php?id=${encodeURIComponent(q)}`);
        const payload = await res.json();
        if (payload.success) {
          setPatients([payload.patient]);
          setSelectedPatient(payload.patient);
        } else {
          setError(payload.error || 'Patient not found');
        }
      } catch (err) {
        console.error('Error fetching patient by id', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Handle patient row click
   * Opens patient details sidebar
   */
  const handlePatientClick = async (patient) => {
    // If the patient already has rich details, use it. Otherwise fetch by id.
    const hasDetails = patient && (Array.isArray(patient.medicalHistory) || patient.notes || patient.currentMedications);
    if (hasDetails) {
      setSelectedPatient(patient);
      if (onPatientClick) onPatientClick(patient);
      return;
    }

    // Fetch full patient details from API
    setLoading(true);
    setError(null);
    try {
      // patient.id is formatted like 'P001' — pass that as `id`
      const res = await fetch(`http://localhost:8080/api/patients/get-by-id.php?id=${encodeURIComponent(patient.id)}`);
      const payload = await res.json();
      if (payload.success && payload.patient) {
        setSelectedPatient(payload.patient);
        if (onPatientClick) onPatientClick(payload.patient);
      } else {
        setError(payload.error || 'Failed to load patient details');
      }
    } catch (err) {
      console.error('Error loading patient details', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close patient details sidebar
   */
  const handleCloseSidebar = () => {
    setSelectedPatient(null);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // if already a human-readable placeholder like 'No visits yet' return it
    if (isNaN(Date.parse(dateString))) return dateString;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="patient-list">
      {/* ===== HEADER ===== */}
      <h1 className="patient-list__title">My Patients</h1>

      {/* ===== SEARCH BAR ===== */}
      <div className="patient-list__search">
        <Search className="patient-list__search-icon" />
        <input
          type="text"
          className="patient-list__search-input"
          placeholder="Search patients by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          aria-label="Search patients"
        />
        {searchTerm && (
          <button
            className="patient-list__search-clear"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ===== PATIENTS TABLE ===== */}
      {loading && (
        <div className="patient-list__loading">Loading patients...</div>
      )}

      {error && (
        <div className="patient-list__error">Error: {error}
          <button onClick={() => { setError(null); setSearchTerm(''); /* reload all */ window.location.reload(); }} style={{ marginLeft: '8px'}}>Reload</button>
        </div>
      )}

      <div className="patient-list__table-container">
        {/* Table Header */}
        <div className="table-header">
          <div>ID</div>
          <div>Name</div>
          <div>Date of Birth</div>
          <div>Allergies</div>
        </div>
        
        {/* Table Body */}
        <div className="table-body">
          {filteredPatients.length === 0 ? (
            // Empty state
            <div className="patient-list__empty">
              <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No patients found matching "{searchTerm}"</p>
              <button 
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            // Patient rows
            filteredPatients.map(patient => (
              <div 
                key={patient.id}
                className={`table-row ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                onClick={() => handlePatientClick(patient)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handlePatientClick(patient);
                }}
              >
                <div className="patient-list__id">{patient.id}</div>
                <div className="patient-list__name">{patient.name}</div>
                <div className="patient-list__dob">{patient.dob}</div>
                <div className={`patient-list__allergies ${
                  patient.allergies === 'None' 
                    ? 'patient-list__allergies--none' 
                    : 'patient-list__allergies--has'
                }`}>
                  {patient.allergies === 'None' ? (
                    <span>✓ None</span>
                  ) : (
                    <span>
                      <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {patient.allergies}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== PATIENT DETAILS SIDEBAR ===== */}
      {selectedPatient && (
        <div className="patient-summary">
          {/* Sidebar Header */}
          <div className="patient-summary__header">
            <h2 className="patient-summary__title">Patient Details</h2>
            <button 
              className="patient-summary__close"
              onClick={handleCloseSidebar}
              aria-label="Close patient details"
            >
              <X size={24} />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="patient-summary__content">
            {/* Basic Information */}
            <div className="patient-summary__section">
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Patient ID:</span>
                <span>{selectedPatient.id}</span>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Full Name:</span>
                <span>{selectedPatient.name}</span>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Date of Birth:</span>
                <span>{formatDate(selectedPatient.dob)} ({selectedPatient.age} years old)</span>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Blood Type:</span>
                <span>{selectedPatient.bloodType}</span>
              </div>
            </div>

            {/* Contact Information */}
            <h3 className="patient-summary__section-title">
              <Mail size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Contact Information
            </h3>
            <div className="patient-summary__section">
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Email:</span>
                <a href={`mailto:${selectedPatient.email}`} className="patient-summary__link">
                  {selectedPatient.email}
                </a>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Phone:</span>
                <a href={`tel:${selectedPatient.phone}`} className="patient-summary__link">
                  {selectedPatient.phone}
                </a>
              </div>
            </div>

            {/* Allergies */}
            <h3 className="patient-summary__section-title">
              <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Allergies
            </h3>
            <div className="patient-summary__allergies-box">
              {selectedPatient.allergies === 'None' ? (
                <p className="patient-summary__allergies--none">No known allergies</p>
              ) : (
                <p className="patient-summary__allergies--has">
                  <strong>⚠️ {selectedPatient.allergies}</strong>
                </p>
              )}
            </div>

            {/* Medical History */}
            <h3 className="patient-summary__section-title">
              <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Medical History
            </h3>
            <div className="patient-summary__medical-history">
              {(selectedPatient.medicalHistory || []).map((condition, index) => (
                <span key={index} className="medical-history-tag">
                  {condition}
                </span>
              ))}
            </div>

            {/* Recent Activity */}
            <h3 className="patient-summary__section-title">
              <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Recent Activity
            </h3>
            
            <div className="patient-summary__visit">
              <div className="patient-summary__visit-header">
                <span className="patient-summary__visit-label">Last Visit</span>
                <span className="patient-summary__visit-date">{formatDate(selectedPatient.lastVisit)}</span>
              </div>
              <p className="patient-summary__note">{selectedPatient.notes}</p>
            </div>
            
            <div className="patient-summary__visit patient-summary__visit--upcoming">
              <div className="patient-summary__visit-header">
                <span className="patient-summary__visit-label">Next Appointment</span>
                <span className="patient-summary__visit-date">{formatDate(selectedPatient.nextAppointment)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="patient-summary__actions">
              <button className="btn-action btn-primary">
                <FileText size={18} />
                View Full Chart
              </button>
              <button className="btn-action btn-secondary">
                <Calendar size={18} />
                Schedule Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;