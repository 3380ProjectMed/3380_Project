import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Check, AlertCircle, DollarSign, Plus, Phone, ChevronLeft, ChevronRight, Filter, User, Edit, X } from 'lucide-react';
import './ReceptionistDashboard.css';

/**
 * ReceptionistDashboard Component (Backend Integrated)
 * 
 * Main dashboard with monthly calendar and today's appointments
 * Fetches real data from backend APIs including doctors list
 */
function ReceptionistDashboard({ setCurrentPage, onProcessPayment, officeId, officeName }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // State for API data
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [calendarAppointments, setCalendarAppointments] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [receptionistOfficeId, setReceptionistOfficeId] = useState(null);
  const [receptionistOfficeName, setReceptionistOfficeName] = useState('Loading...');
  
  // Nurse selection state
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [loadingNurses, setLoadingNurses] = useState(false);
  
  // Alert/notification state
  const [alertModal, setAlertModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Doctor colors palette for calendar visualization
  const doctorColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ef4444', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#14b8a6'
  ];

  /**
   * Load dashboard data on mount
   */
  useEffect(() => {
    fetchReceptionistOffice();
  }, []);

  useEffect(() => {
    if (receptionistOfficeId) {
      loadDoctors();
      loadDashboardData();
    }
  }, [receptionistOfficeId]);

  /**
   * Automatic No-Show checker - runs every 2 minutes
   */
  useEffect(() => {
    checkForNoShows();
    const noShowInterval = setInterval(() => {
      checkForNoShows();
    }, 120000);
    return () => clearInterval(noShowInterval);
  }, []);

  /**
   * Load calendar when month changes
   */
  useEffect(() => {
    if (receptionistOfficeId) {
      loadCalendarData();
    }
  }, [currentDate, receptionistOfficeId, doctors]);

  /**
   * Check for appointments that should be marked as No-Show
   */
  const checkForNoShows = async () => {
    try {
      const response = await fetch('/receptionist_api/appointments/update-no-shows.php', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.updated_count > 0) {
        console.log(`Status updates: ${data.waiting_count} appointment(s) → Waiting, ${data.no_show_count} appointment(s) → No-Show`);
        loadDashboardData();
        loadCalendarData();
      }
    } catch (err) {
      console.error('Failed to check for no-shows:', err);
    }
  };

  /**
   * Fetch receptionist's office ID from session
   */
  const fetchReceptionistOffice = async () => {
    try {
      const response = await fetch('/receptionist_api/dashboard/today.php', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success && data.office) {
        setReceptionistOfficeId(data.office.id);
        setReceptionistOfficeName(data.office.name);
      } else {
        setError('Failed to fetch office information');
      }
    } catch (err) {
      console.error('Failed to fetch receptionist office:', err);
      setError('Failed to fetch office information');
    }
  };

  /**
   * Fetch doctors from the database
   */
  const loadDoctors = async () => {
    if (!receptionistOfficeId) return;
    
    try {
      const response = await fetch(`/receptionist_api/doctors/get-by-office.php?office_id=${receptionistOfficeId}`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        const doctorsWithColors = (data.doctors || []).map((doc, index) => ({
          doctor_id: doc.Doctor_id,
          first_name: doc.First_Name,
          last_name: doc.Last_Name,
          specialty_name: doc.specialty_name,
          specialty_id: doc.specialty_id,
          color: doctorColors[index % doctorColors.length]
        }));
        setDoctors(doctorsWithColors);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  /**
   * Load dashboard statistics and today's appointments
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/receptionist_api/dashboard/today.php', { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setTodayAppointments(data.appointments || []);
        
        if (data.stats) {
          setStats(data.stats);
        } else {
          const appointments = data.appointments || [];
          const calculatedStats = {
            total: appointments.length,
            scheduled: appointments.filter(a => ['Scheduled', 'Upcoming'].includes(a.status || a.Status)).length,
            checked_in: appointments.filter(a => ['Checked In', 'Completed'].includes(a.status || a.Status)).length,
            completed: appointments.filter(a => (a.status || a.Status) === 'Completed').length,
            payment: {
              total_collected: appointments
                .filter(a => a.copay && (a.status || a.Status) === 'Completed')
                .reduce((sum, a) => sum + (parseFloat(a.copay) || 0), 0)
                .toFixed(2)
            }
          };
          setStats(calculatedStats);
        }
        setError(null);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load calendar appointments for the current month
   */
  const loadCalendarData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await fetch(
        `/receptionist_api/appointments/get-by-month.php?year=${year}&month=${month}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        const groupedAppointments = {};
        (data.appointments || []).forEach(apt => {
          const date = apt.Appointment_date.split(' ')[0];
          if (!groupedAppointments[date]) {
            groupedAppointments[date] = [];
          }
          groupedAppointments[date].push(apt);
        });
        setCalendarAppointments(groupedAppointments);
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
    }
  };

  /**
   * Handle check-in appointment - Step 1: Validate insurance first
   */
  const handleCheckInAppointment = async () => {
    if (!selectedAppointment) return;
    
    setCheckingIn(true);
    
    try {
      const response = await fetch('/receptionist_api/appointments/check-in.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          Appointment_id: selectedAppointment.Appointment_id,
          nurse_id: 0,
          validate_only: true
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        if (data.error_type === 'INSURANCE_WARNING' || data.error_type === 'INSURANCE_EXPIRED') {
          setAlertModal({
            show: true,
            type: 'error',
            title: 'Cannot Check In - Insurance Issue',
            message: data.message || data.error
          });
        } else {
          setAlertModal({
            show: true,
            type: 'error',
            title: 'Check-In Failed',
            message: data.error || 'Unknown error occurred'
          });
        }
        setCheckingIn(false);
        return;
      }
      
      if (data.insurance_warning) {
        setAlertModal({
          show: true,
          type: 'warning',
          title: 'Insurance Warning',
          message: data.insurance_warning
        });
      }
      
      setCheckingIn(false);
      setLoadingNurses(true);
      setShowNurseModal(true);
      
      const nursesResponse = await fetch(`/receptionist_api/nurses/get-by-office.php?office_id=${receptionistOfficeId}`, {
        credentials: 'include'
      });
      
      const nursesData = await nursesResponse.json();
      
      if (nursesData.success && nursesData.nurses) {
        setNurses(nursesData.nurses);
        if (nursesData.nurses.length > 0) {
          setSelectedNurse(nursesData.nurses[0].nurse_id);
        }
      } else {
        setAlertModal({
          show: true,
          type: 'error',
          title: 'Failed to Load Nurses',
          message: nursesData.error || 'Unable to load available nurses'
        });
        setShowNurseModal(false);
      }
      setLoadingNurses(false);
      
    } catch (error) {
      console.error('Check-in validation error:', error);
      setAlertModal({
        show: true,
        type: 'error',
        title: 'Network Error',
        message: 'Failed to validate insurance. Please check your connection and try again.'
      });
      setCheckingIn(false);
    }
  };
  
  /**
   * Handle check-in confirmation - Step 2: Perform actual check-in with selected nurse
   */
  const handleConfirmCheckIn = async () => {
    if (!selectedAppointment || !selectedNurse) return;
    
    setCheckingIn(true);
    try {
      const response = await fetch('/receptionist_api/appointments/check-in.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          Appointment_id: selectedAppointment.Appointment_id,
          nurse_id: selectedNurse
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.insurance_warning) {
          setAlertModal({
            show: true,
            type: 'warning',
            title: 'Patient Checked In - Insurance Warning',
            message: data.insurance_warning
          });
        } else {
          setAlertModal({
            show: true,
            type: 'success',
            title: 'Check-In Successful',
            message: 'Patient has been checked in successfully!'
          });
        }
        setShowNurseModal(false);
        setSelectedAppointment(null);
        setSelectedNurse(null);
        loadDashboardData();
        loadCalendarData();
      } else {
        setAlertModal({
          show: true,
          type: 'error',
          title: 'Check-In Failed',
          message: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setAlertModal({
        show: true,
        type: 'error',
        title: 'Network Error',
        message: 'Failed to check in patient. Please check your connection and try again.'
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const dashStats = stats ? {
    total: stats.total || 0,
    scheduled: (stats.scheduled || 0) + (stats.upcoming || 0),
    checked_in: (stats.checked_in || 0) + (stats.completed || 0),
    completed: stats.completed || 0,
    payment: {
      total_collected: stats.payment?.total_collected || '0.00'
    }
  } : {
    total: 0,
    scheduled: 0,
    checked_in: 0,
    completed: 0,
    payment: { total_collected: '0.00' }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getStartingDay = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isWeekend = (day) => {
    const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const getAppointmentsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let dayAppointments = calendarAppointments[dateStr] || [];
    if (selectedDoctor !== 'all') {
      dayAppointments = dayAppointments.filter(apt => apt.Doctor_id === parseInt(selectedDoctor));
    }
    return dayAppointments;
  };

  const getDoctorById = (doctorId) => {
    return doctors.find(doc => doc.doctor_id === doctorId);
  };

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getFilteredAppointments = () => {
    if (selectedFilter === 'all') return todayAppointments;
    
    const statusMap = {
      'scheduled': 'Scheduled',
      'completed': 'Completed',
      'canceled': 'Cancelled'
    };
    
    return todayAppointments.filter(apt => {
      const aptStatus = (apt.status || apt.Status || 'Scheduled').toLowerCase();
      return aptStatus === selectedFilter || aptStatus === statusMap[selectedFilter]?.toLowerCase();
    });
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusClass = (status) => {
    const normalizedStatus = (status || 'scheduled').toLowerCase();
    const statusMap = {
      'scheduled': 'status-scheduled',
      'ready': 'status-ready',
      'waiting': 'status-waiting',
      'checked in': 'status-checked-in',
      'checked-in': 'status-checked-in',
      'in progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'canceled': 'status-cancelled',
      'no-show': 'status-noshow'
    };
    return statusMap[normalizedStatus] || 'status-scheduled';
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentDate);
  const startingDay = getStartingDay(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="receptionist-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Front Desk Dashboard</h1>
          <p className="dashboard-subtitle">
            <Calendar size={18} />
            {getCurrentDate()} • {receptionistOfficeName}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><Calendar size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '...' : dashStats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon"><Check size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '...' : dashStats.checked_in}</div>
            <div className="stat-label">Awaiting Payment</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '...' : dashStats.scheduled}</div>
            <div className="stat-label">Pending Check-in</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '...' : `$${dashStats.payment?.total_collected || '0.00'}`}</div>
            <div className="stat-label">Collected Today</div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="action-card action-primary" onClick={() => setCurrentPage('booking')}>
            <div className="action-icon"><Plus size={24} /></div>
            <div className="action-content">
              <h3 className="action-title">New Appointment</h3>
              <p className="action-description">Schedule patient visit</p>
            </div>
          </button>

          <button className="action-card action-secondary" onClick={() => setCurrentPage('patients')}>
            <div className="action-icon"><Users size={24} /></div>
            <div className="action-content">
              <h3 className="action-title">Patient Search</h3>
              <p className="action-description">Find patient records</p>
            </div>
          </button>

          <button className="action-card action-success" onClick={() => setCurrentPage('payment')}>
            <div className="action-icon"><DollarSign size={24} /></div>
            <div className="action-content">
              <h3 className="action-title">Record Payment</h3>
              <p className="action-description">Process copayment</p>
            </div>
          </button>

          <button className="action-card action-info" onClick={() => setCurrentPage('schedule')}>
            <div className="action-icon"><Clock size={24} /></div>
            <div className="action-content">
              <h3 className="action-title">Doctor Availability</h3>
              <p className="action-description">View daily schedule</p>
            </div>
          </button>
        </div>
      </div>

      <div className="combined-view-section">
        <div className="appointments-section">
          <div className="section-header">
            <h2 className="section-title">Today's Appointments</h2>
            
            <div className="filter-buttons">
              <button className={`filter-btn ${selectedFilter === 'all' ? 'filter-active' : ''}`} onClick={() => setSelectedFilter('all')}>
                All ({todayAppointments.length})
              </button>
              <button className={`filter-btn ${selectedFilter === 'scheduled' ? 'filter-active' : ''}`} onClick={() => setSelectedFilter('scheduled')}>
                Scheduled
              </button>
              <button className={`filter-btn ${selectedFilter === 'completed' ? 'filter-active' : ''}`} onClick={() => setSelectedFilter('completed')}>
                Completed
              </button>
            </div>
          </div>

          <div className="appointments-list">
            {loading ? (
              <div className="empty-state">
                <Clock size={48} />
                <p>Loading appointments...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>{error}</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.Appointment_id || appointment.id} 
                  className="appointment-card"
                  onClick={() => setSelectedAppointment(appointment)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="appointment-time">
                    <Clock size={20} />
                    <span>{appointment.time || formatTime(appointment.Appointment_date || appointment.appointmentDateTime)}</span>
                  </div>

                  <div className="appointment-patient">
                    <h3 className="patient-name">
                      {appointment.patientName || `${appointment.Patient_First} ${appointment.Patient_Last}`}
                    </h3>
                    <div className="patient-meta">
                      <span className="patient-id">
                        ID: {appointment.patientIdFormatted || appointment.Patient_id || appointment.patientId}
                      </span>
                      {appointment.emergencyContact && (
                        <span className="patient-phone">
                          <Phone size={14} />
                          {appointment.emergencyContact}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="appointment-details">
                    <p className="appointment-reason">
                      {appointment.reason || appointment.Reason_for_visit}
                    </p>
                    <p className="appointment-doctor">
                      {appointment.doctorName || `Dr. ${appointment.Doctor_First} ${appointment.Doctor_Last}`}
                    </p>
                  </div>

                  <div className="appointment-status">
                    <span className={`status-badge ${getStatusClass(appointment.status || appointment.Status)}`}>
                      {appointment.status || appointment.Status || 'Scheduled'}
                    </span>
                    {appointment.waitingMinutes > 0 && (
                      <span className="waiting-time">{appointment.waitingMinutes} min</span>
                    )}
                  </div>

                  <div className="appointment-actions">
                    {(appointment.status || appointment.Status) === 'Scheduled' && (
                      <button className="btn-check-in" onClick={(e) => e.stopPropagation()}>
                        <Check size={16} />
                        Check In
                      </button>
                    )}
                    {(appointment.status || appointment.Status) === 'Completed' && appointment.copay && (
                      <button 
                        className="btn-payment"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProcessPayment({
                            id: appointment.Appointment_id || appointment.id,
                            patientId: appointment.Patient_id || appointment.patientId,
                            patientName: appointment.patientName || `${appointment.Patient_First} ${appointment.Patient_Last}`,
                            doctor: appointment.doctorName || `Dr. ${appointment.Doctor_First} ${appointment.Doctor_Last}`,
                            copay: appointment.copay,
                            reason: appointment.reason || appointment.Reason_for_visit,
                            time: appointment.time || formatTime(appointment.Appointment_date)
                          });
                        }}
                      >
                        <DollarSign size={16} />
                        ${appointment.copay.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No appointments match this filter</p>
              </div>
            )}
          </div>
        </div>

        <div className="calendar-view-section">
          <h2 className="section-title">Monthly Calendar</h2>
          
          <div className="calendar-controls">
            <div className="month-navigation">
              <button className="nav-btn" onClick={goToPreviousMonth}>
                <ChevronLeft size={20} />
              </button>
              <h2 className="month-title">{currentMonthName} {currentYear}</h2>
              <button className="nav-btn" onClick={goToNextMonth}>
                <ChevronRight size={20} />
              </button>
              <button className="btn-today" onClick={goToToday}>Today</button>
            </div>

            <div className="doctor-filter">
              <Filter size={18} />
              <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="filter-select">
                <option value="all">All Doctors</option>
                {doctors.map(doc => (
                  <option key={doc.doctor_id} value={doc.doctor_id}>
                    Dr. {doc.first_name} {doc.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {doctors.length > 0 && (
            <div className="doctor-legend">
              {doctors.map(doc => (
                <div key={doc.doctor_id} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: doc.color }}></div>
                  <div className="legend-info">
                    <span className="legend-name">Dr. {doc.first_name} {doc.last_name}</span>
                    <span className="legend-specialty">{doc.specialty_name || doc.Specialty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="calendar-container">
            <div className="calendar-grid">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="weekday-header">{day}</div>
              ))}

              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty-day"></div>
              ))}

              {days.map(day => {
                const appointments = getAppointmentsForDay(day);
                const weekend = isWeekend(day);
                const today = isToday(day);

                return (
                  <div key={day} className={`calendar-day ${weekend ? 'weekend' : ''} ${today ? 'today' : ''}`}>
                    <div className="day-header">
                      <span className="day-number">{day}</span>
                      {appointments.length > 0 && (
                        <span className="appointment-count">{appointments.length}</span>
                      )}
                    </div>

                    <div className="day-appointments">
                      {weekend ? (
                        <p className="no-appointments">Closed</p>
                      ) : appointments.length > 0 ? (
                        appointments.map(apt => {
                          const doctor = getDoctorById(apt.Doctor_id);
                          return (
                            <div
                              key={apt.Appointment_id}
                              className="appointment-item"
                              style={{ borderLeftColor: doctor?.color || '#6b7280' }}
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <div className="apt-time">{formatTime(apt.Appointment_date)}</div>
                              <div className="apt-patient">{apt.Patient_First} {apt.Patient_Last}</div>
                              <div className="apt-doctor" style={{ color: doctor?.color || '#6b7280' }}>
                                Dr. {doctor?.last_name || 'Unknown'}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="no-appointments">No appointments</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Appointment Details</h2>
                <p className="modal-subtitle">ID: {selectedAppointment.Appointment_id}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedAppointment(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="appointment-details-grid">
                <div className="detail-section">
                  <label className="detail-label">
                    <User size={16} />
                    Patient
                  </label>
                  <p className="detail-value">
                    {selectedAppointment.Patient_First} {selectedAppointment.Patient_Last}
                  </p>
                </div>

                <div className="detail-section">
                  <label className="detail-label">
                    <User size={16} />
                    Doctor
                  </label>
                  <p className="detail-value">
                    Dr. {selectedAppointment.Doctor_First} {selectedAppointment.Doctor_Last}
                  </p>
                </div>

                <div className="detail-section">
                  <label className="detail-label">
                    <Calendar size={16} />
                    Date & Time
                  </label>
                  <p className="detail-value">
                    {new Date(selectedAppointment.Appointment_date).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="detail-section">
                  <label className="detail-label">Status</label>
                  <p className="detail-value">
                    <span className={`status-badge ${getStatusClass(selectedAppointment.Status)}`}>
                      {selectedAppointment.Status || 'Scheduled'}
                    </span>
                  </p>
                </div>

                <div className="detail-section detail-section-full">
                  <label className="detail-label">Reason for Visit</label>
                  <p className="detail-value">{selectedAppointment.Reason_for_visit}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-success" 
                onClick={handleCheckInAppointment}
                disabled={checkingIn || selectedAppointment.Status === 'Checked-in' || selectedAppointment.Status === 'Cancelled' || selectedAppointment.Status === 'Completed'}
              >
                <Check size={18} />
                {checkingIn ? 'Checking In...' : 'Check In'}
              </button>
              <button className="btn btn-primary">
                <Edit size={18} />
                Edit Appointment
              </button>
              <button className="btn btn-ghost" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ===== NURSE SELECTION MODAL ===== */}
      {showNurseModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowNurseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Select Nurse</h2>
                <p className="modal-subtitle">
                  Patient: {selectedAppointment.Patient_First} {selectedAppointment.Patient_Last}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowNurseModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {loadingNurses ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Loading nurses...</p>
              ) : nurses.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
                  No nurses available at this office
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {nurses.map(nurse => (
                    <label 
                      key={nurse.nurse_id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        border: selectedNurse === nurse.nurse_id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedNurse === nurse.nurse_id ? '#eff6ff' : 'white'
                      }}
                    >
                      <input
                        type="radio"
                        name="nurse"
                        value={nurse.nurse_id}
                        checked={selectedNurse === nurse.nurse_id}
                        onChange={() => setSelectedNurse(nurse.nurse_id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {nurse.first_name} {nurse.last_name}
                        </div>
                        {nurse.specialization && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>
                            {nurse.specialization}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-success" 
                onClick={handleConfirmCheckIn}
                disabled={checkingIn || !selectedNurse || loadingNurses}
              >
                <Check size={18} />
                {checkingIn ? 'Checking In...' : 'Confirm Check In'}
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowNurseModal(false)}
                disabled={checkingIn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ===== ALERT MODAL ===== */}
      {alertModal.show && (
        <div className="modal-overlay" onClick={() => setAlertModal({ ...alertModal, show: false })}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {alertModal.type === 'success' && (
                  <Check size={24} style={{ color: '#10b981' }} />
                )}
                {alertModal.type === 'error' && (
                  <X size={24} style={{ color: '#ef4444' }} />
                )}
                {alertModal.type === 'warning' && (
                  <AlertCircle size={24} style={{ color: '#f59e0b' }} />
                )}
                {alertModal.type === 'info' && (
                  <AlertCircle size={24} style={{ color: '#3b82f6' }} />
                )}
                <h2 className="modal-title">{alertModal.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setAlertModal({ ...alertModal, show: false })}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ 
                fontSize: '1rem', 
                lineHeight: '1.5',
                color: '#374151',
                whiteSpace: 'pre-line'
              }}>
                {alertModal.message}
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className={`btn ${
                  alertModal.type === 'success' ? 'btn-success' : 
                  alertModal.type === 'error' ? 'btn-danger' :
                  alertModal.type === 'warning' ? 'btn-warning' :
                  'btn-primary'
                }`}
                onClick={() => setAlertModal({ ...alertModal, show: false })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionistDashboard;