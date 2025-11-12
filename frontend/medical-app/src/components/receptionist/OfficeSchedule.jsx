import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Check, X, Edit, AlertCircle } from 'lucide-react';
// Removed API import as we'll use fetch directly
import './OfficeSchedule.css';

/**
 * OfficeSchedule Component (Backend Integrated)
 * 
 * Displays doctor availability grid for appointment booking
 * Shows available time slots per doctor for selected date
 * Integrated with backend APIs for real-time availability
 */
function OfficeSchedule({ officeId, officeName, onSelectTimeSlot, onEditAppointment }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotData, setSelectedSlotData] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

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
      const doctorsResponse = await fetch(
        `/receptionist_api/doctors/get-by-office.php?office_id=${officeId}`,
        { credentials: 'include' }
      );
      const doctorsResult = await doctorsResponse.json();
      
      if (doctorsResult.success) {
        // Add colors and working hours to doctors, normalize property names
        const doctorsWithDetails = (doctorsResult.doctors || []).map((doc, index) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
          return {
            doctor_id: doc.Doctor_id,
            Doctor_id: doc.Doctor_id, // Keep both for compatibility
            first_name: doc.First_Name,
            First_Name: doc.First_Name,
            last_name: doc.Last_Name,
            Last_Name: doc.Last_Name,
            specialty_name: doc.specialty_name,
            specialty_id: doc.specialty_id,
            color: colors[index % colors.length],
            workDays: [1, 2, 3, 4, 5], // Monday-Friday (will be fetched from API in production)
            startTime: 9,
            endTime: 17
          };
        });
        setDoctors(doctorsWithDetails);
      }
      
      // Get appointments for selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const appointmentsResponse = await fetch(
        `/receptionist_api/appointments/get-by-date.php?date=${dateStr}`,
        { credentials: 'include' }
      );
      const appointmentsResult = await appointmentsResponse.json();
      
      if (appointmentsResult.success) {
        // Convert appointments to booked slots lookup
        const slots = {};
        (appointmentsResult.appointments || []).forEach(apt => {
          // Extract date and time from Appointment_date (format: "YYYY-MM-DD HH:MM:SS")
          const appointmentDateTime = apt.Appointment_date; // e.g., "2025-11-11 11:00:00"
          const key = `${apt.Doctor_id}-${appointmentDateTime}`;
          slots[key] = {
            appointment_id: apt.Appointment_id,
            Patient_id: apt.Patient_id,
            Doctor_id: apt.Doctor_id,
            patient_name: apt.patientName,
            doctor_name: apt.doctorName,
            Appointment_date: apt.Appointment_date,
            reason: apt.reason,
            status: apt.status
          };
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
   * Each appointment only shows at ONE slot - the nearest one (earlier if equidistant)
   */
  const isSlotBooked = (doctorId, hour, minute) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const slotTimeInMinutes = hour * 60 + minute;
    
    // Check all booked slots for this doctor on this date
    for (const key in bookedSlots) {
      if (!key.startsWith(`${doctorId}-${dateStr}`)) continue;
      
      const appointment = bookedSlots[key];
      const apptDate = new Date(appointment.Appointment_date);
      const apptTimeInMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();
      
      // Calculate time difference
      const timeDiff = apptTimeInMinutes - slotTimeInMinutes;
      const absTimeDiff = Math.abs(timeDiff);
      
      // Only show if within 15 minutes
      if (absTimeDiff > 15) continue;
      
      // For appointments exactly between two slots (e.g., 10:15 or 10:45)
      // show at the earlier slot only
      if (absTimeDiff === 15) {
        // Only show if appointment is AFTER this slot (not before)
        // 10:45 appointment: show at 10:30 (timeDiff=15), NOT at 11:00 (timeDiff=-15)
        if (timeDiff > 0) {
          return true;
        }
      } else {
        // For other appointments, show at whichever slot is closer
        // Check if this is the closest slot
        const prevSlotTime = slotTimeInMinutes - 30;
        const nextSlotTime = slotTimeInMinutes + 30;
        
        const distToPrev = Math.abs(apptTimeInMinutes - prevSlotTime);
        const distToNext = Math.abs(apptTimeInMinutes - nextSlotTime);
        
        // Show here if this slot is closer than both neighbors
        if (absTimeDiff <= distToPrev && absTimeDiff < distToNext) {
          return true;
        }
      }
    }
    
    return false;
  };

  /**
   * Get the actual appointment for a time slot (if within range)
   * Prioritizes the closest slot, with preference for earlier slots
   */
  const getAppointmentForSlot = (doctorId, hour, minute) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const slotTimeInMinutes = hour * 60 + minute;
    
    let closestAppointment = null;
    let closestDistance = Infinity;
    
    // Check all booked slots for this doctor on this date
    for (const key in bookedSlots) {
      if (!key.startsWith(`${doctorId}-${dateStr}`)) continue;
      
      const appointment = bookedSlots[key];
      const apptDate = new Date(appointment.Appointment_date);
      const apptTimeInMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();
      
      // Calculate time difference
      const timeDiff = apptTimeInMinutes - slotTimeInMinutes;
      const absTimeDiff = Math.abs(timeDiff);
      
      // If appointment is within 15 minutes of this slot
      if (absTimeDiff <= 15) {
        // For equidistant appointments, prefer showing at the earlier slot
        // (e.g., 10:15 appointment: show at 10:00, not 10:30)
        if (absTimeDiff < closestDistance || (absTimeDiff === closestDistance && timeDiff > 0)) {
          closestDistance = absTimeDiff;
          closestAppointment = appointment;
        }
      }
    }
    
    return closestAppointment;
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
    // If slot is booked, show appointment details
    if (status === 'booked') {
      const appointmentData = getAppointmentForSlot(doctor.Doctor_id, hour, minute);
      
      if (appointmentData) {
        setSelectedAppointment(appointmentData);
      }
      return;
    }
    
    // If slot is available, select it for booking
    if (status !== 'available') return;
    
    const slotKey = `${doctor.Doctor_id}-${hour}-${minute}`;
    setSelectedSlot(slotKey);
    
    const slotData = {
      doctor: doctor,
      date: selectedDate,
      time: formatTimeSlot(hour, minute),
      hour: hour,
      minute: minute
    };
    
    setSelectedSlotData(slotData);
  };

  /**
   * Handle continue to booking button click
   */
  const handleContinueToBooking = () => {
    if (selectedSlotData && onSelectTimeSlot) {
      onSelectTimeSlot(selectedSlotData);
    }
  };

  /**
   * Cancel appointment
   */
  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) return;
    
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      setCanceling(true);
      
      const response = await fetch('/receptionist_api/appointments/cancel.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          Appointment_id: selectedAppointment.appointment_id,
          cancellation_reason: 'Cancelled by receptionist'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Close modal
        setSelectedAppointment(null);
        // Reload schedule data
        loadScheduleData();
      } else {
        alert('Failed to cancel appointment: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  /**
   * Edit appointment - pass appointment data to parent for editing
   */
  const handleEditAppointment = () => {
    if (!selectedAppointment || !onEditAppointment) return;
    
    // Close the modal
    setSelectedAppointment(null);
    
    // Pass the appointment data to the parent for editing
    onEditAppointment(selectedAppointment);
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (status) => {
    const normalizedStatus = (status || 'scheduled').toLowerCase();
    const statusMap = {
      'scheduled': 'status-scheduled',
      'ready': 'status-ready',
      'waiting': 'status-waiting',
      'checked in': 'status-checked-in',
      'in progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'canceled': 'status-cancelled',
      'no-show': 'status-noshow'
    };
    return statusMap[normalizedStatus] || 'status-scheduled';
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
          <button className="btn-continue" onClick={handleContinueToBooking}>
            Continue to Booking
          </button>
        </div>
      )}

      {/* ===== APPOINTMENT DETAILS MODAL ===== */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Appointment Details</h2>
                <p className="modal-subtitle">ID: {selectedAppointment.appointment_id}</p>
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
                    {selectedAppointment.patient_name}
                  </p>
                </div>

                <div className="detail-section">
                  <label className="detail-label">
                    <User size={16} />
                    Doctor
                  </label>
                  <p className="detail-value">
                    {selectedAppointment.doctor_name}
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
                    <span className={`status-badge ${getStatusClass(selectedAppointment.status)}`}>
                      {selectedAppointment.status || 'Scheduled'}
                    </span>
                  </p>
                </div>

                {selectedAppointment.reason && (
                  <div className="detail-section detail-section-full">
                    <label className="detail-label">Reason for Visit</label>
                    <p className="detail-value">{selectedAppointment.reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={handleEditAppointment}
                disabled={selectedAppointment.status === 'Cancelled' || selectedAppointment.status === 'Completed'}
              >
                <Edit size={18} />
                Edit Appointment
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleCancelAppointment}
                disabled={canceling || selectedAppointment.status === 'Cancelled' || selectedAppointment.status === 'Completed'}
              >
                <X size={18} />
                {canceling ? 'Canceling...' : 'Cancel Appointment'}
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

export default OfficeSchedule;