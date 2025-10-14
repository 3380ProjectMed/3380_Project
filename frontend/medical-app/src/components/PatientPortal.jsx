import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  CreditCard, 
  Activity,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  Pill,
  AlertCircle,
  ChevronRight,
  Plus,
  X,
  Check,
  DollarSign,
  Shield,
  Stethoscope,
  LogOut,
  Home
} from 'lucide-react';

export default function PatientPortal() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [needsReferral, setNeedsReferral] = useState(false);

  // Mock data
  const upcomingAppointments = [
    { id: 1, doctor: 'Dr. Sarah Johnson', specialty: 'Primary Care', date: '2025-10-15', time: '10:00 AM', location: 'Downtown Medical Center', status: 'Confirmed' },
    { id: 2, doctor: 'Dr. Michael Chen', specialty: 'Cardiology', date: '2025-10-22', time: '2:30 PM', location: 'Westside Family Clinic', status: 'Pending' }
  ];

  const appointmentHistory = [
    { id: 1, doctor: 'Dr. Sarah Johnson', date: '2025-09-10', reason: 'Annual Checkup', status: 'Completed' },
    { id: 2, doctor: 'Dr. Emily Rodriguez', date: '2025-08-15', reason: 'Follow-up Visit', status: 'Completed' }
  ];

  const vitalsHistory = [
    { date: '2025-09-10', bp: '120/80', hr: '72', temp: '98.6', weight: '165' },
    { date: '2025-06-15', bp: '118/78', hr: '70', temp: '98.4', weight: '167' },
    { date: '2025-03-20', bp: '122/82', hr: '74', temp: '98.5', weight: '168' }
  ];

  const medications = [
    { name: 'Lisinopril 10mg', frequency: 'Once daily', prescribedBy: 'Dr. Sarah Johnson' },
    { name: 'Metformin 500mg', frequency: 'Twice daily', prescribedBy: 'Dr. Sarah Johnson' }
  ];

  const allergies = ['Penicillin', 'Shellfish'];

  const conditions = ['Type 2 Diabetes', 'Hypertension'];

  const insurancePolicies = [
    { 
      type: 'Primary', 
      provider: 'Blue Cross Blue Shield', 
      memberId: 'ABC123456789', 
      groupNumber: 'GRP789456',
      effectiveDate: '2024-01-01',
      terminationDate: 'Active'
    }
  ];

  const billingStatements = [
    { id: 1, date: '2025-09-10', service: 'Annual Physical', amount: 150, balance: 35, status: 'Partial Payment' },
    { id: 2, date: '2025-08-15', service: 'Follow-up Visit', amount: 100, balance: 0, status: 'Paid' }
  ];

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Primary Care', location: 'Downtown Medical Center' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Cardiology', location: 'Westside Family Clinic' },
    { id: 3, name: 'Dr. Emily Rodriguez', specialty: 'Family Medicine', location: 'Memorial Park Healthcare' }
  ];

  const locations = [
    'Downtown Medical Center',
    'Westside Family Clinic',
    'Memorial Park Healthcare',
    'Galleria Medical Plaza'
  ];

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const handleBookingNext = () => {
    if (bookingStep < 4) setBookingStep(bookingStep + 1);
  };

  const handleBookingBack = () => {
    if (bookingStep > 1) setBookingStep(bookingStep - 1);
  };

  const handleBookingSubmit = () => {
    alert('Appointment booked successfully!');
    setShowBookingModal(false);
    setBookingStep(1);
    setSelectedDoctor(null);
    setSelectedLocation(null);
    setSelectedDate('');
    setSelectedTime('');
    setAppointmentReason('');
    setNeedsReferral(false);
  };

  const renderBookingModal = () => (
    <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book New Appointment</h2>
          <button className="modal-close" onClick={() => setShowBookingModal(false)}>
            <X />
          </button>
        </div>
        
        <div className="booking-steps">
          <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>1. Select Doctor</div>
          <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>2. Choose Location & Time</div>
          <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>3. Reason for Visit</div>
          <div className={`step ${bookingStep >= 4 ? 'active' : ''}`}>4. Confirm</div>
        </div>

        <div className="modal-body">
          {bookingStep === 1 && (
            <div className="booking-step-content">
              <h3>Select a Doctor</h3>
              {doctors.map(doctor => (
                <div 
                  key={doctor.id}
                  className={`selection-card ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="card-icon"><Stethoscope /></div>
                  <div>
                    <h4>{doctor.name}</h4>
                    <p>{doctor.specialty}</p>
                    <p className="text-small">{doctor.location}</p>
                  </div>
                  {selectedDoctor?.id === doctor.id && <Check className="check-icon" />}
                </div>
              ))}
            </div>
          )}

          {bookingStep === 2 && (
            <div className="booking-step-content">
              <h3>Choose Location</h3>
              <select 
                className="form-input"
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Select a location</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <h3 style={{marginTop: '1.5rem'}}>Select Date</h3>
              <input 
                type="date" 
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />

              <h3 style={{marginTop: '1.5rem'}}>Select Time</h3>
              <div className="time-slots">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="booking-step-content">
              <h3>Reason for Visit</h3>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Please describe the reason for your visit..."
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value)}
              />

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={needsReferral}
                    onChange={(e) => setNeedsReferral(e.target.checked)}
                  />
                  <span>I need a specialist referral</span>
                </label>
              </div>
            </div>
          )}

          {bookingStep === 4 && (
            <div className="booking-step-content">
              <h3>Confirm Your Appointment</h3>
              <div className="confirm-details">
                <div className="confirm-row">
                  <strong>Doctor:</strong>
                  <span>{selectedDoctor?.name}</span>
                </div>
                <div className="confirm-row">
                  <strong>Specialty:</strong>
                  <span>{selectedDoctor?.specialty}</span>
                </div>
                <div className="confirm-row">
                  <strong>Location:</strong>
                  <span>{selectedLocation}</span>
                </div>
                <div className="confirm-row">
                  <strong>Date:</strong>
                  <span>{selectedDate}</span>
                </div>
                <div className="confirm-row">
                  <strong>Time:</strong>
                  <span>{selectedTime}</span>
                </div>
                <div className="confirm-row">
                  <strong>Reason:</strong>
                  <span>{appointmentReason}</span>
                </div>
                {needsReferral && (
                  <div className="confirm-row">
                    <strong>Referral:</strong>
                    <span>Specialist referral requested</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {bookingStep > 1 && (
            <button className="btn btn-secondary" onClick={handleBookingBack}>
              Back
            </button>
          )}
          {bookingStep < 4 ? (
            <button 
              className="btn btn-primary" 
              onClick={handleBookingNext}
              disabled={
                (bookingStep === 1 && !selectedDoctor) ||
                (bookingStep === 2 && (!selectedLocation || !selectedDate || !selectedTime)) ||
                (bookingStep === 3 && !appointmentReason)
              }
            >
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleBookingSubmit}>
              Confirm Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="portal-content">
      <h1 className="page-title">Welcome Back, John Doe</h1>
      
      <div className="dashboard-grid">
        <div className="dashboard-card large">
          <div className="card-header">
            <h2><Calendar className="icon" /> Upcoming Appointments</h2>
          </div>
          <div className="card-content">
            {upcomingAppointments.map(apt => (
              <div key={apt.id} className="appointment-item">
                <div className="appointment-info">
                  <h3>{apt.doctor}</h3>
                  <p>{apt.specialty}</p>
                  <p className="appointment-details">
                    <Clock className="small-icon" /> {apt.date} at {apt.time}
                  </p>
                  <p className="appointment-details">
                    <MapPin className="small-icon" /> {apt.location}
                  </p>
                </div>
                <span className={`status-badge ${apt.status.toLowerCase()}`}>
                  {apt.status}
                </span>
              </div>
            ))}
            <button className="btn btn-primary btn-full" onClick={() => setShowBookingModal(true)}>
              <Plus className="icon" /> Book New Appointment
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2><User className="icon" /> Primary Care Physician</h2>
          </div>
          <div className="card-content">
            <div className="pcp-info">
              <div className="pcp-avatar">
                <Stethoscope />
              </div>
              <div>
                <h3>Dr. Sarah Johnson</h3>
                <p>Primary Care</p>
                <p><MapPin className="small-icon" /> Downtown Medical Center</p>
                <p><Phone className="small-icon" /> (800) 123-4567</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2><Activity className="icon" /> Recent Activity</h2>
          </div>
          <div className="card-content">
            <div className="activity-list">
              <div className="activity-item">
                <Check className="activity-icon success" />
                <div>
                  <p><strong>Appointment Completed</strong></p>
                  <p className="text-small">Dr. Sarah Johnson - Sep 10, 2025</p>
                </div>
              </div>
              <div className="activity-item">
                <FileText className="activity-icon info" />
                <div>
                  <p><strong>New Visit Summary</strong></p>
                  <p className="text-small">Available in Medical Records</p>
                </div>
              </div>
              <div className="activity-item">
                <DollarSign className="activity-icon warning" />
                <div>
                  <p><strong>Payment Due</strong></p>
                  <p className="text-small">Balance: $35.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="portal-content">
      <h1 className="page-title">Profile & Primary Care Physician</h1>
      
      <div className="profile-grid">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-input" defaultValue="John Doe" />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" className="form-input" defaultValue="1985-05-15" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" defaultValue="john.doe@email.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" className="form-input" defaultValue="(555) 123-4567" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" className="form-input" defaultValue="123 Main St, Houston, TX 77002" />
          </div>
        </div>

        <div className="profile-section">
          <h2>Emergency Contact</h2>
          <div className="form-group">
            <label>Contact Name</label>
            <input type="text" className="form-input" defaultValue="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Relationship</label>
            <input type="text" className="form-input" defaultValue="Spouse" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" className="form-input" defaultValue="(555) 987-6543" />
          </div>
        </div>

        <div className="profile-section full-width">
          <h2>Primary Care Physician</h2>
          <div className="pcp-card">
            <div className="pcp-avatar large">
              <Stethoscope />
            </div>
            <div className="pcp-details">
              <h3>Dr. Sarah Johnson</h3>
              <p><strong>Specialty:</strong> Primary Care</p>
              <p><MapPin className="small-icon" /> Downtown Medical Center</p>
              <p><Phone className="small-icon" /> (800) 123-4567</p>
              <p><Mail className="small-icon" /> s.johnson@medconnect.example</p>
            </div>
            <button className="btn btn-secondary">Change PCP</button>
          </div>
        </div>

        <button className="btn btn-primary btn-large">Save Changes</button>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="portal-content">
      <h1 className="page-title">Appointments</h1>
      
      <button className="btn btn-primary btn-large" onClick={() => setShowBookingModal(true)}>
        <Plus className="icon" /> Book New Appointment
      </button>

      <div className="appointments-section">
        <h2>Upcoming Appointments</h2>
        <div className="appointments-list">
          {upcomingAppointments.map(apt => (
            <div key={apt.id} className="appointment-card">
              <div className="appointment-header">
                <div>
                  <h3>{apt.doctor}</h3>
                  <p>{apt.specialty}</p>
                </div>
                <span className={`status-badge ${apt.status.toLowerCase()}`}>
                  {apt.status}
                </span>
              </div>
              <div className="appointment-body">
                <p><Calendar className="small-icon" /> {apt.date}</p>
                <p><Clock className="small-icon" /> {apt.time}</p>
                <p><MapPin className="small-icon" /> {apt.location}</p>
              </div>
              <div className="appointment-footer">
                <button className="btn btn-secondary btn-small">Reschedule</button>
                <button className="btn btn-danger btn-small">Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="appointments-section">
        <h2>Appointment History</h2>
        <div className="history-list">
          {appointmentHistory.map(apt => (
            <div key={apt.id} className="history-item">
              <div>
                <h4>{apt.doctor}</h4>
                <p>{apt.date} - {apt.reason}</p>
              </div>
              <button className="btn btn-link">
                View Summary <ChevronRight className="small-icon" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMedicalRecords = () => (
    <div className="portal-content">
      <h1 className="page-title">Medical Records</h1>
      
      <div className="records-grid">
        <div className="records-section">
          <h2><Activity className="icon" /> Vitals History</h2>
          <div className="vitals-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Blood Pressure</th>
                  <th>Heart Rate</th>
                  <th>Temperature</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {vitalsHistory.map((vital, idx) => (
                  <tr key={idx}>
                    <td>{vital.date}</td>
                    <td>{vital.bp} mmHg</td>
                    <td>{vital.hr} bpm</td>
                    <td>{vital.temp}°F</td>
                    <td>{vital.weight} lbs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="records-section">
          <h2><Pill className="icon" /> Current Medications</h2>
          <div className="medication-list">
            {medications.map((med, idx) => (
              <div key={idx} className="medication-item">
                <div>
                  <h4>{med.name}</h4>
                  <p>{med.frequency}</p>
                  <p className="text-small">Prescribed by: {med.prescribedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="records-section">
          <h2><AlertCircle className="icon" /> Allergies</h2>
          <div className="allergy-list">
            {allergies.map((allergy, idx) => (
              <span key={idx} className="allergy-badge">{allergy}</span>
            ))}
          </div>
        </div>

        <div className="records-section">
          <h2><Heart className="icon" /> Conditions</h2>
          <div className="condition-list">
            {conditions.map((condition, idx) => (
              <div key={idx} className="condition-item">
                <Heart className="small-icon" />
                <span>{condition}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="records-section full-width">
          <h2><FileText className="icon" /> Visit Summaries</h2>
          <div className="summary-list">
            {appointmentHistory.map(apt => (
              <div key={apt.id} className="summary-item">
                <div>
                  <h4>{apt.date} - {apt.reason}</h4>
                  <p>Provider: {apt.doctor}</p>
                </div>
                <button className="btn btn-link">
                  View Full Summary <ChevronRight className="small-icon" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div className="portal-content">
      <h1 className="page-title">Insurance Details</h1>
      
      <button className="btn btn-primary btn-large">
        <Plus className="icon" /> Add Insurance Policy
      </button>

      <div className="insurance-list">
        {insurancePolicies.map((policy, idx) => (
          <div key={idx} className="insurance-card">
            <div className="insurance-header">
              <div>
                <h3>{policy.type} Insurance</h3>
                <h2>{policy.provider}</h2>
              </div>
              <Shield className="insurance-icon" />
            </div>
            <div className="insurance-body">
              <div className="insurance-detail">
                <strong>Member ID:</strong>
                <span>{policy.memberId}</span>
              </div>
              <div className="insurance-detail">
                <strong>Group Number:</strong>
                <span>{policy.groupNumber}</span>
              </div>
              <div className="insurance-detail">
                <strong>Effective Date:</strong>
                <span>{policy.effectiveDate}</span>
              </div>
              <div className="insurance-detail">
                <strong>Status:</strong>
                <span className="status-active">{policy.terminationDate}</span>
              </div>
            </div>
            <div className="insurance-footer">
              <button className="btn btn-secondary btn-small">Edit</button>
              <button className="btn btn-danger btn-small">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="portal-content">
      <h1 className="page-title">Billing & Payments</h1>
      
      <div className="billing-summary">
        <div className="balance-card">
          <h3>Outstanding Balance</h3>
          <h1 className="balance-amount">$35.00</h1>
          <button className="btn btn-primary btn-large">
            <CreditCard className="icon" /> Make Payment
          </button>
        </div>
      </div>

      <div className="billing-section">
        <h2>Billing Statements</h2>
        <div className="statements-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {billingStatements.map(stmt => (
                <tr key={stmt.id}>
                  <td>{stmt.date}</td>
                  <td>{stmt.service}</td>
                  <td>${stmt.amount}</td>
                  <td>${stmt.balance}</td>
                  <td>
                    <span className={`status-badge ${stmt.status.toLowerCase().replace(' ', '-')}`}>
                      {stmt.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-link btn-small">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="billing-section">
        <h2>Payment Methods</h2>
        <div className="payment-methods">
          <div className="payment-card">
            <CreditCard className="payment-icon" />
            <div>
              <p><strong>Visa ending in 1234</strong></p>
              <p className="text-small">Expires 12/2026</p>
            </div>
            <button className="btn btn-link btn-small">Remove</button>
          </div>
          <button className="btn btn-secondary">
            <Plus className="icon" /> Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="landing-root">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="logo">
            <div className="logo-icon">
              <Stethoscope className="icon" />
            </div>
            <span>MedConnect</span>
          </div>
          
          <nav className="portal-nav">
            <button 
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentPage('dashboard')}
            >
              <Home className="nav-icon" /> Dashboard
            </button>
            <button 
              className={currentPage === 'profile' ? 'active' : ''}
              onClick={() => setCurrentPage('profile')}
            >
              <User className="nav-icon" /> Profile
            </button>
            <button 
              className={currentPage === 'appointments' ? 'active' : ''}
              onClick={() => setCurrentPage('appointments')}
            >
              <Calendar className="nav-icon" /> Appointments
            </button>
            <button 
              className={currentPage === 'records' ? 'active' : ''}
              onClick={() => setCurrentPage('records')}
            >
              <FileText className="nav-icon" /> Medical Records
            </button>
            <button 
              className={currentPage === 'insurance' ? 'active' : ''}
              onClick={() => setCurrentPage('insurance')}
            >
              <Shield className="nav-icon" /> Insurance
            </button>
            <button 
              className={currentPage === 'billing' ? 'active' : ''}
              onClick={() => setCurrentPage('billing')}
            >
              <CreditCard className="nav-icon" /> Billing
            </button>
          </nav>
          
          <div className="header-actions">
            <button className="btn btn-secondary">
              <LogOut className="icon" />
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="portal-main">
        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'profile' && renderProfile()}
        {currentPage === 'appointments' && renderAppointments()}
        {currentPage === 'records' && renderMedicalRecords()}
        {currentPage === 'insurance' && renderInsurance()}
        {currentPage === 'billing' && renderBilling()}
      </main>

      {/* Booking Modal */}
      {showBookingModal && renderBookingModal()}

      {/* Footer */}
      <footer className="footer">
        <div className="landing-container">
          © {new Date().getFullYear()} MedConnect • Modern Healthcare Management
        </div>
      </footer>
    </div>
  );
}