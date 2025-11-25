import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Check, X, Edit, AlertCircle } from 'lucide-react';

import './OfficeSchedule.css';
import AddInsuranceModal from './AddInsuranceModal';

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function OfficeSchedule({ officeId, officeName, onSelectTimeSlot, onEditAppointment }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotData, setSelectedSlotData] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [bookedSlots, setBookedSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const [showNurseModal, setShowNurseModal] = useState(false);
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [loadingNurses, setLoadingNurses] = useState(false);

  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [insurancePatient, setInsurancePatient] = useState(null);
  const [validationToken, setValidationToken] = useState(null);

  const [alertModal, setAlertModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    confirmAction: null
  });

  useEffect(() => {
    loadScheduleData();
  }, [selectedDate, officeId]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);

      const doctorsResponse = await fetch(
        `/receptionist_api/doctors/get-by-office.php?office_id=${officeId}`,
        { credentials: 'include' }
      );
      const doctorsResult = await doctorsResponse.json();
      
      if (doctorsResult.success) {
        
        const doctorsWithDetails = (doctorsResult.doctors || []).map((doc, index) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const selectedDayName = dayNames[selectedDate.getDay()];

          const todaySchedule = (doc.work_schedule || []).find(
            schedule => schedule.day === selectedDayName
          );

          const workDays = (doc.work_schedule || []).map(schedule => {
            return dayNames.indexOf(schedule.day);
          }).filter(day => day !== -1);

          let startTime = 9;  
          let endTime = 17;   
          
          if (todaySchedule) {
            
            startTime = parseInt(todaySchedule.start.split(':')[0]);
            endTime = parseInt(todaySchedule.end.split(':')[0]);
          }
          
          return {
            doctor_id: doc.Doctor_id,
            Doctor_id: doc.Doctor_id,
            first_name: doc.First_Name,
            First_Name: doc.First_Name,
            last_name: doc.Last_Name,
            Last_Name: doc.Last_Name,
            specialty_name: doc.specialty_name,
            specialty_id: doc.specialty_id,
            color: colors[index % colors.length],
            workDays: workDays,
            startTime: startTime,
            endTime: endTime,
            work_schedule: doc.work_schedule 
          };
        });
        setDoctors(doctorsWithDetails);
      }

      const dateStr = formatDateLocal(selectedDate);
      const appointmentsResponse = await fetch(
        `/receptionist_api/appointments/get-by-date.php?date=${dateStr}`,
        { credentials: 'include' }
      );
      const appointmentsResult = await appointmentsResponse.json();
      
      if (appointmentsResult.success) {

        const slots = {};
        (appointmentsResult.appointments || []).forEach(apt => {
          
          if (apt.status === 'Cancelled' || apt.status === 'Canceled' || apt.status === 'No-Show') {
            return;
          }

          const appointmentDateTime = apt.Appointment_date; 
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

  const isToday = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  };

  const isWeekend = () => {
    const day = selectedDate.getDay();
    return day === 0 || day === 6;
  };

  const isPastDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 5; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getUniqueSpecialties = () => {
    const specialties = doctors
      .map(doc => doc.specialty_name)
      .filter((specialty, index, self) => specialty && self.indexOf(specialty) === index)
      .sort();
    return specialties;
  };

  const getFilteredDoctors = () => {
    if (specialtyFilter === 'all') {
      return doctors;
    }
    return doctors.filter(doc => doc.specialty_name === specialtyFilter);
  };

  const filteredDoctors = getFilteredDoctors();
  const uniqueSpecialties = getUniqueSpecialties();

  const formatTimeSlot = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const isDoctorWorking = (doctor) => {
    const dayOfWeek = selectedDate.getDay();
    return doctor.workDays.includes(dayOfWeek);
  };

  const isWithinWorkingHours = (doctor, hour, minute) => {
    const timeInMinutes = hour * 60 + minute;
    const startInMinutes = doctor.startTime * 60;
    const endInMinutes = doctor.endTime * 60;
    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
  };

  const isSlotBooked = (doctorId, hour, minute) => {
    const dateStr = formatDateLocal(selectedDate);
    const slotTimeInMinutes = hour * 60 + minute;

    for (const key in bookedSlots) {
      if (!key.startsWith(`${doctorId}-${dateStr}`)) continue;
      
      const appointment = bookedSlots[key];
      const apptDate = new Date(appointment.Appointment_date);
      const apptTimeInMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();

      const timeDiff = apptTimeInMinutes - slotTimeInMinutes;
      const absTimeDiff = Math.abs(timeDiff);

      if (absTimeDiff > 15) continue;

      if (absTimeDiff === 15) {

        if (timeDiff > 0) {
          return true;
        }
      } else {

        const prevSlotTime = slotTimeInMinutes - 30;
        const nextSlotTime = slotTimeInMinutes + 30;
        
        const distToPrev = Math.abs(apptTimeInMinutes - prevSlotTime);
        const distToNext = Math.abs(apptTimeInMinutes - nextSlotTime);

        if (absTimeDiff <= distToPrev && absTimeDiff < distToNext) {
          return true;
        }
      }
    }
    
    return false;
  };

  const getAppointmentForSlot = (doctorId, hour, minute) => {
    const dateStr = formatDateLocal(selectedDate);
    const slotTimeInMinutes = hour * 60 + minute;
    
    let closestAppointment = null;
    let closestDistance = Infinity;

    for (const key in bookedSlots) {
      if (!key.startsWith(`${doctorId}-${dateStr}`)) continue;
      
      const appointment = bookedSlots[key];
      const apptDate = new Date(appointment.Appointment_date);
      const apptTimeInMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();

      const timeDiff = apptTimeInMinutes - slotTimeInMinutes;
      const absTimeDiff = Math.abs(timeDiff);

      if (absTimeDiff <= 15) {

        if (absTimeDiff < closestDistance || (absTimeDiff === closestDistance && timeDiff > 0)) {
          closestDistance = absTimeDiff;
          closestAppointment = appointment;
        }
      }
    }
    
    return closestAppointment;
  };

  const isSlotInPast = (hour, minute) => {
    if (!isToday()) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return (hour < currentHour) || (hour === currentHour && minute <= currentMinute);
  };

  const getSlotStatus = (doctor, hour, minute) => {
    if (isPastDate()) return 'past';
    if (isSlotInPast(hour, minute)) return 'past';
    if (!isDoctorWorking(doctor)) return 'unavailable';
    if (!isWithinWorkingHours(doctor, hour, minute)) return 'unavailable';
    if (isSlotBooked(doctor.Doctor_id, hour, minute)) return 'booked';
    return 'available';
  };

  const handleSlotClick = (doctor, hour, minute, status) => {
    
    if (status === 'booked') {
      const appointmentData = getAppointmentForSlot(doctor.Doctor_id, hour, minute);
      
      if (appointmentData) {
        setSelectedAppointment(appointmentData);
      }
      return;
    }

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

  const handleContinueToBooking = () => {
    if (selectedSlotData && onSelectTimeSlot) {
      onSelectTimeSlot(selectedSlotData);
    }
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) return;
    
    setAlertModal({
      show: true,
      type: 'warning',
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
      confirmAction: confirmCancelAppointment
    });
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) return;
    
    setAlertModal({ ...alertModal, show: false });
    
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
        setAlertModal({
          show: true,
          type: 'success',
          title: 'Appointment Cancelled',
          message: 'The appointment has been successfully cancelled.'
        });
        setSelectedAppointment(null);
        loadScheduleData();
      } else {
        setAlertModal({
          show: true,
          type: 'error',
          title: 'Cancellation Failed',
          message: result.error || 'Failed to cancel appointment. Please try again.'
        });
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setAlertModal({
        show: true,
        type: 'error',
        title: 'Network Error',
        message: 'Failed to cancel appointment. Please check your connection and try again.'
      });
    } finally {
      setCanceling(false);
    }
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment || !onEditAppointment) return;

    setSelectedAppointment(null);

    onEditAppointment(selectedAppointment);
  };

  const handleCheckInAppointment = async () => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) return;

    setCheckingIn(true);
    
    try {
      const response = await fetch('/receptionist_api/appointments/check-in.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          Appointment_id: selectedAppointment.appointment_id,
          nurse_id: 0, 
          validate_only: true
        })
      });
      
      const result = await response.json();

      if (!result.success) {
        if (result.error_type === 'INSURANCE_WARNING' || result.error_type === 'INSURANCE_EXPIRED') {
          
          const isExpired = result.error_type === 'INSURANCE_EXPIRED';
          
          const patientIdVal = selectedAppointment.Patient_id || selectedAppointment.patient_id || selectedAppointment.patientId || selectedAppointment.id || null;
          const patientFirstVal = selectedAppointment.Patient_First || selectedAppointment.patient_first || selectedAppointment.first_name || (selectedAppointment.patient_name ? selectedAppointment.patient_name.split(' ')[0] : '') || '';
          const patientLastVal = selectedAppointment.Patient_Last || selectedAppointment.patient_last || selectedAppointment.last_name || (selectedAppointment.patient_name ? selectedAppointment.patient_name.split(' ').slice(1).join(' ') : '') || '';

          setAlertModal({
            show: true,
            type: 'error',
            title: 'Cannot Check In - Insurance Issue',
            message: result.message || result.error,
            showAddInsurance: true,
            insuranceButtonText: isExpired ? 'Edit Insurance' : 'Add Insurance',
            insurancePatientData: {
              Patient_id: patientIdVal,
              Patient_First: patientFirstVal,
              Patient_Last: patientLastVal
            }
          });
          if (result.validation_token) setValidationToken(result.validation_token);
        } else {
          setAlertModal({
            show: true,
            type: 'error',
            title: 'Check-In Failed',
            message: result.error || 'Unknown error occurred'
          });
        }
        setCheckingIn(false);
        return;
      }

      if (result.insurance_warning) {
        setAlertModal({
          show: true,
          type: 'warning',
          title: 'Insurance Warning',
          message: result.insurance_warning
        });
        if (result.validation_token) setValidationToken(result.validation_token);
      }

      setCheckingIn(false);
      setLoadingNurses(true);
      setShowNurseModal(true);
      
      const nursesResponse = await fetch(`/receptionist_api/nurses/get-by-office.php?office_id=${officeId}`, {
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

  const handleConfirmCheckIn = async () => {
    if (!selectedAppointment || !selectedNurse) return;
    
    setCheckingIn(true);
    try {
      const response = await fetch('/receptionist_api/appointments/check-in.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          Appointment_id: selectedAppointment.appointment_id,
          nurse_id: selectedNurse,
          validation_token: validationToken
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        
        if (result.insurance_warning) {
          setAlertModal({
            show: true,
            type: 'warning',
            title: 'Patient Checked In - Insurance Warning',
            message: result.insurance_warning
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
        setValidationToken(null);
        loadScheduleData();
      } else {
        setAlertModal({
          show: true,
          type: 'error',
          title: 'Check-In Failed',
          message: result.error || 'Unknown error occurred'
        });
      }
    } catch (err) {
      console.error('Failed to check in patient:', err);
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

  const getStatusClass = (status) => {
    const normalizedStatus = (status || 'scheduled').toLowerCase();
    const statusMap = {
      'scheduled': 'status-scheduled',
      'waiting': 'status-waiting',
      'checked-in': 'status-checked-in',
      'checked in': 'status-checked-in',
      'in progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'canceled': 'status-cancelled',
      'no-show': 'status-noshow'
    };
    return statusMap[normalizedStatus] || 'status-scheduled';
  };

  const isSlotSelected = (doctorId, hour, minute) => {
    return selectedSlot === `${doctorId}-${hour}-${minute}`;
  };

  return (
    <div className="office-schedule-page">
      {}
      <div className="schedule-header">
        <div className="header-info">
          <h1 className="page-title">Doctor Availability</h1>
          <p className="page-subtitle">
            <Calendar size={18} />
            {officeName} • Select an available time slot
          </p>
        </div>
      </div>

      {}
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

      {}
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

      {}
      {doctors.length > 0 && uniqueSpecialties.length > 1 && (
        <div className="specialty-filter-section">
          <label className="filter-label">Filter by Specialty:</label>
          <select 
            className="specialty-filter-select"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="all">All Specialties ({doctors.length} doctors)</option>
            {uniqueSpecialties.map(specialty => {
              const count = doctors.filter(d => d.specialty_name === specialty).length;
              return (
                <option key={specialty} value={specialty}>
                  {specialty} ({count} {count === 1 ? 'doctor' : 'doctors'})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {}
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
        ) : filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <User size={64} />
            <h3>No Doctors Match Filter</h3>
            <p>No doctors available for the selected specialty. Try a different filter.</p>
            <button className="btn-primary" onClick={() => setSpecialtyFilter('all')}>
              Show All Doctors
            </button>
          </div>
        ) : (
          <div className="availability-grid">
            {}
            <div 
              className="grid-header"
              style={{ 
                gridTemplateColumns: `120px repeat(${filteredDoctors.length}, minmax(240px, 1fr))` 
              }}
            >
              <div className="time-column-header">
                <Clock size={18} />
                <span>Time</span>
              </div>
              {filteredDoctors.map(doctor => (
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

            {}
            <div className="grid-body">
              {timeSlots.map(({ hour, minute }) => (
                <div 
                  key={`${hour}-${minute}`} 
                  className="grid-row"
                  style={{ 
                    gridTemplateColumns: `120px repeat(${filteredDoctors.length}, minmax(240px, 1fr))` 
                  }}
                >
                  {}
                  <div className="time-cell">
                    <span className="time-label">{formatTimeSlot(hour, minute)}</span>
                  </div>

                  {}
                  {filteredDoctors.map(doctor => {
                    const status = getSlotStatus(doctor, hour, minute);
                    const isSelected = isSlotSelected(doctor.Doctor_id, hour, minute);

                    const appointmentForThisSlot = getAppointmentForSlot(doctor.Doctor_id, hour, minute);

                    return (
                      <div
                        key={`${doctor.Doctor_id}-${hour}-${minute}`}
                        className={`slot-cell ${status} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSlotClick(doctor, hour, minute, status)}
                        title={
                          status === 'available' ? 'Click to select this time slot' :
                          status === 'booked' && appointmentForThisSlot ?
                            `${appointmentForThisSlot.patient_name} — Dr. ${appointmentForThisSlot.doctor_name} — ID: ${appointmentForThisSlot.appointment_id}` :
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

                        {status === 'booked' && appointmentForThisSlot ? (
                          <div className="booked-content">
                            <div className="booked-patient" title={appointmentForThisSlot.patient_name}>
                              {appointmentForThisSlot.patient_name}
                            </div>
                            <div className="booked-meta">
                              Dr. {appointmentForThisSlot.doctor_name} • #{appointmentForThisSlot.appointment_id}
                            </div>
                          </div>
                        ) : (status === 'available' && !isSelected && (
                          <div className="hover-indicator">
                            Click to select
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {}
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

      {}
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
                className="btn btn-success"
                onClick={handleCheckInAppointment}
                disabled={checkingIn || selectedAppointment.status === 'Checked-in' || selectedAppointment.status === 'Cancelled' || selectedAppointment.status === 'Completed'}
              >
                <Check size={18} />
                {checkingIn ? 'Checking In...' : 'Check In'}
              </button>
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
      
      {}
      {showNurseModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowNurseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Select Nurse</h2>
                <p className="modal-subtitle">
                  Patient: {selectedAppointment.patient_name}
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
      
      {}
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
              {alertModal.showAddInsurance ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setInsurancePatient(alertModal.insurancePatientData);
                      setShowInsuranceModal(true);
                      setAlertModal({ ...alertModal, show: false });
                    }}
                  >
                    {alertModal.insuranceButtonText || 'Add Insurance'}
                  </button>
                  <button 
                    className="btn btn-ghost"
                    onClick={() => setAlertModal({ ...alertModal, show: false })}
                  >
                    Cancel
                  </button>
                </>
              ) : alertModal.confirmAction ? (
                <>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setAlertModal({ ...alertModal, show: false })}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`btn ${
                      alertModal.type === 'warning' ? 'btn-danger' : 'btn-primary'
                    }`}
                    onClick={alertModal.confirmAction}
                  >
                    Confirm
                  </button>
                </>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {showInsuranceModal && insurancePatient && (
        <AddInsuranceModal
          patient={insurancePatient}
          onClose={() => {
            setShowInsuranceModal(false);
            setInsurancePatient(null);
          }}
          onSuccess={() => {
            setShowInsuranceModal(false);
            setInsurancePatient(null);
            loadSchedule(); 
          }}
        />
      )}
    </div>
  );
}

export default OfficeSchedule;