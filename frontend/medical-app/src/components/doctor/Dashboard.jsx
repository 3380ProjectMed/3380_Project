import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Calendar, Users, Clock, FileText, Search, Filter, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ setCurrentPage, onAppointmentClick }) {
  const auth = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, waiting: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Auto-refresh appointments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const doctorId = auth.user?.doctor_id;
      if (doctorId && !loading) {
        fetchAppointments(doctorId, false); // Silent refresh
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [auth.user, loading]);

  // Fetch appointments when authenticated user becomes available
  useEffect(() => {
    const doctorId = auth.user?.doctor_id ?? null;
    if (auth.loading) return;

    if (!doctorId) {
      setError('No doctor account found for the logged-in user.');
      setLoading(false);
      return;
    }

    const loadForDoctor = async (did) => {
      try {
  const pr = await fetch(`/doctor_api/profile/get.php?doctor_id=${did}`, { credentials: 'include' });
        const pj = await pr.json();
        if (pj.success) setDoctorProfile(pj.profile);
      } catch (e) {
        console.error('Failed to load profile', e);
      }
      fetchAppointments(did);
    };

    loadForDoctor(doctorId);
  }, [auth.user, auth.loading]);

  /**
   * Get formatted current date
   */
  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  /**
   * Fetch appointments from API
   */
  const fetchAppointments = async (doctorIdParam, showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const doctorId = doctorIdParam ?? auth.user?.doctor_id;
      if (!doctorId) throw new Error('doctor_id missing');

  const response = await fetch(`/doctor_api/appointments/get-today.php?doctor_id=${doctorId}`, { credentials: 'include' });
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.appointments);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
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
        // Refresh appointments after status update
        const doctorId = auth.user?.doctor_id;
        if (doctorId) {
          await fetchAppointments(doctorId, false);
        }
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update appointment status: ' + err.message);
    }
  };

  /**
   * Get CSS class for status badge
   */
  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'upcoming': 'status-upcoming',
      'ready': 'status-ready',
      'waiting': 'status-waiting',
      'in progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no-show': 'status-no-show'
    };
    return statusMap[status.toLowerCase()] || 'status-scheduled';
  };

  /**
   * Handle appointment row click
   */
  const handleAppointmentRowClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
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
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome Back, Dr. {doctorProfile ? doctorProfile.lastName : 'Lastname'}</h1>
          <p className="office-info">
            <Calendar size={18} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
            {getCurrentDate()} {' '}
            <a href="#" onClick={(e) => {
              e.preventDefault(); 
              setCurrentPage('schedule');
            }}>
              {doctorProfile ? doctorProfile.workLocation : 'WorkLocation'}
            </a>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-spinner">
          <div>Loading appointments...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button onClick={() => fetchAppointments(auth.user?.doctor_id)} style={{marginLeft: '1rem'}}>
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
              <h2>Today's Schedule</h2>
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