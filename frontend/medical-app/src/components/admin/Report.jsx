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
  UserPlus,           // NEW: icon for New Patients report
  Award,              // NEW: icon for Doctor Performance
  Repeat,             // NEW: icon for Patient Retention
  GitBranch,          // NEW: icon for Referral Analysis
  PieChart            // NEW: icon for Demographics
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
  const [newPatientsData, setNewPatientsData] = useState(null);
  const [doctorPerformanceData, setDoctorPerformanceData] = useState(null);  // NEW
  const [retentionData, setRetentionData] = useState(null);                   // NEW
  const [referralData, setReferralData] = useState(null);                     // NEW
  const [demographicsData, setDemographicsData] = useState(null);             // NEW
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
  useEffect(() => {
  if (!activeReport) return;  

  if (activeReport === 'financial') fetchFinancialReport();
  if (activeReport === 'office') fetchOfficeUtilization();
  if (activeReport === 'newPatients') fetchNewPatientsReport();
  if (activeReport === 'doctorPerformance') fetchDoctorPerformance();
  if (activeReport === 'retention') fetchPatientRetention();
  if (activeReport === 'referrals') fetchReferralAnalysis();
  if (activeReport === 'demographics') fetchPatientDemographics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // NEW: Doctor Performance report fetcher
  const fetchDoctorPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/doctor-performance.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setDoctorPerformanceData(data);
      } else {
        setError(data.error || 'Failed to load doctor performance report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Patient Retention report fetcher
  const fetchPatientRetention = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/patient-retention.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setRetentionData(data);
      } else {
        setError(data.error || 'Failed to load patient retention report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Referral Analysis report fetcher
  const fetchReferralAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/referral-analysis.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setReferralData(data);
      } else {
        setError(data.error || 'Failed to load referral analysis report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Patient Demographics report fetcher
  const fetchPatientDemographics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/patient-demographics.php?${buildQueryParams()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setDemographicsData(data);
      } else {
        setError(data.error || 'Failed to load patient demographics report');
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
    } else if (activeReport === 'newPatients') {
      fetchNewPatientsReport();
    } else if (activeReport === 'doctorPerformance') {      // NEW
      fetchDoctorPerformance();
    } else if (activeReport === 'retention') {              // NEW
      fetchPatientRetention();
    } else if (activeReport === 'referrals') {              // NEW
      fetchReferralAnalysis();
    } else if (activeReport === 'demographics') {           // NEW
      fetchPatientDemographics();
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
    } else if (activeReport === 'doctorPerformance' && doctorPerformanceData) {  // NEW
      filename = `doctor_performance_${startDate}_to_${endDate}.csv`;
      csvContent = 'Doctor,Specialty,Office,Total Appointments,Completed,Scheduled,No-Shows,Cancelled,Unique Patients,New Patients,Total Revenue,Collected,Outstanding,Avg Revenue/Visit,Avg Appts/Day,No-Show Rate,Completion Rate\n';
      (doctorPerformanceData.doctors || []).forEach(row => {
        csvContent += `"Dr. ${row.doctor_name}","${row.specialty_name}","${row.primary_office}",${row.total_appointments},${row.completed_appointments},${row.scheduled_appointments},${row.no_shows},${row.cancelled},${row.unique_patients_seen},${row.new_patients_to_doctor},${row.total_revenue},${row.total_collected},${row.outstanding_balance},${row.avg_revenue_per_visit || 'N/A'},${row.avg_appointments_per_day || 'N/A'},${row.no_show_rate},${row.completion_rate}\n`;
      });
    } else if (activeReport === 'retention' && retentionData) {  // NEW
      filename = `patient_retention_${startDate}_to_${endDate}.csv`;
      csvContent = 'Patient Name,First Visit Date,First Doctor,Total Appointments,Return Visits,Last Appointment,Days Since First Visit,Status\n';
      (retentionData.patients || []).forEach(row => {
        csvContent += `"${row.patient_name}",${row.first_visit_date},"Dr. ${row.first_doctor}",${row.total_appointments},${row.return_visits},${row.last_appointment_date},${row.days_since_first_visit},${row.retention_status}\n`;
      });
    } else if (activeReport === 'referrals' && referralData) {  // NEW
      filename = `referral_analysis_${startDate}_to_${endDate}.csv`;
      csvContent = 'Referring Doctor,Referring Specialty,Specialist,Specialist Specialty,Total Referrals,Approved,Pending,With Appointments,Completion Rate,Common Reasons\n';
      (referralData.referral_patterns || []).forEach(row => {
        const reasons = (row.common_reasons || '').replace(/"/g, '""');
        csvContent += `"Dr. ${row.referring_doctor_name}","${row.referring_specialty}","Dr. ${row.specialist_doctor_name}","${row.specialist_specialty}",${row.total_referrals},${row.approved_referrals},${row.pending_referrals},${row.referrals_with_appointments},${row.appointment_completion_rate},"${reasons}"\n`;
      });
    } else if (activeReport === 'demographics' && demographicsData) {  // NEW
      filename = `patient_demographics_${startDate}_to_${endDate}.csv`;
      csvContent = 'Category,Value,Count\n';
      
      // Age distribution
      (demographicsData.age_distribution || []).forEach(row => {
        csvContent += `Age,${row.age_group},${row.patient_count}\n`;
      });
      
      // Gender distribution
      (demographicsData.gender_distribution || []).forEach(row => {
        csvContent += `Gender,${row.gender_text},${row.patient_count}\n`;
      });
      
      // Ethnicity distribution
      (demographicsData.ethnicity_distribution || []).forEach(row => {
        csvContent += `Ethnicity,${row.ethnicity_text},${row.patient_count}\n`;
      });
      
      // Insurance distribution
      (demographicsData.insurance_distribution || []).forEach(row => {
        csvContent += `Insurance,"${row.insurance_company} - ${row.plan_type}",${row.patient_count}\n`;
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
            <h1>Reports & Analytics (v2)</h1>
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

          {/* NEW: Doctor Performance Report */}
          <div className="report-selector-card" onClick={() => handleSelectReport('doctorPerformance')}>
            <div className="selector-icon">
              <Award size={48} />
            </div>
            <h3>Doctor Performance</h3>
            <p>Comprehensive productivity metrics, revenue per doctor, and patient volume analysis</p>
            <div className="card-features">
              <span><TrendingUp size={14} /> Productivity Metrics</span>
              <span><DollarSign size={14} /> Revenue Analysis</span>
              <span><Users size={14} /> Patient Volume</span>
            </div>
          </div>

          {/* NEW: Patient Retention Report */}
          <div className="report-selector-card" onClick={() => handleSelectReport('retention')}>
            <div className="selector-icon">
              <Repeat size={48} />
            </div>
            <h3>Patient Retention</h3>
            <p>Track return visits, retention rates, and identify patients at risk of not returning</p>
            <div className="card-features">
              <span><Users size={14} /> Return Visits</span>
              <span><AlertCircle size={14} /> At-Risk Patients</span>
              <span><BarChart3 size={14} /> Retention Trends</span>
            </div>
          </div>

          {/* NEW: Referral Analysis Report */}
          <div className="report-selector-card" onClick={() => handleSelectReport('referrals')}>
            <div className="selector-icon">
              <GitBranch size={48} />
            </div>
            <h3>Referral Analysis</h3>
            <p>Internal referral patterns, specialist utilization, and referral completion rates</p>
            <div className="card-features">
              <span><Users size={14} /> Referral Network</span>
              <span><TrendingUp size={14} /> Completion Rates</span>
              <span><BarChart3 size={14} /> Top Specialists</span>
            </div>
          </div>

          {/* NEW: Patient Demographics Report */}
          <div className="report-selector-card" onClick={() => handleSelectReport('demographics')}>
            <div className="selector-icon">
              <PieChart size={48} />
            </div>
            <h3>Patient Demographics</h3>
            <p>Population analysis by age, gender, ethnicity, and insurance type</p>
            <div className="card-features">
              <span><Users size={14} /> Age Distribution</span>
              <span><PieChart size={14} /> Demographics</span>
              <span><FileText size={14} /> Insurance Types</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main report view
  const headerTitle =
    activeReport === 'financial'
      ? 'Financial Summary'
      : activeReport === 'office'
      ? 'Office Utilization'
      : activeReport === 'newPatients'
      ? 'New Patients'
      : activeReport === 'doctorPerformance'      // NEW
      ? 'Doctor Performance'
      : activeReport === 'retention'              // NEW
      ? 'Patient Retention'
      : activeReport === 'referrals'              // NEW
      ? 'Referral Analysis'
      : activeReport === 'demographics'           // NEW
      ? 'Patient Demographics'
      : '';

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
              disabled={loading || (!financialData && !officeData && !newPatientsData && !doctorPerformanceData && !retentionData && !referralData && !demographicsData)}
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

            {(activeReport === 'financial' || activeReport === 'newPatients' || activeReport === 'doctorPerformance' || activeReport === 'retention') && (
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
              value={`$${money(financialData.summary?.total_revenue)}`}
              subtitle={`${financialData.summary?.total_visits || 0} visits`}
            />
            <StatCard 
              type="success"
              icon={<TrendingUp size={20} />}
              label="Collected Payments"
              value={`$${money(financialData.summary?.total_collected)}`}
              subtitle={`${financialData.summary?.collection_rate || 0}% collection rate`}
            />
            <StatCard 
              type="warning"
              icon={<AlertCircle size={20} />}
              label="Outstanding Balance"
              value={`$${money(financialData.summary?.total_outstanding)}`}
            />
            <StatCard 
              type="info"
              icon={<Users size={20} />}
              label="Unique Patients"
              value={financialData.summary?.unique_patients || 0}
            />
          </div>

          {showChart && financialData.daily_revenue && financialData.daily_revenue.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Revenue Trend</h3>
                <button 
                  onClick={() => setShowChart(!showChart)} 
                  className="btn btn-ghost btn-sm"
                >
                  <BarChart3 size={14} /> {showChart ? 'Hide' : 'Show'} Chart
                </button>
              </div>
              <SimpleChart data={financialData.daily_revenue} />
            </section>
          )}

          <section className="report-section">
            <div className="section-header">
              <h3>Daily Revenue Breakdown</h3>
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
                  {getSortedData(financialData.daily_revenue || [], sortConfig.key).map((row, idx) => {
                    const gross = Number(row.gross_revenue || 0);
                    const collected = Number(row.collected_payments || 0);
                    const rate = gross > 0 ? ((collected / gross) * 100).toFixed(1) : '0.0';
                    
                    return (
                      <tr key={idx}>
                        <td className="text-bold">{row.period_label}</td>
                        <td>{row.total_visits}</td>
                        <td className="text-success">${money(row.gross_revenue)}</td>
                        <td className="text-primary">${money(row.collected_payments)}</td>
                        <td className="text-warning">${money(row.outstanding_balance)}</td>
                        <td>{row.unique_patients}</td>
                        <td>
                          <span className={`badge ${rate > 50 ? 'badge-success' : rate > 20 ? 'badge-warning' : 'badge-error'}`}>
                            {rate}%
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
                <h3>Revenue by Insurance</h3>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Insurance Company</th>
                      <th>Plan Name</th>
                      <th>Visit Count</th>
                      <th>Total Payments</th>
                      <th>Outstanding</th>
                      <th>Avg Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.insurance_breakdown.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">{row.insurance_company || 'Self-Pay'}</td>
                        <td>{row.plan_name || 'N/A'}</td>
                        <td>{row.visit_count}</td>
                        <td className="text-success">${money(row.total_payments)}</td>
                        <td className="text-warning">${money(row.outstanding)}</td>
                        <td>${money(row.avg_payment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* OFFICE REPORT VIEW */}
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
              subtitle={`${officeData.summary?.utilization_rate || 0}% utilization`}
            />
            <StatCard 
              type="warning"
              icon={<AlertCircle size={20} />}
              label="No-Shows"
              value={officeData.summary?.no_shows || 0}
              subtitle={`${officeData.summary?.no_show_rate || 0}% rate`}
            />
            <StatCard 
              type="info"
              icon={<Clock size={20} />}
              label="Avg Wait Time"
              value={`${officeData.summary?.avg_wait_time || 0} min`}
            />
          </div>

          <section className="report-section">
            <div className="section-header">
              <h3>Office Performance</h3>
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('office_name')}>
                      Office {sortConfig.key === 'office_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Address</th>
                    <th onClick={() => handleSort('total_appointments')}>
                      Total {sortConfig.key === 'total_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                    <th onClick={() => handleSort('no_show_rate')}>
                      No-Show Rate {sortConfig.key === 'no_show_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('avg_wait_minutes')}>
                      Avg Wait {sortConfig.key === 'avg_wait_minutes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('utilization_rate')}>
                      Utilization {sortConfig.key === 'utilization_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(officeData.office_stats || [], sortConfig.key).map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-bold">{row.office_name}</td>
                      <td className="text-small">{row.address}</td>
                      <td>{row.total_appointments}</td>
                      <td className="text-success">{row.completed}</td>
                      <td className="text-warning">{row.cancelled}</td>
                      <td className="text-error">{row.no_shows}</td>
                      <td className="text-info">{row.scheduled}</td>
                      <td>
                        <span className={`badge ${
                          parseFloat(row.no_show_rate) < 5 ? 'badge-success' : 
                          parseFloat(row.no_show_rate) < 10 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {row.no_show_rate}%
                        </span>
                      </td>
                      <td>{row.avg_wait_minutes || 'N/A'} min</td>
                      <td>
                        <span className={`badge ${
                          parseFloat(row.utilization_rate) > 80 ? 'badge-success' : 
                          parseFloat(row.utilization_rate) > 60 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {row.utilization_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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

      {/* NEW: Doctor Performance report view */}
      {!loading && activeReport === 'doctorPerformance' && doctorPerformanceData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<Users size={20} />}
              label="Total Doctors"
              value={doctorPerformanceData.summary?.total_doctors || 0}
              subtitle={`${doctorPerformanceData.summary?.total_appointments || 0} appointments`}
            />
            <StatCard 
              type="success"
              icon={<TrendingUp size={20} />}
              label="Completed Visits"
              value={doctorPerformanceData.summary?.total_completed || 0}
              subtitle={`${doctorPerformanceData.summary?.avg_completion_rate || 0}% completion rate`}
            />
            <StatCard 
              type="info"
              icon={<DollarSign size={20} />}
              label="Total Revenue"
              value={`$${money(doctorPerformanceData.summary?.total_revenue)}`}
              subtitle={`$${money(doctorPerformanceData.summary?.total_collected)} collected`}
            />
            <StatCard 
              type="warning"
              icon={<AlertCircle size={20} />}
              label="Avg No-Show Rate"
              value={`${doctorPerformanceData.summary?.avg_no_show_rate || 0}%`}
            />
          </div>

          <section className="report-section">
            <div className="section-header">
              <h3>Doctor Performance Metrics</h3>
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('doctor_name')}>
                      Doctor {sortConfig.key === 'doctor_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Specialty</th>
                    <th>Office</th>
                    <th onClick={() => handleSort('total_appointments')}>
                      Total Appts {sortConfig.key === 'total_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('completed_appointments')}>
                      Completed {sortConfig.key === 'completed_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('unique_patients_seen')}>
                      Unique Pts {sortConfig.key === 'unique_patients_seen' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('new_patients_to_doctor')}>
                      New Pts {sortConfig.key === 'new_patients_to_doctor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('total_revenue')}>
                      Revenue {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('no_show_rate')}>
                      No-Show % {sortConfig.key === 'no_show_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('completion_rate')}>
                      Complete % {sortConfig.key === 'completion_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(doctorPerformanceData.doctors || [], sortConfig.key).map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-bold">Dr. {row.doctor_name}</td>
                      <td className="text-small">{row.specialty_name}</td>
                      <td className="text-small">{row.primary_office}</td>
                      <td>{row.total_appointments}</td>
                      <td className="text-success">{row.completed_appointments}</td>
                      <td>{row.unique_patients_seen}</td>
                      <td className="text-info">{row.new_patients_to_doctor}</td>
                      <td className="text-success">${money(row.total_revenue)}</td>
                      <td>
                        <span className={`badge ${
                          parseFloat(row.no_show_rate) < 5 ? 'badge-success' : 
                          parseFloat(row.no_show_rate) < 10 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {row.no_show_rate}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          parseFloat(row.completion_rate) > 80 ? 'badge-success' : 
                          parseFloat(row.completion_rate) > 60 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {row.completion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* NEW: Patient Retention report view */}
      {!loading && activeReport === 'retention' && retentionData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<UserPlus size={20} />}
              label="Total New Patients"
              value={retentionData.summary?.total_new_patients || 0}
              subtitle="Started in this period"
            />
            <StatCard 
              type="success"
              icon={<Repeat size={20} />}
              label="Retained Patients"
              value={retentionData.summary?.retained_patients || 0}
              subtitle={`${retentionData.summary?.retention_rate || 0}% retention rate`}
            />
            <StatCard 
              type="warning"
              icon={<AlertCircle size={20} />}
              label="At Risk Patients"
              value={retentionData.summary?.at_risk_patients || 0}
              subtitle="No return visits (30+ days)"
            />
            <StatCard 
              type="info"
              icon={<TrendingUp size={20} />}
              label="Avg Return Visits"
              value={retentionData.summary?.avg_return_visits_per_retained_patient || 0}
              subtitle="Per retained patient"
            />
          </div>

          <section className="report-section">
            <div className="section-header">
              <h3>Patient Retention Detail</h3>
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('patient_name')}>
                      Patient {sortConfig.key === 'patient_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('first_visit_date')}>
                      First Visit {sortConfig.key === 'first_visit_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>First Doctor</th>
                    <th onClick={() => handleSort('total_appointments')}>
                      Total Appts {sortConfig.key === 'total_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('return_visits')}>
                      Return Visits {sortConfig.key === 'return_visits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('days_since_first_visit')}>
                      Days Since {sortConfig.key === 'days_since_first_visit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('retention_status')}>
                      Status {sortConfig.key === 'retention_status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(retentionData.patients || [], sortConfig.key).map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-bold">{row.patient_name}</td>
                      <td>{new Date(row.first_visit_date).toLocaleDateString()}</td>
                      <td>Dr. {row.first_doctor}</td>
                      <td>{row.total_appointments}</td>
                      <td className="text-success">{row.return_visits}</td>
                      <td>{row.days_since_first_visit}</td>
                      <td>
                        <span className={`badge ${
                          row.retention_status === 'Retained' ? 'badge-success' : 
                          row.retention_status === 'At Risk' ? 'badge-error' : 'badge-warning'
                        }`}>
                          {row.retention_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* NEW: Referral Analysis report view */}
      {!loading && activeReport === 'referrals' && referralData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<GitBranch size={20} />}
              label="Total Referrals"
              value={referralData.summary?.total_referrals || 0}
            />
            <StatCard 
              type="success"
              icon={<TrendingUp size={20} />}
              label="Approved Referrals"
              value={referralData.summary?.approved_referrals || 0}
            />
            <StatCard 
              type="warning"
              icon={<Clock size={20} />}
              label="Pending Referrals"
              value={referralData.summary?.pending_referrals || 0}
            />
            <StatCard 
              type="info"
              icon={<Users size={20} />}
              label="Completion Rate"
              value={`${referralData.summary?.overall_completion_rate || 0}%`}
              subtitle="With appointments booked"
            />
          </div>

          <section className="report-section">
            <div className="section-header">
              <h3>Referral Patterns</h3>
            </div>
            <div className="table-container">
              <table className="report-table sortable-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('referring_doctor_name')}>
                      Referring Doctor {sortConfig.key === 'referring_doctor_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('specialist_doctor_name')}>
                      Specialist {sortConfig.key === 'specialist_doctor_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Specialty</th>
                    <th onClick={() => handleSort('total_referrals')}>
                      Total {sortConfig.key === 'total_referrals' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('approved_referrals')}>
                      Approved {sortConfig.key === 'approved_referrals' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('referrals_with_appointments')}>
                      With Appts {sortConfig.key === 'referrals_with_appointments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('appointment_completion_rate')}>
                      Complete % {sortConfig.key === 'appointment_completion_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(referralData.referral_patterns || [], sortConfig.key).map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-bold">Dr. {row.referring_doctor_name}</td>
                      <td className="text-bold">Dr. {row.specialist_doctor_name}</td>
                      <td className="text-small">{row.specialist_specialty}</td>
                      <td>{row.total_referrals}</td>
                      <td className="text-success">{row.approved_referrals}</td>
                      <td className="text-info">{row.referrals_with_appointments}</td>
                      <td>
                        <span className={`badge ${
                          parseFloat(row.appointment_completion_rate) > 80 ? 'badge-success' : 
                          parseFloat(row.appointment_completion_rate) > 50 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {row.appointment_completion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {referralData.top_referring_doctors && referralData.top_referring_doctors.length > 0 && (
            <section className="report-section">
              <div className="section-header">
                <h3>Top Referring Doctors</h3>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Total Referrals</th>
                      <th>Approved</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralData.top_referring_doctors.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">Dr. {row.doctor_name}</td>
                        <td>{row.specialty_name}</td>
                        <td>{row.total_referrals_made}</td>
                        <td className="text-success">{row.approved}</td>
                        <td className="text-info">{row.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* NEW: Patient Demographics report view */}
      {!loading && activeReport === 'demographics' && demographicsData && (
        <>
          <div className="stats-grid">
            <StatCard 
              type="primary"
              icon={<Users size={20} />}
              label="Total New Patients"
              value={demographicsData.total_new_patients || 0}
              subtitle="In selected period"
            />
          </div>

          <div className="demographics-grid">
            <section className="report-section">
              <div className="section-header">
                <h3>Age Distribution</h3>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Age Group</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(demographicsData.age_distribution || []).map((row, idx) => {
                      const pct = demographicsData.total_new_patients > 0 
                        ? ((row.patient_count / demographicsData.total_new_patients) * 100).toFixed(1) 
                        : 0;
                      return (
                        <tr key={idx}>
                          <td className="text-bold">{row.age_group}</td>
                          <td>{row.patient_count}</td>
                          <td>
                            <div className="percentage-bar">
                              <div className="percentage-fill" style={{ width: `${pct}%` }}></div>
                              <span className="percentage-text">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-section">
              <div className="section-header">
                <h3>Gender Distribution</h3>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Gender</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(demographicsData.gender_distribution || []).map((row, idx) => {
                      const pct = demographicsData.total_new_patients > 0 
                        ? ((row.patient_count / demographicsData.total_new_patients) * 100).toFixed(1) 
                        : 0;
                      return (
                        <tr key={idx}>
                          <td className="text-bold">{row.gender_text}</td>
                          <td>{row.patient_count}</td>
                          <td>
                            <div className="percentage-bar">
                              <div className="percentage-fill" style={{ width: `${pct}%` }}></div>
                              <span className="percentage-text">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-section">
              <div className="section-header">
                <h3>Ethnicity Distribution</h3>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Ethnicity</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(demographicsData.ethnicity_distribution || []).map((row, idx) => {
                      const pct = demographicsData.total_new_patients > 0 
                        ? ((row.patient_count / demographicsData.total_new_patients) * 100).toFixed(1) 
                        : 0;
                      return (
                        <tr key={idx}>
                          <td className="text-bold">{row.ethnicity_text}</td>
                          <td>{row.patient_count}</td>
                          <td>
                            <div className="percentage-bar">
                              <div className="percentage-fill" style={{ width: `${pct}%` }}></div>
                              <span className="percentage-text">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-section">
              <div className="section-header">
                <h3>Insurance Distribution</h3>
              </div>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Insurance Company</th>
                      <th>Plan Type</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(demographicsData.insurance_distribution || []).map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">{row.insurance_company || 'N/A'}</td>
                        <td className="text-small">{row.plan_type || 'N/A'}</td>
                        <td>{row.patient_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
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

      {!loading && !error && activeReport === 'newPatients' && !newPatientsData && (
        <div className="empty-state">
          <UserPlus size={56} />
          <p>No new patient data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}

      {!loading && !error && activeReport === 'doctorPerformance' && !doctorPerformanceData && (
        <div className="empty-state">
          <Award size={56} />
          <p>No doctor performance data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}

      {!loading && !error && activeReport === 'retention' && !retentionData && (
        <div className="empty-state">
          <Repeat size={56} />
          <p>No patient retention data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}

      {!loading && !error && activeReport === 'referrals' && !referralData && (
        <div className="empty-state">
          <GitBranch size={56} />
          <p>No referral data available for the selected filters</p>
          <button onClick={resetFilters} className="btn btn-secondary">Reset Filters</button>
        </div>
      )}

      {!loading && !error && activeReport === 'demographics' && !demographicsData && (
        <div className="empty-state">
          <PieChart size={56} />
          <p>No demographic data available for the selected filters</p>
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
