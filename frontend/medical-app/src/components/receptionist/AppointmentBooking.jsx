import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, Clock, User, FileText, CreditCard, Phone, Globe, UserPlus, Save, AlertCircle } from 'lucide-react';
import './AppointmentBooking.css';

/**
 * AppointmentBooking Component
 * 
 * Create appointments with REQUIRED booking_channel field
 * 
 * Database Tables:
 * - Appointment (Appointment_id, Patient_id, Doctor_id, Office_id, Appointment_date, 
 *               Date_created, Reason_for_visit, booking_channel)
 * - Patient (Patient_ID, First_Name, Last_Name, EmergencyContact, Email)
 * - Doctor (Doctor_id, First_Name, Last_Name, Specialty)
 * - Specialty (specialty_id, specialty_name)
 * - Office (Office_ID, Name, City, State, address)
 * - patient_insurance (copay, member_id)
 * - insurance_payer (NAME)
 * 
 * INSERT INTO Appointment:
 * (Patient_id, Doctor_id, Office_id, Appointment_date, Date_created, 
 *  Reason_for_visit, booking_channel)
 * VALUES (?, ?, ?, ?, NOW(), ?, ?)
 * 
 * Props:
 * @param {Object} preSelectedPatient - Patient from search page
 * @param {Function} onBack - Return to previous page
 * @param {Function} onSuccess - Navigate after successful booking
 * @param {Number} officeId - Receptionist's Office_ID (RBAC)
 * @param {String} officeName - Office name for display
 */
