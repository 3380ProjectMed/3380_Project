import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, TrendingUp, Users, ChevronDown, Search, X } from 'lucide-react';
import './Report.css';

export default function AppointmentReport() {
  // Filter state
  const [filters, setFilters] = useState({
    StartDate: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
    EndDate: new Date().toISOString().split('T')[0],
    // Doctor filter removed per UX request
    OfficeID: 'all',
    Status: 'all',
    PatientID: 'all',
  // BookingChannel removed — not needed
    VisitReason: '',
    InsurancePolicyID: 'all',
    NurseID: 'all'
  });

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown options state
  const [offices, setOffices] = useState([]);
  const [nurses, setNurses] = useState([]);

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    fetchReport();
    countActiveFilters();
  }, [filters]);

  const fetchDropdownOptions = async () => {
    try {
      // offices and nurses endpoints are not available in this backend; they'll be derived from report results
    } catch (err) {
      console.error('Error fetching dropdown options:', err);
    }
  };

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

      const response = await fetch(`/api/doctor_api/reports/get-appointment-report.php?${queryParams}`);

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        // Try to read text (may be HTML error page)
        const text = await response.text();
        const short = text.length > 1000 ? text.slice(0, 1000) + '...' : text;
        setError(`Server returned ${response.status}: ${short}`);
        return;
      }

      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          const appts = data.data.appointments || [];
          setAppointments(appts);
          setStatistics(data.data.statistics || null);

          // derive offices and nurses from appointments for filter dropdowns
          const officeMap = new Map();
          const nurseMap = new Map();
          appts.forEach(a => {
            if (a.Office_ID || a.office_id || a.office_id === 0) {
              const id = a.Office_ID ?? a.office_id ?? a.OfficeId ?? null;
              const name = a.office_name || a.office || `${a.office_city || ''}`;
              if (id) officeMap.set(id, { Office_ID: id, Name: name });
            }
            if (a.Nurse_id || a.Nurse_id === 0 || a.nurse_id) {
              const nid = a.Nurse_id ?? a.nurse_id ?? a.NurseId ?? null;
              const nname = a.nurse_name || (a.nurse || 'Unknown');
              if (nid) nurseMap.set(nid, { Nurse_id: nid, name: nname });
            }
          });
          setOffices(Array.from(officeMap.values()));
          setNurses(Array.from(nurseMap.values()));
        } else {
          setError(data.error || 'Failed to fetch report');
        }
      } else {
        // Non-JSON response (often HTML). Capture a short snippet to help debugging.
        const text = await response.text();
        const short = text.length > 1000 ? text.slice(0, 1000) + '...' : text;
        setError('Invalid JSON response from server (see server output): ' + short);
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
      DoctorID: 'all',
      OfficeID: 'all',
      Status: 'all',
      PatientID: 'all',
      VisitReason: '',
      InsurancePolicyID: 'all',
      NurseID: 'all'
    });
  };

  const exportToCSV = () => {
    if (appointments.length === 0) return;

    const headers = ['Date', 'Time', 'Patient', 'Office', 'Status', 'Reason', 'Insurance Type'];
    const rows = appointments.map(apt => [
      apt.Appointment_date,
      apt.Appointment_time || 'N/A',
      apt.patient_name,
      apt.office_name,
      apt.Status || 'N/A',
      (apt.Reason || apt.Reason_for_visit) || 'N/A',
      apt.insurance_type || apt.insurance_company || 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-report-${filters.StartDate}-to-${filters.EndDate}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Canceled': return 'bg-red-100 text-red-800 border-red-300';
      case 'No-Show': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="reports-page">
      <div className="report-view">
        <div className="report-header">
          <div>
            <h2> <Calendar className="selector-icon" /> Appointment & Visit Report</h2>
            <p className="report-subtitle">View and analyze appointments from {filters.StartDate} to {filters.EndDate}</p>
          </div>
          <div className="report-header-actions">
            <button className="btn-export" onClick={exportToCSV} disabled={appointments.length === 0}>
              <Download /> Export CSV
            </button>
          </div>
        </div>

        {/* Top summary cards removed — not required for current backend/UX */}

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
                    <option key={office.Office_ID} value={office.Office_ID}>{office.Name} - {office.City}</option>
                  ))}
                </select>
              </div>

              {/* Booking Channel removed from filters */}

              <div>
                <label>Nurse</label>
                <select value={filters.NurseID} onChange={(e) => handleFilterChange('NurseID', e.target.value)} className="date-range-select">
                  <option value="all">All Nurses</option>
                  {nurses.map(nurse => (
                    <option key={nurse.Nurse_id} value={nurse.Nurse_id}>{nurse.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Visit Reason</label>
                <input type="text" value={filters.VisitReason} onChange={(e) => handleFilterChange('VisitReason', e.target.value)} placeholder="e.g. Annual Checkup" className="date-range-select" />
              </div>
            </div>
          )}
        </div>

        <div className="report-section">
          <h3>Appointment Results ({appointments.length})</h3>

          {loading ? (
            <div style={{padding: '3rem', textAlign: 'center'}}>Loading report...</div>
          ) : error ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'red'}}>{error}</div>
          ) : appointments.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: '#6b7280'}}>
              <Search style={{width: 64, height: 64}} />
              <p>No appointments found matching your filters</p>
            </div>
          ) : (
            <div className="risk-table">
              <div className="table-header">
                <div>Date</div>
                <div>Time</div>
                <div>Patient</div>
                <div>Office</div>
                <div>Status</div>
                <div>Reason</div>
                <div>Type of Insurance</div>
              </div>
              {appointments.map((apt, index) => (
                <div key={apt.Appointment_id} className="table-row">
                  <div>{apt.Appointment_date}</div>
                  <div>{apt.Appointment_time || 'N/A'}</div>
                  <div style={{fontWeight: 700}}>{apt.patient_name}</div>
                  <div>{apt.office_name}</div>
                  <div><span className="risk-badge">{apt.Status}</span></div>
                  <div>{apt.Reason || 'N/A'}</div>
                  {/* Show insurance company/type from joined insurance tables */}
                  <div style={{fontWeight: 700}}>{apt.insurance_type || apt.insurance_company || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}