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

  const headerTitle =
    activeReport === 'financial'
      ? 'Financial Summary'
      : activeReport === 'office'
      ? 'Office Utilization'
      : 'New Patients';

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
                    {/* use filtered count here */}
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
            <StatCard 
              type="info"
              icon={<Clock size={20} />}
              label="Avg Wait Time"
              value={officeData.summary?.avg_wait_minutes ? `${officeData.summary.avg_wait_minutes} min` : 'N/A'}
              subtitle="Across all offices"
            />
          </div>

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
                    <th>Avg Wait</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(officeData.office_stats || [], sortConfig.key).map((office, idx) => (
                    <tr key={idx}>
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
        </>
      )}

      {/* NEW PATIENTS REPORT VIEW */}
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

// Enhanced chart component with gridlines, axis, and tooltips
const SimpleChart = ({ data, onBarSelect, selectedPeriod }) => {
  const [hoveredBar, setHoveredBar] = React.useState(null);
  const [clickedBar, setClickedBar] = React.useState(null);
  
  if (!data || data.length === 0) return null;

  // Parse all revenue values and log for debugging
  const revenues = data.map((d, idx) => {
    const raw = d.gross_revenue;
    const parsed = parseFloat(raw);
    const final = isNaN(parsed) ? 0 : parsed;
    
    // Debug logging (remove after confirming it works)
    if (idx === 0) {
      console.log('Chart Debug - First Item:');
      console.log('  Raw value:', raw, typeof raw);
      console.log('  Parsed:', parsed);
      console.log('  Final:', final);
    }
    
    return final;
  });
  
  const maxRevenue = Math.max(...revenues);
  const yAxisMax = Math.max(Math.ceil(maxRevenue * 1.1), 100);
  
  // More debug logging
  console.log('Chart Scaling:');
  console.log('  Max Revenue:', maxRevenue);
  console.log('  Y-Axis Max:', yAxisMax);
  console.log('  All revenues:', revenues);
  
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
        {/* Y-Axis */}
        <div className="chart-y-axis">
          {yAxisLabels.map((value, idx) => (
            <div key={idx} className="y-axis-label">
              {formatCurrency(value)}
            </div>
          ))}
        </div>
        
        {/* Chart Area */}
        <div className="chart-area">
          {/* Gridlines */}
          <div className="chart-gridlines">
            {yAxisLabels.map((_, idx) => (
              <div key={idx} className="gridline" />
            ))}
          </div>
          
          {/* Bars */}
          <div className="chart-bars">
            {data.map((item, idx) => {
              // Explicitly parse each value
              const grossRevenue = parseFloat(item.gross_revenue) || 0;
              const collected = parseFloat(item.collected_payments) || 0;
              const outstanding = parseFloat(item.outstanding_balance) || 0;
              
              // Calculate heights as percentages with explicit checks
              const height = yAxisMax > 0 ? (grossRevenue / yAxisMax) * 100 : 0;
              const collectedHeight = yAxisMax > 0 ? (collected / yAxisMax) * 100 : 0;
              
              // Debug first bar
              if (idx === 0) {
                console.log(`Bar ${idx} (${item.period_label}):`);
                console.log('  Gross Revenue:', grossRevenue);
                console.log('  Calculated Height:', height + '%');
                console.log('  Y-Axis Max:', yAxisMax);
              }
              
              // Ensure height is a valid number
              const safeHeight = isNaN(height) || height < 0 ? 0 : Math.min(height, 100);
              const safeCollectedPct = (grossRevenue > 0 && collectedHeight > 0) 
                ? Math.min((collectedHeight / height) * 100, 100) 
                : 0;  
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
                        style={{ height: `${safeHeight}%` }}
                      >
                        {safeHeight > 0 && (
                          <div
                            className="chart-bar-collected"
                            style={{ height: `${safeCollectedPct}%` }}
                          />
                        )}
                      </div>
                    
                    {/* Tooltip */}
                    {(hoveredBar === idx || clickedBar === idx) && (
                      <div className={`chart-tooltip ${clickedBar === idx ? 'clicked' : ''}`}>
                        <div className="tooltip-header">{item.period_label}</div>
                        <div className="tooltip-row">
                          <span className="tooltip-label">
                            <span className="tooltip-dot gross" />
                            Gross Revenue:
                          </span>
                          <span className="tooltip-value">${grossRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="tooltip-row">
                          <span className="tooltip-label">
                            <span className="tooltip-dot collected" />
                            Collected:
                          </span>
                          <span className="tooltip-value">${collected.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="tooltip-row">
                          <span className="tooltip-label">
                            <span className="tooltip-dot outstanding" />
                            Outstanding:
                          </span>
                          <span className="tooltip-value">${outstanding.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="tooltip-divider" />
                        <div className="tooltip-row small">
                          <span className="tooltip-label">Visits:</span>
                          <span className="tooltip-value">{item.total_visits}</span>
                        </div>
                        <div className="tooltip-row small">
                          <span className="tooltip-label">Patients:</span>
                          <span className="tooltip-value">{item.unique_patients}</span>
                        </div>
                        <div className="tooltip-row small">
                          <span className="tooltip-label">Collection Rate:</span>
                          <span className="tooltip-value">
                            {grossRevenue > 0 ? ((collected / grossRevenue) * 100).toFixed(1) : '0.0'}%
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
          <span className="legend-color legend-gross" />
          <span>Gross Revenue</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-collected" />
          <span>Collected</span>
        </div>
        <div className="legend-hint">
          <AlertCircle size={14} />
          <span>Click bars for details</span>
        </div>
      </div>
    </div>
  );
};

export default Report;