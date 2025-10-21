import React, { useState, useEffect } from 'react';
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
import api from './api';
import './patientportal.css';

export default function PatientPortal({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [needsReferral, setNeedsReferral] = useState(false);

  // Data from API
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [pcp, setPcp] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [offices, setOffices] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [billingBalance, setBillingBalance] = useState(0);
  const [billingStatements, setBillingStatements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data when page changes
  useEffect(() => {
    loadPageData();
  }, [currentPage]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      switch (currentPage) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'profile':
          await loadProfile();
          break;
        case 'appointments':
          await loadAppointments();
          break;
        case 'records':
          await loadMedicalRecords();
          break;
        case 'insurance':
          await loadInsurance();
          break;
        case 'billing':
          await loadBilling();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await api.dashboard.getDashboard();
      if (response.success) {
        setUpcomingAppointments(response.data.upcoming_appointments || []);
        setPcp(response.data.pcp);
        setRecentActivity(response.data.recent_activity || []);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await api.profile.getProfile();
      if (response.success) {
        setProfile(response.data);
        setPcp(response.data);
      }
    } catch (error) {
      console.error('Profile load error:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const [upcomingRes, historyRes, doctorsRes, officesRes] = await Promise.all([
        api.appointments.getUpcoming(),
        api.appointments.getHistory(),
        api.appointments.getDoctors(),
        api.appointments.getOffices()
      ]);
      
      if (upcomingRes.success) setUpcomingAppointments(upcomingRes.data || []);
      if (historyRes.success) setAppointmentHistory(historyRes.data || []);
      if (doctorsRes.success) setDoctors(doctorsRes.data || []);
      if (officesRes.success) setOffices(officesRes.data || []);
    } catch (error) {
      console.error('Appointments load error:', error);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      const [vitalsRes, medsRes, allergiesRes, conditionsRes] = await Promise.all([
        api.medicalRecords.getVitals(),
        api.medicalRecords.getMedications(),
        api.medicalRecords.getAllergies(),
        api.medicalRecords.getConditions()
      ]);
      
      if (vitalsRes.success) setVitalsHistory(vitalsRes.data || []);
      if (medsRes.success) setMedications(medsRes.data || []);
      if (allergiesRes.success) setAllergies(allergiesRes.data || []);
      if (conditionsRes.success) setConditions(conditionsRes.data || []);
    } catch (error) {
      console.error('Medical records load error:', error);
    }
  };

  const loadInsurance = async () => {
    try {
      const response = await api.insurance.getInsurance();
      if (response.success) {
        setInsurancePolicies(response.data || []);
      }
    } catch (error) {
      console.error('Insurance load error:', error);
    }
  };

  const loadBilling = async () => {
    try {
      const [balanceRes, statementsRes] = await Promise.all([
        api.billing.getBalance(),
        api.billing.getStatements()
      ]);
      
      if (balanceRes.success) {
        setBillingBalance(balanceRes.data.outstanding_balance || 0);
      }
      if (statementsRes.success) {
        setBillingStatements(statementsRes.data || []);
      }
    } catch (error) {
      console.error('Billing load error:', error);
    }
  };

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const handleBookingNext = () => {
    if (bookingStep < 4) setBookingStep(bookingStep + 1);
  };

  const handleBookingBack = () => {
    if (bookingStep > 1) setBookingStep(bookingStep - 1);
  };

  const handleBookingSubmit = async () => {
    try {
      const appointmentData = {
        doctor_id: selectedDoctor.Doctor_id,
        office_id: selectedLocation,
        appointment_date: `${selectedDate} ${selectedTime}`,
        reason: appointmentReason,
        needs_referral: needsReferral
      };
      
      const response = await api.appointments.bookAppointment(appointmentData);
      
      if (response.success) {
        alert('Appointment booked successfully!');
        setShowBookingModal(false);
        setBookingStep(1);
        setSelectedDoctor(null);
        setSelectedLocation(null);
        setSelectedDate('');
        setSelectedTime('');
        setAppointmentReason('');
        setNeedsReferral(false);
        loadAppointments();
      }
    } catch (error) {
      alert('Failed to book appointment: ' + error.message);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      const response = await api.appointments.cancelAppointment(appointmentId);
      if (response.success) {
        alert('Appointment cancelled successfully');
        loadAppointments();
      }
    } catch (error) {
      alert('Failed to cancel appointment: ' + error.message);
    }
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
              {doctors.length === 0 ? (
                <p>Loading doctors...</p>
              ) : (
                doctors.map(doctor => (
                  <div 
                    key={doctor.Doctor_id}
                    className={`selection-card ${selectedDoctor?.Doctor_id === doctor.Doctor_id ? 'selected' : ''}`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="card-icon"><Stethoscope /></div>
                    <div>
                      <h4>{doctor.name}</h4>
                      <p>{doctor.specialty_name}</p>
                      <p className="text-small">{doctor.office_name}</p>
                    </div>
                    {selectedDoctor?.Doctor_id === doctor.Doctor_id && <Check className="check-icon" />}
                  </div>
                ))
              )}
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
                {offices.map(office => (
                  <option key={office.Office_ID} value={office.Office_ID}>
                    {office.Name}
                  </option>
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
                  <span>{selectedDoctor?.specialty_name}</span>
                </div>
                <div className="confirm-row">
                  <strong>Location:</strong>
                  <span>{offices.find(o => o.Office_ID == selectedLocation)?.Name}</span>
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
            <button className="btn btn-secondary" onClick={onLogout}>
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

  const renderDashboard = () => (
    <div className="portal-content">
      <h1 className="page-title">Welcome Back, {user?.username || 'Patient'}</h1>
      
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-card large">
            <div className="card-header">
              <h2><Calendar className="icon" /> Upcoming Appointments</h2>
            </div>
            <div className="card-content">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map(apt => (
                  <div key={apt.Appointment_id} className="appointment-item">
                    <div className="appointment-info">
                      <h3>{apt.doctor_name}</h3>
                      <p>{apt.specialty_name}</p>
                      <p className="appointment-details">
                        <Clock className="small-icon" /> {new Date(apt.Appointment_date).toLocaleString()}
                      </p>
                      <p className="appointment-details">
                        <MapPin className="small-icon" /> {apt.office_name}
                      </p>
                    </div>
                    <span className={`status-badge ${apt.status.toLowerCase()}`}>
                      {apt.status}
                    </span>
                  </div>
                ))
              )}
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
              {pcp ? (
                <div className="pcp-info">
                  <div className="pcp-avatar">
                    <Stethoscope />
                  </div>
                  <div>
                    <h3>{pcp.name || pcp.pcp_name}</h3>
                    <p>{pcp.specialty_name || pcp.pcp_specialty}</p>
                    <p><MapPin className="small-icon" /> {pcp.office_name || pcp.pcp_office}</p>
                    <p><Phone className="small-icon" /> {pcp.Phone || pcp.pcp_phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray">No PCP assigned</p>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2><Activity className="icon" /> Recent Activity</h2>
            </div>
            <div className="card-content">
              {recentActivity.length === 0 ? (
                <p className="text-gray">No recent activity</p>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <Check className="activity-icon success" />
                      <div>
                        <p><strong>{activity.Status}</strong></p>
                        <p className="text-small">{activity.doctor_name} - {new Date(activity.Date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="portal-content">
      <h1 className="page-title">Profile & Primary Care Physician</h1>
      
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="profile-grid">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" value={profile ? `${profile.First_Name} ${profile.Last_Name}` : ''} readOnly />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" className="form-input" value={profile?.dob || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={profile?.Email || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input type="tel" className="form-input" value={profile?.EmergencyContact || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Blood Type</label>
              <input type="text" className="form-input" value={profile?.BloodType || 'Not specified'} readOnly />
            </div>
          </div>

          {pcp && (
            <div className="profile-section full-width">
              <h2>Primary Care Physician</h2>
              <div className="pcp-card">
                <div className="pcp-avatar large">
                  <Stethoscope />
                </div>
                <div className="pcp-details">
                  <h3>{pcp.pcp_name || pcp.name}</h3>
                  <p><strong>Specialty:</strong> {pcp.pcp_specialty || pcp.specialty_name}</p>
                  <p><MapPin className="small-icon" /> {pcp.pcp_office || pcp.office_name}</p>
                  <p><Phone className="small-icon" /> {pcp.pcp_phone || pcp.Phone}</p>
                  <p><Mail className="small-icon" /> {pcp.pcp_email || pcp.Email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAppointments = () => (
    <div className="portal-content">
      <h1 className="page-title">Appointments</h1>
      
      <button className="btn btn-primary btn-large" onClick={() => setShowBookingModal(true)}>
        <Plus className="icon" /> Book New Appointment
      </button>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="appointments-section">
            <h2>Upcoming Appointments</h2>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray">No upcoming appointments</p>
            ) : (
              <div className="appointments-list">
                {upcomingAppointments.map(apt => (
                  <div key={apt.Appointment_id} className="appointment-card">
                    <div className="appointment-header">
                      <div>
                        <h3>{apt.doctor_name}</h3>
                        <p>{apt.specialty_name}</p>
                      </div>
                      <span className={`status-badge ${apt.status.toLowerCase()}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="appointment-body">
                      <p><Calendar className="small-icon" /> {new Date(apt.Appointment_date).toLocaleDateString()}</p>
                      <p><Clock className="small-icon" /> {new Date(apt.Appointment_date).toLocaleTimeString()}</p>
                      <p><MapPin className="small-icon" /> {apt.office_name}</p>
                    </div>
                    <div className="appointment-footer">
                      <button className="btn btn-danger btn-small" onClick={() => handleCancelAppointment(apt.Appointment_id)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="appointments-section">
            <h2>Appointment History</h2>
            {appointmentHistory.length === 0 ? (
              <p className="text-gray">No appointment history</p>
            ) : (
              <div className="history-list">
                {appointmentHistory.map(apt => (
                  <div key={apt.Visit_id} className="history-item">
                    <div>
                      <h4>{apt.doctor_name}</h4>
                      <p>{new Date(apt.Date).toLocaleDateString()} - {apt.Reason_for_Visit}</p>
                    </div>
                    <button className="btn btn-link">
                      View Summary <ChevronRight className="small-icon" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderMedicalRecords = () => (
    <div className="portal-content">
      <h1 className="page-title">Medical Records</h1>
      
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="records-grid">
          <div className="records-section">
            <h2><Activity className="icon" /> Vitals History</h2>
            {vitalsHistory.length === 0 ? (
              <p className="text-gray">No vitals recorded</p>
            ) : (
              <div className="vitals-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Blood Pressure</th>
                      <th>Temperature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsHistory.map((vital, idx) => (
                      <tr key={idx}>
                        <td>{vital.date}</td>
                        <td>{vital.bp} mmHg</td>
                        <td>{vital.temp}°F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="records-section">
            <h2><Pill className="icon" /> Current Medications</h2>
            {medications.length === 0 ? (
              <p className="text-gray">No medications</p>
            ) : (
              <div className="medication-list">
                {medications.map((med, idx) => (
                  <div key={idx} className="medication-item">
                    <div>
                      <h4>{med.name}</h4>
                      <p>{med.frequency}</p>
                      <p className="text-small">Prescribed by: {med.prescribed_by}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="records-section">
            <h2><AlertCircle className="icon" /> Allergies</h2>
            {allergies.length === 0 ? (
              <p className="text-gray">No known allergies</p>
            ) : (
              <div className="allergy-list">
                {allergies.map((allergy, idx) => (
                  <span key={idx} className="allergy-badge">{allergy}</span>
                ))}
              </div>
            )}
          </div>

          <div className="records-section">
            <h2><Heart className="icon" /> Conditions</h2>
            {conditions.length === 0 ? (
              <p className="text-gray">No conditions recorded</p>
            ) : (
              <div className="condition-list">
                {conditions.map((condition, idx) => (
                  <div key={idx} className="condition-item">
                    <Heart className="small-icon" />
                    <span>{condition.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderInsurance = () => (
    <div className="portal-content">
      <h1 className="page-title">Insurance Details</h1>
      
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          {insurancePolicies.length === 0 ? (
            <p className="text-gray">No insurance policies on file</p>
          ) : (
            <div className="insurance-list">
              {insurancePolicies.map((policy, idx) => (
                <div key={idx} className="insurance-card">
                  <div className="insurance-header">
                    <div>
                      <h3>{policy.is_primary ? 'Primary' : 'Secondary'} Insurance</h3>
                      <h2>{policy.provider_name}</h2>
                    </div>
                    <Shield className="insurance-icon" />
                  </div>
                  <div className="insurance-body">
                    <div className="insurance-detail">
                      <strong>Member ID:</strong>
                      <span>{policy.member_id}</span>
                    </div>
                    <div className="insurance-detail">
                      <strong>Group ID:</strong>
                      <span>{policy.group_id || 'N/A'}</span>
                    </div>
                    <div className="insurance-detail">
                      <strong>Plan:</strong>
                      <span>{policy.plan_name}</span>
                    </div>
                    <div className="insurance-detail">
                      <strong>Type:</strong>
                      <span>{policy.plan_type}</span>
                    </div>
                    <div className="insurance-detail">
                      <strong>Effective Date:</strong>
                      <span>{policy.effective_date}</span>
                    </div>
                    <div className="insurance-detail">
                      <strong>Status:</strong>
                      <span className="status-active">
                        {policy.expiration_date ? `Expires ${policy.expiration_date}` : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderBilling = () => (
    <div className="portal-content">
      <h1 className="page-title">Billing & Payments</h1>
      
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="billing-summary">
            <div className="balance-card">
              <h3>Outstanding Balance</h3>
              <h1 className="balance-amount">${billingBalance.toFixed(2)}</h1>
              <button className="btn btn-primary btn-large">
                <CreditCard className="icon" /> Make Payment
              </button>
            </div>
          </div>

          <div className="billing-section">
            <h2>Billing Statements</h2>
            {billingStatements.length === 0 ? (
              <p className="text-gray">No billing statements</p>
            ) : (
              <div className="statements-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service</th>
                      <th>Amount</th>
                      <th>Balance</th>
                      <th>Status</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>)