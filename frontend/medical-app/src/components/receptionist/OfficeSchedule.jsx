import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Plus, Filter, Edit, X } from 'lucide-react';
import './OfficeSchedule.css';

/**
 * OfficeSchedule Component - Receptionist Master Calendar
 * 
 * Displays monthly calendar view with ALL doctors' appointments for assigned office
 * RBAC: Limited to receptionist's Work_Location (Office_ID)
 * 
 * Database Tables:
 * - Appointment (Appointment_id, Patient_id, Doctor_id, Office_id, Appointment_date, Reason_for_visit)
 * - Patient (Patient_ID, First_Name, Last_Name)
 * - Doctor (Doctor_id, First_Name, Last_Name, Specialty)
 * - Specialty (specialty_id, specialty_name)
 * - Office (Office_ID - for RBAC)
 * 
 * Real Query:
 * SELECT a.*, p.First_Name, p.Last_Name, d.First_Name as Doc_First, d.Last_Name as Doc_Last,
 *        s.specialty_name
 * FROM Appointment a
 * JOIN Patient p ON a.Patient_id = p.Patient_ID
 * JOIN Doctor d ON a.Doctor_id = d.Doctor_id
 * JOIN Specialty s ON d.Specialty = s.specialty_id
 * WHERE a.Office_id = ? AND MONTH(a.Appointment_date) = ? AND YEAR(a.Appointment_date) = ?
 * 
 * Props:
 * @param {Function} onAppointmentClick - Handle appointment selection
 * @param {Function} onBookAppointment - Navigate to booking page
 * @param {Number} officeId - Office_ID for RBAC filtering
 * @param {String} officeName - Office name for display
 */
