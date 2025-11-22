import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Calendar, Users, Clock, FileText, Search, Filter, CheckCircle, XCircle, PlayCircle, RefreshCw } from 'lucide-react';
import './Dashboard.css';
import { WelcomeHeader } from '../shared';

function Dashboard({ setCurrentPage, onAppointmentClick }) {
  const auth = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, waiting: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshIntervalRef = useRef(null);

  // Auto-refresh appointments every 15 seconds for real-time updates
  useEffect(() => {
    if (auth.user?.role === 'DOCTOR' && !loading) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up new interval for silent refresh
      refreshIntervalRef.current = setInterval(() => {
        fetchAppointments(false); // Silent refresh
      }, 15000); // Every 15 seconds

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [auth.user, loading]);

  // Fetch appointments when authenticated user becomes available
  useEffect(() => {
    if (auth.loading) return;

    if (!auth.user || auth.user.role !== 'DOCTOR') {
      setError('Doctor access required.');
      setLoading(false);
      return;
    }

    loadDoctorData();
  }, [auth.user, auth.loading]);

  /**
   * Load doctor profile and appointments
   */
  const loadDoctorData = async () => {
    try {
      // Fetch profile (backend derives doctor_id from session)
      const pr = await fetch(`/doctor_api/profile/get.php`, { 
        credentials: 'include' 
      });
      const pj = await pr.json();
      if (pj.success) setDoctorProfile(pj.profile);
    } catch (e) {
      console.error('Failed to load profile', e);
    }
    
    fetchAppointments(true);
  };

  /**
   * Fetch appointments from API - now gets REAL-TIME status
   */
  const fetchAppointments = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Backend now returns actual Status from database
      const response = await fetch(
        `/doctor_api/appointments/get-today.php`, 
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.appointments);
        setStats(data.stats);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (showLoader) {
        setError(err.message);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  /**
   * Manual refresh button
   */
  const handleManualRefresh = () => {
    fetchAppointments(false);
  };

  /**
   * Update appointment status
   */
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await fetch('/doctor_api/appointments/update-status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appointment_id: appointmentId,
          status: newStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Immediately refresh to show updated status
        await fetchAppointments(false);
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update appointment status: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'upcoming': 'status-upcoming',
      'ready': 'status-ready',
      'waiting': 'status-waiting',
      'checked-in': 'status-checked-in',
      'in progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no-show': 'status-no-show'
    };
    return statusMap[status.toLowerCase()] || 'status-scheduled';
  };

  const handleAppointmentRowClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  /**
   * Render status actions for each appointment
   */
  const renderStatusActions = (appointment) => {
    const currentStatus = appointment.status.toLowerCase();
    
    // Don't show actions for completed, cancelled, or no-show
    if (['completed', 'cancelled', 'no-show'].includes(currentStatus)) {
      return null;
    }

    return (
      <div className="status-actions" onClick={(e) => e.stopPropagation()}>
        {currentStatus !== 'in progress' && (
          <button 
            className="action-btn-small btn-start"
            onClick={() => updateAppointmentStatus(appointment.id, 'In Progress')}
            title="Start Consultation"
          >
            <PlayCircle size={14} />
          </button>
        )}
        {currentStatus === 'in progress' && (
          <button 
            className="action-btn-small btn-complete"
            onClick={() => updateAppointmentStatus(appointment.id, 'Completed')}
            title="Mark as Completed"
          >
            <CheckCircle size={14} />
          </button>
        )}
        <button 
          className="action-btn-small btn-cancel"
          onClick={() => {
            if (window.confirm('Mark this appointment as No-Show?')) {
              updateAppointmentStatus(appointment.id, 'No-Show');
            }
          }}
          title="No-Show"
        >
          <XCircle size={14} />
        </button>
      </div>
    );
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      apt.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="dashboard">
      {/* ===== WELCOME HEADER ===== */}
      <WelcomeHeader
        title={`Welcome Back, Dr. ${doctorProfile ? doctorProfile.lastName : 'Lastname'}`}
        subtitle={
          <>
            <Calendar size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {getCurrentDate()}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('schedule'); }}>
              {doctorProfile ? doctorProfile.workLocation : 'WorkLocation'}
            </a>
          </>
        }
      />

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button onClick={() => fetchAppointments(true)} style={{marginLeft: '1rem'}}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
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
                <div className="stat-value">{stats.pending}</div>
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
              className="action-btn" 
              onClick={() => setCurrentPage('patients')}
            >
              <Users size={18} />
              View All Patients
            </button>
            <button 
              className="action-btn" 
              onClick={() => setCurrentPage('schedule')}
            >
              <Calendar size={18} />
              Full Schedule
            </button>
            <button 
              className="action-btn" 
              onClick={() => setCurrentPage('clinical')}
            >
              <FileText size={18} />
              Clinical Notes
            </button>
          </div>

          {/* ===== TODAY'S SCHEDULE ===== */}
          <div className="schedule-section">
            <div className="section-header">
              <div className="section-header-left">
                <h2>Today's Schedule</h2>
                {lastUpdate && (
                  <span className="last-update">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="section-controls">
                {/* Refresh Button */}
                <button 
                  className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  title="Refresh appointments"
                >
                  <RefreshCw size={18} />
                </button>

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
                    <option value="scheduled">Scheduled</option>
                    <option value="checked-in">Checked-in</option>
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
                <div className="col-actions">ACTIONS</div>
              </div>
              
              <div className="table-body">
                {filteredAppointments.length > 0 ? (
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
                      <div className="col-time">
                        {appointment.time}
                        {appointment.waitingMinutes > 0 && (
                          <span className="waiting-time">
                            +{appointment.waitingMinutes}m
                          </span>
                        )}
                      </div>
                      <div className="col-apptid">{appointment.appointmentId || (`#${appointment.id}`)}</div>
                      <div className="col-patient">
                        <span className="patient-link">{appointment.patientName}</span>
                        {appointment.allergies !== 'No Known Allergies' && (
                          <span className="allergy-badge" title={appointment.allergies}>
                            ⚠️ Allergies
                          </span>
                        )}
                      </div>
                      <div className="col-reason">{appointment.reason}</div>
                      <div className="col-status">
                        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="col-actions">
                        {renderStatusActions(appointment)}
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
        </>
      )}
    </div>
  );
}

export default Dashboard;