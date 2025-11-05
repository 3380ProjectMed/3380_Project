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
  ArrowLeft
} from 'lucide-react';
import '../doctor/Dashboard.css';
import './Report.css';

function Report() {
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [financialData, setFinancialData] = useState(null);
  const [officeData, setOfficeData] = useState(null);

  // small helper to format money
  const money = (v) => {
    const n = Number(v || 0);
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // small reusable stat card component (keeps markup consistent across reports)
  const StatCard = ({type='primary', icon, label, value}) => (
    <div className={`stat-card stat-${type}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/admin_api/reports/financial-summary.php?start_date=${startDate}&end_date=${endDate}`,
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
        `/admin_api/reports/office-utilization.php?start_date=${startDate}&end_date=${endDate}`,
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

  const handleSelectReport = (reportType) => {
    setActiveReport(reportType);
    if (reportType === 'financial') {
      fetchFinancialReport();
    } else if (reportType === 'office') {
      fetchOfficeUtilization();
    }
  };

  const handleRefresh = () => {
    if (activeReport === 'financial') {
      fetchFinancialReport();
    } else if (activeReport === 'office') {
      fetchOfficeUtilization();
    }
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (activeReport === 'financial' && financialData) {
      filename = `financial_report_${startDate}_to_${endDate}.csv`;
      csvContent = 'Date,Total Visits,Gross Revenue,Collected Payments,Outstanding Balance,Unique Patients\n';
      financialData.daily_revenue.forEach(row => {
        csvContent += `${row.visit_date},${row.total_visits},${row.gross_revenue},${row.collected_payments},${row.outstanding_balance},${row.unique_patients}\n`;
      });
    } else if (activeReport === 'office' && officeData) {
      filename = `office_utilization_${startDate}_to_${endDate}.csv`;
      csvContent = 'Office Name,Address,Total Appointments,Completed,No-Shows,No-Show Rate,Avg Wait Time (min),Utilization Rate\n';
      officeData.office_stats.forEach(row => {
        csvContent += `"${row.office_name}","${row.address}",${row.total_appointments},${row.completed},${row.no_shows},${row.no_show_rate},${row.avg_wait_minutes || 'N/A'},${row.utilization_rate}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
          </div>

          <div className="report-selector-card" onClick={() => handleSelectReport('office')}>
            <div className="selector-icon">
              <Building2 size={48} />
            </div>
            <h3>Office Utilization</h3>
            <p>Appointment metrics, no-show rates, wait times, and office performance analysis</p>
          </div>
        </div>
      </div>
    );
  }

  // Report view
  // main report view
  useEffect(() => {
    // when a report is selected, fetch automatically
    if (activeReport === 'financial') fetchFinancialReport();
    if (activeReport === 'office') fetchOfficeUtilization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport]);

  return (
    <div className="report-container">
      <div className="dashboard-header report-header">
        <div className="report-header-left">
          <h1>{activeReport === 'financial' ? 'Financial Summary' : 'Office Utilization'}</h1>
          <p className="office-info">
            <Calendar size={16} />
            <span className="date-range">{startDate} — {endDate}</span>
          </p>
        </div>

        <div className="report-header-actions">
          <button onClick={() => setActiveReport(null)} className="btn btn-ghost">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="toolbar-actions">
            <button onClick={handleRefresh} disabled={loading} className="btn btn-sm btn-secondary">
              <RefreshCw size={14} />
            </button>
            <button onClick={exportToCSV} disabled={loading || (!financialData && !officeData)} className="btn btn-sm btn-primary">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="filters-section compact-filters">
        <div className="filter-inputs">
          <label className="filter-label">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            className="filter-date-input"
          />

          <label className="filter-label">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
            className="filter-date-input"
          />

          <button onClick={handleRefresh} disabled={loading} className="btn btn-ghost btn-apply-filter">
            <Filter size={14} /> Apply
          </button>
        </div>
      </div>

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

      {!loading && activeReport === 'financial' && financialData && (
        <>
          <div className="stats-grid">
            <StatCard type="success" icon={<DollarSign size={20} />} label="Total Revenue" value={`$${money(financialData.summary?.total_revenue)}`} />
            <StatCard type="primary" icon={<TrendingUp size={20} />} label="Collected Payments" value={`$${money(financialData.summary?.total_collected)}`} />
            <StatCard type="warning" icon={<AlertCircle size={20} />} label="Outstanding Balance" value={`$${money(financialData.summary?.total_outstanding)}`} />
            <StatCard type="info" icon={<FileText size={20} />} label="Total Visits" value={financialData.summary?.total_visits || 0} />
          </div>

          <section className="report-section">
            <h3>Daily Revenue Breakdown</h3>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Visits</th>
                    <th>Gross Revenue</th>
                    <th>Collected</th>
                    <th>Outstanding</th>
                    <th>Patients</th>
                    <th>Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(financialData.daily_revenue || []).map((row, idx) => {
                    const gross = Number(row.gross_revenue || 0);
                    const collected = Number(row.collected_payments || 0);
                    const rate = gross > 0 ? ((collected / gross) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx}>
                        <td>{new Date(row.visit_date).toLocaleDateString()}</td>
                        <td>{row.total_visits}</td>
                        <td>${money(gross)}</td>
                        <td className="text-success">${money(collected)}</td>
                        <td className="text-warning">${money(Number(row.outstanding_balance || 0))}</td>
                        <td>{row.unique_patients}</td>
                        <td>
                          <span className={`rate-badge ${parseFloat(rate) >= 80 ? 'rate-good' : 'rate-poor'}`}>
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

          {financialData.insurance_breakdown?.length > 0 && (
            <section className="report-section">
              <h3>Revenue by Insurance</h3>
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
                    {financialData.insurance_breakdown.map((row, idx) => {
                      const avg = row.visit_count > 0 ? (row.total_payments / row.visit_count).toFixed(2) : '0.00';
                      return (
                        <tr key={idx}>
                          <td className="text-bold">{row.insurance_company || 'Self-Pay'}</td>
                          <td>{row.plan_name || 'N/A'}</td>
                          <td>{row.visit_count}</td>
                          <td className="text-success">${money(row.total_payments)}</td>
                          <td className="text-warning">${money(row.outstanding)}</td>
                          <td>${avg}</td>
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

      {!loading && activeReport === 'office' && officeData && (
        <>
          <div className="stats-grid">
            <StatCard type="primary" icon={<Building2 size={20} />} label="Total Offices" value={officeData.summary?.total_offices || 0} />
            <StatCard type="success" icon={<FileText size={20} />} label="Total Appointments" value={officeData.summary?.total_appointments || 0} />
            <StatCard type="info" icon={<TrendingUp size={20} />} label="Avg Utilization" value={officeData.summary?.avg_utilization ? `${officeData.summary.avg_utilization}%` : 'N/A'} />
            <StatCard type="warning" icon={<AlertCircle size={20} />} label="Avg No-Show Rate" value={officeData.summary?.avg_no_show_rate ? `${officeData.summary.avg_no_show_rate}%` : 'N/A'} />
          </div>

          <section className="report-section">
            <h3>Office Performance Metrics</h3>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Office</th>
                    <th>Address</th>
                    <th>Total</th>
                    <th>Completed</th>
                    <th>No-Shows</th>
                    <th>No-Show Rate</th>
                    <th>Avg Wait</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {officeData.office_stats.map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-bold">{row.office_name}</td>
                      <td className="text-muted">{row.address}</td>
                      <td>{row.total_appointments}</td>
                      <td className="text-success">{row.completed}</td>
                      <td className="text-warning">{row.no_shows}</td>
                      <td>
                        <span className={`rate-badge ${
                          parseFloat(row.no_show_rate) < 10 ? 'rate-good' : 
                          parseFloat(row.no_show_rate) < 20 ? 'rate-fair' : 'rate-poor'
                        }`}>
                          {row.no_show_rate}%
                        </span>
                      </td>
                      <td>{row.avg_wait_minutes ? `${row.avg_wait_minutes} min` : 'N/A'}</td>
                      <td>
                        <div className="utilization-bar">
                          <div 
                            className={`utilization-fill ${
                              parseFloat(row.utilization_rate) >= 70 ? 'util-high' : 
                              parseFloat(row.utilization_rate) >= 50 ? 'util-medium' : 'util-low'
                            }`}
                            style={{ width: `${row.utilization_rate}%` }}
                          />
                          <span className="utilization-text">{row.utilization_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Empty states */}
      {!loading && !error && activeReport === 'financial' && !financialData && (
        <div className="empty-state">
          <FileText size={56} />
          <p>No financial data available for the selected date range</p>
        </div>
      )}

      {!loading && !error && activeReport === 'office' && !officeData && (
        <div className="empty-state">
          <Building2 size={56} />
          <p>No office utilization data available for the selected date range</p>
        </div>
      )}
    </div>
  );
}

export default Report;