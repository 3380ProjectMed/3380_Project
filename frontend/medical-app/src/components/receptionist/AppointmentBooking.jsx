import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, Clock, Phone, Globe, Search, Check, AlertCircle } from 'lucide-react';
// Removed API import as we'll use fetch directly
import './AppointmentBooking.css';

/**
 * AppointmentBooking Component (Backend Integrated)
 * 
 * Multi-step appointment booking process
 * Integrated with backend APIs for patients, doctors, and appointments
 */
function AppointmentBooking({ preSelectedPatient, onBack, onSuccess, officeId, officeName }) {
  const [currentStep, setCurrentStep] = useState(preSelectedPatient ? 2 : 1);
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [bookingChannel, setBookingChannel] = useState('walk-in');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Doctors state
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  
  // Submission state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load doctors when component mounts
   */
  useEffect(() => {
    loadDoctors();
  }, [officeId]);

  /**
   * Debounced patient search
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2 && currentStep === 1) {
        handlePatientSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Load doctors for this office
   */
  const loadDoctors = async () => {
    try {
      setDoctorsLoading(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/receptionist_api/doctors/get-by-office.php?office_id=${officeId}`);
      const data = await response.json();
      
      if (data.success) {
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  /**
   * Search for patients
   */
  const handlePatientSearch = async () => {
    try {
      setSearchLoading(true);
      const response = await fetch(`${API_BASE}/receptionist_api/patients/get-all.php?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.patients || []);
      }
    } catch (err) {
      console.error('Patient search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Select patient and move to step 2
   */
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
  };

  /**
   * Change selected patient
   */
  const handleChangePatient = () => {
    setCurrentStep(1);
    setSelectedPatient(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  /**
   * Validate form before proceeding to confirmation
   */
  const validateForm = () => {
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return false;
    }
    
    if (!appointmentDate) {
      setError('Please select an appointment date');
      return false;
    }
    
    if (!appointmentTime) {
      setError('Please select an appointment time');
      return false;
    }
    
    if (!reasonForVisit.trim()) {
      setError('Please enter a reason for visit');
      return false;
    }
    
    return true;
  };

  /**
   * Move to confirmation step
   */
  const handleProceedToConfirmation = () => {
    if (validateForm()) {
      setError(null);
      setCurrentStep(3);
    }
  };

  /**
   * Submit appointment to backend
   */
  const handleSubmitAppointment = async () => {
    try {
      setCreating(true);
      setError(null);

      // Parse time
      const [hours, minutes] = appointmentTime.split(':');
      
      // Format datetime for API
      const date = new Date(appointmentDate);
      const appointmentDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;

      const appointmentData = {
        Patient_id: selectedPatient.Patient_ID,
        Doctor_id: selectedDoctor.Doctor_id,
        Office_id: officeId,
        Appointment_date: appointmentDateTime,
        Reason_for_visit: reasonForVisit,
        booking_channel: bookingChannel
      };

      const response = await fetch(`${API_BASE}/receptionist_api/appointments/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(appointmentData)
      });
      const result = await response.json();
      
      if (result.success) {
        // Success! Navigate back
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Failed to create appointment:', err);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Get minimum date for appointment (today)
   */
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="appointment-booking-page">
      {/* ===== HEADER ===== */}
      <div className="booking-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="header-info">
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">{officeName}</p>
        </div>
      </div>

      {/* ===== STEP INDICATOR ===== */}
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 1 ? <Check size={20} /> : '1'}</div>
          <span className="step-label">Patient</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 2 ? <Check size={20} /> : '2'}</div>
          <span className="step-label">Details</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">Confirm</span>
        </div>
      </div>

      {/* ===== BOOKING CONTENT ===== */}
      <div className="booking-content">
        {/* STEP 1: PATIENT SEARCH */}
        {currentStep === 1 && (
          <div className="search-patient-section">
            <h2 className="section-title">Find Patient</h2>
            <p className="section-description">
              Search for an existing patient or create a new patient record
            </p>

            <div className="search-box-large">
              <Search className="search-icon" size={24} />
              <input
                type="text"
                className="search-input-large"
                placeholder="Search by name, phone, or date of birth..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="patient-results">
              {searchLoading ? (
                <div className="no-results">
                  <Clock size={48} />
                  <p>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(patient => (
                  <div
                    key={patient.Patient_ID}
                    className="patient-result-item"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="patient-avatar">
                      <User size={24} />
                    </div>
                    <div className="patient-info">
                      <h3 className="patient-name">
                        {patient.First_Name} {patient.Last_Name}
                      </h3>
                      <p className="patient-details">
                        ID: {patient.Patient_ID} • {patient.dob} • {patient.EmergencyContact}
                      </p>
                    </div>
                    {patient.plan_name && (
                      <div className="patient-insurance">
                        <User size={16} />
                        <span>{patient.plan_name}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : searchTerm.length >= 2 ? (
                <div className="no-results">
                  <AlertCircle size={48} />
                  <p>No patients found matching "{searchTerm}"</p>
                </div>
              ) : null}
            </div>

            <div className="new-patient-option">
              <p className="or-divider">OR</p>
              <button className="btn btn-secondary btn-large">
                <User size={20} />
                Create New Patient
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: APPOINTMENT DETAILS */}
        {currentStep === 2 && (
          <div className="booking-form">
            {/* Selected Patient Card */}
            <div className="selected-patient-card">
              <div className="card-header">
                <h3>Selected Patient</h3>
                <button className="btn-change" onClick={handleChangePatient}>
                  Change Patient
                </button>
              </div>
              <div className="patient-info-display">
                <div className="info-item">
                  <User size={18} />
                  <span>{selectedPatient?.First_Name} {selectedPatient?.Last_Name}</span>
                </div>
                <div className="info-item">
                  <Phone size={18} />
                  <span>{selectedPatient?.EmergencyContact}</span>
                </div>
                {selectedPatient?.Email && (
                  <div className="info-item">
                    <Globe size={18} />
                    <span>{selectedPatient.Email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="form-section">
              <div className="form-section-title">
                <User size={20} />
                Select Doctor
                <span className="required-badge">Required</span>
              </div>
              <div className="doctor-grid">
                {doctorsLoading ? (
                  <p>Loading doctors...</p>
                ) : doctors.length === 0 ? (
                  <p>No doctors available</p>
                ) : (
                  doctors.map(doctor => (
                    <div
                      key={doctor.Doctor_id}
                      className={`doctor-card ${
                        selectedDoctor?.Doctor_id === doctor.Doctor_id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="doctor-avatar">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="doctor-name">
                          Dr. {doctor.First_Name} {doctor.Last_Name}
                        </p>
                        <p className="doctor-specialty">{doctor.specialty_name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="form-section">
              <div className="form-section-title">
                <Calendar size={20} />
                Date & Time
                <span className="required-badge">Required</span>
              </div>
              <div className="date-time-grid">
                <div className="form-group">
                  <label className="form-label">Appointment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={getMinDate()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Appointment Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="form-section">
              <div className="form-section-title">
                Reason for Visit
                <span className="required-badge">Required</span>
              </div>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="e.g., Annual checkup, Follow-up visit, New symptoms..."
                  rows="4"
                />
              </div>
            </div>

            {/* Booking Channel */}
            <div className="booking-channel-section">
              <h3 className="form-section-title">Booking Method</h3>
              <div className="booking-channel-options">
                <div
                  className={`channel-option ${bookingChannel === 'walk-in' ? 'selected' : ''}`}
                  onClick={() => setBookingChannel('walk-in')}
                >
                  <User size={24} />
                  <span>Walk-in</span>
                </div>
                <div
                  className={`channel-option ${bookingChannel === 'phone' ? 'selected' : ''}`}
                  onClick={() => setBookingChannel('phone')}
                >
                  <Phone size={24} />
                  <span>Phone</span>
                </div>
                <div
                  className={`channel-option ${bookingChannel === 'online' ? 'selected' : ''}`}
                  onClick={() => setBookingChannel('online')}
                >
                  <Globe size={24} />
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={handleChangePatient}>
                Back to Patient Search
              </button>
              <button 
                className="btn btn-primary btn-large"
                onClick={handleProceedToConfirmation}
              >
                Review & Confirm
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION */}
        {currentStep === 3 && (
          <div className="confirmation-card">
            <div className="confirmation-header">
              <h2>Review Appointment</h2>
              <p>Please review the appointment details before confirming</p>
            </div>

            <div className="confirmation-sections">
              {/* Patient Information */}
              <div className="confirm-section">
                <h3 className="confirm-title">Patient Information</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span className="confirm-label">Patient Name</span>
                    <span className="confirm-value">
                      {selectedPatient?.First_Name} {selectedPatient?.Last_Name}
                    </span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Patient ID</span>
                    <span className="confirm-value">{selectedPatient?.Patient_ID}</span>
                  </div>
                  {selectedPatient?.EmergencyContact && (
                    <div className="confirm-item">
                      <span className="confirm-label">Phone</span>
                      <span className="confirm-value">{selectedPatient.EmergencyContact}</span>
                    </div>
                  )}
                  {selectedPatient?.Email && (
                    <div className="confirm-item">
                      <span className="confirm-label">Email</span>
                      <span className="confirm-value">{selectedPatient.Email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="confirm-section highlight-section">
                <h3 className="confirm-title">Appointment Details</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span className="confirm-label">Doctor</span>
                    <span className="confirm-value">
                      Dr. {selectedDoctor?.First_Name} {selectedDoctor?.Last_Name}
                    </span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Specialty</span>
                    <span className="confirm-value">{selectedDoctor?.specialty_name}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Date</span>
                    <span className="confirm-value-highlight">
                      {new Date(appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Time</span>
                    <span className="confirm-value-highlight">
                      {new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="confirm-item confirm-item-full">
                    <span className="confirm-label">Reason for Visit</span>
                    <span className="confirm-value">{reasonForVisit}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="confirm-section">
                <h3 className="confirm-title">Booking Information</h3>
                <div className="booking-channel-display">
                  {bookingChannel === 'walk-in' && <User size={20} />}
                  {bookingChannel === 'phone' && <Phone size={20} />}
                  {bookingChannel === 'online' && <Globe size={20} />}
                  <div>
                    <p className="channel-name">
                      {bookingChannel === 'walk-in' && 'Walk-in'}
                      {bookingChannel === 'phone' && 'Phone'}
                      {bookingChannel === 'online' && 'Online'}
                    </p>
                  </div>
                </div>
                <div className="confirm-item">
                  <span className="confirm-label">Office</span>
                  <span className="confirm-value">{officeName}</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Confirmation Actions */}
            <div className="confirmation-actions">
              <button 
                className="btn btn-ghost"
                onClick={() => setCurrentStep(2)}
                disabled={creating}
              >
                Back to Edit
              </button>
              <button 
                className="btn btn-success btn-large"
                onClick={handleSubmitAppointment}
                disabled={creating}
              >
                <Check size={20} />
                {creating ? 'Creating Appointment...' : 'Confirm & Create Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppointmentBooking;