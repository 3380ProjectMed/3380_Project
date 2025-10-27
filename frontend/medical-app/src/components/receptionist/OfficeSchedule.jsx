import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Check } from 'lucide-react';
import * as API from '../../api/receptionistApi';
import './OfficeSchedule.css';

/**
 * OfficeSchedule Component (Backend Integrated)
 * 
 * Displays doctor availability grid for appointment booking
 * Shows available time slots per doctor for selected date
 * Integrated with backend APIs for real-time availability
 */
function OfficeSchedule({ officeId, officeName, onSelectTimeSlot }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [loading, setLoading] = useState(true);

  /**
   * Load doctors and appointments when component mounts or date changes
   */
  useEffect(() => {
    loadScheduleData();
  }, [selectedDate, officeId]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      
      // Get doctors for this office
      const doctorsResult = await API.getDoctorsByOffice(officeId);
      
      if (doctorsResult.success) {
        // Add colors and working hours to doctors
        const doctorsWithDetails = (doctorsResult.doctors || []).map((doc, index) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
          return {
            ...doc,
            color: colors[index % colors.length],
            workDays: [1, 2, 3, 4, 5], // Monday-Friday (will be fetched from API in production)
            startTime: 9,
            endTime: 17
          };
        });
        setDoctors(doctorsWithDetails);
      }
      
      // Get appointments for selected date
      const dateStr = API.formatDateForAPI(selectedDate);
      const appointmentsResult = await API.getAppointmentsByDate(dateStr, officeId);
      
      if (appointmentsResult.success) {
        // Convert appointments to booked slots lookup
        const slots = {};
        (appointmentsResult.appointments || []).forEach(apt => {
          const key = `${apt.Doctor_id}-${apt.Appointment_date}`;
          slots[key] = true;
        });
        setBookedSlots(slots);
      }
      
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Date navigation functions
   */
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setSelectedSlot(null);
  };

  /**
   * Check if selected date is today
   */
  const isToday = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  };

  /**
   * Check if selected date is a weekend
   */
  const isWeekend = () => {
    const day = selectedDate.getDay();
    return day === 0 || day === 6;
  };

  /**
   * Check if date is in the past
   */
  const isPastDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  /**
   * Generate time slots (30-minute intervals)
   */
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  /**
   * Format time slot for display
   */
  const formatTimeSlot = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  /**
   * Check if doctor works on selected day
   */
  const isDoctorWorking = (doctor) => {
    const dayOfWeek = selectedDate.getDay();
    return doctor.workDays.includes(dayOfWeek);
  };

  /**
   * Check if time slot is within doctor's working hours
   */
  const isWithinWorkingHours = (doctor, hour, minute) => {
    const timeInMinutes = hour * 60 + minute;
    const startInMinutes = doctor.startTime * 60;
    const endInMinutes = doctor.endTime * 60;
    return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
  };

  /**
   * Check if time slot is booked (from backend data)
   */
  const isSlotBooked = (doctorId, hour, minute) => {
    const dateStr = API.formatDateForAPI(selectedDate);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    const key = `${doctorId}-${dateStr} ${timeStr}`;
    return bookedSlots[key] === true;
  };

  /**
   * Check if time slot is in the past
   */
  const isSlotInPast = (hour, minute) => {
    if (!isToday()) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return (hour < currentHour) || (hour === currentHour && minute <= currentMinute);
  };

  /**
   * Get slot availability status
   */
  const getSlotStatus = (doctor, hour, minute) => {
    if (isPastDate()) return 'past';
    if (isSlotInPast(hour, minute)) return 'past';
    if (!isDoctorWorking(doctor)) return 'unavailable';
    if (!isWithinWorkingHours(doctor, hour, minute)) return 'unavailable';
    if (isSlotBooked(doctor.Doctor_id, hour, minute)) return 'booked';
    return 'available';
  };

  /**
   * Handle slot selection
   */
  const handleSlotClick = (doctor, hour, minute, status) => {
    if (status !== 'available') return;
    
    const slotKey = `${doctor.Doctor_id}-${hour}-${minute}`;
    setSelectedSlot(slotKey);
    
    if (onSelectTimeSlot) {
      onSelectTimeSlot({
        doctor: doctor,
        date: selectedDate,
        time: formatTimeSlot(hour, minute),
        hour: hour,
        minute: minute
      });
    }
  };

  /**
   * Check if slot is selected
   */
  const isSlotSelected = (doctorId, hour, minute) => {
    return selectedSlot === `${doctorId}-${hour}-${minute}`;
  };

  return (
    <div className="office-schedule-page">
      {/* ===== HEADER ===== */}
      <div className="schedule-header">
        <div className="header-info">
          <h1 className="page-title">Doctor Availability</h1>
          <p className="page-subtitle">
            <Calendar size={18} />
            {officeName} • Select an available time slot
          </p>
        </div>
      </div>

      {/* ===== DATE NAVIGATION ===== */}
      <div className="date-navigation-section">
        <div className="date-controls">
          <button className="nav-btn" onClick={goToPreviousDay} title="Previous Day">
            <ChevronLeft size={20} />
          </button>
          
          <div className="current-date-display">
            <h2 className="selected-date">{formatDate(selectedDate)}</h2>
            <div className="date-badges">
              {isToday() && <span className="today-badge">Today</span>}
              {isWeekend() && <span className="weekend-badge">Weekend - Closed</span>}
              {isPastDate() && <span className="past-badge">Past Date</span>}
            </div>
          </div>
          
          <button className="nav-btn" onClick={goToNextDay} title="Next Day">
            <ChevronRight size={20} />
          </button>
          
          <button className="btn-today" onClick={goToToday}>
            Jump to Today
          </button>
        </div>
      </div>

      {/* ===== LEGEND ===== */}
      <div className="availability-legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-box unavailable"></div>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-box selected"></div>
          <span>Selected</span>
        </div>
      </div>

      {/* ===== AVAILABILITY GRID ===== */}
      <div className="availability-grid-container">
        {loading ? (
          <div className="empty-state">
            <Clock size={64} />
            <h3>Loading schedule...</h3>
          </div>
        ) : isWeekend() || isPastDate() ? (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>{isWeekend() ? 'Office Closed on Weekends' : 'Cannot Book Past Dates'}</h3>
            <p>{isWeekend() ? 'Please select a weekday to view available appointments.' : 'Please select a current or future date.'}</p>
            <button className="btn-primary" onClick={goToToday}>
              Go to Today
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <User size={64} />
            <h3>No Doctors Available</h3>
            <p>No doctors are assigned to this office.</p>
          </div>
        ) : (
          <div className="availability-grid">
            {/* Header Row - Doctor Names */}
            <div className="grid-header">
              <div className="time-column-header">
                <Clock size={18} />
                <span>Time</span>
              </div>
              {doctors.map(doctor => (
                <div 
                  key={doctor.Doctor_id} 
                  className="doctor-column-header"
                  style={{ borderTopColor: doctor.color }}
                >
                  <div className="doctor-avatar" style={{ backgroundColor: doctor.color }}>
                    <User size={20} />
                  </div>
                  <div className="doctor-info">
                    <h3 className="doctor-name">Dr. {doctor.First_Name} {doctor.Last_Name}</h3>
                    <p className="doctor-specialty">{doctor.specialty_name}</p>
                    {isDoctorWorking(doctor) ? (
                      <p className="doctor-hours">
                        {formatTimeSlot(doctor.startTime, 0)} - {formatTimeSlot(doctor.endTime, 0)}
                      </p>
                    ) : (
                      <p className="doctor-hours off-day">Off Today</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            <div className="grid-body">
              {timeSlots.map(({ hour, minute }) => (
                <div key={`${hour}-${minute}`} className="grid-row">
                  {/* Time Label */}
                  <div className="time-cell">
                    <span className="time-label">{formatTimeSlot(hour, minute)}</span>
                  </div>

                  {/* Doctor Slots */}
                  {doctors.map(doctor => {
                    const status = getSlotStatus(doctor, hour, minute);
                    const isSelected = isSlotSelected(doctor.Doctor_id, hour, minute);
                    
                    return (
                      <div
                        key={`${doctor.Doctor_id}-${hour}-${minute}`}
                        className={`slot-cell ${status} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSlotClick(doctor, hour, minute, status)}
                        title={
                          status === 'available' ? 'Click to select this time slot' :
                          status === 'booked' ? 'This time slot is already booked' :
                          status === 'past' ? 'This time has passed' :
                          'Doctor not available at this time'
                        }
                      >
                        {isSelected && (
                          <div className="selected-indicator">
                            <Check size={20} />
                          </div>
                        )}
                        {status === 'available' && !isSelected && (
                          <div className="hover-indicator">
                            Click to select
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== SELECTED SLOT INFO ===== */}
      {selectedSlot && (
        <div className="selected-slot-info">
          <div className="info-content">
            <Check size={24} />
            <div className="info-text">
              <h3>Time Slot Selected</h3>
              <p>Click "Continue" to proceed with booking this appointment</p>
            </div>
          </div>
          <button className="btn-continue">
            Continue to Booking
          </button>
        </div>
      )}
    </div>
  );
}

export default OfficeSchedule;