function AppointmentBooking({ preSelectedPatient, onBack, onSuccess, officeId, officeName }) {
  const [step, setStep] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [errors, setErrors] = useState({});

  // Form state matching Appointment table
  const [formData, setFormData] = useState({
    // Appointment table fields
    Patient_id: null,
    Doctor_id: null,
    Office_id: officeId, // From Staff.Work_Location
    Appointment_date: '', // Combined date + time
    Reason_for_visit: '',
    booking_channel: 'phone', // ENUM('phone', 'online', 'walk-in') - REQUIRED
    
    // Display fields (not saved directly)
    appointmentDate: '',
    appointmentTime: '',
    
    // Patient display info
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    insurancePayer: '',
    insurancePlan: '',
    memberID: '',
    copay: ''
  });

  /**
   * Mock patient database (Patient table)
   */
  const mockPatients = [
    { 
      Patient_ID: 1, 
      First_Name: 'John', 
      Last_Name: 'Smith', 
      EmergencyContact: '555-1001', 
      Email: 'john.smith@email.com', 
      dob: '1985-03-15',
      payer_name: 'Blue Cross Blue Shield',
      plan_name: 'BCBS Gold',
      member_id: 'M123456789',
      copay: 25.00
    },
    { 
      Patient_ID: 2, 
      First_Name: 'Maria', 
      Last_Name: 'Garcia', 
      EmergencyContact: '555-1002', 
      Email: 'maria.garcia@email.com', 
      dob: '1978-07-22',
      payer_name: 'Blue Cross Blue Shield',
      plan_name: 'BCBS Silver',
      member_id: 'M123456790',
      copay: 20.00
    },
    { 
      Patient_ID: 3, 
      First_Name: 'David', 
      Last_Name: 'Johnson', 
      EmergencyContact: '555-1003', 
      Email: 'david.johnson@email.com', 
      dob: '1992-11-30',
      payer_name: 'Medicare',
      plan_name: 'Medicare Part B',
      member_id: 'M123456791',
      copay: 15.00
    },
  ];

  /**
   * Doctors from Doctor table with Specialty join
   * SELECT d.Doctor_id, d.First_Name, d.Last_Name, s.specialty_name
   * FROM Doctor d
   * JOIN Specialty s ON d.Specialty = s.specialty_id
   * WHERE d.Work_Location = ?
   */
  const doctors = [
    { Doctor_id: 1, First_Name: 'Emily', Last_Name: 'Chen', specialty_name: 'Internal Medicine' },
    { Doctor_id: 2, First_Name: 'James', Last_Name: 'Rodriguez', specialty_name: 'Cardiology' },
    { Doctor_id: 3, First_Name: 'Susan', Last_Name: 'Lee', specialty_name: 'Pediatrics' },
    { Doctor_id: 4, First_Name: 'Richard', Last_Name: 'Patel', specialty_name: 'Orthopedics' },
  ];

  /**
   * Available time slots
   */
  const timeSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  /**
   * Set pre-selected patient if provided
   */
  useEffect(() => {
    if (preSelectedPatient) {
      handlePatientSelect(preSelectedPatient);
    }
  }, [preSelectedPatient]);

  /**
   * Search patients by name, phone (EmergencyContact), or DOB
   */
  const searchPatients = () => {
    if (!patientSearch.trim()) return [];
    
    const searchLower = patientSearch.toLowerCase().replace(/[^\w\s-]/g, '');
    return mockPatients.filter(p =>
      `${p.First_Name} ${p.Last_Name}`.toLowerCase().includes(searchLower) ||
      p.EmergencyContact.replace(/[^\d]/g, '').includes(searchLower) ||
      p.dob.includes(patientSearch)
    );
  };

  /**
   * Handle patient selection
   */
  const handlePatientSelect = (patient) => {
    setFormData(prev => ({
      ...prev,
      Patient_id: patient.Patient_ID,
      patientName: `${patient.First_Name} ${patient.Last_Name}`,
      patientPhone: patient.EmergencyContact,
      patientEmail: patient.Email,
      insurancePayer: patient.payer_name,
      insurancePlan: patient.plan_name,
      memberID: patient.member_id,
      copay: patient.copay
    }));
    setPatientSearch('');
    setStep(2);
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.Patient_id) newErrors.Patient_id = 'Please select a patient';
    if (!formData.Doctor_id) newErrors.Doctor_id = 'Please select a doctor';
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Please select a date';
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Please select a time';
    if (!formData.Reason_for_visit) newErrors.Reason_for_visit = 'Please enter reason for visit';
    if (!formData.booking_channel) newErrors.booking_channel = 'Booking channel is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    // Combine date and time for Appointment_date
    const appointmentDateTime = `${formData.appointmentDate} ${convertTo24Hour(formData.appointmentTime)}:00`;

    // TODO: Submit to API
    // POST /api/appointments
    const appointmentData = {
      Patient_id: formData.Patient_id,
      Doctor_id: formData.Doctor_id,
      Office_id: formData.Office_id,
      Appointment_date: appointmentDateTime,
      Date_created: new Date().toISOString(),
      Reason_for_visit: formData.Reason_for_visit,
      booking_channel: formData.booking_channel // REQUIRED FIELD
    };
    
    console.log('Creating appointment:', appointmentData);
    
    alert('Appointment booked successfully!');
    if (onSuccess) {
      onSuccess();
    }
  };

  /**
   * Convert 12-hour time to 24-hour format
   */
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours}:${minutes}`;
  };

  /**
   * Get minimum date (today)
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
          <h1 className="page-title">
            {formData.Patient_id ? 'Schedule Appointment' : 'New Appointment'}
          </h1>
          <p className="page-subtitle">
            {step === 1 && 'Step 1: Select Patient'}
            {step === 2 && 'Step 2: Appointment Details'}
            {step === 3 && 'Step 3: Review & Confirm'}
          </p>
        </div>
      </div>

      {/* ===== STEP INDICATOR ===== */}
      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span className="step-label">Patient</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span className="step-label">Details</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">Confirm</span>
        </div>
      </div>

      {/* ===== STEP 1: PATIENT SELECTION ===== */}
      {step === 1 && (
        <div className="booking-content">
          <div className="search-patient-section">
            <h2 className="section-title">Find Patient</h2>
            <p className="section-description">Search by name, phone (EmergencyContact), or date of birth</p>
            
            <div className="search-box-large">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search: Name, Phone (555-1001), or DOB (YYYY-MM-DD)..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="search-input-large"
              />
            </div>

            {/* Search Results */}
            {patientSearch && (
              <div className="patient-results">
                {searchPatients().length > 0 ? (
                  searchPatients().map(patient => (
                    <div
                      key={patient.Patient_ID}
                      className="patient-result-item"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="patient-avatar">
                        <User size={24} />
                      </div>
                      <div className="patient-info">
                        <h3 className="patient-name">
                          {patient.First_Name} {patient.Last_Name}
                        </h3>
                        <p className="patient-details">
                          {patient.EmergencyContact} • DOB: {patient.dob}
                        </p>
                      </div>
                      <div className="patient-insurance">
                        <CreditCard size={16} />
                        <span>{patient.payer_name}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <AlertCircle size={48} />
                    <p>No patients found matching "{patientSearch}"</p>
                  </div>
                )}
              </div>
            )}

            {/* New Patient Button */}
            <div className="new-patient-option">
              <p className="or-divider">OR</p>
              <button className="btn btn-secondary btn-large">
                <UserPlus size={20} />
                Register New Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 2: APPOINTMENT DETAILS ===== */}
      {step === 2 && (
        <div className="booking-content">
          <div className="booking-form">
            {/* Selected Patient Card */}
            <div className="selected-patient-card">
              <div className="card-header">
                <h3>Selected Patient</h3>
                <button className="btn-change" onClick={() => setStep(1)}>Change</button>
              </div>
              <div className="patient-info-display">
                <div className="info-item">
                  <User size={16} />
                  <span>{formData.patientName}</span>
                </div>
                <div className="info-item">
                  <Phone size={16} />
                  <span>{formData.patientPhone}</span>
                </div>
                <div className="info-item">
                  <CreditCard size={16} />
                  <span>{formData.insurancePayer}</span>
                </div>
              </div>
            </div>

            {/* Office Display (Read-only - from Staff.Work_Location) */}
            <div className="form-section">
              <h3 className="form-section-title">Office Location</h3>
              <div className="office-display">
                <p className="office-name">{officeName}</p>
                <p className="office-note">Assigned office location (Office_ID: {officeId})</p>
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="form-section">
              <h3 className="form-section-title">
                <User size={20} />
                Select Doctor
              </h3>
              <div className="doctor-grid">
                {doctors.map(doc => (
                  <div
                    key={doc.Doctor_id}
                    className={`doctor-card ${formData.Doctor_id === doc.Doctor_id ? 'selected' : ''}`}
                    onClick={() => handleInputChange('Doctor_id', doc.Doctor_id)}
                  >
                    <div className="doctor-avatar">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="doctor-name">Dr. {doc.First_Name} {doc.Last_Name}</p>
                      <p className="doctor-specialty">{doc.specialty_name}</p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.Doctor_id && <p className="error-message">{errors.Doctor_id}</p>}
            </div>

            {/* Date & Time */}
            <div className="form-section">
              <h3 className="form-section-title">
                <Calendar size={20} />
                Date & Time
              </h3>
              <div className="date-time-grid">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className={`form-input ${errors.appointmentDate ? 'error' : ''}`}
                    value={formData.appointmentDate}
                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                    min={getMinDate()}
                  />
                  {errors.appointmentDate && <p className="error-message">{errors.appointmentDate}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <select
                    className={`form-select ${errors.appointmentTime ? 'error' : ''}`}
                    value={formData.appointmentTime}
                    onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {errors.appointmentTime && <p className="error-message">{errors.appointmentTime}</p>}
                </div>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="form-section">
              <h3 className="form-section-title">
                <FileText size={20} />
                Visit Information
              </h3>
              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <input
                  type="text"
                  className={`form-input ${errors.Reason_for_visit ? 'error' : ''}`}
                  placeholder="e.g., Annual Physical, Follow-up, New Patient"
                  value={formData.Reason_for_visit}
                  onChange={(e) => handleInputChange('Reason_for_visit', e.target.value)}
                />
                {errors.Reason_for_visit && <p className="error-message">{errors.Reason_for_visit}</p>}
              </div>
            </div>

            {/* Booking Channel - CRITICAL REQUIRED FIELD */}
            <div className="form-section booking-channel-section">
              <h3 className="form-section-title">
                <Phone size={20} />
                Booking Channel
                <span className="required-badge">REQUIRED</span>
              </h3>
              <p className="section-description">How was this appointment scheduled?</p>
              <div className="booking-channel-options">
                <div
                  className={`channel-option ${formData.booking_channel === 'phone' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('booking_channel', 'phone')}
                >
                  <Phone size={24} />
                  <span>Phone Call</span>
                </div>
                <div
                  className={`channel-option ${formData.booking_channel === 'online' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('booking_channel', 'online')}
                >
                  <Globe size={24} />
                  <span>Online Portal</span>
                </div>
                <div
                  className={`channel-option ${formData.booking_channel === 'walk-in' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('booking_channel', 'walk-in')}
                >
                  <UserPlus size={24} />
                  <span>Walk-in</span>
                </div>
              </div>
              {errors.booking_channel && <p className="error-message">{errors.booking_channel}</p>}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                Back to Patient Selection
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Review Appointment
                <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 3: CONFIRMATION ===== */}
      {step === 3 && (
        <div className="booking-content">
          <div className="confirmation-card">
            <div className="confirmation-header">
              <h2>Review Appointment Details</h2>
              <p>Please verify all information before confirming</p>
            </div>

            <div className="confirmation-sections">
              {/* Patient Info */}
              <div className="confirm-section">
                <h3 className="confirm-title">Patient Information</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span className="confirm-label">Name</span>
                    <span className="confirm-value">{formData.patientName}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Phone</span>
                    <span className="confirm-value">{formData.patientPhone}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Insurance</span>
                    <span className="confirm-value">{formData.insurancePayer}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Copay</span>
                    <span className="confirm-value">${formData.copay}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="confirm-section">
                <h3 className="confirm-title">Appointment Details</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span className="confirm-label">Doctor</span>
                    <span className="confirm-value">
                      Dr. {doctors.find(d => d.Doctor_id === formData.Doctor_id)?.First_Name}{' '}
                      {doctors.find(d => d.Doctor_id === formData.Doctor_id)?.Last_Name}
                    </span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Location</span>
                    <span className="confirm-value">{officeName}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Date</span>
                    <span className="confirm-value">
                      {new Date(formData.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Time</span>
                    <span className="confirm-value">{formData.appointmentTime}</span>
                  </div>
                  <div className="confirm-item confirm-item-full">
                    <span className="confirm-label">Reason</span>
                    <span className="confirm-value">{formData.Reason_for_visit}</span>
                  </div>
                </div>
              </div>

              {/* Booking Channel - Highlighted */}
              <div className="confirm-section highlight-section">
                <h3 className="confirm-title">Booking Channel</h3>
                <div className="booking-channel-display">
                  {formData.booking_channel === 'phone' && <Phone size={20} />}
                  {formData.booking_channel === 'online' && <Globe size={20} />}
                  {formData.booking_channel === 'walk-in' && <UserPlus size={20} />}
                  <span className="channel-name">
                    {formData.booking_channel === 'phone' && 'Phone Call'}
                    {formData.booking_channel === 'online' && 'Online Portal'}
                    {formData.booking_channel === 'walk-in' && 'Walk-in'}
                  </span>
                </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="confirmation-actions">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={18} />
                Edit Details
              </button>
              <button className="btn btn-success btn-large" onClick={handleSubmit}>
                <Save size={20} />
                Confirm & Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentBooking;