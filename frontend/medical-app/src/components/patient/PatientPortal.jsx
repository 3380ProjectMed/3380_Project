// PatientPortal.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, CreditCard, Activity, Clock, MapPin, Phone, Mail,
  Heart, Pill, AlertCircle, ChevronRight, Plus, X, Check, Shield, Stethoscope,
  LogOut, Home
} from 'lucide-react';
import './PatientPortal.css';
import Profile from './Profile.jsx';
import api from '../../patientapi.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
import Toast from '../common/Toast.jsx';

export default function PatientPortal({ onLogout }) {
  const navigate = useNavigate();

  // --- Auth/user comes from context (don't rely on a prop) ---
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
  const [doctorsLoadError, setDoctorsLoadError] = useState(null);
  const [officesLoadError, setOfficesLoadError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [billingBalance, setBillingBalance] = useState(0);
  const [billingStatements, setBillingStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [profileErrors, setProfileErrors] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

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
      // populate editable form fields with current profile values
      setFormData(fd => ({
        ...fd,
        first_name: r.data.First_Name || '',
        last_name: r.data.Last_Name || '',
        dob: r.data.dob || '',
        email: r.data.Email || '',
        // prefer human-readable labels returned by the API
        gender: r.data.Gender_Text ?? r.data.Gender ?? fd.gender,
        genderAtBirth: r.data.AssignedAtBirth_Gender_Text ?? r.data.AssignedAtBirth_Gender ?? fd.genderAtBirth,
        ethnicity: r.data.Ethnicity_Text ?? r.data.Ethnicity ?? fd.ethnicity,
        race: r.data.Race_Text ?? r.data.Race ?? fd.race,
      }));
      setProfileErrors({});
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

  // Save profile changes (personal fields + demographics)
  async function handleSaveProfile() {
    // Client-side validation
    const errors = {};
    // First/Last name required
    if (!formData.first_name || String(formData.first_name).trim().length === 0) {
      errors.first_name = 'First name is required';
    }
    if (!formData.last_name || String(formData.last_name).trim().length === 0) {
      errors.last_name = 'Last name is required';
    }
    // Email basic format check (allow empty -> backend will store NULL)
    if (formData.email && formData.email.length > 0) {
      const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRe.test(formData.email)) errors.email = 'Please enter a valid email address';
    }
    // DOB sane range: not in future, and person age <= 120
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const now = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.dob = 'Date of birth is invalid';
      } else {
        if (dobDate > now) errors.dob = 'Date of birth cannot be in the future';
        else {
          const ageMs = now - dobDate;
          const ageY = ageMs / (1000 * 60 * 60 * 24 * 365.25);
          if (ageY > 120) errors.dob = 'Please enter a valid date of birth';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setToast({ message: 'Please fix form errors before saving.', type: 'error' });
      return;
    }

    // Clear previous errors
    setProfileErrors({});

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        dob: formData.dob,
        // include demographics
        gender: formData.gender,
        genderAtBirth: formData.genderAtBirth,
        ethnicity: formData.ethnicity,
        race: formData.race,
      };
      const res = await api.profile.updateProfile(payload);
      if (res && res.success) {
        setToast({ message: 'Your profile changes have been saved.', type: 'success' });
        // Reload persisted profile and leave edit mode
        await loadProfile();
        setEditingProfile(false);
      } else {
        setToast({ message: res?.message || 'Failed to update profile', type: 'error' });
      }
    } catch (err) {
      console.error('Save profile error', err);
      setToast({ message: err?.message || 'Failed to update profile', type: 'error' });
    }
  }

  function startEditProfile() {
    setEditingProfile(true);
  }

  function cancelEditProfile() {
    // Revert formData to last fetched profile values and exit edit mode
    setFormData(fd => ({
      ...fd,
      first_name: profile?.First_Name || '',
      last_name: profile?.Last_Name || '',
      dob: profile?.dob || '',
      email: profile?.Email || '',
      gender: profile?.Gender ?? fd.gender,
      genderAtBirth: profile?.AssignedAtBirth_Gender ?? fd.genderAtBirth,
      ethnicity: profile?.Ethnicity ?? fd.ethnicity,
      race: profile?.Race ?? fd.race,
    }));
    setProfileErrors({});
    setEditingProfile(false);
  }

  // --- Booking helpers ---
  const timeSlots = ['9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM'];
  const handleBookingNext = () => setBookingStep(s => Math.min(4, s + 1));
  const handleBookingBack = () => setBookingStep(s => Math.max(1, s - 1));

  // Ensure doctors/offices are loaded when booking modal opens
  useEffect(() => {
    if (showBookingModal && (doctors.length === 0 || offices.length === 0)) {
      setDoctorsLoadError(null);
      setOfficesLoadError(null);
      setBookingError(null);
      loadDoctorsAndOffices().catch(e => {
        console.warn('Failed loading doctors/offices', e);
      });
    }
  }, [showBookingModal]);

  // Fetch doctors and offices separately with UI-friendly errors
  async function loadDoctorsAndOffices() {
    try {
      const d = await api.appointments.getDoctors();
      if (d && d.success) {
        setDoctors(d.data ?? []);
      } else {
        setDoctors([]);
        setDoctorsLoadError(d?.message || 'Failed to load doctors');
      }
    } catch (err) {
      console.error('Doctors fetch error', err);
      setDoctors([]);
      setDoctorsLoadError(err.message || 'Failed to load doctors');
    }

    try {
      const o = await api.appointments.getOffices();
      if (o && o.success) {
        setOffices(o.data ?? []);
      } else {
        setOffices([]);
        setOfficesLoadError(o?.message || 'Failed to load offices');
      }
    } catch (err) {
      console.error('Offices fetch error', err);
      setOffices([]);
      setOfficesLoadError(err.message || 'Failed to load offices');
    }
  }

  async function handleBookingSubmit() {
    setBookingLoading(true);
    setBookingError(null);
    const appointmentData = {
      doctor_id: selectedDoctor?.Doctor_id,
      office_id: selectedLocation,
      appointment_date: `${selectedDate} ${selectedTime}`,
      reason: appointmentReason,
    };
    try {
      const r = await api.appointments.bookAppointment(appointmentData);
      if (r && r.success) {
        // Show success toast instead of alert
        setToast({ message: 'Appointment booked successfully!', type: 'success' });
        setShowBookingModal(false);
        setBookingStep(1);
        setSelectedDoctor(null);
        setSelectedLocation(null);
        setSelectedDate(''); setSelectedTime('');
        setAppointmentReason(''); setNeedsReferral(false);
        loadAppointments();
      } else {
        const msg = r?.message || 'Failed to book appointment';
        setBookingError(msg);
      }
    } catch (err) {
      console.error('Booking error', err);
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleCancelAppointment(id) {
    // Show confirmation modal instead of browser confirm
    setAppointmentToCancel(id);
    setShowCancelModal(true);
  }

  async function confirmCancelAppointment() {
    if (!appointmentToCancel) return;
    
    try {
      const r = await api.appointments.cancelAppointment(appointmentToCancel);
      if (r.success) {
        // Show success toast instead of alert
        setToast({ message: 'Appointment cancelled successfully', type: 'success' });
        loadAppointments();
      } else {
        setToast({ message: r?.message || 'Failed to cancel appointment', type: 'error' });
      }
    } catch (err) {
      console.error('Cancel appointment error', err);
      setToast({ message: 'Failed to cancel appointment', type: 'error' });
    } finally {
      setShowCancelModal(false);
      setAppointmentToCancel(null);
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

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    gender: '',
    genderAtBirth: '',
    ethnicity: '',
    race: '',
    // personal fields (populated from profile GET)
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
  });

  const genderOptions = ['Male', 'Female', 'Non-Binary', 'Prefer to Self-Describe', 'Prefer not to say', 'Other'];
  const genderAtBirthOptions = ['Male', 'Female', 'Intersex', 'Prefer not to say', 'Other'];
  // Keep these lists in sync with CodesEthnicity and CodesRace in the DB so
  // frontend labels match server lookup values used by the profile mapper.
  const ethnicityOptions = [
    'Hispanic or Latino',
    'Non-Hispanic or Latino',
    'Not Specified',
    'Other'
  ];
  const raceOptions = [
    'White',
    'Black or African American',
    'American Indian/Alaska Native',
    'Asian',
    'Native Hawaiian/Pacific Islander',
    'Two or More Races',
    'Not Specified',
    'Other'
  ];

  // --- Render functions for inline sections ---
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
          <div className="records-section">
            <h2><Heart className="icon" /> Vitals History</h2>
            {vitalsHistory.length === 0 ? (
              <p className="text-gray">No vitals recorded</p>
            ) : (
              <div className="vitals-list">
                {vitalsHistory.map((vital, idx) => (
                  <div key={idx} className="vital-item">
                    <div className="vital-date">{new Date(vital.Date).toLocaleDateString()}</div>
                    <div className="vital-values">
                      <span>BP: {vital.blood_pressure || 'N/A'}</span>
                      <span>HR: {vital.heart_rate || 'N/A'}</span>
                      <span>Temp: {vital.temperature || 'N/A'}</span>
                      <span>Weight: {vital.weight || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="records-section">
            <h2><Pill className="icon" /> Current Medications</h2>
            {medications.length === 0 ? (
              <p className="text-gray">No medications on file</p>
            ) : (
              <div className="medications-list">
                {medications.map((med, idx) => (
                  <div key={idx} className="medication-item">
                    <h4>{med.medication_name}</h4>
                    <p>{med.dosage} - {med.frequency}</p>
                    <p className="text-small">Prescribed by {med.prescribing_doctor}</p>
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
              <div className="allergies-list">
                {allergies.map((allergy, idx) => (
                  <div key={idx} className="allergy-item">
                    <h4>{allergy.allergen}</h4>
                    <p>{allergy.reaction}</p>
                    <span className={`severity-badge ${allergy.severity?.toLowerCase()}`}>
                      {allergy.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="records-section">
            <h2><FileText className="icon" /> Conditions</h2>
            {conditions.length === 0 ? (
              <p className="text-gray">No conditions on file</p>
            ) : (
              <div className="conditions-list">
                {conditions.map((condition, idx) => (
                  <div key={idx} className="condition-item">
                    <h4>{condition.condition_name}</h4>
                    <p>Diagnosed: {new Date(condition.diagnosis_date).toLocaleDateString()}</p>
                    <p className="text-small">Status: {condition.status}</p>
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
                <p><strong>Policy Number:</strong> {policy.policy_number}</p>
                <p><strong>Group Number:</strong> {policy.group_number}</p>
                <p><strong>Member ID:</strong> {policy.member_id}</p>
                <p><strong>Effective Date:</strong> {new Date(policy.effective_date).toLocaleDateString()}</p>
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

          <div className="billing-statements">
            <h2>Recent Statements</h2>
            {billingStatements.length === 0 ? (
              <p className="text-gray">No billing statements available</p>
            ) : (
              <div className="statements-list">
                {billingStatements.map((statement, idx) => (
                  <div key={idx} className="statement-item">
                    <div>
                      <h4>Statement #{statement.statement_id}</h4>
                      <p>{new Date(statement.statement_date).toLocaleDateString()}</p>
                    </div>
                    <div className="statement-amount">
                      ${statement.amount_due.toFixed(2)}
                    </div>
                    <button className="btn btn-link">View Details</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // --- Booking modal renderer ---
  const renderBookingModal = () => (
    <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Book Appointment</h3>
          <button className="btn" onClick={() => setShowBookingModal(false)}><X /></button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Doctor</label>
            <select className="form-input" value={selectedDoctor ? String(selectedDoctor.Doctor_id) : ''}
            onChange={(e) => {
              const id = e.target.value;
              // Doctor_id from backend may be a string; compare loosely or coerce
              const d = doctors.find(x => String(x.Doctor_id) === String(id)) || null;
              setSelectedDoctor(d);
            }}>
            <option value="">Select doctor</option>
            {doctors.map(d => (
              <option key={d.Doctor_id} value={d.Doctor_id}>{d.name} — {d.specialty_name}</option>
            ))}
          </select>
          {doctorsLoadError && <div className="form-error">{doctorsLoadError}</div>}

          <label style={{ marginTop: 8 }}>Office</label>
            <select className="form-input" value={selectedLocation || ''} onChange={(e) => setSelectedLocation(Number(e.target.value))}>
            <option value="">Select office</option>
            {offices.map(o => (
              <option key={o.Office_ID} value={o.Office_ID}>{o.Name} — {o.address}</option>
            ))}
          </select>
          {officesLoadError && <div className="form-error">{officesLoadError}</div>}

          <label style={{ marginTop: 8 }}>Date</label>
          <input className="form-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

          <label style={{ marginTop: 8 }}>Time</label>
          <select className="form-input" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
            <option value="">Select time</option>
            {timeSlots.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>

          <label style={{ marginTop: 8 }}>Reason</label>
          <textarea className="form-input" rows={3} value={appointmentReason} onChange={(e) => setAppointmentReason(e.target.value)} />

          {bookingError && <div className="form-error" style={{ marginTop: 8 }}>{bookingError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn" onClick={() => { setShowBookingModal(false); setBookingStep(1); }} disabled={bookingLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBookingSubmit} disabled={bookingLoading || !selectedDoctor || !selectedLocation || !selectedDate || !selectedTime}>
              {bookingLoading ? 'Booking…' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Cancel confirmation modal renderer ---
  const renderCancelModal = () => (
    <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Cancel Appointment</h3>
          <button className="btn" onClick={() => setShowCancelModal(false)}><X /></button>
        </div>

        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <p>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setShowCancelModal(false)}>
            No, Keep It
          </button>
          <button className="btn btn-danger" onClick={confirmCancelAppointment}>
            Yes, Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );

  // --- Main render ---
  const portalProps = {
    displayName,
    loading,
    upcomingAppointments,
    appointmentHistory,
    pcp,
    recentActivity,
    doctors,
    offices,
    vitalsHistory,
    medications,
    allergies,
    conditions,
    insurancePolicies,
    billingBalance,
    billingStatements,
    timeSlots,
    setShowBookingModal,
    setBookingStep,
    handleBookingNext,
    handleBookingBack,
    handleBookingSubmit,
    handleCancelAppointment,
    profile,
    formData,
    setFormData,
    profileErrors,
    setProfileErrors,
    editingProfile,
    startEditProfile,
    cancelEditProfile,
    genderOptions,
    genderAtBirthOptions,
    ethnicityOptions,
    raceOptions,
    saveProfile: handleSaveProfile,
    processPayment: api.billing.processPayment,
  };

  return (
    <div className="patient-portal-root">
      {/* Header */}
      <header className="patient-portal-header">
        <div className="patient-portal-container">
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
        {currentPage === 'profile' && <Profile {...portalProps} />}
        {currentPage === 'appointments' && renderAppointments()}
        {currentPage === 'records' && renderMedicalRecords()}
        {currentPage === 'insurance' && renderInsurance()}
        {currentPage === 'billing' && renderBilling()}
      </main>

      {showBookingModal && renderBookingModal()}
      {showCancelModal && renderCancelModal()}

      {/* Global toast (patient portal) */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}

      <footer className="footer">
        <div className="landing-container">
          © {new Date().getFullYear()} MedConnect • Modern Healthcare Management
        </div>
      </footer>
    </div>
  );
}