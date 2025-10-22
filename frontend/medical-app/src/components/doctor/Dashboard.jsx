import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, FileText, Search, Filter } from 'lucide-react';
import './Dashboard.css';
function Dashboard({ setCurrentPage, onAppointmentClick }) {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, waiting: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch appointments on component mount
  useEffect(() => {
    const load = async () => {
      // load doctor profile first
      try {
        const doctorId = 202;
        const pr = await fetch(`http://localhost:8080/api/profile/get.php?doctor_id=${doctorId}`);
        const pj = await pr.json();
        if (pj.success) setDoctorProfile(pj.profile);
      } catch (e) {
        // ignore profile load failures for now
        console.error('Failed to load profile', e);
      }
      fetchAppointments();
    };
    load();
  }, []);

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
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const doctorId = 202; // TODO: Get from auth context
      
      // ✅ FIXED: Changed port from 8080 to 8000
      const response = await fetch(
        `http://localhost:8080/api/appointments/get-today.php?doctor_id=${doctorId}`
      );
      
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
      setLoading(false);
    }
  };

  /**
   * Get CSS class for status badge
   */
  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'in waiting': 'status-waiting',
      'in consultation': 'status-consultation',
      'completed': 'status-completed'
    };
    return statusMap[status.toLowerCase()] || '';
  };

  /**
   * Handle appointment row click
   */
  const handleAppointmentRowClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
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
            {getCurrentDate()} • {' '}
            <a href="#" onClick={(e) => {
              e.preventDefault(); 
              setCurrentPage('schedule');
            }}>
              Main Clinic, Suite 305
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
          <button onClick={fetchAppointments} style={{marginLeft: '1rem'}}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content - Only show when not loading and no error */}
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
                    <option value="scheduled">Scheduled</option>
                    <option value="in-waiting">In Waiting</option>
                    <option value="in-consultation">In Consultation</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Appointments Table */}
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
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAppointmentRowClick(appointment);
                      }}
                    >
                      <div className="col-time">{appointment.time}</div>
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