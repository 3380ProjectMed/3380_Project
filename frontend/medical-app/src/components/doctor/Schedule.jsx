import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Schedule.css';
/**
 * Schedule Component
 * 
 * Displays a monthly calendar view with doctor's appointments
 * Features:
 * - Monthly navigation (previous/next)
 * - Location-based filtering (Main Clinic / Satellite Office)
 * - Automatic location assignment by day of week
 * - Appointment display with time and patient name
 * - Weekend highlighting
 * 
 * Props:
 * @param {Function} onAppointmentClick - Handler when appointment is clicked
 */
function Schedule({ onAppointmentClick }) {
  // Current month being displayed
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // October 2025
  
  // Location filter state
  const [selectedLocation, setSelectedLocation] = useState('all');

  /**
   * Mock appointments data
   * TODO: Replace with API call to fetch appointments
   * API endpoint: GET /api/appointments?month=10&year=2025
   */
  const mockAppointments = [
    { 
      id: 'A001', 
      time: '09:00', 
      patientName: 'Sarah Connor', 
      date: '2025-10-01', 
      location: 'Main Clinic - Suite A',
      reason: 'Follow-up'
    },
    { 
      id: 'A002', 
      time: '14:00', 
      patientName: 'John Doe', 
      date: '2025-10-01', 
      location: 'Main Clinic - Suite A',
      reason: 'Annual Physical'
    },
    { 
      id: 'A003', 
      time: '10:30', 
      patientName: 'Jane Smith', 
      date: '2025-10-07', 
      location: 'Satellite Office - Bldg B',
      reason: 'New Patient'
    },
    { 
      id: 'A004', 
      time: '11:00', 
      patientName: 'Michael Lee', 
      date: '2025-10-08', 
      location: 'Main Clinic - Suite A',
      reason: 'Lab Results'
    },
    { 
      id: 'A005', 
      time: '15:30', 
      patientName: 'Emma Wilson', 
      date: '2025-10-15', 
      location: 'Main Clinic - Suite A',
      reason: 'Consultation'
    },
    { 
      id: 'A006', 
      time: '09:30', 
      patientName: 'David Brown', 
      date: '2025-10-21', 
      location: 'Satellite Office - Bldg B',
      reason: 'Follow-up'
    },
  ];

  /**
   * Calendar Helper Functions
   */
  
  // Get number of days in the current month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get the starting day of week for the month (0 = Sunday)
  const getStartingDay = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  /**
   * Get assigned location for a specific day
   * Schedule pattern:
   * - Monday, Wednesday, Friday = Main Clinic
   * - Tuesday, Thursday = Satellite Office
   * - Saturday, Sunday = Weekend (no clinic)
   */
  const getDailyLocation = (year, month, day) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    
    // 1=Mon, 3=Wed, 5=Fri
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      return 'Main Clinic - Suite A';
    } 
    // 2=Tue, 4=Thu
    else if (dayOfWeek === 2 || dayOfWeek === 4) {
      return 'Satellite Office - Bldg B';
    }
    // 0=Sun, 6=Sat
    return null; // Weekend
  };

  /**
   * Get appointments for a specific day
   * Filters by date and applies location filter if selected
   */
  const getAppointmentsForDay = (day) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const assignedLocation = getDailyLocation(year, month, day);
    
    // No appointments on weekends
    if (!assignedLocation) return [];
    
    // Filter appointments by date
    let dayAppointments = mockAppointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate.getDate() === day &&
             appDate.getMonth() === month &&
             appDate.getFullYear() === year;
    });

    // Apply location filter if not "all"
    if (selectedLocation !== 'all') {
      dayAppointments = dayAppointments.filter(app => {
        if (selectedLocation === 'main') {
          return app.location.includes('Main Clinic');
        } else if (selectedLocation === 'satellite') {
          return app.location.includes('Satellite Office');
        }
        return true;
      });
    }

    return dayAppointments;
  };

  /**
   * Check if day should be filtered out based on location filter
   * Returns true if day should be shown, false if it should be dimmed
   */
  const isDayVisible = (day) => {
    const assignedLocation = getDailyLocation(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      day
    );
    
    // Always show weekends
    if (!assignedLocation) return true;
    
    // Show all locations
    if (selectedLocation === 'all') return true;
    
    // Filter by selected location
    if (selectedLocation === 'main') {
      return assignedLocation.includes('Main Clinic');
    } else if (selectedLocation === 'satellite') {
      return assignedLocation.includes('Satellite Office');
    }
    
    return true;
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
   * Navigate to clinical workspace with selected appointment
   */
  const handleAppointmentClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  // Get month name and year for display
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Generate array of days in month
  const days = Array.from(
    { length: getDaysInMonth(currentDate) },
    (_, i) => i + 1
  );

  return (
    <div className="schedule">
      {/* ===== HEADER WITH MONTH NAVIGATION ===== */}
      <div className="schedule-header">
        <div className="month-navigation">
          {/* Previous Month Button */}
          <button 
            onClick={goToPreviousMonth} 
            className="nav-arrow"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} />
          </button>
          
          {/* Current Month Display */}
          <h1 className="month-title">
            {currentMonthName} {currentYear}
          </h1>
          
          {/* Next Month Button */}
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
      <div className="filter-section">
        <label htmlFor="location-filter">Filter Location:</label>
        <select 
          id="location-filter"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="location-select"
        >
          <option value="all">All Locations</option>
          <option value="main">Main Clinic - Suite A</option>
          <option value="satellite">Satellite Office - Bldg B</option>
        </select>
      </div>

      {/* ===== CALENDAR GRID ===== */}
      <div className="calendar-container">
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
            const dayDate = new Date(
              currentDate.getFullYear(), 
              currentDate.getMonth(), 
              day
            );
            const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
            const assignedLocation = getDailyLocation(
              currentDate.getFullYear(), 
              currentDate.getMonth(), 
              day
            );
            const appointments = getAppointmentsForDay(day);
            const isVisible = isDayVisible(day);
            
            return (
              <div 
                key={day} 
                className={`calendar-day ${isWeekend ? 'weekend' : ''} ${!isVisible && !isWeekend ? 'filtered' : ''}`}
              >
                {/* Day Header (number + location badge) */}
                <div className="day-header">
                  <span className="day-number">{day}</span>
                  
                  {/* Location Badge (only on weekdays) */}
                  {assignedLocation && (
                    <span 
                      className={`location-badge ${
                        assignedLocation.includes('Main') 
                          ? 'main-clinic' 
                          : 'satellite-office'
                      }`}
                    >
                      {assignedLocation.includes('Main') 
                        ? 'Main' 
                        : 'Satellite'}
                    </span>
                  )}
                </div>
                
                {/* Day Content (appointments) */}
                <div className="day-content">
                  {isWeekend ? (
                    // Weekend message
                    <p className="no-appointments">Weekend Off</p>
                  ) : appointments.length > 0 ? (
                    // Show appointments
                    <div className="appointments">
                      {appointments.map(app => (
                        <div 
                          key={app.id} 
                          className="appointment-item"
                          onClick={() => handleAppointmentClick(app)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleAppointmentClick(app);
                          }}
                        >
                          <p className="appointment-time">{app.time}</p>
                          <p className="appointment-patient">{app.patientName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // No appointments message
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