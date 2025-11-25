// PatientPortal.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, CreditCard, Activity, Clock, MapPin, Phone, Mail,
  Heart, Pill, AlertCircle, ChevronRight, Plus, X, Check, Shield, Stethoscope,
  LogOut, Home, Info
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

  const { user, logout: ctxLogout } = useAuth();

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
  const [referrals, setReferrals] = useState({ active: [], used: [] });
  const [doctors, setDoctors] = useState([]);
  const [offices, setOffices] = useState([]);
  const [doctorsLoadError, setDoctorsLoadError] = useState(null);
  const [officesLoadError, setOfficesLoadError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [doctorOfficesForDate, setDoctorOfficesForDate] = useState([]);
  const [loadingDoctorOffices, setLoadingDoctorOffices] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [billingBalance, setBillingBalance] = useState(0);
  const [billingStatements, setBillingStatements] = useState([]);
  
  // PCP Selection Modal States
  const [showPcpModal, setShowPcpModal] = useState(false);
  const [pcpFormData, setPcpFormData] = useState({ primary_doctor: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Load page data on tab switch
  useEffect(() => {
    (async () => {
      try {
        switch (currentPage) {
          case 'dashboard': 
            await loadDashboard(); 
            await loadReferrals();
            // Load profile data to get display name
            await loadProfile();
            break;
          case 'profile': 
            await loadProfile(); 
            // Load doctors for PCP selection dropdown
            const d = await api.appointments.getDoctors();
            if (d.success) setDoctors(d.data ?? []);
            break;
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

  async function loadReferrals() {
    console.log('Loading referrals data...');
    try {
      const r = await api.referrals.getReferrals();
      console.log('Referrals API response:', r);
      if (r.success) {
        setReferrals(r.data);
      } else {
        console.error('Referrals API failed:', r);
        setReferrals({ active: [], used: [] });
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
      setReferrals({ active: [], used: [] });
    }
  }

  async function loadAvailableTimeSlots(doctorId, date) {
    if (!doctorId || !date) {
      setAvailableTimeSlots([]);
      return;
    }

    setLoadingTimeSlots(true);
    try {
      const response = await api.appointments.getAvailableTimeSlots(doctorId, date);
      if (response.success) {
        setAvailableTimeSlots(response.data.available_slots || []);
        // Clear selected time if it's no longer available
        if (selectedTime && !response.data.available_slots.includes(selectedTime)) {
          setSelectedTime('');
        }
      } else {
        setAvailableTimeSlots([]);
        console.error('Failed to load time slots:', response.message);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }

  async function loadDoctorOfficesForDate(doctorId, date) {
    if (!doctorId || !date) {
      setDoctorOfficesForDate([]);
      return;
    }

    setLoadingDoctorOffices(true);
    try {
      const response = await api.appointments.getDoctorOfficesForDate(doctorId, date);
      if (response.success) {
        setDoctorOfficesForDate(response.data.offices || []);
        // Auto-select the office if there's only one
        if (response.data.offices && response.data.offices.length === 1) {
          setSelectedLocation(response.data.offices[0].office_id);
        } else {
          setSelectedLocation(null);
        }
      } else {
        setDoctorOfficesForDate([]);
        setSelectedLocation(null);
        console.error('Failed to load doctor offices:', response.message);
      }
    } catch (error) {
      console.error('Error loading doctor offices:', error);
      setDoctorOfficesForDate([]);
      setSelectedLocation(null);
    } finally {
      setLoadingDoctorOffices(false);
    }
  }



  async function loadProfile() {
    console.log('Loading profile data...');
    const r = await api.profile.getProfile();
    console.log('Profile API response:', r);
    if (r.success) {
      setProfile(r.data);
      // populate editable form fields with current profile values
      setFormData(fd => ({
        ...fd,
        first_name: r.data.first_name || '',
        last_name: r.data.last_name || '',
        dob: r.data.dob || '',
        email: r.data.email || '',
        emergency_contact: r.data.emergency_contact || '',
        emergency_contact_first_name: r.data.emergency_contact_first_name || '',
        emergency_contact_last_name: r.data.emergency_contact_last_name || '',
        emergency_contact_relationship: r.data.emergency_contact_relationship || '',
        primary_doctor: r.data.pcp_id || '',
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
    // Also reload profile to get updated blood_type
    await loadProfile();
  }

  async function loadInsurance() {
    const r = await api.insurance.getInsurance();
    if (r.success) setInsurancePolicies(r.data ?? []);
  }

  async function loadBilling() {
    console.log('loadBilling called');
    try {
      const [b, s] = await Promise.all([
        api.billing.getBalance(),
        api.billing.getStatements(),
      ]);
      console.log('Billing balance response:', b);
      console.log('Billing statements response:', s);
      if (b.success) setBillingBalance(b.data?.outstanding_balance ?? 0);
      if (s.success) setBillingStatements(s.data ?? []);
    } catch (error) {
      console.error('Error loading billing:', error);
    }
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
    // Email basic format check
    if (formData.email && formData.email.length > 0) {
      const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRe.test(formData.email)) errors.email = 'Please enter a valid email address';
    }
    // DOB sane range
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
        emergency_contact: formData.emergency_contact,
        emergency_contact_first_name: formData.emergency_contact_first_name,
        emergency_contact_last_name: formData.emergency_contact_last_name,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        primary_doctor: formData.primary_doctor,
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
      emergency_contact: profile?.emergency_contact || '',
      emergency_contact_first_name: profile?.emergency_contact_first_name || '',
      emergency_contact_last_name: profile?.emergency_contact_last_name || '',
      emergency_contact_relationship: profile?.emergency_contact_relationship || '',
      primary_doctor: profile?.pcp_id || '',
      gender: profile?.gender ?? fd.gender,
      genderAtBirth: profile?.assigned_at_birth_gender ?? fd.genderAtBirth,
      ethnicity: profile?.ethnicity ?? fd.ethnicity,
      race: profile?.race ?? fd.race,
    }));
    setProfileErrors({});
    setEditingProfile(false);
  }

  // PCP Selection functions
  async function showPcpSelection() {
    setPcpFormData({ primary_doctor: '' });
    
    // Ensure doctors are loaded before showing modal
    if (doctors.length === 0) {
      setDoctorsLoadError(null);
      try {
        await loadDoctorsAndOffices();
      } catch (e) {
        console.warn('Failed loading doctors for PCP selection', e);
        setToast({ message: 'Failed to load doctors. Please try again.', type: 'error' });
        return;
      }
    }
    
    setShowPcpModal(true);
  }

  function hidePcpSelection() {
    setShowPcpModal(false);
    setPcpFormData({ primary_doctor: '' });
  }

  async function handleSavePcp() {
    if (!pcpFormData.primary_doctor) {
      setToast({ message: 'Please select a Primary Care Physician', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        primary_doctor: pcpFormData.primary_doctor,
      };

      const res = await api.profile.updateProfile(payload);
      if (res.success) {
        // Refresh both profile and dashboard data
        await loadProfile();
        await loadDashboard();
        hidePcpSelection();
        setToast({ message: 'Primary Care Physician updated successfully!', type: 'success' });
      } else {
        console.error('Failed to update PCP:', res);
        setToast({ message: res?.message || 'Failed to update Primary Care Physician. Please try again.', type: 'error' });
      }
    } catch (err) {
      console.error('Error updating PCP:', err);
      setToast({ message: err?.message || 'An error occurred while updating Primary Care Physician. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
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

  // Ensure doctors are loaded when PCP modal opens
  useEffect(() => {
    if (showPcpModal && doctors.length === 0) {
      setDoctorsLoadError(null);
      loadDoctorsAndOffices().catch(e => {
        console.warn('Failed loading doctors for PCP selection', e);
      });
    }
  }, [showPcpModal]);

  // Load available time slots and offices when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableTimeSlots(selectedDoctor.doctor_id, selectedDate);
      loadDoctorOfficesForDate(selectedDoctor.doctor_id, selectedDate);
    } else {
      setAvailableTimeSlots([]);
      setDoctorOfficesForDate([]);
      setSelectedTime('');
      setSelectedLocation(null);
    }
  }, [selectedDoctor, selectedDate]);

  // Fetch doctors and offices
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
    // Determine office from doctor's schedule for selected date
    const officeForAppointment = doctorOfficesForDate.length > 0 ? doctorOfficesForDate[0].office_id : null;
    
    console.log('Submitting booking...', { selectedDoctor, officeForAppointment, selectedDate, selectedTime });
    setBookingLoading(true);
    setBookingError(null);
    
    // Validate all required fields before submitting
    if (!selectedDoctor?.doctor_id) {
      setBookingError('Please select a doctor');
      setBookingLoading(false);
      return;
    }
    if (!officeForAppointment) {
      setBookingError('No office available for the selected doctor on this date');
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
      office_id: officeForAppointment,
      appointment_date: `${selectedDate} ${selectedTime}`,
      reason: appointmentReason.trim(),
    };
    
    try {
      const r = await api.appointments.bookAppointment(appointmentData);
      console.log('Booking API response:', r);
      if (r && r.success) {
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
        setDoctorOfficesForDate([]);
        setBookingLoading(false);
        // Refresh both appointments and referrals data
        loadAppointments();
        loadReferrals();
      } else {
        const msg = r?.message || 'Failed to book appointment';
        setBookingError(msg);
        setBookingLoading(false);
      }
    } catch (err) {
      console.error('Booking error', err);
      
      let errorMessage = 'Failed to book appointment';
      if (err.message) {
        const jsonMatch = err.message.match(/- (\{[\s\S]*\})$/);
        
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[1]);
            errorMessage = errorData.message || errorMessage;
          } catch (parseErr) {
            // If JSON parsing fails, use the original error message
            errorMessage = err.message;
          }
        } else {
          // If no JSON match found, use the original error message
          errorMessage = err.message;
        }
      }
      
      setBookingError(errorMessage);
      setBookingLoading(false);
    }
  }

  async function handleCancelAppointment(id) {
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
        // Refresh both appointments and referrals data
        loadAppointments();
        loadReferrals();
      } else {
        setToast({ message: r?.message || 'Failed to cancel appointment', type: 'error' });
      }
    } catch (err) {
      console.error('Cancel appointment error', err);
      
      let errorMessage = 'Failed to cancel appointment';
      if (err.message) {
        // Try to extract JSON from error message
        const jsonMatch = err.message.match(/- (\{[\s\S]*\})$/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[1]);
            errorMessage = errorData.message || errorMessage;
          } catch (parseErr) {
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

  // --- Logout handler ---
  async function handleLogout() {
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
    // personal fields
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    emergency_contact: '',
    emergency_contact_first_name: '',
    emergency_contact_last_name: '',
    emergency_contact_relationship: '',
    primary_doctor: '',
  });

  // Calculate display name based on patient's first and last name
  const displayName = formData.first_name && formData.last_name 
    ? `${formData.first_name} ${formData.last_name}` 
    : user?.username ?? 'Patient';

  const genderOptions = ['Male', 'Female', 'Non-Binary', 'Prefer to Self-Describe', 'Prefer not to say', 'Other'];
  const genderAtBirthOptions = ['Male', 'Female', 'Intersex', 'Prefer not to say', 'Other'];
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
      {/* MODAL HEADER */}
      <div className="modal-header">
        <h2>
          <Calendar className="icon" />
          Book Appointment
        </h2>
        <button className="modal-close" onClick={() => setShowBookingModal(false)}>
          <X className="icon" />
        </button>
      </div>

      {/* MODAL BODY */}
      <div className="modal-body">
        {/* DOCTOR SELECTION */}
        <div className="form-group">
          <label>Doctor</label>
          <select 
            value={selectedDoctor ? String(selectedDoctor.doctor_id) : ''}
            onChange={(e) => {
              const id = e.target.value;
              const d = doctors.find(x => String(x.doctor_id) === String(id)) || null;
              setSelectedDoctor(d);
            }}
          >
            <option value="">Select doctor</option>
            {doctors.map(d => (
              <option key={d.doctor_id} value={d.doctor_id}>
                {d.name} — {d.specialty_name}
              </option>
            ))}
          </select>
          {doctorsLoadError && (
            <div className="form-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {doctorsLoadError}
            </div>
          )}
        </div>

        {/* DATE & TIME ROW */}
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Time</label>
            <select 
              value={selectedTime} 
              onChange={(e) => setSelectedTime(e.target.value)} 
              disabled={!selectedDoctor || !selectedDate || loadingTimeSlots}
            >
              <option value="">
                {loadingTimeSlots ? 'Loading available times...' : 
                 !selectedDoctor ? 'Select a doctor first' :
                 !selectedDate ? 'Select a date first' : 
                 'Select time'}
              </option>
              {availableTimeSlots.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {availableTimeSlots.length === 0 && selectedDoctor && selectedDate && !loadingTimeSlots && (
              <div className="helper-text" style={{ background: '#fff3cd', borderLeft: '3px solid #ffc107' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                No available time slots for this date. Please select a different date.
              </div>
            )}
          </div>
        </div>

        {/* OFFICE LOCATION INFORMATION */}
        {selectedDoctor && selectedDate && (
          <div className="form-group">
            <label>
              <MapPin style={{ width: '1rem', height: '1rem', marginLeft: '-0.25rem' }} />
              Office Location
            </label>
            {loadingDoctorOffices ? (
              <div style={{ 
                padding: '1rem 1.25rem', 
                background: 'var(--fifth-color)', 
                borderRadius: '0.75rem',
                color: 'var(--gray)',
                fontStyle: 'italic',
                border: '2px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="modal-loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  Loading office information...
                </div>
              </div>
            ) : doctorOfficesForDate.length > 0 ? (
              <div style={{ 
                padding: '1.25rem 1.5rem', 
                background: 'linear-gradient(135deg, var(--fifth-color), white)',
                borderRadius: '0.75rem',
                border: '2px solid var(--forth-color)',
                boxShadow: '0 2px 4px rgba(0, 119, 182, 0.08)'
              }}>
                {doctorOfficesForDate.map((office, index) => (
                  <div key={office.office_id}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <MapPin style={{ 
                        width: '1.25rem', 
                        height: '1.25rem', 
                        color: 'var(--secondary-color)',
                        flexShrink: 0,
                        marginTop: '0.125rem'
                      }} />
                      <div>
                        <div style={{ 
                          fontWeight: '700', 
                          color: 'var(--primary-color)',
                          fontSize: '1rem',
                          marginBottom: '0.375rem'
                        }}>
                          {office.office_name}
                        </div>
                        <div style={{ 
                          color: 'var(--dark)', 
                          lineHeight: '1.6',
                          fontSize: '0.95rem'
                        }}>
                          {office.full_address}
                        </div>
                        {office.phone && (
                          <div style={{ 
                            color: 'var(--gray)', 
                            marginTop: '0.25rem',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            {office.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {doctorOfficesForDate.length > 1 && index < doctorOfficesForDate.length - 1 && (
                      <hr style={{ 
                        margin: '1rem 0', 
                        border: 'none', 
                        borderTop: '2px solid var(--forth-color)' 
                      }} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="form-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Doctor is not scheduled to work on this date. Please select a different date.
              </div>
            )}
          </div>
        )}

        {/* REASON FOR VISIT */}
        <div className="form-group">
          <label>Reason for Visit</label>
          <textarea 
            rows={4} 
            value={appointmentReason} 
            onChange={(e) => setAppointmentReason(e.target.value)}
            placeholder="Please describe your reason for this appointment..."
          />
          <div className="helper-text">
            <Info style={{ width: '1rem', height: '1rem' }} />
            Provide details about symptoms or concerns you'd like to discuss with your doctor.
          </div>
        </div>

        {/* BOOKING ERROR */}
        {bookingError && (
          <div className="form-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {bookingError}
          </div>
        )}
      </div>

      {/* MODAL FOOTER */}
      <div className="modal-footer">
        <button 
          className="btn btn-secondary" 
          onClick={() => { 
            setShowBookingModal(false); 
            setBookingStep(1); 
          }} 
          disabled={bookingLoading}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleBookingSubmit} 
          disabled={bookingLoading || !selectedDoctor || !selectedDate || !selectedTime || doctorOfficesForDate.length === 0}
        >
          {bookingLoading ? (
            <>
              <div className="modal-loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
              Booking...
            </>
          ) : (
            <>
              <Calendar style={{ width: '1.125rem', height: '1.125rem' }} />
              Book Appointment
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

  // --- PCP Selection Modal Renderer ---
  const renderPcpModal = () => (
    <div className="modal-overlay" onClick={hidePcpSelection}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Choose Your Primary Care Physician</h3>
          <button className="btn" onClick={hidePcpSelection}><X /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Select Primary Care Physician</label>
            {doctorsLoadError ? (
              <div className="error-message" style={{ padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '0.5rem', color: '#c33', marginBottom: '1rem' }}>
                <p>{doctorsLoadError}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => loadDoctorsAndOffices().catch(console.warn)}>
                  Try Again
                </button>
              </div>
            ) : doctors.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                Loading available doctors...
              </div>
            ) : (
              <select 
                className="form-input" 
                value={pcpFormData.primary_doctor} 
                onChange={(e) => setPcpFormData({ ...pcpFormData, primary_doctor: e.target.value })}
              >
                <option value="">Select a Primary Care Physician</option>
                {doctors.filter((doctor) => 
                  ['Internal Medicine', 'General Practice', 'Pediatrics', 'Family Medicine'].includes(doctor.specialty_name)
                ).map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name} - {doctor.specialty_name} ({doctor.office_name})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={hidePcpSelection} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSavePcp} disabled={loading || !pcpFormData.primary_doctor}>
            {loading ? 'Saving...' : 'Save PCP'}
          </button>
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
    profile,
    upcomingAppointments,
    appointmentHistory,
    pcp,
    recentActivity,
    referrals,
    doctors,
    offices,
    vitalsHistory,
    medications,
    allergies,
    conditions,
    insurancePolicies,
    onInsuranceUpdate: loadInsurance,
    billingBalance,
    billingStatements,
    timeSlots,
    setToast,
    setShowBookingModal,
    setBookingStep,
    handleBookingNext,
    handleBookingBack,
    handleBookingSubmit,
    handleCancelAppointment,
    selectedDoctor,
    setSelectedDoctor,
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
    processPayment: api.billing.makePayment,
    showPcpSelection,
    hidePcpSelection,
    handleSavePcp,
  };

  return (
    <div className="patient-portal-root">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="portal-main">
        {currentPage === 'dashboard' && <Dashboard {...portalProps} />}
        {currentPage === 'profile' && <Profile {...portalProps} />}
        {currentPage === 'appointments' && <Appointments {...portalProps} />}
        {currentPage === 'records' && <MedicalRecords {...portalProps} onRefresh={loadMedicalRecords} />}
        {currentPage === 'insurance' && <Insurance {...portalProps} />}
        {currentPage === 'billing' && <Billing {...portalProps} />}
      </main>

      {showBookingModal && renderBookingModal()}
      {showPcpModal && renderPcpModal()}
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