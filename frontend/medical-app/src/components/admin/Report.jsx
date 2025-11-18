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
  UserPlus
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
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  
  // Data states
  const [financialData, setFinancialData] = useState(null);
  const [officeData, setOfficeData] = useState(null);
  const [newPatientsData, setNewPatientsData] = useState(null);
  const [offices, setOffices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [insurances, setInsurances] = useState([]);

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [showChart, setShowChart] = useState(true);

  const [selectedOfficeRow, setSelectedOfficeRow] = useState(null);
  const [officeAppointments, setOfficeAppointments] = useState([]);
  const [officeAppointmentsLoading, setOfficeAppointmentsLoading] = useState(false);

  const [selectedDoctorRow, setSelectedDoctorRow] = useState(null);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [doctorPatientsLoading, setDoctorPatientsLoading] = useState(false);

  const PRIMARY_SPECIALTIES = [1, 2, 3, 4];
  const primaryCareRows = newPatientsData?.doctor_performance
    ? newPatientsData.doctor_performance.filter(doc =>
        PRIMARY_SPECIALTIES.includes(Number(doc.specialty))
      )
    : [];

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch report data when activeReport changes
  useEffect(() => {
    if (activeReport === 'financial') {
      fetchFinancialReport();
    } else if (activeReport === 'office') {
      fetchOfficeUtilization();
    } else if (activeReport === 'newPatients') {
      fetchNewPatientsReport();
    }
  }, [activeReport]);

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

  const fetchDoctorPatients = async (doc) => {
    try {
      setDoctorPatientsLoading(true);
      setSelectedDoctorRow(doc);
      setError(null);

      const params = new URLSearchParams({
        doctor_id: doc.doctor_id,
        start_date: startDate,
        end_date: endDate,
      });

      // optional: filter by office / status
      if (selectedOffice !== 'all') params.append('office_id', selectedOffice);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(
        `/admin_api/reports/doctor-patients.php?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (data.success) {
        setDoctorPatients(data.patients || []);
      } else {
        setError(data.error || 'Failed to load patient details');
        setDoctorPatients([]);
      }
    } catch (err) {
      setError(err.message);
      setDoctorPatients([]);
    } finally {
      setDoctorPatientsLoading(false);
    }
  };


  const fetchOfficeAppointments = async (office) => {
    try {
      setOfficeAppointmentsLoading(true);
      setSelectedOfficeRow(office);
      setError(null);

      const params = new URLSearchParams({
        office_id: office.office_id,
        start_date: startDate,
        end_date: endDate,
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(
        `/admin_api/reports/office-appointments.php?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (data.success) {
        setOfficeAppointments(data.appointments || []);
      } else {
        setError(data.error || 'Failed to load appointment details');
        setOfficeAppointments([]);
      }
    } catch (err) {
      setError(err.message);
      setOfficeAppointments([]);
    } finally {
      setOfficeAppointmentsLoading(false);
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

    // Only apply office filter for Financial & New Patients reports
    if (activeReport !== 'office' && selectedOffice !== 'all') {
      params.append('office_id', selectedOffice);
    }

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

  const fetchNewPatientsReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/get-new-patients.php?${buildQueryParams()}`,
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
    resetFilters();
    setActiveReport(reportType);
    setShowFilters(false);
    setSortConfig({ key: null, direction: 'desc' });
    setSelectedPeriod(null);
  };

  const handleRefresh = () => {
    setSelectedPeriod(null);
    if (activeReport === 'financial') {
      fetchFinancialReport();
    } else if (activeReport === 'office') {
      fetchOfficeUtilization();
    } else if (activeReport === 'newPatients') {
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

    } else if (activeReport === 'newPatients' && newPatientsData) {
      filename = `new_patients_${startDate}_to_${endDate}.csv`;

      // Doctor performance section
      csvContent = 'Doctor,New Patients,Retained,Retention Rate,Total Patients,Avg Visits,Completed\n';
      (newPatientsData.doctor_performance || []).forEach(doc => {
        csvContent += `"Dr. ${doc.doctor_name}",${doc.new_patients_acquired},${doc.retained_patients},${doc.retention_rate}%,${doc.total_patients_seen},${doc.avg_visits_per_patient},${doc.total_completed}\n`;
      });

      // Booking method breakdown section

      csvContent += '\nBooking Method,New Patients,Total Appointments,Completed,Unique Patients,Completion Rate\n';
      (newPatientsData.booking_breakdown || []).forEach(row => {
        const total = Number(row.total_appointments || 0);
        const completed = Number(row.completed_appointments || 0);
        const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
        csvContent += `${row.method},${row.new_patients},${row.total_appointments},${row.completed_appointments},${row.unique_patients},${rate}\n`;
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

          <div className="report-selector-card" onClick={() => handleSelectReport('newPatients')}>
            <div className="selector-icon">
              <UserPlus size={48} />
            </div>
            <h3>New Patients</h3>
            <p>Track patient acquisition and retention by doctor and office</p>
            <div className="card-features">
              <span><Users size={14} /> Patient Growth</span>
              <span><BarChart3 size={14} /> Retention Analytics</span>
              <span><Download size={14} /> Export Data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const headerTitle =
    activeReport === 'financial'
      ? 'Financial Summary'
      : activeReport === 'office'
      ? 'Office Utilization'
      : 'New Patients & Retention';

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
              disabled={loading || (!financialData && !officeData && !newPatientsData)}
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

            {activeReport !== 'office' && (
              <div className="filter-group">
                <label>Office</label>
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                >
                  <option value="all">All Offices</option>
                  {offices.map(office => (
                    <option key={office.office_id} value={office.office_id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(activeReport === 'financial' || activeReport === 'newPatients') && (
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

      {/* FINANCIAL REPORT VIEW */}
      {!loading && activeReport === 'financial' && financialData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<DollarSign size={20} />}
              label="Total Revenue"
              value={`$${money(financialData.summary?.total_revenue || 0)}`}
              subtitle={`${financialData.summary?.total_visits || 0} visits`}
            />
            <StatCard 
              type="success"
              icon={<TrendingUp size={20} />}
              label="Collected"
              value={`$${money(financialData.summary?.total_collected || 0)}`}
              subtitle={`${financialData.summary?.collection_rate || 0}% collection rate`}
            />
            <StatCard 
              type="warning"
              icon={<AlertCircle size={20} />}
              label="Outstanding"
              value={`$${money(financialData.summary?.total_outstanding || 0)}`}
              subtitle={`${financialData.summary?.outstanding_visits || 0} visits pending`}
            />
            <StatCard 
              type="info"
              icon={<Users size={20} />}
              label="Unique Patients"
              value={financialData.summary?.unique_patients || 0}
              subtitle={`$${money(financialData.summary?.avg_revenue_per_patient || 0)} avg per patient`}
            />
          </div>

          {financialData.daily_revenue && financialData.daily_revenue.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Revenue Trend</h3>
                <button onClick={() => setShowChart(!showChart)} className="btn btn-sm btn-ghost">
                  {showChart ? 'Hide Chart' : 'Show Chart'}
                </button>
              </div>

              {showChart && (
                <SimpleChart
                  data={financialData.daily_revenue}
                  onBarSelect={setSelectedPeriod}
                  selectedPeriod={selectedPeriod}
                />
              )}
            </section>
          )}

          <section className="report-section">
            <div className="section-header">
              <div>
                <h3>Daily Revenue Breakdown</h3>
                <p className="section-subtitle">
                  {(
                    selectedPeriod
                      ? (financialData.daily_revenue || []).filter(
                          (r) => r.period_label === selectedPeriod
                        )
                      : (financialData.daily_revenue || [])
                  ).length}{' '}
                  {selectedPeriod ? 'rows for selected period' : 'periods'}
                </p>
              </div>

              {selectedPeriod && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSelectedPeriod(null)}
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('period_label')}>
                      Date {sortConfig.key === 'period_label' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('total_visits')}>
                      Visits {sortConfig.key === 'total_visits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('gross_revenue')}>
                      Gross Revenue {sortConfig.key === 'gross_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('collected_payments')}>
                      Collected {sortConfig.key === 'collected_payments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('outstanding_balance')}>
                      Outstanding {sortConfig.key === 'outstanding_balance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('unique_patients')}>
                      Unique Patients {sortConfig.key === 'unique_patients' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(
                    selectedPeriod
                      ? (financialData.daily_revenue || []).filter(
                          (row) => row.period_label === selectedPeriod
                        )
                      : (financialData.daily_revenue || []),
                    sortConfig.key
                  ).map((row, idx) => {
                    const gross = Number(row.gross_revenue || 0);
                    const collected = Number(row.collected_payments || 0);
                    const collectionRate =
                      gross > 0 ? ((collected / gross) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={idx}>
                        <td className="text-bold">{row.period_label}</td>
                        <td>{row.total_visits}</td>
                        <td className="text-success">${money(row.gross_revenue)}</td>
                        <td className="text-primary">${money(row.collected_payments)}</td>
                        <td className="text-warning">${money(row.outstanding_balance)}</td>
                        <td>{row.unique_patients}</td>
                        <td>
                          <span
                            className={`badge ${
                              Number(collectionRate) >= 80
                                ? 'badge-success'
                                : Number(collectionRate) >= 50
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {collectionRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {financialData.insurance_breakdown && financialData.insurance_breakdown.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Insurance Breakdown</h3>
                <p className="section-subtitle">{financialData.insurance_breakdown.length} insurance plans</p>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Insurance Company</th>
                      <th>Plan Name</th>
                      <th>Visit Count</th>
                      <th>Total Cost</th>
                      <th>Total Payments</th>
                      <th>Outstanding</th>
                      <th>Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.insurance_breakdown.map((ins, idx) => {
                      const collectionRate = Number(ins.total_cost) > 0 
                        ? ((Number(ins.total_payments) / Number(ins.total_cost)) * 100).toFixed(1) 
                        : '0.0';
                      
                      return (
                        <tr key={idx}>
                          <td className="text-bold">{ins.insurance_company}</td>
                          <td>{ins.plan_name}</td>
                          <td>{ins.visit_count}</td>
                          <td className="text-success">${money(ins.total_cost)}</td>
                          <td className="text-primary">${money(ins.total_payments)}</td>
                          <td className="text-warning">${money(ins.outstanding)}</td>
                          <td>
                            <span className={`badge ${Number(collectionRate) >= 80 ? 'badge-success' : Number(collectionRate) >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                              {collectionRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {financialData.doctor_performance && financialData.doctor_performance.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Doctor Performance</h3>
                <p className="section-subtitle">{financialData.doctor_performance.length} doctors</p>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Total Visits</th>
                      <th>Total Revenue</th>
                      <th>Collected</th>
                      <th>Avg Per Visit</th>
                      <th>Unique Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.doctor_performance.map((doc, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">Dr. {doc.doctor_name}</td>
                        <td>{doc.total_visits}</td>
                        <td className="text-success">${money(doc.total_revenue)}</td>
                        <td className="text-primary">${money(doc.collected)}</td>
                        <td>${money(doc.avg_per_visit)}</td>
                        <td>{doc.unique_patients}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* OFFICE UTILIZATION REPORT VIEW */}
      {!loading && activeReport === 'office' && officeData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<Building2 size={20} />}
              label="Total Appointments"
              value={officeData.summary?.total_appointments || 0}
              subtitle={`${officeData.summary?.total_offices || 0} offices`}
            />
            <StatCard 
              type="success"
              icon={<TrendingUp size={20} />}
              label="Completed"
              value={officeData.summary?.completed || 0}
              subtitle={`${officeData.summary?.completion_rate || 0}% completion rate`}
            />
            <StatCard 
              type="danger"
              icon={<AlertCircle size={20} />}
              label="No-Shows"
              value={officeData.summary?.no_shows || 0}
              subtitle={`${officeData.summary?.no_show_rate || 0}% no-show rate`}
            />
            {/* <StatCard 
              type="info"
              icon={<Clock size={20} />}
              label="Avg Wait Time"
              value={officeData.summary?.avg_wait_minutes ? `${officeData.summary.avg_wait_minutes} min` : 'N/A'}
              subtitle="Across all offices"
            /> */}
          </div>

          {officeData.office_stats && officeData.office_stats.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Utilization by Office</h3>
                <p className="section-subtitle">
                  Share of total appointments in this period
                </p>
              </div>
              <OfficeUtilizationPie offices={officeData.office_stats} />
            </section>
          )}

          <section className="report-section">
            <div className="section-header">
              <h3>Office Performance Metrics</h3>
              <p className="section-subtitle">{(officeData.office_stats || []).length} offices</p>
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('office_name')}>
                      Office Name {sortConfig.key === 'office_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Address</th>
                    <th onClick={() => handleSort('total_appointments')}>
                      Total Appts {sortConfig.key === 'total_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('completed')}>
                      Completed {sortConfig.key === 'completed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('cancelled')}>
                      Cancelled {sortConfig.key === 'cancelled' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('no_shows')}>
                      No-Shows {sortConfig.key === 'no_shows' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('scheduled')}>
                      Scheduled {sortConfig.key === 'scheduled' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>No-Show Rate</th>
                    {/* <th>Avg Wait</th> */}
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(officeData.office_stats || [], sortConfig.key).map((office, idx) => (
                        <tr 
                          key={idx}
                          className="clickable-row"
                          onClick={() => fetchOfficeAppointments(office)}
                        >
                      <td className="text-bold">{office.office_name}</td>
                      <td className="text-muted">{office.address}</td>
                      <td>{office.total_appointments}</td>
                      <td className="text-success">{office.completed}</td>
                      <td className="text-warning">{office.cancelled}</td>
                      <td className="text-danger">{office.no_shows}</td>
                      <td>{office.scheduled}</td>
                      <td>
                        <span className={`badge ${Number(office.no_show_rate) < 5 ? 'badge-success' : Number(office.no_show_rate) < 10 ? 'badge-warning' : 'badge-danger'}`}>
                          {office.no_show_rate}%
                        </span>
                      </td>
                      <td>{office.avg_wait_minutes ? `${office.avg_wait_minutes} min` : 'N/A'}</td>
                      <td>
                        <span className={`badge ${Number(office.utilization_rate) >= 80 ? 'badge-success' : Number(office.utilization_rate) >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                          {office.utilization_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {officeData.doctor_stats && officeData.doctor_stats.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Doctor Performance by Office</h3>
                <p className="section-subtitle">{officeData.doctor_stats.length} doctor-office combinations</p>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Office</th>
                      <th>Total Appts</th>
                      <th>Completed</th>
                      <th>No-Shows</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeData.doctor_stats.map((stat, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">Dr. {stat.doctor_name}</td>
                        <td>{stat.office_name}</td>
                        <td>{stat.total_appointments}</td>
                        <td className="text-success">{stat.completed}</td>
                        <td className="text-danger">{stat.no_shows}</td>
                        <td>
                          <span className={`badge ${Number(stat.completion_rate) >= 90 ? 'badge-success' : Number(stat.completion_rate) >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                            {stat.completion_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {selectedOfficeRow && (
            <section className="report-section">
              <div className="section-header">
                <div>
                  <h3>
                    Appointments for {selectedOfficeRow.office_name}
                  </h3>
                  <p className="section-subtitle">
                    {startDate} – {endDate} · Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  </p>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setSelectedOfficeRow(null);
                    setOfficeAppointments([]);
                  }}
                >
                  Clear
                </button>
              </div>

              {officeAppointmentsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>Loading appointments...</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Doctor</th>
                        <th>Patient</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {officeAppointments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            No appointments in this period for this office.
                          </td>
                        </tr>
                      )}
                      {officeAppointments.map((appt) => (
                        <tr key={appt.Appointment_id}>
                          <td>{new Date(appt.Appointment_date).toLocaleString()}</td>
                          <td>Dr. {appt.doctor_name}</td>
                          <td>{appt.patient_name}</td>
                          <td>{appt.Status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* NEW PATIENTS REPORT VIEW */}
      {!loading && activeReport === 'newPatients' && newPatientsData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<UserPlus size={20} />}
              label="New Patients Acquired"
              value={newPatientsData.summary?.total_new_patients || 0}
              trend={newPatientsData.summary?.growth_rate !== undefined ? {
                direction: newPatientsData.summary.growth_rate >= 0 ? 'up' : 'down',
                text: `${newPatientsData.summary.growth_rate >= 0 ? '+' : ''}${newPatientsData.summary.growth_rate}% vs prev period`
              } : null}
            />
            
            <StatCard 
              type="success"
              icon={<TrendingUp size={20} />}
              label="Patient Retention"
              value={`${newPatientsData.summary?.avg_retention_rate || 0}%`}
              subtitle={`${newPatientsData.summary?.total_retained_patients || 0} of ${newPatientsData.summary?.total_new_patients || 0} returned`}
            />

            <StatCard 
              type="info"
              icon={<Users size={20} />}
              label="Total Unique Patients"
              value={newPatientsData.summary?.total_unique_patients || 0}
              subtitle="Seen in period"
            />

            <StatCard 
              type="warning"
              icon={<BarChart3 size={20} />}
              label="Top Performer"
              value={newPatientsData.summary?.top_doctor_count || 0}
              subtitle={`Dr. ${newPatientsData.summary?.top_doctor || 'N/A'}`}
            />
            <StatCard 
              type="info"
              icon={<Calendar size={20} />}
              label="Top Channel"
              value={newPatientsData.summary?.top_booking_method || 'N/A'}
              subtitle={
                newPatientsData.summary?.top_booking_method_count
                  ? `${newPatientsData.summary.top_booking_method_count} new patients`
                  : 'No channel data'
              }
            />
          </div>

          {newPatientsData.trend_data && newPatientsData.trend_data.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>New Patient Acquisition Trend</h3>
                <p className="section-subtitle">New patients acquired by doctor over time</p>
              </div>
              <NewPatientTrendChart data={newPatientsData.trend_data} groupBy={groupBy} />
            </section>
          )}

          {newPatientsData.doctor_performance && newPatientsData.doctor_performance.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Doctor Performance Analysis</h3>
                <p className="section-subtitle">
                  {newPatientsData.doctor_performance.length} doctors · Acquisition & Retention Metrics
                </p>
              </div>
              <div className="table-container">
                <table className="report-table sortable-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('doctor_name')}>
                        Doctor {sortConfig.key === 'doctor_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('new_patients_acquired')} className="text-right">
                        New Patients {sortConfig.key === 'new_patients_acquired' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('retained_patients')} className="text-right">
                        Retained {sortConfig.key === 'retained_patients' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('retention_rate')}>
                        Retention Rate {sortConfig.key === 'retention_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('total_patients_seen')} className="text-right">
                        Total Patients {sortConfig.key === 'total_patients_seen' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('avg_visits_per_patient')} className="text-right">
                        Avg Visits/Patient {sortConfig.key === 'avg_visits_per_patient' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('total_completed')} className="text-right">
                        Completed {sortConfig.key === 'total_completed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(newPatientsData.doctor_performance, sortConfig.key).map((doc, idx) => (
                       <tr
                        key={idx}
                        className="clickable-row"
                        onClick={() => fetchDoctorPatients(doc)}
                      >
                        <td className="text-bold">Dr. {doc.doctor_name}</td>
                        <td className="text-right text-primary">
                          {doc.new_patients_acquired}
                          { ![1,2,3,4].includes(Number(doc.specialty)) &&
                            <span className="pill-muted">
                              ({doc.new_patients_for_doctor} new to this doctor)
                            </span>
                          }
                        </td>
                        <td className="text-right text-success">{doc.retained_patients}</td>
                        <td>
                          <div className="retention-cell">
                            <span className={`badge ${
                              Number(doc.retention_rate) >= 70 
                                ? 'badge-success' 
                                : Number(doc.retention_rate) >= 50 
                                ? 'badge-warning' 
                                : 'badge-danger'
                            }`}>
                              {doc.retention_rate}%
                            </span>
                            <div className="retention-bar">
                              <div 
                                className="retention-fill" 
                                style={{ 
                                  width: `${doc.retention_rate}%`,
                                  backgroundColor: Number(doc.retention_rate) >= 70 
                                    ? '#10b981' 
                                    : Number(doc.retention_rate) >= 50 
                                    ? '#f59e0b' 
                                    : '#ef4444'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="text-right">{doc.total_patients_seen}</td>
                        <td className="text-right">{doc.avg_visits_per_patient}</td>
                        <td className="text-right">{doc.total_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {selectedDoctorRow && (
            <section className="report-section">
              <div className="section-header">
                <div>
                  <h3>Patients seen by Dr. {selectedDoctorRow.doctor_name}</h3>
                  <p className="section-subtitle">
                    {startDate} – {endDate}
                    {selectedOffice !== 'all' && ` · Office: ${selectedOffice}`}
                  </p>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setSelectedDoctorRow(null);
                    setDoctorPatients([]);
                  }}
                >
                  Clear
                </button>
              </div>

              {doctorPatientsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>Loading patients...</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>First Visit</th>
                        <th>Last Visit</th>
                        <th className="text-right">Total Appts</th>
                        <th className="text-right">Completed</th>
                        <th className="text-right">No-Shows</th>
                        <th className="text-right">Cancelled</th>
                        <th>New?</th>
                        <th>Retained?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorPatients.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center text-muted">
                            No patients for this doctor in the selected period.
                          </td>
                        </tr>
                      )}
                      {doctorPatients.map((p) => (
                        <tr key={p.patient_id}>
                          <td className="text-bold">{p.patient_name}</td>
                          <td>{p.first_visit_date ? new Date(p.first_visit_date).toLocaleString() : '—'}</td>
                          <td>{p.last_visit_date ? new Date(p.last_visit_date).toLocaleString() : '—'}</td>
                          <td className="text-right">{p.total_appointments}</td>
                          <td className="text-right text-success">{p.completed_appointments}</td>
                          <td className="text-right text-danger">{p.no_shows}</td>
                          <td className="text-right text-warning">{p.cancelled_appointments}</td>
                          <td>
                            {p.is_new_patient
                              ? <span className="badge badge-success">New</span>
                              : <span className="badge badge-muted">Existing</span>}
                          </td>
                          <td>
                            {p.is_retained
                              ? <span className="badge badge-info">Retained</span>
                              : <span className="badge badge-muted">Single visit</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {newPatientsData.office_breakdown && newPatientsData.office_breakdown.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>New Patients by Office</h3>
                <p className="section-subtitle">{newPatientsData.office_breakdown.length} offices</p>
              </div>
              <div className="office-breakdown-grid">
                {newPatientsData.office_breakdown.map((office, idx) => {
                  const newPatientRate = office.total_patients > 0 
                    ? ((office.new_patients / office.total_patients) * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <div key={idx} className="office-breakdown-card">
                      <div className="office-breakdown-header">
                        <h4>{office.office_name}</h4>
                      </div>
                      <div className="office-breakdown-stats">
                        <div className="breakdown-stat">
                          <span className="breakdown-value">{office.new_patients}</span>
                          <span className="breakdown-label">New Patients</span>
                        </div>
                        <div className="breakdown-stat">
                          <span className="breakdown-value">{office.total_patients}</span>
                          <span className="breakdown-label">Total Patients</span>
                        </div>
                        <div className="breakdown-stat">
                          <span className="breakdown-value">{newPatientRate}%</span>
                          <span className="breakdown-label">New Patient Rate</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {newPatientsData.booking_breakdown && newPatientsData.booking_breakdown.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>New Patients by Booking Method</h3>
                <p className="section-subtitle">
                  How patients are entering the system during this period
                </p>
              </div>

              <div className="table-container">
                <table className="report-table sortable-table">
                  <thead>
                    <tr>
                      <th>Booking Method</th>
                      <th className="text-right">New Patients</th>
                      <th className="text-right">Total Appointments</th>
                      <th className="text-right">Completed</th>
                      <th className="text-right">Unique Patients</th>
                      <th className="text-right">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newPatientsData.booking_breakdown.map((row, idx) => {
                      const total = Number(row.total_appointments || 0);
                      const completed = Number(row.completed_appointments || 0);
                      const completionRate = total > 0 
                        ? ((completed / total) * 100).toFixed(1)
                        : '0.0';

                      return (
                        <tr key={idx}>
                          <td className="text-bold">{row.method}</td> {/* ← here */}
                          <td className="text-right text-primary">{row.new_patients}</td>
                          <td className="text-right">{row.total_appointments}</td>
                          <td className="text-right text-success">{row.completed_appointments}</td>
                          <td className="text-right">{row.unique_patients}</td>
                          <td className="text-right">
                            <span className={`badge ${
                              Number(completionRate) >= 80
                                ? 'badge-success'
                                : Number(completionRate) >= 60
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}>
                              {completionRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </>
      )}

      {/* Empty States */}
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

const OfficeUtilizationPie = ({ offices }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [selectedOffice, setSelectedOffice] = React.useState(null);

  const total = offices.reduce(
    (sum, o) => sum + (o.total_appointments || 0),
    0
  );

  if (!total) {
    return <p className="chart-empty">No appointment data for this period.</p>;
  }

  const colors = [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#0ea5e9',
    '#f43f5e',
    '#a855f7'
  ];

  const handleSliceClick = (office, e) => {
    e.stopPropagation();
    setSelectedOffice(selectedOffice?.office_id === office.office_id ? null : office);
  };

  React.useEffect(() => {
    const handleClickOutside = () => setSelectedOffice(null);
    if (selectedOffice) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedOffice]);

  let cumulativePercent = 0;
  const slices = offices.map((office, idx) => {
    const value = office.total_appointments || 0;
    const slicePercent = value / total;
    
    const startAngle = cumulativePercent * 360;
    const endAngle = (cumulativePercent + slicePercent) * 360;
    
    cumulativePercent += slicePercent;
    
    const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
    const endAngleRad = ((endAngle - 90) * Math.PI) / 180;
    
    const x1 = 200 + 160 * Math.cos(startAngleRad);
    const y1 = 200 + 160 * Math.sin(startAngleRad);
    const x2 = 200 + 160 * Math.cos(endAngleRad);
    const y2 = 200 + 160 * Math.sin(endAngleRad);
    
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
    
    const pathData = [
      `M 200 200`,
      `L ${x1} ${y1}`,
      `A 160 160 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');
    
    return {
      office,
      path: pathData,
      color: colors[idx % colors.length],
      index: idx
    };
  });

  return (
    <div className="office-pie-card">
      <div className="pie-chart-container">
        <svg 
          viewBox="0 0 400 400" 
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }}
        >
          {slices.map(({ office, path, color, index }) => {
            const isActive = hoveredIndex === index || selectedOffice?.office_id === office.office_id;
            
            return (
              <path
                key={office.office_id || index}
                d={path}
                fill={color}
                stroke="white"
                strokeWidth={isActive ? 4 : 2}
                style={{
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.95,
                  transition: 'all 0.3s ease',
                  filter: isActive ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => handleSliceClick(office, e)}
              />
            );
          })}
          
          <circle
            cx="200"
            cy="200"
            r="100"
            fill="white"
            filter="drop-shadow(0 2px 8px rgba(0,0,0,0.1))"
          />
          
          {hoveredIndex !== null && (
            <text
              x="200"
              y="200"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                fill: '#0077b6',
                pointerEvents: 'none'
              }}
            >
              {offices[hoveredIndex].utilization_rate}%
            </text>
          )}
        </svg>
      </div>

      <div className="pie-legend">
        {offices.map((office, idx) => {
          const isHovered = hoveredIndex === idx;
          
          return (
            <div 
              key={office.office_id || idx} 
              className={`pie-legend-row ${
                selectedOffice?.office_id === office.office_id ? 'legend-selected' : ''
              } ${isHovered ? 'legend-hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(e) => handleSliceClick(office, e)}
              style={{ cursor: 'pointer' }}
            >
              <span 
                className="pie-legend-color"
                style={{ 
                  backgroundColor: colors[idx % colors.length],
                  display: 'block'
                }}
              />
              <div className="pie-legend-text">
                <div className="pie-legend-title">{office.office_name}</div>
                <div className="pie-legend-sub">
                  {office.total_appointments} appts · {office.utilization_rate}%
                </div>
                {isHovered && (
                  <div className="pie-legend-details">
                    <span>✓ {office.completed} completed</span>
                    <span>⚠ {office.no_shows} no-shows</span>
                    <span>📅 {office.scheduled} scheduled</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOffice && (
        <div className="office-detail-card" onClick={(e) => e.stopPropagation()}>
          <div className="office-detail-header">
            <h4>{selectedOffice.office_name}</h4>
            <button 
              className="btn-close-detail" 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOffice(null);
              }}
            >
              ×
            </button>
          </div>
          
          <div className="office-detail-grid">
            <div className="detail-stat">
              <span className="detail-label">Address</span>
              <span className="detail-value detail-value-small">{selectedOffice.address}</span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Total Appointments</span>
              <span className="detail-value detail-primary">
                {selectedOffice.total_appointments}
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Completed</span>
              <span className="detail-value detail-success">
                {selectedOffice.completed}
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Scheduled</span>
              <span className="detail-value detail-info">
                {selectedOffice.scheduled}
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Cancelled</span>
              <span className="detail-value detail-warning">
                {selectedOffice.cancelled}
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">No-Shows</span>
              <span className="detail-value detail-danger">
                {selectedOffice.no_shows}
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">No-Show Rate</span>
              <span className={`detail-value ${
                Number(selectedOffice.no_show_rate) < 5 
                  ? 'detail-success' 
                  : Number(selectedOffice.no_show_rate) < 10 
                  ? 'detail-warning' 
                  : 'detail-danger'
              }`}>
                {selectedOffice.no_show_rate}%
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Completion Rate</span>
              <span className={`detail-value ${
                Number(selectedOffice.completion_rate) >= 90 
                  ? 'detail-success' 
                  : Number(selectedOffice.completion_rate) >= 75 
                  ? 'detail-warning' 
                  : 'detail-danger'
              }`}>
                {selectedOffice.completion_rate}%
              </span>
            </div>

            <div className="detail-stat">
              {/* <span className="detail-label">Avg Wait Time</span>
              <span className="detail-value">
                {selectedOffice.avg_wait_minutes 
                  ? `${selectedOffice.avg_wait_minutes} min` 
                  : 'N/A'}
              </span> */}
            </div>

            <div className="detail-stat">
              <span className="detail-label">Utilization Rate</span>
              <span className={`detail-value ${
                Number(selectedOffice.utilization_rate) >= 80 
                  ? 'detail-success' 
                  : Number(selectedOffice.utilization_rate) >= 60 
                  ? 'detail-warning' 
                  : 'detail-danger'
              }`}>
                {selectedOffice.utilization_rate}%
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Unique Doctors</span>
              <span className="detail-value">
                {selectedOffice.unique_doctors}
              </span>
            </div>

            <div className="detail-stat">
              <span className="detail-label">Unique Patients</span>
              <span className="detail-value">
                {selectedOffice.unique_patients}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SimpleChart = ({ data, onBarSelect, selectedPeriod }) => {
  const [hoveredBar, setHoveredBar] = React.useState(null);
  const [clickedBar, setClickedBar] = React.useState(null);

  if (!data || data.length === 0) return null;

  // Colors used everywhere (bars, legend, tooltip dots)
  const COLORS = {
    gross: '#1d4ed8',       // blue
    collected: '#10b981',   // green
    outstanding: '#f97316', // orange
  };

  // Reverse so earliest period is on the LEFT
  const sortedData = [...data].reverse();

  const revenues = sortedData.map((d) => {
    const parsed = parseFloat(d.gross_revenue);
    return isNaN(parsed) ? 0 : parsed;
  });

  const maxRevenue = Math.max(...revenues, 0);
  const yAxisMax = Math.max(Math.ceil(maxRevenue * 1.1), 100);

  const yAxisSteps = 5;
  const yAxisLabels = [];
  for (let i = yAxisSteps; i >= 0; i--) {
    yAxisLabels.push(Math.round((yAxisMax * i / yAxisSteps) * 100) / 100);
  }

  const formatCurrency = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(value)}`;
  };

  const handleBarClick = (item, idx) => {
    const nextIndex = clickedBar === idx ? null : idx;
    setClickedBar(nextIndex);

    if (onBarSelect) {
      onBarSelect(nextIndex === null ? null : item.period_label);
    }
  };

  const handleOutsideClick = () => {
    setClickedBar(null);
    if (onBarSelect) {
      onBarSelect(null);
    }
  };

  React.useEffect(() => {
    if (clickedBar !== null) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [clickedBar]);

  React.useEffect(() => {
    if (selectedPeriod === null) {
      setClickedBar(null);
    }
  }, [selectedPeriod]);

  return (
    <div className="simple-chart">
      <div className="chart-wrapper">
        <div className="chart-y-axis">
          {yAxisLabels.map((value, idx) => (
            <div key={idx} className="y-axis-label">
              {formatCurrency(value)}
            </div>
          ))}
        </div>

        <div className="chart-area">
          <div className="chart-gridlines">
            {yAxisLabels.map((_, idx) => (
              <div key={idx} className="gridline" />
            ))}
          </div>

          <div className="chart-bars">
            {sortedData.map((item, idx) => {
              const grossRevenue = parseFloat(item.gross_revenue) || 0;
              const collected = parseFloat(item.collected_payments) || 0;
              const outstanding = parseFloat(item.outstanding_balance) || 0;

              const barHeight = yAxisMax > 0 ? (grossRevenue / yAxisMax) * 100 : 0;
              const safeHeight =
                isNaN(barHeight) || barHeight < 0 ? 0 : Math.min(barHeight, 100);

              // Percent of *gross* that is collected / outstanding
              let collectedPct = 0;
              let outstandingPct = 0;
              if (grossRevenue > 0) {
                collectedPct = (collected / grossRevenue) * 100;
                outstandingPct = (outstanding / grossRevenue) * 100;

                // Clamp so segments never exceed 100% due to rounding
                const sum = collectedPct + outstandingPct;
                if (sum > 100) {
                  const scale = 100 / sum;
                  collectedPct *= scale;
                  outstandingPct *= scale;
                }
              }

              const isActive =
                hoveredBar === idx ||
                clickedBar === idx ||
                selectedPeriod === item.period_label;

              return (
                <div
                  key={idx}
                  className="chart-bar-group"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBarClick(item, idx);
                  }}
                >
                  <div className="chart-bar-container">
                    <div
                      className={`chart-bar chart-bar-gross ${
                        isActive ? 'hovered' : ''
                      }`}
                      style={{
                        height: `${safeHeight}%`,
                        backgroundColor: COLORS.gross,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                      }}
                    >
                      {safeHeight > 0 && (
                        <>
                          {/* Collected segment (bottom) */}
                          <div
                            className="chart-bar-segment chart-bar-collected"
                            style={{
                              height: `${collectedPct}%`,
                              backgroundColor: COLORS.collected,
                            }}
                          />
                          {/* Outstanding segment (stacked above) */}
                          <div
                            className="chart-bar-segment chart-bar-outstanding"
                            style={{
                              height: `${outstandingPct}%`,
                              backgroundColor: COLORS.outstanding,
                            }}
                          />
                        </>
                      )}
                    </div>

                    {(hoveredBar === idx || clickedBar === idx) && (
                      <div
                        className={`chart-tooltip ${
                          clickedBar === idx ? 'clicked' : ''
                        }`}
                      >
                        <div className="tooltip-header">{item.period_label}</div>

                        <div className="tooltip-row">
                          <span className="tooltip-label">
                            <span
                              className="tooltip-dot"
                              style={{ backgroundColor: COLORS.gross }}
                            />
                            Gross Revenue:
                          </span>
                          <span className="tooltip-value">
                            $
                            {grossRevenue.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="tooltip-row">
                          <span className="tooltip-label">
                            <span
                              className="tooltip-dot"
                              style={{ backgroundColor: COLORS.collected }}
                            />
                            Collected:
                          </span>
                          <span className="tooltip-value">
                            $
                            {collected.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="tooltip-row">
                          <span className="tooltip-label">
                            <span
                              className="tooltip-dot"
                              style={{ backgroundColor: COLORS.outstanding }}
                            />
                            Outstanding:
                          </span>
                          <span className="tooltip-value">
                            $
                            {outstanding.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="tooltip-divider" />

                        <div className="tooltip-row small">
                          <span className="tooltip-label">Visits:</span>
                          <span className="tooltip-value">
                            {item.total_visits}
                          </span>
                        </div>
                        <div className="tooltip-row small">
                          <span className="tooltip-label">Patients:</span>
                          <span className="tooltip-value">
                            {item.unique_patients}
                          </span>
                        </div>
                        <div className="tooltip-row small">
                          <span className="tooltip-label">
                            Collection Rate:
                          </span>
                          <span className="tooltip-value">
                            {grossRevenue > 0
                              ? ((collected / grossRevenue) * 100).toFixed(1)
                              : '0.0'}
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="chart-label">{item.period_label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span
            className="legend-color legend-gross"
            style={{ backgroundColor: COLORS.gross }}
          />
          <span>Gross Revenue</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color legend-collected"
            style={{ backgroundColor: COLORS.collected }}
          />
          <span>Collected</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color legend-outstanding"
            style={{ backgroundColor: COLORS.outstanding }}
          />
          <span>Outstanding</span>
        </div>
        <div className="legend-hint">
          <AlertCircle size={14} />
          <span>Click bars for details</span>
        </div>
      </div>
    </div>
  );
};

const NewPatientTrendChart = ({ data, groupBy }) => {
  const [hoverIndex, setHoverIndex] = React.useState(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState(null);

  if (!data || data.length === 0) {
    return <p className="chart-empty">No trend data.</p>;
  }

  // Build per-period meta: total new patients + doctor breakdown
  const periodMap = new Map();

  data.forEach(row => {
    const period = row.period_label;
    const doctor = row.doctor_name;
    const v = parseInt(row.new_patients, 10) || 0;

    if (!periodMap.has(period)) {
      periodMap.set(period, {
        period,
        total: 0,
        doctors: {} // doctor_name -> count
      });
    }

    const meta = periodMap.get(period);
    meta.total += v;
    if (!meta.doctors[doctor]) meta.doctors[doctor] = 0;
    meta.doctors[doctor] += v;
  });

  const periods = Array.from(periodMap.values());
  const maxValue = Math.max(...periods.map(p => p.total), 1);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  const hasMultiplePeriods = periods.length > 1;
  const denom = hasMultiplePeriods ? periods.length - 1 : 1;

  // Build points for the total new-patients line
  const pointsArr = periods.map((p, idx) => {
    const x = hasMultiplePeriods ? (idx / denom) * 800 : 400;
    const y = 300 - ((p.total / yAxisMax) * 300);
    return { ...p, x, y };
  });

  const polylinePoints = pointsArr.map(p => `${p.x},${p.y}`).join(' ');

  const selectedMeta = selectedPeriod
    ? periods.find(p => p.period === selectedPeriod)
    : null;

  return (
    <div className="trend-chart-container">
      <div className="trend-chart">
        <div className="trend-y-axis">
          {[4, 3, 2, 1, 0].map(i => (
            <div key={i} className="y-label">
              {Math.round((yAxisMax * i) / 4)}
            </div>
          ))}
        </div>

        <div className="trend-chart-area">
          <div className="trend-gridlines">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="gridline" />
            ))}
          </div>

          <svg className="trend-svg" viewBox="0 0 800 300" preserveAspectRatio="none">
            {/* Single "all patients" line */}
            {pointsArr.length > 1 && (
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points with hover + click */}
            {pointsArr.map((p, idx) => {
              const doctorsSorted = Object.entries(p.doctors)
                .sort((a, b) => b[1] - a[1]);
              const topDoctors = doctorsSorted.slice(0, 3);
              const othersCount = doctorsSorted
                .slice(3)
                .reduce((s, [, c]) => s + c, 0);

              const titleLines = [
                `${p.period}: ${p.total} new patients`,
                '',
                ...topDoctors.map(
                  ([name, count]) => `• Dr. ${name}: ${count}`
                ),
                othersCount > 0 ? `• Others: ${othersCount}` : ''
              ].filter(Boolean);

              const isSelected = selectedPeriod === p.period;

              return (
                <circle
                  key={p.period}
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 5}
                  fill={isSelected ? '#4f46e5' : '#6366f1'}
                  stroke="white"
                  strokeWidth={isSelected ? 3 : 2}
                  className="trend-point"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPeriod(prev =>
                      prev === p.period ? null : p.period
                    );
                  }}
                >
                  <title>{titleLines.join('\n')}</title>
                </circle>
              );
            })}
          </svg>

          <div className="trend-x-labels">
            {periods.map((p, idx) => (
              <div key={p.period} className="x-label">
                {p.period}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Small hint under the chart */}
      <div className="trend-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#6366f1' }} />
          <span>All new patients</span>
        </div>
        <div className="legend-hint">
          <AlertCircle size={14} />
          <span>Hover points for doctor mix · Click a point to see details below</span>
        </div>
      </div>

      {/* Details panel for the selected period */}
      {selectedMeta && (
        <div className="trend-detail-card">
          <div className="trend-detail-header">
            <h4>New patients on {selectedMeta.period}</h4>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setSelectedPeriod(null)}
            >
              Clear
            </button>
          </div>

          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th className="text-right">New Patients</th>
                  <th className="text-right">Share of Day</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedMeta.doctors)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => {
                    const share =
                      selectedMeta.total > 0
                        ? ((count / selectedMeta.total) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={name}>
                        <td className="text-bold">Dr. {name}</td>
                        <td className="text-right text-primary">{count}</td>
                        <td className="text-right">
                          <span className="badge badge-info">
                            {share}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* NOTE: if you later add an API that returns individual
              appointments for this period, you can replace this
              per-doctor table with true appointment rows
              (patient, doctor, date/time, office). */}
        </div>
      )}
    </div>
  );
};



export default Report;
