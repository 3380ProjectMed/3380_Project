import React, { useEffect, useState } from "react";
import "./NurseSchedule.css";
import { getNurseSchedule } from '../../api/nurse';

export default function NurseSchedule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0,10);
  const data = await getNurseSchedule({ date: today }).catch(() => []);
  if (mounted) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load schedule');
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="nurse-page">
      <div className="nurse-schedule-page">
        <h1>My Schedule</h1>
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
              <div className="empty">{loading ? 'Loading...' : (error || 'No schedule')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
