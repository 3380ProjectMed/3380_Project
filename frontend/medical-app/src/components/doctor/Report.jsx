import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Filter, Download, TrendingUp, Users, ChevronDown, 
  Search, X, Activity, Clock, AlertCircle, CheckCircle 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Report.css';

export default function AppointmentReport() {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({
    StartDate: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
    EndDate: new Date().toISOString().split('T')[0],
    OfficeID: 'all',
    Status: 'all',
    PatientID: 'all',
    VisitReason: '',
    NurseID: 'all'
  });

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [topDiagnoses, setTopDiagnoses] = useState([]);
  const [topReasons, setTopReasons] = useState([]);
  const [appointmentsByDay, setAppointmentsByDay] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown options state
  const [offices, setOffices] = useState([]);
  const [nurses, setNurses] = useState([]);

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    fetchReport();
    countActiveFilters();
  }, [filters]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all' && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`/doctor_api/reports/get-appointment-report.php?${queryParams}`, { 
        credentials: 'include' 
      });

      if (!response.ok) {
        const text = await response.text();
        const short = text.length > 1000 ? text.slice(0, 1000) + '...' : text;
        setError(`Server returned ${response.status}: ${short}`);
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          const appts = data.data.appointments || [];
          setAppointments(appts);
          setStatistics(data.data.statistics || null);
          setTopDiagnoses(data.data.top_diagnoses || []);
          setTopReasons(data.data.top_reasons || []);
          setAppointmentsByDay(data.data.appointments_by_day || []);

          // Derive offices and nurses from appointments
          const officeMap = new Map();
          const nurseMap = new Map();
          
          appts.forEach(a => {
            if (a.office_id) {
              officeMap.set(a.office_id, { 
                office_id: a.office_id, 
                name: a.office_name || 'Unknown Office' 
              });
            }
            
            if (a.nurse_id) {
              nurseMap.set(a.nurse_id, { 
                nurse_id: a.nurse_id, 
                name: a.nurse_name || 'Unknown Nurse' 
              });
            }
          });
          
          setOffices(Array.from(officeMap.values()));
          setNurses(Array.from(nurseMap.values()));
        } else {
          setError(data.error || 'Failed to fetch report');
        }
      } else {
        const text = await response.text();
        const short = text.length > 1000 ? text.slice(0, 1000) + '...' : text;
        setError('Invalid JSON response from server: ' + short);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const countActiveFilters = () => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all' && filters[key] !== '') {
        if (key !== 'StartDate' && key !== 'EndDate') count++;
      }
    });
    setActiveFiltersCount(count);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      StartDate: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
      EndDate: new Date().toISOString().split('T')[0],
      OfficeID: 'all',
      Status: 'all',
      PatientID: 'all',
      VisitReason: '',
      NurseID: 'all'
    });
  };

  const exportToCSV = () => {
    if (appointments.length === 0) return;

    const headers = ['Date', 'Time', 'Patient', 'Age', 'Reason', 'Status', 'Diagnosis', 'Duration (min)', 'Office'];
    const rows = appointments.map(apt => [
      apt.appointment_date || 'N/A',
      apt.appointment_time || 'N/A',
      apt.patient_name || 'N/A',
      apt.patient_age || 'N/A',
      apt.reason || 'N/A',
      apt.status || 'N/A',
      apt.diagnosis || 'N/A',
      apt.visit_duration_minutes || 'N/A',
      apt.office_name || 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-appointment-report-${filters.StartDate}-to-${filters.EndDate}.csv`;
    a.click();
  };

  const handleRowClick = (appointment) => {
    // Navigate to clinical workspace with appointment_id
    if (appointment.appointment_id) {
      navigate(`/doctor/workspace/${appointment.appointment_id}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Canceled': 
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'No-Show': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Prepare data for status pie chart
  const statusChartData = statistics ? [
    { name: 'Completed', value: statistics.completed_count, color: '#10b981' },
    { name: 'Scheduled', value: statistics.scheduled_count, color: '#3b82f6' },
    { name: 'Canceled', value: statistics.canceled_count, color: '#ef4444' },
    { name: 'No-Show', value: statistics.noshow_count, color: '#f59e0b' }
  ].filter(item => item.value > 0) : [];

  // Prepare data for day of week bar chart
  const dayChartData = appointmentsByDay.map(day => ({
    day: day.day_name,
    count: parseInt(day.appointment_count)
  }));

  // Calculate completion rate
  const completionRate = statistics && statistics.total_appointments > 0
    ? ((statistics.completed_count / statistics.total_appointments) * 100).toFixed(1)
    : 0;

  const noshowRate = statistics && statistics.total_appointments > 0
    ? ((statistics.noshow_count / statistics.total_appointments) * 100).toFixed(1)
    : 0;

  return (
    <div className="reports-page">
      <div className="report-view">
        <div className="report-header">
          <div>
            <h2><Calendar className="selector-icon" /> Clinical Appointment Report</h2>
            <p className="report-subtitle">Patient care insights from {filters.StartDate} to {filters.EndDate}</p>
          </div>
          <div className="report-header-actions">
            <button className="btn-export" onClick={exportToCSV} disabled={appointments.length === 0}>
              <Download /> Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {statistics && (
          <div className="report-section">
            <h3><TrendingUp className="selector-icon" /> Performance Overview</h3>
            <div className="report-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <Calendar style={{width: 24, height: 24, color: 'white'}} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.total_appointments}</div>
                  <div className="stat-label">Total Appointments</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                  <Users style={{width: 24, height: 24, color: 'white'}} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.unique_patients}</div>
                  <div className="stat-label">Unique Patients</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                  <CheckCircle style={{width: 24, height: 24, color: 'white'}} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.completed_count}</div>
                  <div className="stat-label">Completed Visits</div>
                  <div className="stat-percentage">{completionRate}% completion rate</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
                  <AlertCircle style={{width: 24, height: 24, color: 'white'}} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.noshow_count}</div>
                  <div className="stat-label">No-Shows</div>
                  <div className="stat-percentage" style={{color: parseFloat(noshowRate) > 10 ? '#ef4444' : '#6b7280'}}>
                    {noshowRate}% no-show rate
                  </div>
                </div>
              </div>

              {statistics.avg_visit_duration && (
                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'}}>
                    <Clock style={{width: 24, height: 24, color: 'white'}} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{statistics.avg_visit_duration} min</div>
                    <div className="stat-label">Avg Visit Duration</div>
                  </div>
                </div>
              )}

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'}}>
                  <Activity style={{width: 24, height: 24, color: 'white'}} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.upcoming_appointments}</div>
                  <div className="stat-label">Upcoming Appointments</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {statistics && (
          <div className="report-section">
            <h3>Visual Analytics</h3>
            <div className="charts-grid">
              {/* Status Distribution Pie Chart */}
              {statusChartData.length > 0 && (
                <div className="chart-card">
                  <h4>Appointment Status Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Appointments by Day of Week */}
              {dayChartData.length > 0 && (
                <div className="chart-card">
                  <h4>Appointments by Day of Week</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#667eea" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Diagnoses and Reasons */}
        {(topDiagnoses.length > 0 || topReasons.length > 0) && (
          <div className="report-section">
            <h3>Clinical Insights</h3>
            <div className="insights-grid">
              {topDiagnoses.length > 0 && (
                <div className="insight-card">
                  <h4>Top Diagnoses</h4>
                  <div className="insight-list">
                    {topDiagnoses.slice(0, 5).map((diag, idx) => (
                      <div key={idx} className="insight-item">
                        <span className="insight-rank">{idx + 1}</span>
                        <span className="insight-text">{diag.diagnosis}</span>
                        <span className="insight-count">{diag.diagnosis_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topReasons.length > 0 && (
                <div className="insight-card">
                  <h4>Top Visit Reasons</h4>
                  <div className="insight-list">
                    {topReasons.slice(0, 5).map((reason, idx) => (
                      <div key={idx} className="insight-item">
                        <span className="insight-rank">{idx + 1}</span>
                        <span className="insight-text">{reason.reason}</span>
                        <span className="insight-count">{reason.reason_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="report-section">
          <div className="report-header" style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}} onClick={() => setShowFilters(!showFilters)}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <Filter />
              <h3>Filters {activeFiltersCount > 0 && <span className="risk-badge">{activeFiltersCount} active</span>}</h3>
            </div>
            <div>
              {activeFiltersCount > 0 && (
                <button onClick={(e) => { e.stopPropagation(); clearFilters(); }} className="btn-back-reports">Clear All</button>
              )}
              <ChevronDown className={`${showFilters ? 'rotated' : ''}`} />
            </div>
          </div>

          {showFilters && (
            <div className="report-selector-grid">
              <div>
                <label>Start Date</label>
                <input type="date" value={filters.StartDate} onChange={(e) => handleFilterChange('StartDate', e.target.value)} className="date-range-select" />
              </div>
              <div>
                <label>End Date</label>
                <input type="date" value={filters.EndDate} onChange={(e) => handleFilterChange('EndDate', e.target.value)} className="date-range-select" />
              </div>

              <div>
                <label>Status</label>
                <select value={filters.Status} onChange={(e) => handleFilterChange('Status', e.target.value)} className="date-range-select">
                  <option value="all">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                  <option value="No-Show">No-Show</option>
                </select>
              </div>

              <div>
                <label>Office</label>
                <select value={filters.OfficeID} onChange={(e) => handleFilterChange('OfficeID', e.target.value)} className="date-range-select">
                  <option value="all">All Offices</option>
                  {offices.map(office => (
                    <option key={office.office_id} value={office.office_id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Nurse</label>
                <select value={filters.NurseID} onChange={(e) => handleFilterChange('NurseID', e.target.value)} className="date-range-select">
                  <option value="all">All Nurses</option>
                  {nurses.map(nurse => (
                    <option key={nurse.nurse_id} value={nurse.nurse_id}>
                      {nurse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Visit Reason</label>
                <input 
                  type="text" 
                  value={filters.VisitReason} 
                  onChange={(e) => handleFilterChange('VisitReason', e.target.value)} 
                  placeholder="e.g. Annual Checkup" 
                  className="date-range-select" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Appointment Table */}
        <div className="report-section">
          <h3>Appointment Details ({appointments.length})</h3>
          <p style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem'}}>
            Click on any row to view full clinical details
          </p>

          {loading ? (
            <div style={{padding: '3rem', textAlign: 'center'}}>Loading report...</div>
          ) : error ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'red'}}>{error}</div>
          ) : appointments.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: '#6b7280'}}>
              <Search style={{width: 64, height: 64, margin: '0 auto'}} />
              <p>No appointments found matching your filters</p>
            </div>
          ) : (
            <div className="risk-table">
              <div className="table-header">
                <div>Date</div>
                <div>Time</div>
                <div>Patient</div>
                <div>Age</div>
                <div>Reason</div>
                <div>Status</div>
                <div>Diagnosis</div>
                <div>Office</div>
              </div>
              {appointments.map((apt) => (
                <div 
                  key={apt.appointment_id} 
                  className="table-row clickable-row"
                  onClick={() => handleRowClick(apt)}
                  style={{cursor: 'pointer'}}
                  title="Click to view clinical details"
                >
                  <div>{apt.appointment_date || 'N/A'}</div>
                  <div>{apt.appointment_time || 'N/A'}</div>
                  <div style={{fontWeight: 700}}>{apt.patient_name || 'N/A'}</div>
                  <div>{apt.patient_age || 'N/A'}</div>
                  <div>{apt.reason || 'N/A'}</div>
                  <div>
                    <span className={`risk-badge ${getStatusColor(apt.status)}`}>
                      {apt.status || 'N/A'}
                    </span>
                  </div>
                  <div>{apt.diagnosis || 'N/A'}</div>
                  <div>{apt.office_name || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}