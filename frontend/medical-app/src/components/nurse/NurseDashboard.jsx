import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, FileText, Search, Filter } from 'lucide-react';
import './NurseDashboard.css';
import { getNurseDashboardStats, getNurseSchedule } from '../../api/nurse';

/**
 * NurseDashboard
 * Mirrors the doctor dashboard layout/visuals (cards, grid, table)
 * while keeping nurse-specific copy. Uses local mock data—wire to API later.
 */
export default function NurseDashboard({ setCurrentPage, onAppointmentClick }) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Date label
  const getCurrentDate = () => {
  // Date label
  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const s = await getNurseDashboardStats(today).catch(() => null);
        if (s && mounted) {
          setStats({ total: s.totalAppointments ?? 0, waiting: s.waitingCount ?? 0, pending: s.upcomingCount ?? 0, completed: s.completedCount ?? 0 });
        }

        const appts = await getNurseSchedule({ date: new Date().toISOString().slice(0,10) }).catch(() => null);
        if (appts && mounted) {
          setAppointments(appts);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Filtering (search + status)
  const filteredAppointments = (appointments || []).filter(app => {
    const matchesSearch =
      app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      app.status.toLowerCase().replace(' ', '-') === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Status badge color map (same as doctor)
  // Status badge color map (same as doctor)
  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'in waiting': 'status-waiting',
      'in consultation': 'status-consultation',
      'completed': 'status-completed'
    const statusMap = {
      'scheduled': 'status-scheduled',
      'in waiting': 'status-waiting',
      'in consultation': 'status-consultation',
      'completed': 'status-completed'
    };
    return statusMap[status.toLowerCase()] || '';
    return statusMap[status.toLowerCase()] || '';
  };

  // Row click -> Nurse intake / Clinical flow
  // Row click -> Nurse intake / Clinical flow
  const handleAppointmentRowClick = (appointment) => {
    if (onAppointmentClick) onAppointmentClick(appointment);
    if (setCurrentPage) setCurrentPage('clinical'); // optional
    if (onAppointmentClick) onAppointmentClick(appointment);
    if (setCurrentPage) setCurrentPage('clinical'); // optional
  };

  return (
    <div className="dashboard">
      {/* ===== WELCOME HEADER (Doctor look, Nurse copy) ===== */}
      <div className="dashboard-header">
        <div className="welcome-section">
    <div className="dashboard">
      {/* ===== WELCOME HEADER (Doctor look, Nurse copy) ===== */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome Back, Nurse Lastname</h1>
          <p className="office-info">
            <Calendar size={18} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
            {getCurrentDate()} • {' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
          <p className="office-info">
            <Calendar size={18} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
            {getCurrentDate()} • {' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Main Clinic, Suite 305
            </a>
          </p>
        </div>
      </div>

      {/* ===== STATS CARDS (same structure/colors as doctor) ===== */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
      {/* ===== STATS CARDS (same structure/colors as doctor) ===== */}
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
        <div className="stat-card stat-info">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Upcoming Today</div>
          </div>
        </div>

        <div className="stat-card stat-success">
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
          className="action-btn" 
          onClick={() => setCurrentPage && setCurrentPage('patients')}
        >
      <div className="quick-actions">
        <button 
          className="action-btn" 
          onClick={() => setCurrentPage && setCurrentPage('patients')}
        >
          <Users size={18} />
          View All Patients
        </button>
        <button 
          className="action-btn" 
          onClick={() => setCurrentPage && setCurrentPage('schedule')}
        >
        <button 
          className="action-btn" 
          onClick={() => setCurrentPage && setCurrentPage('schedule')}
        >
          <Calendar size={18} />
          Full Schedule
        </button>
        <button 
          className="action-btn" 
          onClick={() => setCurrentPage && setCurrentPage('clinical')}
        >
        <button 
          className="action-btn" 
          onClick={() => setCurrentPage && setCurrentPage('clinical')}
        >
          <FileText size={18} />
          Clinical / Intake
        </button>
      </div>

      {/* ===== TODAY'S SCHEDULE TABLE (fully matches doctor) ===== */}
      <div className="schedule-section">
      {/* ===== TODAY'S SCHEDULE TABLE (fully matches doctor) ===== */}
      <div className="schedule-section">
        <div className="section-header">
          <h2>Today's Schedule</h2>
          <div className="section-controls">
            <div className="search-box">
              <Search size={18} />
              <input 
              <input 
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search appointments"
              />
            </div>
            <div className="filter-box">
              <Filter size={18} />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
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
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="table-row" 
                  onClick={() => handleAppointmentRowClick(appointment)}
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="table-row" 
                  onClick={() => handleAppointmentRowClick(appointment)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleAppointmentRowClick(appointment)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAppointmentRowClick(appointment)}
                >
                  <div className="col-time">{appointment.time}</div>
                  <div className="col-time">{appointment.time}</div>
                  <div className="col-patient">
                    <span className="patient-link">{appointment.patientName}</span>
                    <span className="patient-link">{appointment.patientName}</span>
                  </div>
                  <div className="col-reason">{appointment.reason}</div>
                  <div className="col-reason">{appointment.reason}</div>
                  <div className="col-status">
                    <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
