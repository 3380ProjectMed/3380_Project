// PatientPortal.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, CreditCard, Activity, Clock, MapPin, Phone, Mail,
  Heart, Pill, AlertCircle, ChevronRight, Plus, X, Check, Shield, Stethoscope,
  LogOut, Home
} from 'lucide-react';
import './PatientPortal.css';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';

// If you use an api client, import it. For now this avoids ReferenceErrors.
// import api from '../../lib/api';

export default function PatientPortal({ onLogout }) {
  const navigate = useNavigate();

  // --- Auth/user comes from context (don’t rely on a prop) ---
  const { user, logout: ctxLogout } = useAuth();
  const displayName = user?.username ?? 'Patient';

  // --- UI state ---
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [needsReferral, setNeedsReferral] = useState(false);

  // --- Data state ---
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
  const [loading, setLoading] = useState(false);

  // TODO: wire to your real API client; placeholders below avoid runtime errors.
  const api = {
    dashboard: { getDashboard: async () => ({ success: true, data: { upcoming_appointments: [], pcp: null, recent_activity: [] } }) },
    profile:   { getProfile: async () => ({ success: true, data: null }) },
    appointments: {
      getUpcoming: async () => ({ success: true, data: [] }),
      getHistory: async () => ({ success: true, data: [] }),
      getDoctors: async () => ({ success: true, data: [] }),
      getOffices: async () => ({ success: true, data: [] }),
      bookAppointment: async () => ({ success: true }),
      cancelAppointment: async () => ({ success: true }),
    },
    medicalRecords: {
      getVitals: async () => ({ success: true, data: [] }),
      getMedications: async () => ({ success: true, data: [] }),
      getAllergies: async () => ({ success: true, data: [] }),
      getConditions: async () => ({ success: true, data: [] }),
    },
    insurance: { getInsurance: async () => ({ success: true, data: [] }) },
    billing:   { getBalance: async () => ({ success: true, data: { outstanding_balance: 0 } }),
                 getStatements: async () => ({ success: true, data: [] }) },
  };

  // Load page data on tab switch
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        switch (currentPage) {
          case 'dashboard': await loadDashboard(); break;
          case 'profile': await loadProfile(); break;
          case 'appointments': await loadAppointments(); break;
          case 'records': await loadMedicalRecords(); break;
          case 'insurance': await loadInsurance(); break;
          case 'billing': await loadBilling(); break;
        }
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPage]);

  // --- Data fetchers ---
  async function loadDashboard() {
    const r = await api.dashboard.getDashboard();
    if (r.success) {
      setUpcomingAppointments(r.data.upcoming_appointments ?? []);
      setPcp(r.data.pcp ?? null);
      setRecentActivity(r.data.recent_activity ?? []);
    }
  }
  async function loadProfile() {
    const r = await api.profile.getProfile();
    if (r.success) {
      setProfile(r.data);
      setPcp(r.data);
    }
  }
  async function loadAppointments() {
    const [u, h, d, o] = await Promise.all([
      api.appointments.getUpcoming(),
      api.appointments.getHistory(),
      api.appointments.getDoctors(),
      api.appointments.getOffices(),
    ]);
    if (u.success) setUpcomingAppointments(u.data ?? []);
    if (h.success) setAppointmentHistory(h.data ?? []);
    if (d.success) setDoctors(d.data ?? []);
    if (o.success) setOffices(o.data ?? []);
  }
  async function loadMedicalRecords() {
    const [v, m, a, c] = await Promise.all([
      api.medicalRecords.getVitals(),
      api.medicalRecords.getMedications(),
      api.medicalRecords.getAllergies(),
      api.medicalRecords.getConditions(),
    ]);
    if (v.success) setVitalsHistory(v.data ?? []);
    if (m.success) setMedications(m.data ?? []);
    if (a.success) setAllergies(a.data ?? []);
    if (c.success) setConditions(c.data ?? []);
  }
  async function loadInsurance() {
    const r = await api.insurance.getInsurance();
    if (r.success) setInsurancePolicies(r.data ?? []);
  }
  async function loadBilling() {
    const [b, s] = await Promise.all([
      api.billing.getBalance(),
      api.billing.getStatements(),
    ]);
    if (b.success) setBillingBalance(b.data?.outstanding_balance ?? 0);
    if (s.success) setBillingStatements(s.data ?? []);
  }

  // --- Booking helpers ---
  const timeSlots = ['9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM'];
  const handleBookingNext = () => setBookingStep(s => Math.min(4, s + 1));
  const handleBookingBack = () => setBookingStep(s => Math.max(1, s - 1));

  async function handleBookingSubmit() {
    const appointmentData = {
      doctor_id: selectedDoctor?.Doctor_id,
      office_id: selectedLocation,
      appointment_date: `${selectedDate} ${selectedTime}`,
      reason: appointmentReason,
      needs_referral: needsReferral,
    };
    const r = await api.appointments.bookAppointment(appointmentData);
    if (r.success) {
      alert('Appointment booked successfully!');
      setShowBookingModal(false);
      setBookingStep(1);
      setSelectedDoctor(null);
      setSelectedLocation(null);
      setSelectedDate(''); setSelectedTime('');
      setAppointmentReason(''); setNeedsReferral(false);
      loadAppointments();
    }
  }

  async function handleCancelAppointment(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    const r = await api.appointments.cancelAppointment(id);
    if (r.success) {
      alert('Appointment cancelled');
      loadAppointments();
    }
  }

  // --- Logout handler (uses context if no prop provided) ---
  async function handleLogout() {
    const ok = window.confirm('Are you sure you want to log out?');
    if (!ok) return;
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await ctxLogout(); // calls /api/logout and clears context user
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      navigate('/', { replace: true }); // always back to Landing
    }
  }

  // --- Render helpers (defined BEFORE return so they’re in scope) ---
  const renderDashboard = () => (
    <div className="portal-content">
      <h1 className="page-title">Welcome Back, {displayName}</h1>
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
                    <span className={`status-badge ${apt.status?.toLowerCase?.() ?? 'scheduled'}`}>
                      {apt.status ?? 'Scheduled'}
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
                  <div className="pcp-avatar"><Stethoscope /></div>
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
                        <p className="text-small">
                          {activity.doctor_name} — {new Date(activity.Date).toLocaleDateString()}
                        </p>
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

  const [profile, setProfile] = useState(null);
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
              <input type="text" className="form-input"
                value={profile ? `${profile.First_Name} ${profile.Last_Name}` : ''} readOnly />
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
                <div className="pcp-avatar large"><Stethoscope /></div>
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
                      <span className={`status-badge ${apt.status?.toLowerCase?.() ?? 'scheduled'}`}>
                        {apt.status ?? 'Scheduled'}
                      </span>
                    </div>
                    <div className="appointment-body">
                      <p><Calendar className="small-icon" /> {new Date(apt.Appointment_date).toLocaleDateString()}</p>
                      <p><Clock className="small-icon" /> {new Date(apt.Appointment_date).toLocaleTimeString()}</p>
                      <p><MapPin className="small-icon" /> {apt.office_name}</p>
                    </div>
                    <div className="appointment-footer">
                      <button className="btn btn-danger btn-small"
                        onClick={() => handleCancelAppointment(apt.Appointment_id)}>
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
                      <p>{new Date(apt.Date).toLocaleDateString()} — {apt.Reason_for_Visit}</p>
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
          {/* vitals, meds, allergies, conditions sections (unchanged) */}
          {/* ... keep your existing sections here ... */}
        </div>
      )}
    </div>
  );

  const renderInsurance = () => (
    <div className="portal-content">
      <h1 className="page-title">Insurance Details</h1>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : insurancePolicies.length === 0 ? (
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
                {/* details unchanged */}
              </div>
            </div>
          ))}
        </div>
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
          {/* statements table unchanged */}
        </>
      )}
    </div>
  );

  // --- Booking modal renderer (unchanged) ---
  const renderBookingModal = () => (
    <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* header + steps + step bodies + footer (your existing code) */}
        {/* Keep your existing implementation here */}
      </div>
    </div>
  );

  // --- Main render ---
  return (
    <div className="landing-root">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="logo">
            <div className="logo-icon"><Stethoscope className="icon" /></div>
            <span>MedConnect</span>
          </div>

          <nav className="portal-nav">
            <button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>
              <Home className="nav-icon" /> Dashboard
            </button>
            <button className={currentPage === 'profile' ? 'active' : ''} onClick={() => setCurrentPage('profile')}>
              <User className="nav-icon" /> Profile
            </button>
            <button className={currentPage === 'appointments' ? 'active' : ''} onClick={() => setCurrentPage('appointments')}>
              <Calendar className="nav-icon" /> Appointments
            </button>
            <button className={currentPage === 'records' ? 'active' : ''} onClick={() => setCurrentPage('records')}>
              <FileText className="nav-icon" /> Medical Records
            </button>
            <button className={currentPage === 'insurance' ? 'active' : ''} onClick={() => setCurrentPage('insurance')}>
              <Shield className="nav-icon" /> Insurance
            </button>
            <button className={currentPage === 'billing' ? 'active' : ''} onClick={() => setCurrentPage('billing')}>
              <CreditCard className="nav-icon" /> Billing
            </button>
          </nav>

          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleLogout}>
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

      {showBookingModal && renderBookingModal()}

      <footer className="footer">
        <div className="landing-container">
          © {new Date().getFullYear()} MedConnect • Modern Healthcare Management
        </div>
      </footer>
    </div>
  );
}
