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
      const data = await getNurseScheduleToday();
      
      console.log('Schedule data:', data);
      
      const scheduleData = data?.schedule || data || [];
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
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
              schedule.map((shift, i) => (
                <div key={i} className="row">
                  <div>{shift.day_of_week || 'N/A'}</div>
                  <div>
                    {shift.start_time || '??'} - {shift.end_time || '??'}
                  </div>
                  <div>-</div>
                  <div>
                    {shift.office_name || `Office ${shift.office_id || ''}`}
                    {shift.address && ` - ${shift.address}, ${shift.city}, ${shift.state}`}
                  </div>
                  <div>Regular Shift</div>
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
