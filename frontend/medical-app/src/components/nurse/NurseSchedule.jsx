import React, { useEffect, useState } from "react";
import "./NurseSchedule.css";
import { getNurseScheduleToday } from '../../api/nurse';

export default function NurseSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getNurseScheduleToday();
      setSchedule(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Schedule error:', e);
      setError(e.message || 'Failed to load schedule');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  return (
    <div className="nurse-page">
      <div className="nurse-schedule-page">
        <h1>My Schedule</h1>
        
        {error && (
          <div style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <button onClick={loadSchedule} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Schedule'}
          </button>
        </div>

        <div className="nurse-table">
          <div className="thead">
            <div>Day</div>
            <div>Time</div>
            <div>Patient</div>
            <div>Location</div>
            <div>Reason</div>
          </div>
          <div className="tbody">
            {loading ? (
              <div className="empty">Loading schedule...</div>
            ) : schedule.length > 0 ? (
              schedule.map((a, i) => {
                const time = a.time || a.appointment_time || a.datetime || '';
                let day = '-';
                let timeStr = '-';
                try {
                  const dt = new Date(time);
                  day = dt.toLocaleDateString(undefined, { weekday: 'long' });
                  timeStr = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                } catch (e) {}
                return (
                  <div key={a.id ?? a.appointmentId ?? i} className="row">
                    <div>{day}</div>
                    <div>{timeStr}</div>
                    <div>{a.patientName || a.patient_name || '-'}</div>
                    <div>{a.office_name || (a.location && a.location.office_name) || '-'}</div>
                    <div>{a.reason || 'Visit'}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty">No schedule</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
