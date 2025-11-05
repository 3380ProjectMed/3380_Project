import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Schedule.css';

/**
 * Schedule Component
 * 
 * Displays a monthly calendar view with doctor's appointments
 * Features:
 * - Monthly navigation (previous/next)
 * - Location-based filtering (dynamic from work schedule)
 * - Real-time data from API
 * - Appointment display with time and patient name
 * - Weekend highlighting based on work schedule
 */
function Schedule({ onAppointmentClick }) {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [workSchedule, setWorkSchedule] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch work schedule on component mount
  useEffect(() => {
    fetchWorkSchedule();
    fetchAppointments();
  }, []);

  // Refetch appointments when month changes
  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  /**
   * Fetch doctor's work schedule from API
   */
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

  /**
   * Fetch appointments for current month
   */
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1; // JS months are 0-indexed
      const year = currentDate.getFullYear();
  const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
  const response = await fetch(`${API_BASE}/doctor_api/appointments/get-by-month.php?month=${month}&year=${year}`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        // The backend groups appointments by date. Flatten into a single array for easier filtering.
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

  /**
   * Get the day of week name from a date
   */
  const getDayOfWeekName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  /**
   * Get assigned location for a specific day based on work schedule
   */
// Around line 118 - Fix getDailyLocation function
const getDailyLocation = (year, month, day) => {
  const date = new Date(year, month, day);
  const dayOfWeekName = getDayOfWeekName(date);
  
  // Find work schedule entry for this day of week
  const scheduleEntry = workSchedule.find(
    s => (s.day_of_week || s.Day_of_week) === dayOfWeekName  // ← Handle both cases
  );
  
  if (!scheduleEntry) {
    return null; // Not working this day
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

// Around line 145 - Fix getUniqueLocations function
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

  /**
   * Get appointments for a specific day
   */
  const getAppointmentsForDay = (day) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const assignedLocation = getDailyLocation(year, month, day);
    
    // No appointments if not working
    if (!assignedLocation) return [];
    
    // Filter appointments by date
    let dayAppointments = appointments.filter(app => {
      const appDate = new Date(app.appointment_date);
      return appDate.getDate() === day &&
             appDate.getMonth() === month &&
             appDate.getFullYear() === year;
    });

    // Apply location filter if not "all"
    if (selectedLocation !== 'all') {
      dayAppointments = dayAppointments.filter(app => {
        return app.office_id === parseInt(selectedLocation);
      });
    }

    return dayAppointments;
  };

  /**
   * Check if day should be visible based on location filter
   */
  const isDayVisible = (day) => {
    const assignedLocation = getDailyLocation(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      day
    );
    
    // Always show non-working days (they're already grayed out)
    if (!assignedLocation) return true;
    
    // Show all locations
    if (selectedLocation === 'all') return true;
    
    // Filter by selected location
    return assignedLocation.office_id === parseInt(selectedLocation);
  };

  /**
   * Get display name for location badge
   */
  const getLocationBadge = (location) => {
    // Extract name or use short name
    if (location.name) {
      return location.name;
    }
    // Fallback to abbreviation of office name
    return location.office_name.split(' ').map(w => w[0]).join('').toUpperCase();
  };

  /**
   * Navigation handlers
   */
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

  /**
   * Handle appointment click
   */
  const handleAppointmentClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getStartingDay = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Get month name and year for display
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Generate array of days in month
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
      {/* ===== HEADER WITH MONTH NAVIGATION ===== */}
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

      {/* ===== LOCATION FILTER ===== */}
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

      {/* ===== CALENDAR GRID ===== */}
      <div className="calendar-container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading appointments...
          </div>
        )}
        
        <div className="calendar-grid">
          {/* Weekday Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
          
          {/* Empty cells before first day of month */}
          {Array.from({ length: getStartingDay(currentDate) }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty-day"></div>
          ))}
          
          {/* Calendar Days */}
          {days.map(day => {
            const assignedLocation = getDailyLocation(
              currentDate.getFullYear(), 
              currentDate.getMonth(), 
              day
            );
            const isNotWorking = !assignedLocation;
            const appointments = getAppointmentsForDay(day);
            const isVisible = isDayVisible(day);
            
            return (
              <div 
                key={day} 
                className={`calendar-day ${isNotWorking ? 'weekend' : ''} ${!isVisible && !isNotWorking ? 'filtered' : ''}`}
              >
                {/* Day Header */}
                <div className="day-header">
                  <span className="day-number">{day}</span>
                  
                  {/* Location Badge */}
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
                
                {/* Day Content */}
                <div className="day-content">
                  {isNotWorking ? (
                    <p className="no-appointments">Off</p>
                  ) : appointments.length > 0 ? (
                    <div className="appointments">
                      {appointments.map(app => (
                        <div 
                          key={app.appointment_id} 
                          className="appointment-item"
                          onClick={() => handleAppointmentClick(app)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleAppointmentClick(app);
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