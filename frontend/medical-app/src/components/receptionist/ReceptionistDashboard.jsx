import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Check, AlertCircle, DollarSign, Plus, Phone, ChevronLeft, ChevronRight, Filter, User, Edit, X } from 'lucide-react';
import * as API from '../../api/receptionistApi';
import './ReceptionistDashboard.css';

/**
 * ReceptionistDashboard Component (Backend Integrated)
 * 
 * Main dashboard with monthly calendar and today's appointments
 * Pulls real data from backend APIs
 */
function ReceptionistDashboard({ setCurrentPage, onProcessPayment, officeId, officeName }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // State for API data
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Doctors list
  const doctors = [
    { Doctor_id: 1, First_Name: 'Emily', Last_Name: 'Chen', specialty_name: 'Internal Medicine', color: '#3b82f6' },
    { Doctor_id: 2, First_Name: 'James', Last_Name: 'Rodriguez', specialty_name: 'Cardiology', color: '#10b981' },
    { Doctor_id: 3, First_Name: 'Susan', Last_Name: 'Lee', specialty_name: 'Pediatrics', color: '#f59e0b' },
    { Doctor_id: 4, First_Name: 'Richard', Last_Name: 'Patel', specialty_name: 'Orthopedics', color: '#8b5cf6' },
  ];

  /**
   * Load dashboard data on mount
   */
  useEffect(() => {
    loadDashboardData();
  }, [officeId]);

  /**
   * Load calendar when month changes
   */
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, officeId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = API.formatDateForAPI(new Date());
      
      const [statsResult, appointmentsResult] = await Promise.all([
        API.getDashboardStats(officeId, today),
        API.getTodayAppointments(officeId)
      ]);

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
      
      if (appointmentsResult.success) {
        setTodayAppointments(appointmentsResult.appointments || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const startDate = API.formatDateForAPI(startOfMonth);
      const endDate = API.formatDateForAPI(endOfMonth);
      
      const result = await API.getAppointmentsByOffice(officeId, startDate, endDate);
      
      if (result.success) {
        setCalendarAppointments(result.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
    }
  };

  const dashStats = stats || {
    total_appointments: 0,
    scheduled: 0,
    checked_in: 0,
    completed: 0,
    revenue_collected: 0
  };

  /**
   * Calendar helper functions
   */
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
    
    let dayAppointments = calendarAppointments.filter(apt => {
      const aptDate = apt.Appointment_date.split(' ')[0];
      return aptDate === dateStr;
    });

    if (selectedDoctor !== 'all') {
      dayAppointments = dayAppointments.filter(apt => apt.Doctor_id === parseInt(selectedDoctor));
    }

    return dayAppointments;
  };

  const getDoctorById = (doctorId) => {
    return doctors.find(doc => doc.Doctor_id === doctorId);
  };

  const formatTime = (datetime) => {
    return API.parseTime(datetime);
  };

  const getFilteredAppointments = () => {
    if (selectedFilter === 'all') return todayAppointments;
    
    const statusMap = {
      'scheduled': 'Scheduled',
      'completed': 'Completed',
      'canceled': 'Canceled'
    };
    
    return todayAppointments.filter(apt => 
      (apt.Status || 'Scheduled') === statusMap[selectedFilter]
    );
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'completed': 'status-completed',
      'canceled': 'status-cancelled',
      'checked in': 'status-checked-in',
      'no-show': 'status-noshow'
    };
    return statusMap[status?.toLowerCase()] || 'status-scheduled';
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
      {/* ===== HEADER ===== */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Front Desk Dashboard</h1>
          <p className="dashboard-subtitle">
            <Calendar size={18} />
            {getCurrentDate()} • {officeName}
          </p>
        </div>
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loading ? '...' : dashStats.total_appointments}
            </div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <Check size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loading ? '...' : dashStats.checked_in}
            </div>
            <div className="stat-label">Awaiting Payment</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loading ? '...' : dashStats.scheduled}
            </div>
            <div className="stat-label">Pending Check-in</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loading ? '...' : `$${dashStats.revenue_collected.toFixed(2)}`}
            </div>
            <div className="stat-label">Collected Today</div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button 
            className="action-card action-primary"
            onClick={() => setCurrentPage('booking')}
          >
            <div className="action-icon">
              <Plus size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">New Appointment</h3>
              <p className="action-description">Schedule patient visit</p>
            </div>
          </button>

          <button 
            className="action-card action-secondary"
            onClick={() => setCurrentPage('patients')}
          >
            <div className="action-icon">
              <Users size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">Patient Search</h3>
              <p className="action-description">Find patient records</p>
            </div>
          </button>

          <button 
            className="action-card action-success"
            onClick={() => setCurrentPage('payment')}
          >
            <div className="action-icon">
              <DollarSign size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">Record Payment</h3>
              <p className="action-description">Process copayment</p>
            </div>
          </button>

          <button 
            className="action-card action-info"
            onClick={() => setCurrentPage('schedule')}
          >
            <div className="action-icon">
              <Clock size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">Doctor Availability</h3>
              <p className="action-description">View daily schedule</p>
            </div>
          </button>
        </div>
      </div>

      {/* ===== COMBINED VIEW ===== */}
      <div className="combined-view-section">
        {/* TODAY'S APPOINTMENTS */}
        <div className="appointments-section">
          <div className="section-header">
            <h2 className="section-title">Today's Appointments</h2>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${selectedFilter === 'all' ? 'filter-active' : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                All ({todayAppointments.length})
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'scheduled' ? 'filter-active' : ''}`}
                onClick={() => setSelectedFilter('scheduled')}
              >
                Scheduled
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'completed' ? 'filter-active' : ''}`}
                onClick={() => setSelectedFilter('completed')}
              >
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
                  key={appointment.Appointment_id} 
                  className="appointment-card"
                >
                  <div className="appointment-time">
                    <Clock size={20} />
                    <span>{formatTime(appointment.Appointment_date)}</span>
                  </div>

                  <div className="appointment-patient">
                    <h3 className="patient-name">
                      {appointment.Patient_First} {appointment.Patient_Last}
                    </h3>
                    <div className="patient-meta">
                      <span className="patient-id">ID: {appointment.Patient_id}</span>
                      {appointment.EmergencyContact && (
                        <span className="patient-phone">
                          <Phone size={14} />
                          {appointment.EmergencyContact}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="appointment-details">
                    <p className="appointment-reason">{appointment.Reason_for_visit}</p>
                    <p className="appointment-doctor">
                      Dr. {appointment.Doctor_First} {appointment.Doctor_Last}
                    </p>
                  </div>

                  <div className="appointment-status">
                    <span className={`status-badge ${getStatusClass(appointment.Status)}`}>
                      {appointment.Status || 'Scheduled'}
                    </span>
                  </div>

                  <div className="appointment-actions">
                    {appointment.Status === 'Scheduled' && (
                      <button className="btn-check-in">
                        <Check size={16} />
                        Check In
                      </button>
                    )}
                    {appointment.Status === 'Completed' && appointment.copay && (
                      <button 
                        className="btn-payment"
                        onClick={() => onProcessPayment({
                          id: appointment.Appointment_id,
                          patientId: appointment.Patient_id,
                          patientName: `${appointment.Patient_First} ${appointment.Patient_Last}`,
                          doctor: `Dr. ${appointment.Doctor_First} ${appointment.Doctor_Last}`,
                          copay: appointment.copay,
                          reason: appointment.Reason_for_visit,
                          time: formatTime(appointment.Appointment_date)
                        })}
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

        {/* CALENDAR VIEW */}
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
              <select 
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Doctors</option>
                {doctors.map(doc => (
                  <option key={doc.Doctor_id} value={doc.Doctor_id}>
                    Dr. {doc.First_Name} {doc.Last_Name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="doctor-legend">
            {doctors.map(doc => (
              <div key={doc.Doctor_id} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: doc.color }}></div>
                <div className="legend-info">
                  <span className="legend-name">Dr. {doc.First_Name} {doc.Last_Name}</span>
                  <span className="legend-specialty">{doc.specialty_name}</span>
                </div>
              </div>
            ))}
          </div>

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
                  <div 
                    key={day}
                    className={`calendar-day ${weekend ? 'weekend' : ''} ${today ? 'today' : ''}`}
                  >
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
                              style={{ borderLeftColor: doctor?.color }}
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <div className="apt-time">{formatTime(apt.Appointment_date)}</div>
                              <div className="apt-patient">
                                {apt.Patient_First} {apt.Patient_Last}
                              </div>
                              <div className="apt-doctor" style={{ color: doctor?.color }}>
                                Dr. {doctor?.Last_Name}
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

      {/* ===== APPOINTMENT DETAILS MODAL ===== */}
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
                    Dr. {getDoctorById(selectedAppointment.Doctor_id)?.First_Name}{' '}
                    {getDoctorById(selectedAppointment.Doctor_id)?.Last_Name}
                  </p>
                </div>

                <div className="detail-section">
                  <label className="detail-label">
                    <Calendar size={16} />
                    Date & Time
                  </label>
                  <p className="detail-value">
                    {formatTime(selectedAppointment.Appointment_date)}
                  </p>
                </div>

                <div className="detail-section detail-section-full">
                  <label className="detail-label">Reason for Visit</label>
                  <p className="detail-value">{selectedAppointment.Reason_for_visit}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary">
                <Edit size={18} />
                Edit Appointment
              </button>
              <button className="btn btn-danger">
                <X size={18} />
                Cancel Appointment
              </button>
              <button className="btn btn-ghost" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionistDashboard;