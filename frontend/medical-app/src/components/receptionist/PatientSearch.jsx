import React, { useState, useEffect } from 'react';
import { Search, X, User, Phone, Mail, Calendar, CreditCard, DollarSign, AlertCircle, UserCheck, UserPlus } from 'lucide-react';

import './PatientSearch.css';

function PatientSearch() {
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
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactfn: '',
    emergencyContactln: '',
    emergencyContactrl: '',
    emergencyPhone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  const [genderOptions, setGenderOptions] = useState([]);

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadGenderOptions = async () => {
      try {
        const res = await fetch('/admin_api/users/get_form_options.php', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.genders) && mounted) {
          setGenderOptions(data.genders); 
        }
      } catch (err) {
        console.error('Failed to load gender options:', err);
      }
    };

    loadGenderOptions();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch();
      } else if (searchTerm.length === 0) {
        
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const clearSearch = () => {
    setSearchTerm('');
    setPatients([]);
  };

  const handleViewPatient = async (patient) => {
    try {
      setLoading(true);

      const response = await fetch(
        `/receptionist_api/patients/get-by-id.php?id=${patient.Patient_ID}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        const fallbackEmergency = patient.EmergencyContact || '';

        setSelectedPatient({
          ...data.patient,
          EmergencyContact: data.patient.EmergencyContact || data.patient.emergency_contact || data.patient.emergency_contact_id || fallbackEmergency,
          EmergencyContactRelationship: data.patient.EmergencyContactRelationship || data.patient.emergency_relationship || patient.EmergencyContactRelationship || patient.emergency_relationship || null,
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



  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setFormErrors({});
    setError(null);
  };

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
      gender: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      emergencyContactfn: '',
      emergencyContactln: '',
      emergencyContactrl: '',
      emergencyPhone: ''
    });
    setFormErrors({});
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;

    if (name === 'phone' || name === 'emergencyPhone') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatPhoneNumber = (value) => {
    
    const cleaned = value.replace(/\D/g, '');

    const limited = cleaned.substring(0, 10);

    if (limited.length === 0) return '';
    if (limited.length <= 3) return `(${limited}`;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  const formatAppointmentTime = (apt) => {
    if (!apt) return null;
    const dt = apt.appointment_datetime || apt.visit_start_at || apt.Appointment_date || apt.appointment_date;
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

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
        
        closeCreateModal();
        handleSearch(); 
        alert('Patient created successfully!');
      } else {
        
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
      {}
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

              {}
              {selectedPatient && (selectedPatient.ec_first_name || selectedPatient.ec_last_name || selectedPatient.EmergencyContact) && (
                <div className="info-section">
                  <h3 className="section-heading">
                    <Phone size={20} />
                    Emergency Contact
                  </h3>
                  <div className="info-grid">
                    {(selectedPatient.ec_first_name || selectedPatient.ec_last_name) && (
                      <div className="info-field">
                        <span className="field-label">Name</span>
                        <span className="field-value">{`${selectedPatient.ec_first_name || ''} ${selectedPatient.ec_last_name || ''}`.trim()}</span>
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

                    {selectedPatient.EmergencyContactRelationship && (
                      <div className="info-field">
                        <span className="field-label">Relation</span>
                        <span className="field-value">{selectedPatient.EmergencyContactRelationship}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

      {}
      <div className="search-section">
        <div className="search-box-container">
          <Search className="search-icon-left" size={20} />
          <input
            type="text"
            className="search-input-main"
            placeholder="Search by name or date of birth..."
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

      {}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {}
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
                      <span className="detail-label">Emergency Phone</span><br />
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
                          day: 'numeric',
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

      {}
      {showModal && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedPatient.First_Name || selectedPatient.first_name || ''} {selectedPatient.Last_Name || selectedPatient.last_name || ''}
                </h2>
                <p className="modal-subtitle">Patient ID: {selectedPatient.Patient_ID || selectedPatient.patient_id || ''}</p>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

              <div className="modal-body">
                <div className="info-section">
                  <h3 className="section-heading">
                    <User size={20} />
                    Personal Information
                  </h3>
                  <div className="info-grid">
                    <div className="info-field">
                      <span className="field-label">Patient ID</span>
                      <span className="field-value">
                        {selectedPatient.Patient_ID || selectedPatient.patient_id || 'N/A'}
                      </span>
                    </div>
                    <div className="info-field">
                      <span className="field-label">Full Name</span>
                      <span className="field-value">
                        {selectedPatient.First_Name || selectedPatient.first_name || ''} {selectedPatient.Last_Name || selectedPatient.last_name || ''}
                      </span>
                    </div>
                    {selectedPatient.dob && (
                      <div className="info-field">
                        <span className="field-label">Date of Birth</span>
                        <span className="field-value">{selectedPatient.dob}</span>
                      </div>
                    )}
                    {(selectedPatient.Email || selectedPatient.email) && (
                      <div className="info-field">
                        <span className="field-label">Email</span>
                        <a href={`mailto:${selectedPatient.Email || selectedPatient.email}`} className="field-value link-email">
                          {selectedPatient.Email || selectedPatient.email}
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

                {(selectedPatient.ec_first_name || selectedPatient.ec_last_name || selectedPatient.EmergencyContact || selectedPatient.EmergencyContactRelationship) && (
                  <div className="info-section">
                    <h3 className="section-heading">
                      <User size={20} />
                      Emergency Contact
                    </h3>
                    <div className="info-grid">
                      {(selectedPatient.ec_first_name || selectedPatient.ec_last_name) && (
                        <div className="info-field">
                          <span className="field-label">Full Name</span><br />
                          <span className="field-value">
                            {`${selectedPatient.ec_first_name || ''} ${selectedPatient.ec_last_name || ''}`.trim()}
                          </span>
                        </div>
                      )}
                      {selectedPatient.EmergencyContact && (
                        <div className="info-field">
                          <span className="field-label">Phone</span><br />
                          <a href={`tel:${selectedPatient.EmergencyContact}`} className="field-value link-phone">
                            {selectedPatient.EmergencyContact}
                          </a>
                        </div>
                      )}
                      {selectedPatient.EmergencyContactRelationship && (
                        <div className="info-field">
                          <span className="field-label">Relation</span>
                          <span className="field-value">{selectedPatient.EmergencyContactRelationship}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {}
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

              {}
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
                        {(() => {
                          const t = formatAppointmentTime(apt);
                          if (t) {
                            return (
                              <p className="visit-time">{t}</p>
                            );
                          }
                          return null;
                        })()}
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
              <button className="btn btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {}
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
                {}
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                {}
                <div className="info-section">
                  <h3 className="section-heading">
                    <User size={20} />
                    Personal Information
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">First Name *</label>
                      <div className="input-with-icon">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          name="firstName"
                          className={`form-input with-icon ${formErrors.firstName ? 'input-error' : ''}`}
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {formErrors.firstName && (
                        <span className="error-text">{formErrors.firstName}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Last Name *</label>
                      <div className="input-with-icon">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          name="lastName"
                          className={`form-input with-icon ${formErrors.lastName ? 'input-error' : ''}`}
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {formErrors.lastName && (
                        <span className="error-text">{formErrors.lastName}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Date of Birth *</label>
                      <div className="input-with-icon">
                        <Calendar className="input-icon" size={18} />
                        <input
                          type="date"
                          name="dateOfBirth"
                          className={`form-input with-icon ${formErrors.dateOfBirth ? 'input-error' : ''}`}
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
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
                        <option value="">Select gender</option>
                        {genderOptions.length > 0 ? (
                          genderOptions.map(opt => (
                            <option key={opt.id} value={String(opt.id)}>{opt.label}</option>
                          ))
                        ) : (
                          
                          <>
                            <option value="1">Male</option>
                            <option value="2">Female</option>
                            <option value="5">Not Specified</option>
                          </>
                        )}
                      </select>
                      {formErrors.gender && (
                        <span className="error-text">{formErrors.gender}</span>
                      )}
                    </div>
                  </div>
                </div>

                {}
                <div className="info-section">
                  <h3 className="section-heading">
                    <Mail size={20} />
                    Contact Information
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Email Address *</label>
                      <div className="input-with-icon">
                        <Mail className="input-icon" size={18} />
                        <input
                          type="email"
                          name="email"
                          className={`form-input with-icon ${formErrors.email ? 'input-error' : ''}`}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="example@email.com"
                          required
                        />
                      </div>
                      {formErrors.email && (
                        <span className="error-text">{formErrors.email}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Phone Number *</label>
                      <div className="input-with-icon">
                        <Phone className="input-icon" size={18} />
                        <input
                          type="tel"
                          name="phone"
                          className={`form-input with-icon ${formErrors.phone ? 'input-error' : ''}`}
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                      {formErrors.phone && (
                        <span className="error-text">{formErrors.phone}</span>
                      )}
                    </div>

                    <div className="form-field full-width">
                      <label className="form-label">Street Address</label>
                      <input
                        type="text"
                        name="address"
                        className="form-input"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-input"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Houston"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        name="state"
                        className="form-input"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="TX"
                        maxLength="2"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        className="form-input"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="77001"
                        maxLength="10"
                      />
                    </div>
                  </div>
                </div>

                {}
                <div className="info-section">
                  <h3 className="section-heading">
                    <Phone size={20} />
                    Emergency Contact
                  </h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Contact First Name</label>
                      <div className="input-with-icon">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          name="emergencyContactfn"
                          className="form-input with-icon"
                          value={formData.emergencyContactfn}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Contact Last Name</label>
                      <div className="input-with-icon">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          name="emergencyContactln"
                          className="form-input with-icon"
                          value={formData.emergencyContactln}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Contact Relation to Patient</label>
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
                      <label className="form-label">Contact Phone</label>
                      <div className="input-with-icon">
                        <Phone className="input-icon" size={18} />
                        <input
                          type="tel"
                          name="emergencyPhone"
                          className="form-input with-icon"
                          value={formData.emergencyPhone}
                          onChange={handleInputChange}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="info-section">
                  <h3 className="section-heading">
                    <CreditCard size={20} />
                    Create Password
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