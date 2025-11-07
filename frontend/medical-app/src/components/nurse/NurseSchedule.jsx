import React, { useEffect, useState } from "react";
import "./NurseSchedule.css";
import { getNurseSchedule } from '../../api/nurse';

export default function NurseSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const appts = await getNurseSchedule({ date: today });
      const list = Array.isArray(appts) ? appts : (appts?.appointments || []);
      setSchedule(list);
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
              schedule.map((a, i) => (
                <div key={a.appointmentId ?? i} className="row">
                  <div>{new Date(a.time).toLocaleDateString()}</div>
                  <div>{new Date(a.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  <div>{a.patientName || '-'}</div>
                  <div>-</div>
                  <div>{a.reason || 'Visit'}</div>
                </div>
              ))
            ) : (
              <div className="empty">No schedule</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
