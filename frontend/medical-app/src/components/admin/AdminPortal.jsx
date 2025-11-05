import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  Building2, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import '../doctor/Dashboard.css';
import './Report.css';
import './AdminPortal.css';
import AdminSidebar from './Sidebar.jsx';
import AdminDashboard from './Dashboard.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import UserManagement from './UserManagement.jsx';
// --- Simple stub pages used by the admin sidebar ---
function UsersView() {
  return (
    <div>
      <div className="dashboard-header">
        <h1>User Management</h1>
        <p>Manage doctors, nurses and patients</p>
      </div>
      <div className="report-section">
        <p>Users table and management controls go here (stub view).</p>
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div>
      <div className="dashboard-header">
        <h1>Profile</h1>
        <p>Admin profile and settings</p>
      </div>
      <div className="report-section">
        <p>Profile editing controls will be implemented here (stub view).</p>
      </div>
    </div>
  );
}

function AdminPortal({ preview = false }) {
  const [activeTab, setActiveTab] = useState('financial');
  // Default to dashboard so a browser refresh lands on the dashboard page
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Financial data
  const [financialData, setFinancialData] = useState(null);
  
  // Office utilization data
  const [officeData, setOfficeData] = useState(null);

  useEffect(() => {
    if (activeTab === 'financial') {
      fetchFinancialReport();
    } else if (activeTab === 'office') {
      fetchOfficeUtilization();
    }
  }, [activeTab, startDate, endDate]);

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

  const handleRefresh = () => {
    if (activeTab === 'financial') {
      fetchFinancialReport();
    } else {
      fetchOfficeUtilization();
    }
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'financial' && financialData) {
      filename = `financial_report_${startDate}_to_${endDate}.csv`;
      csvContent = 'Date,Total Visits,Gross Revenue,Collected Payments,Outstanding Balance,Unique Patients\n';
      financialData.daily_revenue.forEach(row => {
        csvContent += `${row.visit_date},${row.total_visits},${row.gross_revenue},${row.collected_payments},${row.outstanding_balance},${row.unique_patients}\n`;
      });
    } else if (activeTab === 'office' && officeData) {
      filename = `office_utilization_${startDate}_to_${endDate}.csv`;
      csvContent = 'Office Name,Address,Total Appointments,Completed,No-Shows,No-Show Rate,Avg Wait Time (min),Utilization Rate\n';
      officeData.office_stats.forEach(row => {
        csvContent += `${row.office_name},"${row.address}",${row.total_appointments},${row.completed},${row.no_shows},${row.no_show_rate}%,${row.avg_wait_minutes || 'N/A'},${row.utilization_rate}%\n`;
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

  const handleLogout = async () => {
    try {
      // Prefer using auth provider's logout so context is cleared; fallback to direct call
      if (logout) {
        await logout();
      } else {
        await fetch('/api/logout.php', { method: 'POST', credentials: 'include' });
      }
    } catch (e) {
      console.warn('logout failed', e);
    } finally {
      navigate('/login');
    }
  };

  return (
    <div>
      <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

      <main className='main-content'>
        <div className="report-container">
          {/* Render selected admin page */}
          {currentPage === 'dashboard' && <AdminDashboard />}
          {currentPage === 'users' && <UserManagement />}
          {currentPage === 'reports' && (
            <>
              {/* Header */}
              <div className="dashboard-header">
                <div>
                  <h1>Reports & Analytics</h1>
                  <p>System performance and financial insights</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleRefresh} className="btn-secondary" disabled={loading}>
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                  <button onClick={exportToCSV} className="btn-save" disabled={loading || (!financialData && !officeData)}>
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="date-range-selector">
                <Calendar size={20} />
                <div className="date-inputs">
                  <div>
                    <label>From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate}
                    />
                  </div>
                  <div>
                    <label>To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="report-tabs">
                <button
                  className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
                  onClick={() => setActiveTab('financial')}
                >
                  <DollarSign size={18} />
                  Financial Summary
                </button>
                <button
                  className={`tab-button ${activeTab === 'office' ? 'active' : ''}`}
                  onClick={() => setActiveTab('office')}
                >
                  <Building2 size={18} />
                  Office Utilization
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading report data...</p>
                </div>
              )}

              {/* Financial Summary Tab */}
              {!loading && activeTab === 'financial' && financialData && (
                <div className="report-content">
                  {/* Summary Cards */}
                  <div className="stats-grid">
                    <div className="stat-card stat-success">
                      <div className="stat-icon">
                        <DollarSign size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">
                          ${parseFloat(financialData.summary.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="stat-label">Total Revenue</div>
                      </div>
                    </div>

                    <div className="stat-card stat-primary">
                      <div className="stat-icon">
                        <TrendingUp size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">
                          ${parseFloat(financialData.summary.total_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="stat-label">Collected Payments</div>
                      </div>
                    </div>

                    <div className="stat-card stat-warning">
                      <div className="stat-icon">
                        <AlertCircle size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">
                          ${parseFloat(financialData.summary.total_outstanding || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="stat-label">Outstanding Balance</div>
                      </div>
                    </div>

                    <div className="stat-card stat-info">
                      <div className="stat-icon">
                        <FileText size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{financialData.summary.total_visits || 0}</div>
                        <div className="stat-label">Total Visits</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Revenue Table */}
                  <div className="report-section">
                    <h3>Daily Revenue Breakdown</h3>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Visits</th>
                            <th>Gross Revenue</th>
                            <th>Collected</th>
                            <th>Outstanding</th>
                            <th>Unique Patients</th>
                            <th>Collection Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialData.daily_revenue.map((row, idx) => {
                            const collectionRate = row.gross_revenue > 0 
                              ? ((row.collected_payments / row.gross_revenue) * 100).toFixed(1)
                              : '0.0';
                            
                            return (
                              <tr key={idx}>
                                <td>{new Date(row.visit_date).toLocaleDateString()}</td>
                                <td>{row.total_visits}</td>
                                <td>${parseFloat(row.gross_revenue).toFixed(2)}</td>
                                <td className="text-success">${parseFloat(row.collected_payments).toFixed(2)}</td>
                                <td className="text-warning">${parseFloat(row.outstanding_balance).toFixed(2)}</td>
                                <td>{row.unique_patients}</td>
                                <td>
                                  <span className={`badge ${parseFloat(collectionRate) >= 80 ? 'badge-success' : 'badge-warning'}`}>
                                    {collectionRate}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Insurance Breakdown */}
                  {financialData.insurance_breakdown && financialData.insurance_breakdown.length > 0 && (
                    <div className="report-section">
                      <h3>Revenue by Insurance</h3>
                      <div className="table-container">
                        <table className="data-table">
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
                              const avgPayment = row.visit_count > 0 
                                ? (row.total_payments / row.visit_count).toFixed(2)
                                : '0.00';
                              
                              return (
                                <tr key={idx}>
                                  <td><strong>{row.insurance_company || 'Self-Pay'}</strong></td>
                                  <td>{row.plan_name || 'N/A'}</td>
                                  <td>{row.visit_count}</td>
                                  <td className="text-success">${parseFloat(row.total_payments).toFixed(2)}</td>
                                  <td className="text-warning">${parseFloat(row.outstanding).toFixed(2)}</td>
                                  <td>${avgPayment}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {currentPage === 'profile' && <ProfileView />}
          {currentPage === 'security' && <div><h2>Security</h2><p>Security settings will go here.</p></div>}
      

      {/* Office Utilization Tab */}
      {!loading && activeTab === 'office' && officeData && (
        <div className="report-content">
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <Building2 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{officeData.summary.total_offices || 0}</div>
                <div className="stat-label">Total Offices</div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{officeData.summary.total_appointments || 0}</div>
                <div className="stat-label">Total Appointments</div>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {officeData.summary.avg_utilization ? `${officeData.summary.avg_utilization}%` : 'N/A'}
                </div>
                <div className="stat-label">Avg Utilization Rate</div>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {officeData.summary.avg_no_show_rate ? `${officeData.summary.avg_no_show_rate}%` : 'N/A'}
                </div>
                <div className="stat-label">Avg No-Show Rate</div>
              </div>
            </div>
          </div>

          {/* Office Statistics Table */}
          <div className="report-section">
            <h3>Office Performance Metrics</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Office</th>
                    <th>Address</th>
                    <th>Total Appts</th>
                    <th>Completed</th>
                    <th>No-Shows</th>
                    <th>No-Show Rate</th>
                    <th>Avg Wait Time</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {officeData.office_stats.map((row, idx) => (
                    <tr key={idx}>
                      <td><strong>{row.office_name}</strong></td>
                      <td>{row.address}</td>
                      <td>{row.total_appointments}</td>
                      <td className="text-success">{row.completed}</td>
                      <td className="text-warning">{row.no_shows}</td>
                      <td>
                        <span className={`badge ${parseFloat(row.no_show_rate) < 10 ? 'badge-success' : parseFloat(row.no_show_rate) < 20 ? 'badge-warning' : 'badge-danger'}`}>
                          {row.no_show_rate}%
                        </span>
                      </td>
                      <td>{row.avg_wait_minutes ? `${row.avg_wait_minutes} min` : 'N/A'}</td>
                      <td>
                        <div className="utilization-bar">
                          <div 
                            className="utilization-fill" 
                            style={{ 
                              width: `${row.utilization_rate}%`,
                              backgroundColor: parseFloat(row.utilization_rate) >= 70 ? '#10b981' : parseFloat(row.utilization_rate) >= 50 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                          <span>{row.utilization_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Appointment Status Breakdown */}
          <div className="report-section">
            <h3>Appointment Status Distribution</h3>
            <div className="status-grid">
              {officeData.office_stats.map((office, idx) => (
                <div key={idx} className="status-card">
                  <h4>{office.office_name}</h4>
                  <div className="status-metrics">
                    <div className="status-item">
                      <span className="status-label">Completed</span>
                      <span className="status-value text-success">{office.completed}</span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">Cancelled</span>
                      <span className="status-value text-warning">{office.cancelled || 0}</span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">No-Shows</span>
                      <span className="status-value text-danger">{office.no_shows}</span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">Scheduled</span>
                      <span className="status-value text-info">{office.scheduled || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && activeTab === 'financial' && !financialData && (
        <div className="empty-state">
          <FileText size={48} />
          <p>No financial data available for the selected date range</p>
        </div>
      )}

      {!loading && !error && activeTab === 'office' && !officeData && (
        <div className="empty-state">
          <Building2 size={48} />
          <p>No office utilization data available for the selected date range</p>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
 
export default AdminPortal;