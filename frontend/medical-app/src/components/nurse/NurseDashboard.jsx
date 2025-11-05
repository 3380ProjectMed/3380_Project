import React, { useEffect, useState } from 'react';
import { Calendar, Users, Clock, FileText, Search, Filter } from 'lucide-react';
import './NurseDashboard.css';
import { getNurseDashboardStats, getNurseScheduleToday } from '../../api/nurse';

export default function NurseDashboard({ setCurrentPage, onAppointmentClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const s = await getNurseDashboardStats(today).catch(() => null);
        if (s && mounted) {
          setStats({ total: s.totalAppointments ?? 0, waiting: s.waitingCount ?? 0, pending: s.upcomingCount ?? 0, completed: s.completedCount ?? 0 });
        }

        const appts = await getNurseScheduleToday().catch(() => []);
        if (mounted) setAppointments(Array.isArray(appts) ? appts : []);
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter((app) => {
    const patientName = app?.patientName ?? '';
    const reason = app?.reason ?? '';
    const status = (app?.status || '').toString();

    const matchesSearch = (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesFilter = filterStatus === 'all' || status.toLowerCase().replace(/\s+/g, '-') === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    const statusMap = {
      'scheduled': 'status-scheduled',
      'waiting': 'status-waiting',
      'in waiting': 'status-waiting',
      'in consultation': 'status-consultation',
      'completed': 'status-completed'
    };
    return statusMap[s] || '';
  };

  const handleAppointmentRowClick = (appointment) => {
    if (onAppointmentClick) onAppointmentClick(appointment);
    if (setCurrentPage) setCurrentPage('clinical');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome Back, Nurse</h1>
          <p className="office-info">
            <Calendar size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {new Date().toLocaleDateString()} • <span>Main Clinic, Suite 305</span>
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><Calendar size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.waiting}</div>
            <div className="stat-label">Patients Waiting</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Upcoming Today</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon"><FileText size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button className="action-btn" onClick={() => setCurrentPage && setCurrentPage('patients')}>
          <Users size={18} /> View All Patients
        </button>
        <button className="action-btn" onClick={() => setCurrentPage && setCurrentPage('schedule')}>
          <Calendar size={18} /> Full Schedule
        </button>
        <button className="action-btn" onClick={() => setCurrentPage && setCurrentPage('clinical')}>
          <FileText size={18} /> Clinical / Intake
        </button>
      </div>

      <div className="schedule-section">
        <div className="section-header">
          <h2>Today's Schedule</h2>
          <div className="section-controls">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} aria-label="Search appointments" />
            </div>
            <div className="filter-box">
              <Filter size={18} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-waiting">In Waiting</option>
                <option value="in-consultation">In Consultation</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="appointments-table">
          <div className="table-header">
            <div className="col-time">TIME</div>
            <div className="col-patient">PATIENT'S NAME</div>
            <div className="col-reason">REASON FOR VISIT</div>
            <div className="col-status">STATUS</div>
          </div>

          <div className="table-body">
            {loading && <div className="empty-state">Loading…</div>}
            {!loading && Array.isArray(filteredAppointments) && filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment, idx) => (
                <div key={appointment.appointmentId ?? idx} className="table-row" role="button" tabIndex={0} onClick={() => handleAppointmentRowClick(appointment)} onKeyPress={(e) => e.key === 'Enter' && handleAppointmentRowClick(appointment)}>
                  <div className="col-time">{appointment.time ?? ''}</div>
                  <div className="col-patient"><span className="patient-link">{appointment.patientName ?? 'Unknown'}</span></div>
                  <div className="col-reason">{appointment.reason ?? ''}</div>
                  <div className="col-status"><span className={`status-badge ${getStatusClass(appointment.status)}`}>{appointment.status ?? ''}</span></div>
                </div>
              ))
            ) : (
              <div className="empty-state"><Calendar size={48} /><p>{error ? error : 'No appointments match your search'}</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
