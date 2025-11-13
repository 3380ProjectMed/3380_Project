import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  FileText, 
  Building2, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  Clock,
  UserPlus            // NEW: icon for New Patients report
} from 'lucide-react';
import '../doctor/Dashboard.css';
import './Report.css';

function Report() {
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day'); // day, week, month
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedInsurance, setSelectedInsurance] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Data states
  const [financialData, setFinancialData] = useState(null);
  const [officeData, setOfficeData] = useState(null);
  const [newPatientsData, setNewPatientsData] = useState(null); // NEW
  const [offices, setOffices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [insurances, setInsurances] = useState([]);

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [showChart, setShowChart] = useState(true);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [officesRes, doctorsRes, insurancesRes] = await Promise.all([
        fetch('/admin_api/reports/filter-options.php?type=offices', { credentials: 'include' }),
        fetch('/admin_api/reports/filter-options.php?type=doctors', { credentials: 'include' }),
        fetch('/admin_api/reports/filter-options.php?type=insurances', { credentials: 'include' })
      ]);

      const [officesData, doctorsData, insurancesData] = await Promise.all([
        officesRes.json(),
        doctorsRes.json(),
        insurancesRes.json()
      ]);

      if (officesData.success) setOffices(officesData.data || []);
      if (doctorsData.success) setDoctors(doctorsData.data || []);
      if (insurancesData.success) setInsurances(insurancesData.data || []);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const money = (v) => {
    const n = Number(v || 0);
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const StatCard = ({type='primary', icon, label, value, subtitle, trend}) => (
    <div className={`stat-card stat-${type}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        {trend && <div className={`stat-trend ${trend.direction}`}>{trend.text}</div>}
      </div>
    </div>
  );

  const buildQueryParams = () => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy
    });
    
    if (selectedOffice !== 'all') params.append('office_id', selectedOffice);
    if (selectedDoctor !== 'all') params.append('doctor_id', selectedDoctor);
    if (selectedInsurance !== 'all') params.append('insurance_id', selectedInsurance);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    
    return params.toString();
  };

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/financial-summary.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setFinancialData(data);
      } else {
        setError(data.error || 'Failed to load financial report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficeUtilization = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/office-utilization.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setOfficeData(data);
      } else {
        setError(data.error || 'Failed to load office utilization report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: New Patients report fetcher
  const fetchNewPatientsReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/new-patients.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setNewPatientsData(data);
      } else {
        setError(data.error || 'Failed to load new patients report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (reportType) => {
    setActiveReport(reportType);
    setShowFilters(false);
    setSortConfig({ key: null, direction: 'desc' });
  };

  const handleRefresh = () => {
    if (activeReport === 'financial') {
      fetchFinancialReport();
    } else if (activeReport === 'office') {
      fetchOfficeUtilization();
    } else if (activeReport === 'newPatients') {        // NEW
      fetchNewPatientsReport();
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data, key) => {
    if (!sortConfig.key || !data) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (activeReport === 'financial' && financialData) {
      filename = `financial_report_${startDate}_to_${endDate}.csv`;
      csvContent = 'Period,Total Visits,Gross Revenue,Collected Payments,Outstanding Balance,Unique Patients,Collection Rate\n';
      (financialData.daily_revenue || []).forEach(row => {
        const gross = Number(row.gross_revenue || 0);
        const collected = Number(row.collected_payments || 0);
        const rate = gross > 0 ? ((collected / gross) * 100).toFixed(1) : '0.0';
        csvContent += `${row.period_label},${row.total_visits},${row.gross_revenue},${row.collected_payments},${row.outstanding_balance},${row.unique_patients},${rate}\n`;
      });
    } else if (activeReport === 'office' && officeData) {
      filename = `office_utilization_${startDate}_to_${endDate}.csv`;
      csvContent = 'Office Name,Address,Total Appointments,Completed,Cancelled,No-Shows,Scheduled,No-Show Rate,Avg Wait Time (min),Utilization Rate\n';
      (officeData.office_stats || []).forEach(row => {
        csvContent += `"${row.office_name}","${row.address}",${row.total_appointments},${row.completed},${row.cancelled},${row.no_shows},${row.scheduled},${row.no_show_rate},${row.avg_wait_minutes || 'N/A'},${row.utilization_rate}\n`;
      });
    } else if (activeReport === 'newPatients' && newPatientsData) { // NEW
      filename = `new_patients_${startDate}_to_${endDate}.csv`;
      csvContent = 'Period,Doctor,Office,New Appointments,Unique New Patients\n';
      (newPatientsData.rows || []).forEach(row => {
        csvContent += `${row.period_label},${row.doctor_name},${row.office_name},${row.new_patient_appointments},${row.unique_new_patients}\n`;
      });
    }
    
    if (!filename) return;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setGroupBy('day');
    setSelectedOffice('all');
    setSelectedDoctor('all');
    setSelectedInsurance('all');
    setStatusFilter('all');
  };

  // Quick date range presets
  const setDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Report selector view
  if (!activeReport) {
    return (
      <div className="report-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Reports & Analytics</h1>
            <p className="office-info">Select a report type to view detailed insights</p>
          </div>
        </div>

        <div className="report-selector-grid">
          <div className="report-selector-card" onClick={() => handleSelectReport('financial')}>
            <div className="selector-icon">
              <DollarSign size={48} />
            </div>
            <h3>Financial Summary</h3>
            <p>Revenue tracking, payments collected, outstanding balances, and insurance breakdown</p>
            <div className="card-features">
              <span><BarChart3 size={14} /> Charts & Trends</span>
              <span><Filter size={14} /> Advanced Filters</span>
              <span><Download size={14} /> Export Data</span>
            </div>
          </div>

          <div className="report-selector-card" onClick={() => handleSelectReport('office')}>
            <div className="selector-icon">
              <Building2 size={48} />
            </div>
            <h3>Office Utilization</h3>
            <p>Appointment metrics, no-show rates, wait times, and office performance analysis</p>
            <div className="card-features">
              <span><Clock size={14} /> Wait Time Analysis</span>
              <span><Users size={14} /> Staff Performance</span>
              <span><TrendingUp size={14} /> Utilization Trends</span>
            </div>
          </div>

          {/* NEW: New Patients report card */}
          <div className="report-selector-card" onClick={() => handleSelectReport('newPatients')}>
            <div className="selector-icon">
              <UserPlus size={48} />
            </div>
            <h3>New Patients</h3>
            <p>Track first-time visits by doctor and office over time</p>
            <div className="card-features">
              <span><Users size={14} /> Patient Growth</span>
              <span><BarChart3 size={14} /> Trends Over Time</span>
              <span><Download size={14} /> Export Data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main report view
  useEffect(() => {
    if (activeReport === 'financial') fetchFinancialReport();
    if (activeReport === 'office') fetchOfficeUtilization();
    if (activeReport === 'newPatients') fetchNewPatientsReport(); // NEW
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport]);

  const headerTitle =
    activeReport === 'financial'
      ? 'Financial Summary'
      : activeReport === 'office'
      ? 'Office Utilization'
      : 'New Patients'; // NEW

  return (
    <div className="report-container">
      <div className="dashboard-header report-header">
        <div className="report-header-left">
          <h1>{headerTitle}</h1>
          <p className="office-info">
            <Calendar size={16} />
            <span className="date-range">{startDate} — {endDate}</span>
            {(selectedOffice !== 'all' || selectedDoctor !== 'all' || selectedInsurance !== 'all') && (
              <span className="active-filters-badge">{
                [selectedOffice !== 'all' && 'Office', 
                 selectedDoctor !== 'all' && 'Doctor',
                 selectedInsurance !== 'all' && 'Insurance'].filter(Boolean).join(', ')
              } filtered</span>
            )}
          </p>
        </div>

        <div className="report-header-actions">
          <button onClick={() => setActiveReport(null)} className="btn btn-ghost">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="toolbar-actions">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter size={14} /> Filters {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button onClick={handleRefresh} disabled={loading} className="btn btn-sm btn-secondary">
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            </button>
            <button 
              onClick={exportToCSV} 
              disabled={loading || (!financialData && !officeData && !newPatientsData)} // NEW
              className="btn btn-sm btn-primary"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="advanced-filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-range-group">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="date-presets">
                <button onClick={() => setDateRange(7)} className="btn-preset">Last 7 days</button>
                <button onClick={() => setDateRange(30)} className="btn-preset">Last 30 days</button>
                <button onClick={() => setDateRange(90)} className="btn-preset">Last 90 days</button>
              </div>
            </div>

            <div className="filter-group">
              <label>Group By</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Office</label>
              <select value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)}>
                <option value="all">All Offices</option>
                {offices.map(office => (
                  <option key={office.office_id} value={office.office_id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>

            {(activeReport === 'financial' || activeReport === 'newPatients') && ( // NEW: doctor filter for newPatients too
              <div className="filter-group">
                <label>Doctor</label>
                <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                  <option value="all">All Doctors</option>
                  {doctors.map(doctor => (
                    <option key={doctor.doctor_id} value={doctor.doctor_id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeReport === 'financial' && (
              <div className="filter-group">
                <label>Insurance</label>
                <select value={selectedInsurance} onChange={(e) => setSelectedInsurance(e.target.value)}>
                  <option value="all">All Insurance</option>
                  <option value="self-pay">Self-Pay Only</option>
                  {insurances.map(ins => (
                    <option key={ins.payer_id} value={ins.payer_id}>
                      {ins.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeReport === 'office' && (
              <div className="filter-group">
                <label>Appointment Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-Show">No-Show</option>
                </select>
              </div>
            )}
          </div>

          <div className="filter-actions">
            <button onClick={resetFilters} className="btn btn-ghost">Reset All</button>
            <button onClick={handleRefresh} disabled={loading} className="btn btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading report data...</p>
        </div>
      )}

      {/* FINANCIAL REPORT VIEW (unchanged) */}
      {!loading && activeReport === 'financial' && financialData && (
        <>
          {/* ... your existing financial stats, chart, tables ... */}
          {/* (unchanged from your original; omitted here to keep this snippet manageable) */}
        </>
      )}

      {/* OFFICE REPORT VIEW (unchanged) */}
      {!loading && activeReport === 'office' && officeData && (
        <>
          {/* ... your existing office utilization stats & table ... */}
        </>
      )}

      {/* NEW: New Patients report view */}
      {!loading && activeReport === 'newPatients' && newPatientsData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<UserPlus size={20} />}
              label="Total New Patient Appointments"
              value={newPatientsData.summary?.total_new_appointments || 0}
              subtitle={`${(newPatientsData.rows || []).length} time buckets`}
            />
            <StatCard 
              type="success"
              icon={<Users size={20} />}
              label="Unique New Patients"
              value={newPatientsData.summary?.unique_new_patients || 0}
              subtitle="First-time visits in period"
            />
          </div>

          <section className="report-section">
            <div className="section-header">
              <h3>New Patients by Period / Doctor / Office</h3>
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('period_label')}>
                      Period {sortConfig.key === 'period_label' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('doctor_name')}>
                      Doctor {sortConfig.key === 'doctor_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('office_name')}>
                      Office {sortConfig.key === 'office_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('new_patient_appointments')}>
                      New Appts {sortConfig.key === 'new_patient_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('unique_new_patients')}>
                      Unique New Patients {sortConfig.key === 'unique_new_patients' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(newPatientsData.rows || [], sortConfig.key).map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-bold">{row.period_label}</td>
                      <td>Dr. {row.doctor_name}</td>
                      <td>{row.office_name}</td>
                      <td>{row.new_patient_appointments}</td>
                      <td>{row.unique_new_patients}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!loading && !error && activeReport === 'financial' && !financialData && (
        <div className="empty-state">
          <FileText size={56} />
          <p>No financial data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}

      {!loading && !error && activeReport === 'office' && !officeData && (
        <div className="empty-state">
          <Building2 size={56} />
          <p>No office utilization data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}

      {/* NEW: empty state for New Patients */}
      {!loading && !error && activeReport === 'newPatients' && !newPatientsData && (
        <div className="empty-state">
          <UserPlus size={56} />
          <p>No new patient data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}
    </div>
  );
}

// Simple chart component using CSS
const SimpleChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxRevenue = Math.max(...data.map(d => Number(d.gross_revenue || 0)));
  
  return (
    <div className="simple-chart">
      <div className="chart-bars">
        {data.map((item, idx) => {
          const height = maxRevenue > 0 ? (Number(item.gross_revenue || 0) / maxRevenue) * 100 : 0;
          const collected = Number(item.collected_payments || 0);
          const collectedHeight = maxRevenue > 0 ? (collected / maxRevenue) * 100 : 0;
          
          return (
            <div key={idx} className="chart-bar-group">
              <div className="chart-bar-container">
                <div className="chart-bar chart-bar-gross" style={{ height: `${height}%` }}>
                  <div className="chart-bar-collected" style={{ height: `${height ? (collectedHeight / height) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="chart-label">{item.period_label}</div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color legend-gross" />
          <span>Gross Revenue</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-collected" />
          <span>Collected</span>
        </div>
      </div>
    </div>
  );
};

export default Report;