function OfficeSchedule({ onAppointmentClick, onBookAppointment, officeId, officeName }) {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1)); // January 2024
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  /**
   * Doctors from database (Doctor table with Specialty join)
   * SELECT d.Doctor_id, d.First_Name, d.Last_Name, s.specialty_name
   * FROM Doctor d
   * JOIN Specialty s ON d.Specialty = s.specialty_id
   * WHERE d.Work_Location = ?
   */
  const doctors = [
    { Doctor_id: 1, First_Name: 'Emily', Last_Name: 'Chen', specialty_name: 'Internal Medicine', color: '#3b82f6' },
    { Doctor_id: 2, First_Name: 'James', Last_Name: 'Rodriguez', specialty_name: 'Cardiology', color: '#10b981' },
    { Doctor_id: 3, First_Name: 'Susan', Last_Name: 'Lee', specialty_name: 'Pediatrics', color: '#f59e0b' },
    { Doctor_id: 4, First_Name: 'Richard', Last_Name: 'Patel', specialty_name: 'Orthopedics', color: '#8b5cf6' },
  ];

  /**
   * Mock appointments from Appointment table
   */
  const mockAppointments = [
    {
      Appointment_id: 1001,
      Appointment_date: '2024-01-15 09:00:00',
      Patient_id: 1,
      Patient_First: 'John',
      Patient_Last: 'Smith',
      Doctor_id: 1,
      Reason_for_visit: 'Annual physical examination',
      Office_id: officeId
    },
    {
      Appointment_id: 1002,
      Appointment_date: '2024-01-15 14:00:00',
      Patient_id: 3,
      Patient_First: 'David',
      Patient_Last: 'Johnson',
      Doctor_id: 1,
      Reason_for_visit: 'Follow-up consultation',
      Office_id: officeId
    },
    {
      Appointment_id: 1003,
      Appointment_date: '2024-01-15 10:30:00',
      Patient_id: 5,
      Patient_First: 'Michael',
      Patient_Last: 'Brown',
      Doctor_id: 2,
      Reason_for_visit: 'Cardiology checkup',
      Office_id: officeId
    },
    {
      Appointment_id: 1007,
      Appointment_date: '2024-01-16 08:45:00',
      Patient_id: 4,
      Patient_First: 'Sarah',
      Patient_Last: 'Williams',
      Doctor_id: 4,
      Reason_for_visit: 'Orthopedic consultation',
      Office_id: officeId
    },
    {
      Appointment_id: 1005,
      Appointment_date: '2024-01-15 13:30:00',
      Patient_id: 2,
      Patient_First: 'Maria',
      Patient_Last: 'Garcia',
      Doctor_id: 3,
      Reason_for_visit: 'Pediatric wellness visit',
      Office_id: officeId
    },
  ];

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

  /**
   * Get appointments for a specific day
   * Filters by Office_id (RBAC) and date
   */
  const getAppointmentsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let dayAppointments = mockAppointments.filter(apt => {
      const aptDate = apt.Appointment_date.split(' ')[0];
      return aptDate === dateStr && apt.Office_id === officeId;
    });

    // Apply doctor filter
    if (selectedDoctor !== 'all') {
      dayAppointments = dayAppointments.filter(apt => apt.Doctor_id === parseInt(selectedDoctor));
    }

    return dayAppointments;
  };

  /**
   * Get doctor info by Doctor_id
   */
  const getDoctorById = (doctorId) => {
    return doctors.find(doc => doc.Doctor_id === doctorId);
  };

  /**
   * Format time from Appointment_date
   */
  const formatTime = (datetime) => {
    const time = datetime.split(' ')[1];
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Handle appointment click
   */
  const handleAppointmentClick = (appointment, event) => {
    event.stopPropagation();
    setSelectedAppointment(appointment);
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  /**
   * Close appointment modal
   */
  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  // Generate calendar days
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentDate);
  const startingDay = getStartingDay(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Check if today
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  // Check if weekend
  const isWeekend = (day) => {
    const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  return (
    <div className="office-schedule-page">
      {/* ===== HEADER ===== */}
      <div className="schedule-header">
        <div className="header-info">
          <h1 className="page-title">Office Master Schedule</h1>
          <p className="page-subtitle">
            <Calendar size={18} />
            {officeName} - All Doctors
          </p>
        </div>
        <button className="btn btn-primary" onClick={onBookAppointment}>
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="schedule-controls">
        {/* Month Navigation */}
        <div className="month-navigation">
          <button className="nav-btn" onClick={goToPreviousMonth} aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <h2 className="month-title">{currentMonthName} {currentYear}</h2>
          <button className="nav-btn" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight size={20} />
          </button>
          <button className="btn-today" onClick={goToToday}>Today</button>
        </div>

        {/* Doctor Filter */}
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

      {/* ===== DOCTOR LEGEND ===== */}
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

      {/* ===== CALENDAR GRID ===== */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Weekday Headers */}
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}

          {/* Empty cells before first day */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty-day"></div>
          ))}

          {/* Calendar Days */}
          {days.map(day => {
            const appointments = getAppointmentsForDay(day);
            const weekend = isWeekend(day);
            const today = isToday(day);

            return (
              <div 
                key={day}
                className={`calendar-day ${weekend ? 'weekend' : ''} ${today ? 'today' : ''}`}
              >
                {/* Day Header */}
                <div className="day-header">
                  <span className="day-number">{day}</span>
                  {appointments.length > 0 && (
                    <span className="appointment-count">{appointments.length}</span>
                  )}
                </div>

                {/* Day Content */}
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
                          onClick={(e) => handleAppointmentClick(apt, e)}
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

      {/* ===== APPOINTMENT DETAILS MODAL ===== */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Appointment Details</h2>
                <p className="modal-subtitle">ID: {selectedAppointment.Appointment_id}</p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
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
                  <p className="detail-value-sub">Patient ID: {selectedAppointment.Patient_id}</p>
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
                  <p className="detail-value-sub">
                    {getDoctorById(selectedAppointment.Doctor_id)?.specialty_name}
                  </p>
                </div>

                <div className="detail-section">
                  <label className="detail-label">
                    <Calendar size={16} />
                    Date & Time
                  </label>
                  <p className="detail-value">
                    {new Date(selectedAppointment.Appointment_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="detail-value-sub">
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
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficeSchedule;