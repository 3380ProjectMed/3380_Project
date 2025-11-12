import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './NurseSchedule.css';
import { getNurseSchedule } from '../../api/nurse';

// Helper: get days in month
function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
function getStartingDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export default function NurseSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const days = getDaysInMonth(currentDate);
        let all = [];
        for (let d = 1; d <= days; d++) {
          const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
          try {
            const apptsRaw = await getNurseSchedule({ date: dateStr });
            // Normalize payload: accept array or envelope { appointments: [] } or { schedule: [] }
            const appts = Array.isArray(apptsRaw) ? apptsRaw : (apptsRaw?.appointments || apptsRaw?.schedule || []);
            if (Array.isArray(appts) && appts.length > 0) {
              all = all.concat(appts.map(a => ({ ...a, _date: dateStr })));
            }
          } catch (err) {
            // Optionally log or handle per-day errors
          }
        }
        if (mounted) setAppointments(all);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load schedule');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentDate]);

  // Calendar helpers
  const days = Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1);
  const startingDay = getStartingDay(currentDate);

  // Group appointments by date
  const apptByDate = {};
  appointments.forEach(a => {
    if (!apptByDate[a._date]) apptByDate[a._date] = [];
    apptByDate[a._date].push(a);
  });

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Month/year display
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  return (
    <div className="nurse-page">
      <div className="nurse-schedule-page">
        <h1>My Schedule</h1>
        <div className="schedule-header">
          <div className="month-navigation">
            <button onClick={goToPreviousMonth} className="nav-arrow" aria-label="Previous month">
              <ChevronLeft size={24} />
            </button>
            <h2 className="month-title">{currentMonthName} {currentYear}</h2>
            <button onClick={goToNextMonth} className="nav-arrow" aria-label="Next month">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <div className="calendar-container">
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Loading appointments...
            </div>
          )}
          {error && (
            <div style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>{error}</div>
          )}
          <div className="calendar-grid">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
            {/* Empty cells before first day of month */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty-day"></div>
            ))}
            {/* Calendar Days */}
            {days.map(day => {
              const dateStr = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const appts = apptByDate[dateStr] || [];
              return (
                <div key={day} className={`calendar-day${appts.length === 0 ? ' no-appts' : ''}`}>
                  <div className="day-header">
                    <span className="day-number">{day}</span>
                  </div>
                  <div className="day-content">
                    {appts.length === 0 ? (
                      <p className="no-appointments">No appointments</p>
                    ) : (
                      <div className="appointments">
                        {appts.map((a, i) => (
                          <div key={a.id ?? a.appointmentId ?? i} className="appointment-item">
                            <p className="appointment-time">{a.time ? a.time.substring(0,5) : ''}</p>
                            <p className="appointment-patient">{a.patientName || '-'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
