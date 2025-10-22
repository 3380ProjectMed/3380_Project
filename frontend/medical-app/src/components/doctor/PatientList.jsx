import React, { useState, useMemo } from 'react';
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
  /**
   * Mock patient data
   * TODO: Replace with API call to fetch patients
   * API endpoint: GET /api/patients
   */
  const mockPatients = useMemo(() => [
    { 
      id: 'P001', 
      name: 'James Patterson', 
      dob: '1975-04-12',
      age: 48,
      allergies: 'Penicillin',
      email: 'james.p@email.com',
      phone: '(555) 123-4567',
      lastVisit: '2023-10-15',
      nextAppointment: '2023-11-01',
      notes: 'Regular checkup needed. Patient has history of high blood pressure.',
      medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
      bloodType: 'O+'
    },
    { 
      id: 'P002', 
      name: 'Sarah Connor', 
      dob: '1990-08-23',
      age: 33,
      allergies: 'None',
      email: 'sarah.c@email.com',
      phone: '(555) 234-5678',
      lastVisit: '2023-09-30',
      nextAppointment: '2023-10-30',
      notes: 'Follow-up on medication adjustment for anxiety management.',
      medicalHistory: ['Anxiety Disorder'],
      bloodType: 'A+'
    },
    { 
      id: 'P003', 
      name: 'Robert Miller', 
      dob: '2001-11-05',
      age: 22,
      allergies: 'Latex, Aspirin',
      email: 'robert.m@email.com',
      phone: '(555) 345-6789',
      lastVisit: '2023-10-01',
      nextAppointment: '2023-11-15',
      notes: 'Allergy review scheduled. Patient experiences severe reactions.',
      medicalHistory: ['Severe Allergies', 'Asthma'],
      bloodType: 'B+'
    },
    { 
      id: 'P004', 
      name: 'Emily Chen', 
      dob: '1988-03-17',
      age: 35,
      allergies: 'Sulfa drugs',
      email: 'emily.c@email.com',
      phone: '(555) 456-7890',
      lastVisit: '2023-10-10',
      nextAppointment: '2023-11-20',
      notes: 'Annual physical examination scheduled.',
      medicalHistory: ['Migraine'],
      bloodType: 'AB+'
    },
    { 
      id: 'P005', 
      name: 'Michael Johnson', 
      dob: '1965-12-30',
      age: 57,
      allergies: 'None',
      email: 'michael.j@email.com',
      phone: '(555) 567-8901',
      lastVisit: '2023-10-05',
      nextAppointment: '2023-12-01',
      notes: 'Monitoring cholesterol levels. Patient doing well on current medication.',
      medicalHistory: ['High Cholesterol', 'Arthritis'],
      bloodType: 'O-'
    },
  ], []);

  // Local state for search and selected patient
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedPatient, setLocalSelectedPatient] = useState(null);

  // Use external state if provided, otherwise use local state
  const selectedPatient = externalSelectedPatient || localSelectedPatient;
  const setSelectedPatient = externalSetSelectedPatient || setLocalSelectedPatient;

  /**
   * Filter patients based on search term
   * Searches in: name and patient ID
   */
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return mockPatients;
    
    const searchLower = searchTerm.toLowerCase();
    return mockPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchLower) ||
      patient.id.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, mockPatients]);

  /**
   * Handle patient row click
   * Opens patient details sidebar
   */
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    if (onPatientClick) {
      onPatientClick(patient);
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
              {selectedPatient.medicalHistory.map((condition, index) => (
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