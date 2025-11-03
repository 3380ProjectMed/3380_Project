// PatientPortal.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, CreditCard, Activity, Clock, MapPin, Phone, Mail,
  Heart, Pill, AlertCircle, ChevronRight, Plus, X, Check, Shield, Stethoscope,
  LogOut, Home
} from 'lucide-react';
import './PatientPortal.css';
import Sidebar from './Sidebar.jsx';
import Dashboard from './Dashboard.jsx';
import Appointments from './Appointments.jsx';
import MedicalRecords from './MedicalRecords.jsx';
import Insurance from './Insurance.jsx';
import Billing from './Billing.jsx';
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
      }
    })();
  }, [currentPage]);

  // --- Data fetchers ---
  async function loadDashboard() {
    console.log('Loading dashboard data...');
    const r = await api.dashboard.getDashboard();
    console.log('Dashboard API response:', r);
    if (r.success) {
      setUpcomingAppointments(r.data.upcoming_appointments ?? []);
      setPcp(r.data.pcp ?? null);
      setRecentActivity(r.data.recent_activity ?? []);
    } else {
      console.error('Dashboard API failed:', r);
    }
  }

  async function loadProfile() {
    console.log('Loading profile data...');
    const r = await api.profile.getProfile();
    console.log('Profile API response:', r);
    if (r.success) {
      setProfile(r.data);
      setPcp(r.data);
      // populate editable form fields with current profile values
      setFormData(fd => ({
        ...fd,
        first_name: r.data.first_name || '',
        last_name: r.data.last_name || '',
        dob: r.data.dob || '',
        email: r.data.email || '',
        // prefer human-readable labels returned by the API
        gender: r.data.Gender_Text ?? r.data.gender ?? fd.gender,
        genderAtBirth: r.data.AssignedAtBirth_Gender_Text ?? r.data.assigned_at_birth_gender ?? fd.genderAtBirth,
        ethnicity: r.data.Ethnicity_Text ?? r.data.ethnicity ?? fd.ethnicity,
        race: r.data.Race_Text ?? r.data.race ?? fd.race,
      }));
      setProfileErrors({});
    } else {
      console.error('Profile API failed:', r);
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
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      dob: profile?.dob || '',
      email: profile?.email || '',
      gender: profile?.gender ?? fd.gender,
      genderAtBirth: profile?.assigned_at_birth_gender ?? fd.genderAtBirth,
      ethnicity: profile?.ethnicity ?? fd.ethnicity,
      race: profile?.race ?? fd.race,
    }));
    setProfileErrors({});
    setEditingProfile(false);
  }

  // --- Booking helpers ---
  const timeSlots = ['9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM'];
  
  const handleBookingNext = () => {
    // Validate each step before proceeding
    if (bookingStep === 1 && !selectedDoctor) {
      setBookingError('Please select a doctor before proceeding');
      return;
    }
    if (bookingStep === 2 && !selectedLocation) {
      setBookingError('Please select an office location before proceeding');
      return;
    }
    if (bookingStep === 3 && (!selectedDate || !selectedTime)) {
      setBookingError('Please select both date and time before proceeding');
      return;
    }
    
    setBookingError(null); // Clear any previous errors
    setBookingStep(s => Math.min(4, s + 1));
  };
  
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
    console.log('Submitting booking...', { selectedDoctor, selectedLocation, selectedDate, selectedTime });
    setBookingLoading(true);
    setBookingError(null);
    
    // Validate all required fields before submitting
    if (!selectedDoctor?.doctor_id) {
      setBookingError('Please select a doctor');
      setBookingLoading(false);
      return;
    }
    if (!selectedLocation) {
      setBookingError('Please select an office location');
      setBookingLoading(false);
      return;
    }
    if (!selectedDate) {
      setBookingError('Please select a date');
      setBookingLoading(false);
      return;
    }
    if (!selectedTime) {
      setBookingError('Please select a time');
      setBookingLoading(false);
      return;
    }
    if (!appointmentReason?.trim()) {
      setBookingError('Please provide a reason for the appointment');
      setBookingLoading(false);
      return;
    }
    
    const appointmentData = {
      doctor_id: selectedDoctor.doctor_id,
      office_id: selectedLocation,
      appointment_date: `${selectedDate} ${selectedTime}`,
      reason: appointmentReason.trim(),
    };
    
    console.log('Appointment data being sent:', appointmentData);
    try {
      const r = await api.appointments.bookAppointment(appointmentData);
      console.log('Booking API response:', r);
      if (r && r.success) {
        // Show success toast instead of alert
        setToast({ message: 'Appointment booked successfully!', type: 'success' });
        // Force close modal and reset state
        setShowBookingModal(false);
        setBookingStep(1);
        setSelectedDoctor(null);
        setSelectedLocation(null);
        setSelectedDate(''); 
        setSelectedTime('');
        setAppointmentReason(''); 
        setNeedsReferral(false);
        setBookingLoading(false);
        loadAppointments();
      } else {
        const msg = r?.message || 'Failed to book appointment';
        setBookingError(msg);
        setBookingLoading(false);
      }
    } catch (err) {
      console.error('Booking error', err);
      
      // Extract user-friendly message from API error response
      let errorMessage = 'Failed to book appointment';
      if (err.message) {
        // Try to extract JSON from error message (format: "HTTP 400 Bad Request - {json}")
        const jsonMatch = err.message.match(/- ({.*})$/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[1]);
            errorMessage = errorData.message || errorMessage;
          } catch (parseErr) {
            // If JSON parsing fails, use the original error message
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }
      
      setBookingError(errorMessage);
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
      
      // Extract user-friendly message from API error response
      let errorMessage = 'Failed to cancel appointment';
      if (err.message) {
        // Try to extract JSON from error message (format: "HTTP 400 Bad Request - {json}")
        const jsonMatch = err.message.match(/- ({.*})$/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[1]);
            errorMessage = errorData.message || errorMessage;
          } catch (parseErr) {
            // If JSON parsing fails, use the original error message
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }
      
      setToast({ message: errorMessage, type: 'error' });
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
            <select className="form-input" value={selectedDoctor ? String(selectedDoctor.doctor_id) : ''}
            onChange={(e) => {
              const id = e.target.value;
              // doctor_id from backend may be a string; compare loosely or coerce
              const d = doctors.find(x => String(x.doctor_id) === String(id)) || null;
              setSelectedDoctor(d);
            }}>
            <option value="">Select doctor</option>
            {doctors.map(d => (
              <option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialty_name}</option>
            ))}
          </select>
          {doctorsLoadError && <div className="form-error">{doctorsLoadError}</div>}

          <label style={{ marginTop: 8 }}>Office</label>
            <select className="form-input" value={selectedLocation || ''} onChange={(e) => setSelectedLocation(Number(e.target.value))}>
            <option value="">Select office</option>
            {offices.map(o => (
              <option key={o.office_id} value={o.office_id}>{o.name} — {o.full_address}</option>
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
      {/* Sidebar (fixed on the left) */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="portal-main">
        {currentPage === 'dashboard' && <Dashboard {...portalProps} />}
        {currentPage === 'profile' && <Profile {...portalProps} />}
        {currentPage === 'appointments' && <Appointments {...portalProps} />}
        {currentPage === 'records' && <MedicalRecords {...portalProps} />}
        {currentPage === 'insurance' && <Insurance {...portalProps} />}
        {currentPage === 'billing' && <Billing {...portalProps} />}
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