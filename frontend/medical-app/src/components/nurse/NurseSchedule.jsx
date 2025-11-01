import React, { useEffect, useState } from "react";
import "./NurseSchedule.css";
import { getNurseScheduleToday } from '../../api/nurse';

export default function NurseSchedule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  async function loadSchedule() {
    setLoading(true);
    setError(null);
    try {
      const data = await getNurseScheduleToday().catch(() => []);
      setRows(data || []);
    } catch (e) {
      setError(e && e.data && e.data.error === 'NURSE_NOT_FOUND' ? 'No nurse record is associated with this account.' : (e.message || 'Failed to load schedule'));
    } finally { setLoading(false); }
  }

  useEffect(() => { loadSchedule(); }, []);

  return (
    <div className="nurse-page">
      <div className="nurse-schedule-page">
        <h1>My Schedule</h1>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => loadSchedule()}>Retry</button>
        </div>
        <div className="nurse-table">
          <div className="thead">
            <div>Date</div><div>Time</div><div>Patient</div><div>Location</div><div>Reason</div>
          </div>
          <div className="tbody">
            {rows.length ? rows.map((r, i) => (
              <div key={i} className="row">
                <div>{new Date(r.time).toLocaleDateString()}</div>
                <div>{new Date(r.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div>{r.patientName}</div>
                <div>{r.location || ''}</div>
                <div>{r.reason}</div>
              </div>
            )) : (
              <div className="empty">{loading ? 'Loading...' : (error || 'No schedule found for your location today')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
