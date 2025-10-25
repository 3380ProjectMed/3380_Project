import React, { useState, useMemo } from 'react';
import { Search, X, User, Phone, Mail, Calendar, CreditCard, MapPin, AlertCircle, Edit } from 'lucide-react';
import './PatientSearch.css';

/**
 * PatientSearch Component - Receptionist Patient Lookup
 * 
 * Search patients by name, phone (EmergencyContact), or DOB
 * 
 * Database Tables:
 * - Patient (Patient_ID, First_Name, Last_Name, dob, SSN, EmergencyContact, Email)
 * - patient_insurance (id, copay, deductible_individ, coinsurance_rate_pct, is_primary)
 * - insurance_plan (plan_id, plan_name, plan_type)
 * - insurance_payer (payer_id, NAME)
 * 
 * Real Query:
 * SELECT p.*, 
 *        pi.copay, pi.deductible_individ, pi.coinsurance_rate_pct,
 *        pl.plan_name, pl.plan_type,
 *        py.NAME as payer_name
 * FROM Patient p
 * LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
 * LEFT JOIN insurance_plan pl ON pi.plan_id = pl.plan_id
 * LEFT JOIN insurance_payer py ON pl.payer_id = py.payer_id
 * WHERE (p.First_Name LIKE ? OR p.Last_Name LIKE ? 
 *        OR p.EmergencyContact LIKE ? OR p.dob = ?)
 * 
 * Props:
 * @param {Function} onBookAppointment - Navigate to booking with patient
 * @param {Object} selectedPatient - Currently selected patient
 * @param {Function} setSelectedPatient - Set selected patient
 */
