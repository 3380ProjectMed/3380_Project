import React, { useState } from 'react';
import { Calendar, Users, Clock, FileText, Check, AlertCircle, DollarSign, Plus, Phone } from 'lucide-react';
import './ReceptionistDashboard.css';

/**
 * ReceptionistDashboard Component
 * 
 * Main dashboard for receptionist showing:
 * - Today's statistics (appointments, check-ins, payments)
 * - Quick action buttons
 * - Today's appointment list with status
 * 
 * Database Tables:
 * - Appointment (Appointment_id, Patient_id, Doctor_id, Office_id, Appointment_date)
 * - Patient (Patient_ID, First_Name, Last_Name, Email, Phone via EmergencyContact)
 * - Doctor (Doctor_id, First_Name, Last_Name)
 * - PatientVisit (Status: 'Scheduled', 'Completed', 'Canceled', 'No-Show')
 * - patient_insurance (copay)
 * 
 * Props:
 * @param {Function} setCurrentPage - Navigate to different pages
 * @param {Function} onProcessPayment - Handle payment processing
 * @param {Number} officeId - Office_ID for RBAC filtering
 * @param {String} officeName - Office name for display
 */
function ReceptionistDashboard({ setCurrentPage, onProcessPayment, officeId, officeName }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  /**
   * Mock appointment data from database
   * Real query:
   * SELECT a.Appointment_id, a.Appointment_date, a.Reason_for_visit,
   *        p.Patient_ID, p.First_Name, p.Last_Name, p.EmergencyContact,
   *        d.First_Name as Doctor_First, d.Last_Name as Doctor_Last,
   *        pi.copay,
   *        pv.Status
   * FROM Appointment a
   * JOIN Patient p ON a.Patient_id = p.Patient_ID
   * JOIN Doctor d ON a.Doctor_id = d.Doctor_id
   * LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
   * LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
   * WHERE a.Office_id = ? AND DATE(a.Appointment_date) = CURDATE()
   * ORDER BY a.Appointment_date
   */
  const mockAppointments = [
    {
      Appointment_id: 1001,
      Appointment_date: '2024-01-15 09:00:00',
      time: '09:00 AM',
      Patient_ID: 1,
      Patient_First: 'John',
      Patient_Last: 'Smith',
      EmergencyContact: '555-1001',
      Doctor_First: 'Emily',
      Doctor_Last: 'Chen',
      Reason_for_visit: 'Annual physical examination',
      Status: 'Scheduled',
      copay: 25.00,
      Office_id: officeId
    },
    {
      Appointment_id: 1002,
      Appointment_date: '2024-01-15 09:30:00',
      time: '09:30 AM',
      Patient_ID: 3,
      Patient_First: 'David',
      Patient_Last: 'Johnson',
      EmergencyContact: '555-1003',
      Doctor_First: 'Emily',
      Doctor_Last: 'Chen',
      Reason_for_visit: 'Follow-up consultation',
      Status: 'Completed', // Checked In status
      copay: 15.00,
      Office_id: officeId
    },
    {
      Appointment_id: 1003,
      Appointment_date: '2024-01-15 10:30:00',
      time: '10:30 AM',
      Patient_ID: 5,
      Patient_First: 'Michael',
      Patient_Last: 'Brown',
      EmergencyContact: '555-1005',
      Doctor_First: 'James',
      Doctor_Last: 'Rodriguez',
      Reason_for_visit: 'Cardiology checkup',
      Status: 'Scheduled', // In Progress
      copay: 25.00,
      Office_id: officeId
    },
    {
      Appointment_id: 1004,
      Appointment_date: '2024-01-15 11:00:00',
      time: '11:00 AM',
      Patient_ID: 4,
      Patient_First: 'Sarah',
      Patient_Last: 'Williams',
      EmergencyContact: '555-1004',
      Doctor_First: 'Emily',
      Doctor_Last: 'Chen',
      Reason_for_visit: 'Lab results review',
      Status: 'Completed',
      copay: 30.00,
      Office_id: officeId
    },
    {
      Appointment_id: 1005,
      Appointment_date: '2024-01-15 02:00:00',
      time: '02:00 PM',
      Patient_ID: 6,
      Patient_First: 'Jennifer',
      Patient_Last: 'Davis',
      EmergencyContact: '555-1006',
      Doctor_First: 'James',
      Doctor_Last: 'Rodriguez',
      Reason_for_visit: 'Routine checkup',
      Status: 'Scheduled',
      copay: 25.00,
      Office_id: officeId
    },
  ];

  /**
   * Calculate dashboard statistics from PatientVisit.Status
   */
  const calculateStats = () => {
    const total = mockAppointments.length;
    const checkedIn = mockAppointments.filter(a => a.Status === 'Completed' && !a.paymentRecorded).length;
    const pending = mockAppointments.filter(a => a.Status === 'Scheduled').length;
    const completed = mockAppointments.filter(a => a.Status === 'Completed').length;
    const totalRevenue = mockAppointments
      .filter(a => a.Status === 'Completed')
      .reduce((sum, a) => sum + (a.copay || 0), 0);

    return { total, checkedIn, pending, completed, totalRevenue };
  };

  const stats = calculateStats();

  /**
   * Filter appointments by status
   */
  const getFilteredAppointments = () => {
    if (selectedFilter === 'all') return mockAppointments;
    return mockAppointments.filter(apt => 
      apt.Status.toLowerCase().replace(' ', '-') === selectedFilter
    );
  };

  const filteredAppointments = getFilteredAppointments();

  /**
   * Get status badge class (maps to PatientVisit.Status enum)
   */
  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'completed': 'status-completed',
      'canceled': 'status-cancelled',
      'no-show': 'status-noshow'
    };
    return statusMap[status.toLowerCase()] || '';
  };

  /**
   * Get current date formatted
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

  return (
    <div className="receptionist-dashboard">
      {/* ===== HEADER ===== */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Front Desk Dashboard</h1>
          <p className="dashboard-subtitle">
            <Calendar size={18} />
            {getCurrentDate()} • {officeName}
          </p>
        </div>
      </div>

      {/* ===== STATS GRID ===== */}
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

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <Check size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.checkedIn}</div>
            <div className="stat-label">Awaiting Payment</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Check-in</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
            <div className="stat-label">Collected Today</div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button 
            className="action-card action-primary"
            onClick={() => setCurrentPage('booking')}
          >
            <div className="action-icon">
              <Plus size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">New Appointment</h3>
              <p className="action-description">Schedule patient visit</p>
            </div>
          </button>

          <button 
            className="action-card action-secondary"
            onClick={() => setCurrentPage('patients')}
          >
            <div className="action-icon">
              <Users size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">Patient Search</h3>
              <p className="action-description">Find patient records</p>
            </div>
          </button>

          <button 
            className="action-card action-success"
            onClick={() => setCurrentPage('payment')}
          >
            <div className="action-icon">
              <DollarSign size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">Record Payment</h3>
              <p className="action-description">Process copayment</p>
            </div>
          </button>

          <button 
            className="action-card action-info"
            onClick={() => setCurrentPage('schedule')}
          >
            <div className="action-icon">
              <Calendar size={24} />
            </div>
            <div className="action-content">
              <h3 className="action-title">Full Schedule</h3>
              <p className="action-description">View office calendar</p>
            </div>
          </button>
        </div>
      </div>

      {/* ===== TODAY'S APPOINTMENTS ===== */}
      <div className="appointments-section">
        <div className="section-header">
          <h2 className="section-title">Today's Appointments</h2>
          
          {/* Status Filter - Maps to PatientVisit.Status */}
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedFilter === 'all' ? 'filter-active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All ({mockAppointments.length})
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'scheduled' ? 'filter-active' : ''}`}
              onClick={() => setSelectedFilter('scheduled')}
            >
              Scheduled
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'completed' ? 'filter-active' : ''}`}
              onClick={() => setSelectedFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'canceled' ? 'filter-active' : ''}`}
              onClick={() => setSelectedFilter('canceled')}
            >
              Canceled
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'no-show' ? 'filter-active' : ''}`}
              onClick={() => setSelectedFilter('no-show')}
            >
              No-Show
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="appointments-list">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div 
                key={appointment.Appointment_id} 
                className="appointment-card"
              >
                <div className="appointment-time">
                  <Clock size={20} />
                  <span>{appointment.time}</span>
                </div>

                <div className="appointment-patient">
                  <h3 className="patient-name">
                    {appointment.Patient_First} {appointment.Patient_Last}
                  </h3>
                  <div className="patient-meta">
                    <span className="patient-id">ID: {appointment.Patient_ID}</span>
                    <span className="patient-phone">
                      <Phone size={14} />
                      {appointment.EmergencyContact}
                    </span>
                  </div>
                </div>

                <div className="appointment-details">
                  <p className="appointment-reason">{appointment.Reason_for_visit}</p>
                  <p className="appointment-doctor">
                    Dr. {appointment.Doctor_First} {appointment.Doctor_Last}
                  </p>
                </div>

                <div className="appointment-status">
                  <span className={`status-badge ${getStatusClass(appointment.Status)}`}>
                    {appointment.Status}
                  </span>
                </div>

                <div className="appointment-actions">
                  {appointment.Status === 'Scheduled' && (
                    <button className="btn-check-in">
                      <Check size={16} />
                      Check In
                    </button>
                  )}
                  {appointment.Status === 'Completed' && !appointment.paymentRecorded && (
                    <button 
                      className="btn-payment"
                      onClick={() => onProcessPayment({
                        ...appointment,
                        patientName: `${appointment.Patient_First} ${appointment.Patient_Last}`,
                        doctor: `Dr. ${appointment.Doctor_First} ${appointment.Doctor_Last}`,
                        id: appointment.Appointment_id,
                        patientId: appointment.Patient_ID,
                        reason: appointment.Reason_for_visit
                      })}
                    >
                      <DollarSign size={16} />
                      ${appointment.copay.toFixed(2)}
                    </button>
                  )}
                  {appointment.paymentRecorded && (
                    <span className="payment-complete">
                      <Check size={16} />
                      Paid
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>No appointments match this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceptionistDashboard;