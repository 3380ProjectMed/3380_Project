import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Search } from 'lucide-react';
import '../doctor/Report.css';

export default function AdminReport() {
  const [filters, setFilters] = useState({
    StartDate: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
    EndDate: new Date().toISOString().split('T')[0]
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchReport(); }, [filters]);

  const fetchReport = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/doctor_api/reports/get-appointment-report.php?${params}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        setError(`Server returned ${res.status}: ${text.slice(0,500)}`);
        return;
      }
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setAppointments((data.data && data.data.appointments) || []);
        } else {
          setError(data.error || 'Failed to fetch report');
        }
      } else {
        const text = await res.text();
        setError('Invalid JSON response: ' + text.slice(0,500));
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="reports-page">
      <div className="report-view">
        <div className="report-header">
          <div>
            <h2><Calendar className="selector-icon"/> Admin Reports</h2>
            <p className="report-subtitle">Appointment and visit reports</p>
          </div>
          <div className="report-header-actions">
            <button className="btn-export" onClick={() => { /* simple CSV export */ }} disabled={!appointments.length}><Download/> Export CSV</button>
          </div>
        </div>

        <div className="report-section">
          {loading ? <div style={{padding:24}}>Loading…</div> : error ? <div style={{padding:24,color:'red'}}>{error}</div> : (
            <div className="risk-table">
              <div className="table-header">
                <div>Date</div><div>Time</div><div>Patient</div><div>Office</div><div>Status</div><div>Reason</div>
              </div>
              {appointments.map(a => (
                <div className="table-row" key={a.Appointment_id || a.appointment_id}>
                  <div>{a.Appointment_date || a.appointment_date}</div>
                  <div>{a.Appointment_time || a.appointment_time || 'N/A'}</div>
                  <div style={{fontWeight:700}}>{a.patient_name}</div>
                  <div>{a.office_name}</div>
                  <div><span className="risk-badge">{a.Status}</span></div>
                  <div>{a.Reason || a.Reason_for_visit || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
