import React, { useState, useEffect } from 'react';
import { Search, X, User, Phone, Mail, Calendar, CreditCard, DollarSign, AlertCircle, UserCheck, UserPlus } from 'lucide-react';
// Removed API import as we'll use fetch directly
import './PatientSearch.css';

/**
 * PatientSearch Component (Backend Integrated)
 * 
 * Search and view patient profiles
 * Integrated with backend patient APIs
 */
function PatientSearch({ onBookAppointment }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    phone: '',
    gender: 'male',
    emergencyContactfn: '',
    emergencyContactln: '',
    emergencyContactrl: '',
    emergencyPhone: ''
  });
  const [formErrors, setFormErrors] = useState({});

  /**
   * Load initial patients on mount
   */
  useEffect(() => {
    handleSearch();
  }, []);

  /**
   * Debounced search - triggers after user stops typing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch();
      } else if (searchTerm.length === 0) {
        // Load all patients if search is empty
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Search patients via API
   */
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/receptionist_api/patients/get-all.php?q=${encodeURIComponent(searchTerm)}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.patients || []);
      } else {
        setError('Failed to search patients');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear search
   */
  const clearSearch = () => {
    setSearchTerm('');
    setPatients([]);
  };

  /**
   * View patient details
   */
  const handleViewPatient = async (patient) => {
    try {
      setLoading(true);
      
      // Get full patient details including insurance and appointments
      const response = await fetch(
        `/receptionist_api/patients/get-by-id.php?id=${patient.Patient_ID}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setSelectedPatient({
          ...data.patient,
          insurance: data.insurance,
          recent_appointments: data.recent_appointments
        });
        setShowModal(true);
      }
    } catch (err) {
      console.error('Failed to load patient details:', err);
      setError('Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Book appointment for patient
   */
  const handleBookAppointment = (patient) => {
    if (onBookAppointment) {
      onBookAppointment(patient);
    }
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  /**
   * Open create patient modal
   */
  const openCreateModal = () => {
    setShowCreateModal(true);
    setFormErrors({});
    setError(null);
  };

  /**
   * Close create patient modal
   */
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      phone: '',
      gender: 'male',
      emergencyContactfn: '',
      emergencyContactln: '',
      emergencyContactrl: '',
      emergencyPhone: ''
    });
    setFormErrors({});
    setError(null);
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Create new patient
   */
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormErrors({});

    try {
      const response = await fetch('/api/signup.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Success - close modal and refresh patient list
        closeCreateModal();
        handleSearch(); // Refresh patient list
        alert('Patient created successfully!');
      } else {
        // Handle errors
        if (data.errors) {
          setFormErrors(data.errors);
        }
        setError(data.message || 'Failed to create patient');
      }
    } catch (err) {
      console.error('Create patient error:', err);
      setError('Failed to create patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-search-page">
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">Patient Search</h1>
            <p className="page-subtitle">Search and view patient records</p>
          </div>
          <button className="btn-create-patient" onClick={openCreateModal}>
            <UserPlus size={20} />
            Create New Patient
          </button>
        </div>
      </div>

      {/* ===== SEARCH SECTION ===== */}
      <div className="search-section">
        <div className="search-box-container">
          <Search className="search-icon-left" size={20} />
          <input
            type="text"
            className="search-input-main"
            placeholder="Search by name, phone, or date of birth..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={clearSearch}>
              <X size={20} />
            </button>
          )}
        </div>
        
        {patients.length > 0 && (
          <p className="search-results-count">
            Found {patients.length} patient{patients.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ===== ERROR MESSAGE ===== */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* ===== PATIENTS GRID ===== */}
      <div className="patients-grid">
        {loading && patients.length === 0 ? (
          <div className="empty-state-search">
            <Search size={64} />
            <h3>Searching...</h3>
            <p>Please wait while we search for patients</p>
          </div>
        ) : patients.length === 0 && searchTerm.length >= 2 ? (
          <div className="empty-state-search">
            <Search size={64} />
            <h3>No Patients Found</h3>
            <p>Try searching with a different name, phone number, or date of birth</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state-search">
            <User size={64} />
            <h3>Start Searching</h3>
            <p>Enter a patient's name, phone number, or date of birth to search</p>
          </div>
        ) : (
          patients.map(patient => (
            <div 
              key={patient.Patient_ID} 
              className="patient-result-card"
              onClick={() => handleViewPatient(patient)}
            >
              <div className="patient-avatar-large">
                <User size={32} />
              </div>
              
              <div className="patient-info-main">
                <h2 className="patient-name-large">
                  {patient.First_Name} {patient.Last_Name}
                </h2>
                
                <div className="patient-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Patient ID</span>
                    <span className="detail-value">{patient.Patient_ID}</span>
                  </div>
                  
                  {patient.dob && (
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span className="detail-label">DOB</span>
                      <span className="detail-value">{patient.dob}</span>
                    </div>
                  )}
                  
                  {patient.EmergencyContact && (
                    <div className="detail-item">
                      <Phone size={16} />
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{patient.EmergencyContact}</span>
                    </div>
                  )}
                  
                  {patient.pcp_name && (
                    <div className="detail-item">
                      <UserCheck size={16} />
                      <span className="detail-label">PCP</span>
                      <span className="detail-value">{patient.pcp_name}</span>
                    </div>
                  )}
                  
                  {patient.insurance_expiration && (
                    <div className="detail-item">
                      <AlertCircle size={16} />
                      <span className="detail-label">Insurance Exp</span>
                      <span className={`detail-value ${new Date(patient.insurance_expiration) < new Date() ? 'text-expired' : ''}`}>
                        {new Date(patient.insurance_expiration).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {patient.plan_name && (
                <div className="patient-insurance-badge">
                  <CreditCard size={20} />
                  <div>
                    <p className="insurance-name">{patient.plan_name}</p>
                    <p className="insurance-policy">{patient.plan_type}</p>
                    {patient.copay && (
                      <p className="insurance-copay">
                        <DollarSign size={14} />
                        Copay: ${typeof patient.copay === 'number' ? patient.copay.toFixed(2) : parseFloat(patient.copay).toFixed(2)}
                      </p>
                    )}
                    {patient.insurance_expiration && (
                      <p className={`insurance-expiration ${new Date(patient.insurance_expiration) < new Date() ? 'expired' : ''}`}>
                        {new Date(patient.insurance_expiration) < new Date() ? '⚠ EXPIRED' : 'Expires'}: {' '}
                        {new Date(patient.insurance_expiration).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ===== PATIENT DETAILS MODAL ===== */}
      {showModal && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedPatient.First_Name} {selectedPatient.Last_Name}
                </h2>
                <p className="modal-subtitle">Patient ID: {selectedPatient.Patient_ID}</p>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Personal Information */}
              <div className="info-section">
                <h3 className="section-heading">
                  <User size={20} />
                  Personal Information
                </h3>
                <div className="info-grid">
                  <div className="info-field">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">
                      {selectedPatient.First_Name} {selectedPatient.Last_Name}
                    </span>
                  </div>
                  
                  {selectedPatient.dob && (
                    <div className="info-field">
                      <span className="field-label">Date of Birth</span>
                      <span className="field-value">{selectedPatient.dob}</span>
                    </div>
                  )}
                  
                  {selectedPatient.Email && (
                    <div className="info-field">
                      <span className="field-label">Email</span>
                      <a href={`mailto:${selectedPatient.Email}`} className="field-value link-email">
                        {selectedPatient.Email}
                      </a>
                    </div>
                  )}
                  
                  {selectedPatient.EmergencyContact && (
                    <div className="info-field">
                      <span className="field-label">Phone</span>
                      <a href={`tel:${selectedPatient.EmergencyContact}`} className="field-value link-phone">
                        {selectedPatient.EmergencyContact}
                      </a>
                    </div>
                  )}
                  
                  {selectedPatient.pcp_first_name && selectedPatient.pcp_last_name && (
                    <div className="info-field">
                      <span className="field-label">Primary Care Physician</span>
                      <span className="field-value">
                        Dr. {selectedPatient.pcp_first_name} {selectedPatient.pcp_last_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance Information */}
              {selectedPatient.insurance && (
                <div className="info-section">
                  <h3 className="section-heading">
                    <CreditCard size={20} />
                    Insurance Information
                  </h3>
                  <div className="insurance-card-display">
                    <h4 className="insurance-provider-name">
                      {selectedPatient.insurance.payer_name}
                    </h4>
                    <div className="insurance-details-grid">
                      <div className="insurance-detail">
                        <span className="insurance-label">Plan Name</span>
                        <span className="insurance-value">{selectedPatient.insurance.plan_name}</span>
                      </div>
                      <div className="insurance-detail">
                        <span className="insurance-label">Plan Type</span>
                        <span className="insurance-value">{selectedPatient.insurance.plan_type}</span>
                      </div>
                      {selectedPatient.insurance.expiration_date && (
                        <div className="insurance-detail">
                          <span className="insurance-label">Expiration Date</span>
                          <span className={`insurance-value ${new Date(selectedPatient.insurance.expiration_date) < new Date() ? 'insurance-expired' : ''}`}>
                            {new Date(selectedPatient.insurance.expiration_date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {new Date(selectedPatient.insurance.expiration_date) < new Date() && ' ⚠ EXPIRED'}
                          </span>
                        </div>
                      )}
                      {selectedPatient.insurance.copay && (
                        <div className="insurance-detail">
                          <span className="insurance-label">Copay</span>
                          <span className="insurance-value insurance-copay">
                            ${typeof selectedPatient.insurance.copay === 'number' 
                              ? selectedPatient.insurance.copay.toFixed(2) 
                              : parseFloat(selectedPatient.insurance.copay).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedPatient.insurance.deductible_individ && (
                        <div className="insurance-detail">
                          <span className="insurance-label">Deductible</span>
                          <span className="insurance-value">
                            ${typeof selectedPatient.insurance.deductible_individ === 'number'
                              ? selectedPatient.insurance.deductible_individ.toFixed(2)
                              : parseFloat(selectedPatient.insurance.deductible_individ).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedPatient.insurance.coinsurance_rate_pct && (
                        <div className="insurance-detail">
                          <span className="insurance-label">Coinsurance</span>
                          <span className="insurance-value">
                            {selectedPatient.insurance.coinsurance_rate_pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Appointments */}
              {selectedPatient.recent_appointments && selectedPatient.recent_appointments.length > 0 && (
                <div className="info-section">
                  <h3 className="section-heading">
                    <Calendar size={20} />
                    Recent Appointments
                  </h3>
                  <div className="visit-history-grid">
                    {selectedPatient.recent_appointments.slice(0, 4).map((apt, index) => (
                      <div 
                        key={apt.Appointment_id} 
                        className={`visit-card ${index === 0 ? 'visit-card-upcoming' : ''}`}
                      >
                        <span className="visit-label">
                          {new Date(apt.Appointment_date) > new Date() ? 'Upcoming' : 'Past Visit'}
                        </span>
                        <p className="visit-date">
                          {new Date(apt.Appointment_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="visit-doctor">
                          Dr. {apt.Doctor_First} {apt.Doctor_Last}
                        </p>
                        <p className="visit-reason">{apt.Reason_for_visit}</p>
                        {apt.Status && (
                          <span className={`status-badge status-${apt.Status.toLowerCase()}`}>
                            {apt.Status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  closeModal();
                  handleBookAppointment(selectedPatient);
                }}
              >
                <Calendar size={18} />
                Book Appointment
              </button>
              <button className="btn btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE PATIENT MODAL ===== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Create New Patient</h2>
                <p className="modal-subtitle">Register a new patient in the system</p>
              </div>
              <button className="modal-close" onClick={closeCreateModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient}>
              <div className="modal-body">
                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                {/* Personal Information */}
                <div className="info-section">
                  <h3 className="section-heading">
                    <User size={20} />
                    Personal Information
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        className={`form-input ${formErrors.firstName ? 'input-error' : ''}`}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.firstName && (
                        <span className="error-text">{formErrors.firstName}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        className={`form-input ${formErrors.lastName ? 'input-error' : ''}`}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.lastName && (
                        <span className="error-text">{formErrors.lastName}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Date of Birth *</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        className={`form-input ${formErrors.dateOfBirth ? 'input-error' : ''}`}
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.dateOfBirth && (
                        <span className="error-text">{formErrors.dateOfBirth}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Gender *</label>
                      <select
                        name="gender"
                        className={`form-input ${formErrors.gender ? 'input-error' : ''}`}
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                      {formErrors.gender && (
                        <span className="error-text">{formErrors.gender}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="info-section">
                  <h3 className="section-heading">
                    <Mail size={20} />
                    Contact Information
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className={`form-input ${formErrors.email ? 'input-error' : ''}`}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.email && (
                        <span className="error-text">{formErrors.email}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(123) 456-7890"
                        required
                      />
                      {formErrors.phone && (
                        <span className="error-text">{formErrors.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Security */}
                <div className="info-section">
                  <h3 className="section-heading">
                    <CreditCard size={20} />
                    Account Security
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        name="password"
                        className={`form-input ${formErrors.password ? 'input-error' : ''}`}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Minimum 8 characters"
                        required
                      />
                      {formErrors.password && (
                        <span className="error-text">{formErrors.password}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className={`form-input ${formErrors.confirmPassword ? 'input-error' : ''}`}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.confirmPassword && (
                        <span className="error-text">{formErrors.confirmPassword}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact (Optional) */}
                <div className="info-section">
                  <h3 className="section-heading">
                    <Phone size={20} />
                    Emergency Contact (Optional)
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        name="emergencyContactfn"
                        className="form-input"
                        value={formData.emergencyContactfn}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        name="emergencyContactln"
                        className="form-input"
                        value={formData.emergencyContactln}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Relationship</label>
                      <input
                        type="text"
                        name="emergencyContactrl"
                        className="form-input"
                        value={formData.emergencyContactrl}
                        onChange={handleInputChange}
                        placeholder="e.g., Spouse, Parent, Friend"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        className="form-input"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create Patient
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  className="btn btn-ghost" 
                  onClick={closeCreateModal}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientSearch;