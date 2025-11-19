import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Schedule.css';
import DayAppointmentsModal from './DayAppointmentsModal';

/**
 * Schedule Component - FIXED VERSION
 * 
 * Features:
 * - Monthly calendar view with LARGER day boxes
 * - Location badges for each working day
 * - Today's date highlighted with blue circle (19)
 * - Click on day → Shows modal with list of ALL appointments
 * - Click on individual appointment → Opens directly
 * - Location filtering
 * - Scrollable appointment lists
 * 
 * BUG FIX: Corrected date handling to show appointments on the correct day
 */
function Schedule({ onAppointmentClick }) {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [workSchedule, setWorkSchedule] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state for showing day appointments
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);

  useEffect(() => {
    fetchWorkSchedule();
    fetchAppointments();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchWorkSchedule = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/doctor_api/schedule/get-doctor-schedule.php`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setWorkSchedule(data.schedule);
      } else {
        setError(data.error || 'Failed to load work schedule');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      const response = await fetch(`${API_BASE}/doctor_api/appointments/get-by-month.php?month=${month}&year=${year}`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        const grouped = data.appointments || {};
        const flat = [];
        Object.keys(grouped).forEach(date => {
          grouped[date].forEach(a => {
            flat.push({
              appointment_id: a.id,
              appointment_date: a.appointment_date,
              appointment_time: a.appointment_time,
              patient_name: a.patientName || a.patient_name || 'Patient',
              office_id: a.office_id || a.officeId || null,
              office_name: a.location || a.location_name || a.office_name || '',
              reason: a.reason || ''
            });
          });
        });
        setAppointments(flat);
      } else {
        setError(data.error || 'Failed to load appointments');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeekName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getDailyLocation = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayOfWeekName = getDayOfWeekName(date);
    
    const scheduleEntry = workSchedule.find(
      s => (s.day_of_week || s.Day_of_week) === dayOfWeekName
    );
    
    if (!scheduleEntry) {
      return null;
    }
    
    return {
      office_id: scheduleEntry.office_id || scheduleEntry.Office_ID,
      office_name: scheduleEntry.office_name,
      address: scheduleEntry.address,
      city: scheduleEntry.city || scheduleEntry.City,
      state: scheduleEntry.state || scheduleEntry.State,
      start_time: scheduleEntry.start_time || scheduleEntry.Start_time,
      end_time: scheduleEntry.end_time || scheduleEntry.End_time
    };
  };

  const getUniqueLocations = () => {
    const locations = new Map();
    workSchedule.forEach(schedule => {
      const officeId = schedule.office_id || schedule.Office_ID;
      const officeName = schedule.office_name;
      const city = schedule.city || schedule.City;
      
      if (!locations.has(officeId)) {
        locations.set(officeId, {
          id: officeId,
          name: officeName,
          city: city
        });
      }
    });
    return Array.from(locations.values());
  };

  const getAppointmentsForDay = (day) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const assignedLocation = getDailyLocation(year, month, day);
    
    if (!assignedLocation) return [];
    
    // FIX: Parse appointment dates more carefully to avoid timezone issues
    let dayAppointments = appointments.filter(app => {
      // Parse the appointment date string (format: YYYY-MM-DD)
      const appDateStr = app.appointment_date;
      if (!appDateStr) return false;
      
      // Extract year, month, day from the string directly
      const [appYear, appMonth, appDay] = appDateStr.split('T')[0].split('-').map(Number);
      
      // Compare with calendar day (month is 0-indexed in currentDate.getMonth())
      return appDay === day &&
             appMonth === month + 1 && // appMonth is 1-12, month is 0-11
             appYear === year;
    });

    if (selectedLocation !== 'all') {
      dayAppointments = dayAppointments.filter(app => {
        return app.office_id === parseInt(selectedLocation);
      });
    }

    return dayAppointments;
  };

  const isDayVisible = (day) => {
    const assignedLocation = getDailyLocation(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      day
    );
    
    if (!assignedLocation) return true;
    if (selectedLocation === 'all') return true;
    
    return assignedLocation.office_id === parseInt(selectedLocation);
  };

  const getLocationBadge = (location) => {
    if (location.office_name) {
      const words = location.office_name.split(' ');
      if (words.length > 1) {
        return words.map(w => w[0]).join('').toUpperCase();
      }
      return location.office_name.substring(0, 3).toUpperCase();
    }
    return 'LOC';
  };

  // FIXED: Show modal instead of opening first appointment
  const handleDayClick = (day, e) => {
    // Check if the click was on an appointment item
    if (e.target.closest('.appointment-item')) {
      return; // Let the appointment click handler deal with it
    }
    
    const dayAppointments = getAppointmentsForDay(day);
    
    if (dayAppointments.length === 0) {
      return; // Don't show modal if no appointments
    }
    
    // Show modal with all appointments for this day
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Convert to 1-12 for display
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDay(dateStr);
    setSelectedDayAppointments(dayAppointments);
    setShowDayModal(true);
  };

  const handleAppointmentClick = (appointment, e) => {
    e.stopPropagation();
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth() - 1, 
      1
    ));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth() + 1, 
      1
    ));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getStartingDay = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  const days = Array.from(
    { length: getDaysInMonth(currentDate) },
    (_, i) => i + 1
  );

  const uniqueLocations = getUniqueLocations();

  if (error) {
    return (
      <div className="schedule">
        <div className="error-message" style={{
          padding: '2rem',
          backgroundColor: '#fee',
          borderRadius: '0.5rem',
          color: '#c00'
        }}>
          <h2>Error Loading Schedule</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule">
      {/* Day Appointments Modal */}
      <DayAppointmentsModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        date={selectedDay}
        appointments={selectedDayAppointments}
        onAppointmentClick={onAppointmentClick}
      />
      
      <div className="schedule-header">
        <div className="month-navigation">
          <button 
            onClick={goToPreviousMonth} 
            className="nav-arrow"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} />
          </button>
          
          <h1 className="month-title">
            {currentMonthName} {currentYear}
          </h1>
          
          <button 
            onClick={goToNextMonth} 
            className="nav-arrow"
            aria-label="Next month"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {uniqueLocations.length > 1 && (
        <div className="filter-section">
          <label htmlFor="location-filter">Filter Location:</label>
          <select 
            id="location-filter"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="location-select"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.city && `- ${loc.city}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="calendar-container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading appointments...
          </div>
        )}
        
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
          
          {Array.from({ length: getStartingDay(currentDate) }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty-day"></div>
          ))}
          
          {days.map(day => {
            const assignedLocation = getDailyLocation(
              currentDate.getFullYear(), 
              currentDate.getMonth(), 
              day
            );
            const isNotWorking = !assignedLocation;
            const dayAppointments = getAppointmentsForDay(day);
            const isVisible = isDayVisible(day);
            
            const today = new Date();
            const isToday = day === today.getDate() && 
                           currentDate.getMonth() === today.getMonth() && 
                           currentDate.getFullYear() === today.getFullYear();
            
            const dayClasses = [
              'calendar-day',
              isNotWorking ? 'weekend' : '',
              !isVisible && !isNotWorking ? 'filtered' : '',
              isToday ? 'today' : ''
            ].filter(Boolean).join(' ');
            
            return (
              <div 
                key={day} 
                className={dayClasses}
                onClick={(e) => !isNotWorking && handleDayClick(day, e)}
                style={{ 
                  cursor: !isNotWorking && dayAppointments.length > 0 ? 'pointer' : 'default' 
                }}
              >
                <div className="day-header">
                  <span className="day-number">{day}</span>
                  
                  {assignedLocation && (
                    <span 
                      className="location-badge"
                      style={{
                        backgroundColor: `hsl(${(assignedLocation.office_id * 137) % 360}, 70%, 85%)`,
                        color: `hsl(${(assignedLocation.office_id * 137) % 360}, 70%, 25%)`
                      }}
                      title={`${assignedLocation.office_name} - ${assignedLocation.city}, ${assignedLocation.state}`}
                    >
                      {getLocationBadge(assignedLocation)}
                    </span>
                  )}
                </div>
                
                <div className="day-content">
                  {isNotWorking ? (
                    <p className="no-appointments">Off</p>
                  ) : dayAppointments.length > 0 ? (
                    <div className="appointments">
                      {dayAppointments.map(app => (
                        <div 
                          key={app.appointment_id} 
                          className="appointment-item"
                          onClick={(e) => handleAppointmentClick(app, e)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              handleAppointmentClick(app, e);
                            }
                          }}
                        >
                          <p className="appointment-time">
                            {app.appointment_time ? app.appointment_time.substring(0, 5) : 'TBD'}
                          </p>
                          <p className="appointment-patient">
                            {app.patient_name || 'Patient'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-appointments">
                      {isVisible ? 'No appointments' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Schedule;