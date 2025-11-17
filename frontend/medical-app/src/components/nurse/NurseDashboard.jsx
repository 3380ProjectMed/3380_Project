import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, FileText, Search, Filter } from 'lucide-react';
import './NurseDashboard.css';
import { getNurseDashboardStats, getNurseScheduleToday, getNurseProfile } from '../../api/nurse';

export default function NurseDashboard({ setCurrentPage }) {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nurseName, setNurseName] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [s, appts, profile] = await Promise.all([
          getNurseDashboardStats(today),
          getNurseScheduleToday(),
          getNurseProfile()
        ]);
        
        if (mounted && s) {
          setStats({
            total: s.total,
            waiting: s.waiting,
            upcoming: s.upcoming,
            completed: s.completed
          });
        }
        
        if (mounted) setAppointments(Array.isArray(appts) ? appts : []);
        if (mounted && profile && profile.lastName) setNurseName(profile.lastName);
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Filter and search
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      (apt.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (apt.status || '').toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'waiting': 'status-waiting',
      'in progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no-show': 'status-no-show',
      'upcoming': 'status-upcoming',
      'ready': 'status-ready',
    };
    return statusMap[(status || '').toLowerCase()] || 'status-scheduled';
  };

  const handleAppointmentRowClick = (appointment) => {
    // Click appointment → Go to schedule page
    // The schedule page will handle opening the vitals form
    if (setCurrentPage) setCurrentPage('schedule');
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      {/* ===== WELCOME HEADER ===== */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome, Nurse{nurseName ? ` ${nurseName}` : ''}</h1>
          <p className="office-info">
            <Calendar size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {getCurrentDate()} • <span>Main Clinic, Suite 305</span>
          </p>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.waiting}</div>
            <div className="stat-label">Patients Waiting</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming Today</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="quick-actions">
        <button
          className="action-btn action-primary"
          onClick={() => setCurrentPage && setCurrentPage('schedule')}
        >
          <Calendar size={18} />
          View My Schedule
        </button>
        <button
          className="action-btn action-secondary"
          onClick={() => setCurrentPage && setCurrentPage('profile')}
        >
          <Users size={18} />
          My Profile
        </button>
      </div>

      {/* ===== TODAY'S SCHEDULE ===== */}
      <div className="schedule-section">
        <div className="section-header">
          <h2>Today's Schedule Preview</h2>
          <div className="section-controls">
            {/* Search Box */}
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search appointments"
              />
            </div>
            {/* Status Filter */}
            <div className="filter-box">
              <Filter size={18} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ready">Ready</option>
                <option value="waiting">Waiting</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="no-show">No-Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="appointments-table">
          <div className="table-header">
            <div className="col-time">TIME</div>
            <div className="col-apptid">APPT ID</div>
            <div className="col-patient">PATIENT'S NAME</div>
            <div className="col-reason">REASON FOR VISIT</div>
            <div className="col-status">STATUS</div>
          </div>

          <div className="table-body">
            {loading && (
              <div className="empty-state">
                <div className="spinner"></div>
                <p>Loading appointments...</p>
              </div>
            )}
            {error && !loading && (
              <div className="alert alert-error">
                <strong>Error:</strong> {error}
                <button onClick={() => window.location.reload()} style={{ marginLeft: '1rem' }}>
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && (
              filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="table-row"
                    onClick={() => handleAppointmentRowClick(appointment)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAppointmentRowClick(appointment);
                    }}
                  >
                    <div className="col-time">{appointment.time}</div>
                    <div className="col-apptid">{appointment.appointmentId}</div>
                    <div className="col-patient">
                      <span className="patient-link">{appointment.patientName}</span>
                    </div>
                    <div className="col-reason">{appointment.reason}</div>
                    <div className="col-status">
                      <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No appointments match your search</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* View Full Schedule Link */}
        <div className="section-footer">
          <button 
            className="link-button"
            onClick={() => setCurrentPage && setCurrentPage('schedule')}
          >
            View Full Schedule →
          </button>
        </div>
      </div>
    </div>
  );
}