function PatientSearch({ onBookAppointment, selectedPatient, setSelectedPatient }) {
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Mock patient database (from Patient table with insurance joins)
   */
  const mockPatients = useMemo(() => [
    {
      Patient_ID: 1,
      First_Name: 'John',
      Last_Name: 'Smith',
      dob: '1985-03-15',
      SSN: '123-45-6789',
      EmergencyContact: '555-1001',
      Email: 'john.smith@email.com',
      AssignedAtBirth_Gender: 1, // Male
      Gender: 1,
      BloodType: 'O+',
      // Insurance join data
      InsuranceID: 1,
      payer_name: 'Blue Cross Blue Shield',
      plan_name: 'BCBS Gold',
      plan_type: 'PPO',
      member_id: 'M123456789',
      copay: 25.00,
      deductible_individ: 1500.00,
      coinsurance_rate_pct: 20.00
    },
    {
      Patient_ID: 2,
      First_Name: 'Maria',
      Last_Name: 'Garcia',
      dob: '1978-07-22',
      SSN: '123-45-6790',
      EmergencyContact: '555-1002',
      Email: 'maria.garcia@email.com',
      AssignedAtBirth_Gender: 2, // Female
      Gender: 2,
      BloodType: 'A+',
      InsuranceID: 2,
      payer_name: 'Blue Cross Blue Shield',
      plan_name: 'BCBS Silver',
      plan_type: 'HMO',
      member_id: 'M123456790',
      copay: 20.00,
      deductible_individ: 2000.00,
      coinsurance_rate_pct: 15.00
    },
    {
      Patient_ID: 3,
      First_Name: 'David',
      Last_Name: 'Johnson',
      dob: '1992-11-30',
      SSN: '123-45-6791',
      EmergencyContact: '555-1003',
      Email: 'david.johnson@email.com',
      AssignedAtBirth_Gender: 1,
      Gender: 1,
      BloodType: 'B+',
      InsuranceID: 3,
      payer_name: 'Medicare',
      plan_name: 'Medicare Part B',
      plan_type: 'Medicare',
      member_id: 'M123456791',
      copay: 15.00,
      deductible_individ: 500.00,
      coinsurance_rate_pct: 10.00
    },
    {
      Patient_ID: 4,
      First_Name: 'Sarah',
      Last_Name: 'Williams',
      dob: '1980-05-14',
      SSN: '123-45-6792',
      EmergencyContact: '555-1004',
      Email: 'sarah.williams@email.com',
      AssignedAtBirth_Gender: 2,
      Gender: 2,
      BloodType: 'AB-',
      InsuranceID: 4,
      payer_name: 'Aetna',
      plan_name: 'Aetna Premier',
      plan_type: 'PPO',
      member_id: 'M123456792',
      copay: 30.00,
      deductible_individ: 1000.00,
      coinsurance_rate_pct: 25.00
    },
    {
      Patient_ID: 5,
      First_Name: 'Michael',
      Last_Name: 'Brown',
      dob: '1975-09-08',
      SSN: '123-45-6793',
      EmergencyContact: '555-1005',
      Email: 'michael.brown@email.com',
      AssignedAtBirth_Gender: 1,
      Gender: 1,
      BloodType: 'O-',
      InsuranceID: 5,
      payer_name: 'UnitedHealthcare',
      plan_name: 'UHC Choice Plus',
      plan_type: 'PPO',
      member_id: 'M123456793',
      copay: 25.00,
      deductible_individ: 1500.00,
      coinsurance_rate_pct: 20.00
    },
  ], []);

  /**
   * Filter patients based on search term
   * Searches: First_Name, Last_Name, EmergencyContact (phone), dob
   */
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return mockPatients;

    const searchLower = searchTerm.toLowerCase().replace(/[^\w\s-]/g, '');

    return mockPatients.filter(patient => {
      const nameMatch = 
        patient.First_Name.toLowerCase().includes(searchLower) ||
        patient.Last_Name.toLowerCase().includes(searchLower) ||
        `${patient.First_Name} ${patient.Last_Name}`.toLowerCase().includes(searchLower);
      const phoneMatch = patient.EmergencyContact.replace(/[^\d]/g, '').includes(searchLower);
      const dobMatch = patient.dob.includes(searchTerm);
      
      return nameMatch || phoneMatch || dobMatch;
    });
  }, [searchTerm, mockPatients]);

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Calculate age from dob
   */
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  /**
   * Open patient details
   */
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  /**
   * Close patient details modal
   */
  const handleCloseModal = () => {
    setSelectedPatient(null);
  };

  return (
    <div className="patient-search-page">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <h1 className="page-title">Patient Search</h1>
        <p className="page-subtitle">Search by name, phone (EmergencyContact), or date of birth</p>
      </div>

      {/* ===== SEARCH BOX ===== */}
      <div className="search-section">
        <div className="search-box-container">
          <Search className="search-icon-left" size={20} />
          <input
            type="text"
            className="search-input-main"
            placeholder="Search: Name, Phone (555-1001), or DOB (YYYY-MM-DD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search patients"
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="search-results-count">
          {searchTerm ? (
            <span>{filteredPatients.length} result{filteredPatients.length !== 1 ? 's' : ''} found</span>
          ) : (
            <span>{mockPatients.length} total patients</span>
          )}
        </div>
      </div>

      {/* ===== PATIENT RESULTS ===== */}
      <div className="patients-grid">
        {filteredPatients.length > 0 ? (
          filteredPatients.map(patient => (
            <div
              key={patient.Patient_ID}
              className="patient-result-card"
              onClick={() => handlePatientClick(patient)}
            >
              {/* Patient Avatar */}
              <div className="patient-avatar-large">
                <User size={32} />
              </div>

              {/* Patient Info */}
              <div className="patient-info-main">
                <h3 className="patient-name-large">
                  {patient.First_Name} {patient.Last_Name}
                </h3>
                <div className="patient-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Patient ID</span>
                    <span className="detail-value">{patient.Patient_ID}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">DOB</span>
                    <span className="detail-value">
                      {patient.dob} ({calculateAge(patient.dob)} yrs)
                    </span>
                  </div>
                  <div className="detail-item">
                    <Phone size={14} />
                    <span className="detail-value">{patient.EmergencyContact}</span>
                  </div>
                  <div className="detail-item">
                    <Mail size={14} />
                    <span className="detail-value detail-email">{patient.Email}</span>
                  </div>
                </div>
              </div>

              {/* Insurance Badge */}
              <div className="patient-insurance-badge">
                <CreditCard size={16} />
                <div>
                  <p className="insurance-name">{patient.payer_name}</p>
                  <p className="insurance-policy">{patient.plan_name} ({patient.plan_type})</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-search">
            <Search size={64} />
            <h3>No patients found</h3>
            <p>No patients match "{searchTerm}"</p>
            <button className="btn btn-secondary" onClick={handleClearSearch}>
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* ===== PATIENT DETAILS MODAL ===== */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedPatient.First_Name} {selectedPatient.Last_Name}
                </h2>
                <p className="modal-subtitle">Patient ID: {selectedPatient.Patient_ID}</p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Personal Information */}
              <section className="info-section">
                <h3 className="section-heading">
                  <User size={20} />
                  Personal Information
                </h3>
                <div className="info-grid">
                  <div className="info-field">
                    <span className="field-label">Date of Birth</span>
                    <span className="field-value">
                      {selectedPatient.dob} ({calculateAge(selectedPatient.dob)} years old)
                    </span>
                  </div>
                  <div className="info-field">
                    <span className="field-label">Blood Type</span>
                    <span className="field-value">{selectedPatient.BloodType}</span>
                  </div>
                  <div className="info-field">
                    <span className="field-label">Emergency Contact</span>
                    <span className="field-value">
                      <a href={`tel:${selectedPatient.EmergencyContact}`} className="link-phone">
                        {selectedPatient.EmergencyContact}
                      </a>
                    </span>
                  </div>
                  <div className="info-field">
                    <span className="field-label">Email</span>
                    <span className="field-value">
                      <a href={`mailto:${selectedPatient.Email}`} className="link-email">
                        {selectedPatient.Email}
                      </a>
                    </span>
                  </div>
                </div>
              </section>

              {/* Insurance Information */}
              <section className="info-section">
                <h3 className="section-heading">
                  <CreditCard size={20} />
                  Insurance Information
                </h3>
                <div className="insurance-card-display">
                  <div className="insurance-provider-name">{selectedPatient.payer_name}</div>
                  <div className="insurance-details-grid">
                    <div className="insurance-detail">
                      <span className="insurance-label">Plan Name</span>
                      <span className="insurance-value">
                        {selectedPatient.plan_name} ({selectedPatient.plan_type})
                      </span>
                    </div>
                    <div className="insurance-detail">
                      <span className="insurance-label">Member ID</span>
                      <span className="insurance-value">{selectedPatient.member_id}</span>
                    </div>
                    <div className="insurance-detail">
                      <span className="insurance-label">Copay Amount</span>
                      <span className="insurance-value insurance-copay">
                        ${selectedPatient.copay?.toFixed(2)}
                      </span>
                    </div>
                    <div className="insurance-detail">
                      <span className="insurance-label">Deductible (Individual)</span>
                      <span className="insurance-value">
                        ${selectedPatient.deductible_individ?.toFixed(2)}
                      </span>
                    </div>
                    <div className="insurance-detail">
                      <span className="insurance-label">Coinsurance Rate</span>
                      <span className="insurance-value">
                        {selectedPatient.coinsurance_rate_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  onBookAppointment(selectedPatient);
                  handleCloseModal();
                }}
              >
                <Calendar size={18} />
                Book Appointment
              </button>
              <button className="btn btn-secondary">
                <Edit size={18} />
                Edit Profile
              </button>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientSearch;