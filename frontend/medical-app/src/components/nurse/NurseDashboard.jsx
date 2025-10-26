import React, { useState, useMemo } from "react";
import { Calendar, Users, Clock, FileText, Search, Filter } from "lucide-react";
import "./NurseDashboard.css";

/**
 * NurseDashboard (standalone)
 * - Mirrors the Doctor dashboard layout/UX
 * - No health-check fetch, so it won’t error if backend is down
 * - Uses mock appointments; replace with API when ready
 *
 * Props:
 *  - setCurrentPage       : (pageId) => void
 *  - onAppointmentClick   : (appointment) => void
 */
export default function NurseDashboard({ setCurrentPage, onAppointmentClick }) {
  // Local state for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pretty date
  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Mock appointment data (same shape as doctor’s)
  const mockAppointments = useMemo(
    () => [
      {
        id: "A001",
        time: "10:00 AM",
        patientName: "John Doe",
        patientId: "P001",
        reason: "Follow-up (Hypertension)",
        status: "Scheduled",
      },
      {
        id: "A002",
        time: "10:30 AM",
        patientName: "Jane Smith",
        patientId: "P002",
        reason: "New Patient Visit",
        status: "In Waiting",
      },
      {
        id: "A003",
        time: "11:00 AM",
        patientName: "Michael Lee",
        patientId: "P003",
        reason: "Annual Physical",
        status: "In Consultation",
      },
      {
        id: "A004",
        time: "11:30 AM",
        patientName: "Sarah Connor",
        patientId: "P004",
        reason: "Review Lab Results",
        status: "Scheduled",
      },
      {
        id: "A005",
        time: "2:00 PM",
        patientName: "David Wilson",
        patientId: "P005",
        reason: "Diabetes Management",
        status: "Scheduled",
      },
      {
        id: "A006",
        time: "2:30 PM",
        patientName: "Emma Johnson",
        patientId: "P006",
        reason: "Vaccination",
        status: "Completed",
      },
    ],
    []
  );

  // Stats summary
  const stats = useMemo(() => {
    return {
      total: mockAppointments.length,
      waiting: mockAppointments.filter((a) => a.status === "In Waiting").length,
      pending: mockAppointments.filter((a) => a.status === "Scheduled").length,
      completed: mockAppointments.filter((a) => a.status === "Completed").length,
    };
  }, [mockAppointments]);

  // Filtered view
  const filteredAppointments = useMemo(() => {
    return mockAppointments.filter((app) => {
      const matchesSearch =
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" ||
        app.status.toLowerCase().replace(" ", "-") === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [mockAppointments, searchTerm, filterStatus]);

  // Status → CSS class
  const getStatusClass = (status) => {
    const map = {
      scheduled: "status-scheduled",
      "in waiting": "status-waiting",
      "in consultation": "status-consultation",
      completed: "status-completed",
    };
    return map[status.toLowerCase()] || "";
  };

  const handleAppointmentRowClick = (appointment) => {
    onAppointmentClick?.(appointment);
  };

  return (
    <div className="nurse-dashboard">
      {/* ===== HEADER ===== */}
      <div className="nurse-dashboard__header">
        <div className="welcome-card">
          <h1>Welcome Back, Nurse Lastname</h1>
          <p className="meta-line">
            <Calendar size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
            {todayStr} •{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage?.("schedule");
              }}
            >
              Main Clinic, Suite 305
            </a>
          </p>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="nurse-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.waiting}</div>
            <div className="stat-label">Patients Waiting</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Upcoming Today</div>
          </div>
        </div>

        <div className="stat-card success">
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
      <div className="nurse-actions">
        <button className="action-btn" onClick={() => setCurrentPage?.("patients")}>
          <Users size={18} />
          View All Patients
        </button>
        <button className="action-btn" onClick={() => setCurrentPage?.("schedule")}>
          <Calendar size={18} />
          Full Schedule
        </button>
        <button className="action-btn" onClick={() => setCurrentPage?.("clinical")}>
          <FileText size={18} />
          Clinical / Intake
        </button>
      </div>

      {/* ===== TODAY'S SCHEDULE ===== */}
      <div className="nurse-schedule">
        <div className="section-header">
          <h2>Today's Schedule</h2>
          <div className="section-controls">
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
            {filteredAppointments.length ? (
              filteredAppointments.map((a) => (
                <div
                  key={a.id}
                  className="table-row"
                  onClick={() => handleAppointmentRowClick(a)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleAppointmentRowClick(a)}
                >
                  <div className="col-time">{a.time}</div>
                  <div className="col-patient">
                    <span className="patient-link">{a.patientName}</span>
                  </div>
                  <div className="col-reason">{a.reason}</div>
                  <div className="col-status">
                    <span className={`status-badge ${getStatusClass(a.status)}`}>{a.status}</span>
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
