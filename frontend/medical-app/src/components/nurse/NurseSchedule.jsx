import React, { useState, useEffect } from 'react';
import './NurseSchedule.css';
import { getNurseScheduleToday } from '../../api/nurse';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalizeDayName(d) {
  if (!d && d !== 0) return null;
  // If numeric (0=Sunday?), try to map
  if (typeof d === 'number') {
    // If stored as 0=Sunday, shift to Monday..Sunday mapping
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return names[d];
  }
  // Normalize common short names
  const dd = String(d).toLowerCase();
  if (dd.startsWith('mon')) return 'Monday';
  if (dd.startsWith('tue')) return 'Tuesday';
  if (dd.startsWith('wed')) return 'Wednesday';
  if (dd.startsWith('thu')) return 'Thursday';
  if (dd.startsWith('fri')) return 'Friday';
  if (dd.startsWith('sat')) return 'Saturday';
  if (dd.startsWith('sun')) return 'Sunday';
  // If it's full name already
  return d;
}

function formatTime(t) {
  if (!t) return '';
  // accept HH:MM:SS or HH:MM
  const m = String(t).match(/(\d{1,2}):(\d{2})(:?\d{0,2})?/);
  if (!m) return t;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = ((hh + 11) % 12) + 1;
  return `${hh}:${mm} ${ampm}`;
}

export default function NurseSchedule() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getNurseScheduleToday();
        // Expect { schedule: [...] } or { data: ... }
        const raw = data?.schedule || data?.data || data || [];
        if (!Array.isArray(raw)) {
          setShifts([]);
        } else {
          // normalize day names
          const normalized = raw.map(s => ({
            day_of_week: normalizeDayName(s.day_of_week ?? s.day ?? s.weekday),
            start_time: s.start_time || s.start || s.startTime,
            end_time: s.end_time || s.end || s.endTime,
            office_name: s.office_name || s.office || s.location || '',
            address: s.address || s.addr || '',
            city: s.city || '',
            state: s.state || ''
          }));
          if (mounted) setShifts(normalized);
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load work schedule');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Build a map day => array of shifts
  const shiftsByDay = {};
  WEEK_DAYS.forEach(d => { shiftsByDay[d] = []; });
  shifts.forEach(s => {
    const d = s.day_of_week || null;
    if (d && shiftsByDay[d]) shiftsByDay[d].push(s);
  });

  return (
    <div className="nurse-page">
      <div className="nurse-schedule-page">
        <h1>My Work Schedule</h1>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading schedule...
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>{error}</div>
        )}

        {!loading && !error && (
          <div className="schedule-table">
            <div className="schedule-row header">
              <div className="col day">Day</div>
              <div className="col hours">Shift Hours</div>
              <div className="col location">Location</div>
            </div>
            {WEEK_DAYS.map(day => {
              const dayShifts = shiftsByDay[day] || [];
              if (dayShifts.length === 0) {
                return (
                  <div key={day} className="schedule-row">
                    <div className="col day">{day}</div>
                    <div className="col hours">Off</div>
                    <div className="col location">-</div>
                  </div>
                );
              }
              // Render first shift; if multiple, join
              const hours = dayShifts.map(s => `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`).join(' / ');
              const loc = dayShifts.map(s => {
                const parts = [s.office_name, s.address, s.city, s.state].filter(Boolean);
                return parts.join(', ');
              }).join(' / ');

              return (
                <div key={day} className="schedule-row">
                  <div className="col day">{day}</div>
                  <div className="col hours">{hours}</div>
                  <div className="col location">{loc}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
