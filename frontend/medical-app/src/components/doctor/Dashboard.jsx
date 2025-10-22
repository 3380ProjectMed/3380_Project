import React, { useState } from 'react';
import { Calendar, Users, Clock, FileText, Search, Filter } from 'lucide-react';
import './Dashboard.css';
/**
 * Dashboard Component
 * 
 * Main landing page for doctors showing:
 * - Welcome message with current date and location
 * - Quick stats (appointments, waiting patients, etc.)
 * - Quick action buttons
 * - Today's appointment schedule with search/filter
 * 
 * Props:
 * @param {Function} setCurrentPage - Navigate to different pages
 * @param {Function} onAppointmentClick - Handle when appointment is clicked
 */
function Dashboard({ setCurrentPage, onAppointmentClick }) {
  // Local state for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  /**
   * Get formatted current date
   * Example: "Monday, October 18, 2025"
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
   * Mock appointment data
   * TODO: Replace with API call to fetch real appointments
   * API endpoint: GET /api/appointments/today
   */
  const mockAppointments = [
    {
      id: 'A001',
      time: '10:00 AM',
      patientName: 'John Doe',
      patientId: 'P001',
      reason: 'Follow-up (Hypertension)',
      status: 'Scheduled'
    },
    {
      id: 'A002',
      time: '10:30 AM',
      patientName: 'Jane Smith',
      patientId: 'P002',
      reason: 'New Patient Visit',
      status: 'In Waiting'
    },
    {
      id: 'A003',
      time: '11:00 AM',
      patientName: 'Michael Lee',
      patientId: 'P003',
      reason: 'Annual Physical',
      status: 'In Consultation'
    },
    {
      id: 'A004',
      time: '11:30 AM',
      patientName: 'Sarah Connor',
      patientId: 'P004',
      reason: 'Review Lab Results',
      status: 'Scheduled'
    },
    {
      id: 'A005',
      time: '2:00 PM',
      patientName: 'David Wilson',
      patientId: 'P005',
      reason: 'Diabetes Management',
      status: 'Scheduled'
    },
    {
      id: 'A006',
      time: '2:30 PM',
      patientName: 'Emma Johnson',
      patientId: 'P006',
      reason: 'Vaccination',
      status: 'Completed'
    }
  ];

  /**
   * Calculate statistics from appointments
   * These numbers drive the stat cards
   */
  const calculateStats = () => {
    return {
      total: mockAppointments.length,
      waiting: mockAppointments.filter(a => a.status === 'In Waiting').length,
      pending: mockAppointments.filter(a => a.status === 'Scheduled').length,
      completed: mockAppointments.filter(a => a.status === 'Completed').length
    };
  };

  const stats = calculateStats();

  /**
   * Filter appointments based on search and status filter
   */
  const getFilteredAppointments = () => {
    return mockAppointments.filter(app => {
      // Search filter: match patient name or reason
      const matchesSearch = 
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter: match selected status or show all
      const matchesFilter = 
        filterStatus === 'all' || 
        app.status.toLowerCase().replace(' ', '-') === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  };

  /**
   * Get CSS class for status badge based on appointment status
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
   * Navigate to clinical workspace with selected appointment
   */
  const handleAppointmentRowClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  // Get filtered appointments for display
  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="dashboard">
      {/* ===== WELCOME HEADER ===== */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome Back, Dr. Lastname</h1>
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
        {/* Section Header with Search and Filter */}
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
          {/* Table Header */}
          <div className="table-header">
            <div className="col-time">TIME</div>
            <div className="col-patient">PATIENT'S NAME</div>
            <div className="col-reason">REASON FOR VISIT</div>
            <div className="col-status">STATUS</div>
          </div>
          
          {/* Table Body */}
          <div className="table-body">
            {filteredAppointments.length > 0 ? (
              // Map through filtered appointments
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
              // Empty state when no appointments match filters
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

export default Dashboard;