import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Filter, 
  TrendingUp, Users, ChevronDown, ChevronRight, X, 
  Phone, Calendar, Pill, FileText, Heart, Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import './Report.css';

export default function ChronicDiseaseReport() {
  // Data state
  const [patients, setPatients] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [conditionBreakdown, setConditionBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    condition: 'all',
    risk: 'all'
  });

  // UI state
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRiskView, setSelectedRiskView] = useState('critical'); // critical, due_soon, on_track

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`/doctor_api/reports/get-chronic-disease-report.php?${queryParams}`, { 
        credentials: 'include' 
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPatients(data.data.patients || []);
        setStatistics(data.data.statistics || null);
        setConditionBreakdown(data.data.condition_breakdown || []);
      } else {
        setError(data.error || 'Failed to fetch report');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const togglePatientExpand = (patientId) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'DUE_SOON': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ON_TRACK': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getBPStatusColor = (status) => {
    switch (status) {
      case 'CONTROLLED': return 'text-green-600';
      case 'UNCONTROLLED': return 'text-red-600';
      case 'NO_DATA': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  const getMedStatusColor = (status) => {
    switch (status) {
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-300';
      case 'CRITICAL': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'EXPIRING_SOON': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const exportToCSV = () => {
    if (patients.length === 0) return;

    const headers = ['Patient', 'Age', 'Condition', 'Days Since Visit', 'Risk Status', 'BP Status', 'Active Meds', 'No-Shows', 'Next Appointment'];
    const rows = patients.map(p => [
      p.patient_name,
      p.age,
      p.condition_name,
      p.days_since_last_visit || 'N/A',
      p.followup_risk,
      p.bp_control_status,
      p.active_medications,
      p.no_show_count,
      p.next_appointment_date ? formatDate(p.next_appointment_date) : 'Not Scheduled'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronic-disease-management-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Prepare chart data
  const riskDistributionData = statistics ? [
    { name: 'Critical', value: statistics.critical_count, color: '#ef4444' },
    { name: 'Due Soon', value: statistics.due_soon_count, color: '#f59e0b' },
    { name: 'On Track', value: statistics.on_track_count, color: '#10b981' }
  ].filter(item => item.value > 0) : [];

  const conditionChartData = conditionBreakdown.slice(0, 5).map(c => ({
    condition: c.condition_name.substring(0, 15) + (c.condition_name.length > 15 ? '...' : ''),
    total: c.total_patients,
    critical: c.critical
  }));

  // Filter patients by selected risk view
  const filteredPatients = patients.filter(p => {
    if (selectedRiskView === 'all') return true;
    return p.followup_risk.toLowerCase() === selectedRiskView.toLowerCase();
  });

  return (
    <div className="chronic-disease-dashboard">
      <div className="dashboard-header">
        <div>
          <h1><Activity style={{display: 'inline', marginRight: '0.5rem'}} />Chronic Disease Management</h1>
          <p className="dashboard-subtitle">Track and manage patients with chronic conditions</p>
        </div>
        <button className="btn-export" onClick={exportToCSV} disabled={patients.length === 0}>
          <Download size={18} /> Export Report
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading patient data...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <>
          {/* SUMMARY STATISTICS - The Big Picture */}
          {statistics && (
            <div className="summary-section">
              <h2><TrendingUp size={20} /> Overview</h2>
              <div className="summary-cards">
                <div className="summary-card total">
                  <div className="card-icon" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                    <Users size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-value">{statistics.total_patients}</div>
                    <div className="card-label">Total Patients</div>
                    <div className="card-sublabel">with chronic conditions</div>
                  </div>
                </div>

                <div className="summary-card critical" onClick={() => setSelectedRiskView('critical')}>
                  <div className="card-icon" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-value">{statistics.critical_count}</div>
                    <div className="card-label">CRITICAL</div>
                    <div className="card-sublabel">Overdue for follow-up (&gt;90 days)</div>
                  </div>
                  <div className="card-action">Click to view →</div>
                </div>

                <div className="summary-card warning" onClick={() => setSelectedRiskView('due_soon')}>
                  <div className="card-icon" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
                    <Clock size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-value">{statistics.due_soon_count}</div>
                    <div className="card-label">DUE SOON</div>
                    <div className="card-sublabel">Need follow-up (60-90 days)</div>
                  </div>
                  <div className="card-action">Click to view →</div>
                </div>

                <div className="summary-card success" onClick={() => setSelectedRiskView('on_track')}>
                  <div className="card-icon" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                    <CheckCircle size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-value">{statistics.on_track_count}</div>
                    <div className="card-label">ON TRACK</div>
                    <div className="card-sublabel">Recent visits (&lt;60 days)</div>
                  </div>
                  <div className="card-action">Click to view →</div>
                </div>
              </div>

              {/* Secondary Metrics - Why These Numbers Matter */}
              <div className="secondary-metrics">
                <div className="metric-item">
                  <Heart className="metric-icon" />
                  <div>
                    <div className="metric-value">{statistics.uncontrolled_bp_count}</div>
                    <div className="metric-label">Uncontrolled BP</div>
                  </div>
                </div>
                <div className="metric-item">
                  <Pill className="metric-icon" />
                  <div>
                    <div className="metric-value">{statistics.meds_expiring_count}</div>
                    <div className="metric-label">Meds Expiring Soon</div>
                  </div>
                </div>
                <div className="metric-item">
                  <AlertTriangle className="metric-icon" />
                  <div>
                    <div className="metric-value">{statistics.high_risk_no_shows}</div>
                    <div className="metric-label">High-Risk No-Shows</div>
                  </div>
                </div>
                <div className="metric-item">
                  <Calendar className="metric-icon" />
                  <div>
                    <div className="metric-value">{statistics.no_scheduled_followup}</div>
                    <div className="metric-label">No Follow-up Scheduled</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISUAL ANALYTICS */}
          {statistics && (
            <div className="analytics-section">
              <h2>Clinical Insights</h2>
              <div className="charts-container">
                {/* Risk Distribution Pie Chart */}
                {riskDistributionData.length > 0 && (
                  <div className="chart-card">
                    <h3>Patient Risk Distribution</h3>
                    <p className="chart-description">How many patients need attention now vs. later</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={riskDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {riskDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Condition Breakdown Bar Chart */}
                {conditionChartData.length > 0 && (
                  <div className="chart-card">
                    <h3>Top Chronic Conditions</h3>
                    <p className="chart-description">What conditions I'm managing (with critical counts)</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conditionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="condition" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#667eea" name="Total Patients" />
                        <Bar dataKey="critical" fill="#ef4444" name="Critical" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Condition Details Table */}
              {conditionBreakdown.length > 0 && (
                <div className="condition-breakdown">
                  <h3>Condition Breakdown Details</h3>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Condition</th>
                        <th>Total Patients</th>
                        <th>Critical</th>
                        <th>Due Soon</th>
                        <th>On Track</th>
                        <th>Uncontrolled BP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conditionBreakdown.map((condition, idx) => (
                        <tr key={idx}>
                          <td><strong>{condition.condition_name}</strong></td>
                          <td>{condition.total_patients}</td>
                          <td><span className="badge badge-critical">{condition.critical}</span></td>
                          <td><span className="badge badge-warning">{condition.due_soon}</span></td>
                          <td><span className="badge badge-success">{condition.on_track}</span></td>
                          <td><span className="badge badge-danger">{condition.uncontrolled_bp}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PATIENT LIST - The Drill-Down Detail */}
          <div className="patients-section">
            <div className="section-header">
              <h2>
                Patient Details 
                <span className="patient-count">({filteredPatients.length} patients)</span>
              </h2>
              <div className="view-toggles">
                <button 
                  className={`toggle-btn ${selectedRiskView === 'critical' ? 'active critical' : ''}`}
                  onClick={() => setSelectedRiskView('critical')}
                >
                  Critical ({statistics?.critical_count || 0})
                </button>
                <button 
                  className={`toggle-btn ${selectedRiskView === 'due_soon' ? 'active warning' : ''}`}
                  onClick={() => setSelectedRiskView('due_soon')}
                >
                  Due Soon ({statistics?.due_soon_count || 0})
                </button>
                <button 
                  className={`toggle-btn ${selectedRiskView === 'on_track' ? 'active success' : ''}`}
                  onClick={() => setSelectedRiskView('on_track')}
                >
                  On Track ({statistics?.on_track_count || 0})
                </button>
                <button 
                  className={`toggle-btn ${selectedRiskView === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedRiskView('all')}
                >
                  All ({statistics?.total_patients || 0})
                </button>
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} style={{color: '#10b981'}} />
                <p>No patients in this category</p>
              </div>
            ) : (
              <div className="patient-list">
                {filteredPatients.map((patient) => (
                  <div key={patient.patient_id} className={`patient-card ${expandedPatient === patient.patient_id ? 'expanded' : ''}`}>
                    {/* Patient Header - Always Visible */}
                    <div className="patient-header" onClick={() => togglePatientExpand(patient.patient_id)}>
                      <div className="patient-main-info">
                        <div className="patient-name-row">
                          <h3>{patient.patient_name}</h3>
                          <span className={`risk-badge ${getRiskColor(patient.followup_risk)}`}>
                            {patient.followup_risk.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="patient-meta">
                          <span>{patient.age} years old</span>
                          <span>•</span>
                          <span>{patient.gender}</span>
                          <span>•</span>
                          <span><strong>{patient.condition_name}</strong></span>
                        </div>
                      </div>

                      <div className="patient-quick-stats">
                        <div className="quick-stat">
                          <Clock size={16} />
                          <span>{patient.days_since_last_visit} days since visit</span>
                        </div>
                        <div className="quick-stat">
                          <Pill size={16} />
                          <span>{patient.active_medications} active meds</span>
                        </div>
                        {patient.no_show_count > 0 && (
                          <div className="quick-stat warning">
                            <AlertTriangle size={16} />
                            <span>{patient.no_show_count} no-shows</span>
                          </div>
                        )}
                      </div>

                      <div className="expand-icon">
                        {expandedPatient === patient.patient_id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>

                    {/* Expanded Details - Show on Click */}
                    {expandedPatient === patient.patient_id && (
                      <div className="patient-details">
                        <div className="details-grid">
                          {/* Left Column: Clinical Status */}
                          <div className="details-section">
                            <h4><Heart size={18} /> Clinical Status</h4>
                            <div className="detail-item">
                              <span className="detail-label">Last Visit:</span>
                              <span className="detail-value">{formatDate(patient.last_visit_date)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Last Seen By:</span>
                              <span className="detail-value">{patient.last_seen_by || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Blood Pressure:</span>
                              <span className={`detail-value ${getBPStatusColor(patient.bp_control_status)}`}>
                                {patient.last_bp || 'No data'} 
                                {patient.bp_control_status !== 'NO_DATA' && ` (${patient.bp_control_status})`}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Temperature:</span>
                              <span className="detail-value">{patient.last_temp || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Last Diagnosis:</span>
                              <span className="detail-value">{patient.last_diagnosis || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Right Column: Follow-up Info */}
                          <div className="details-section">
                            <h4><Calendar size={18} /> Follow-up Status</h4>
                            <div className="detail-item">
                              <span className="detail-label">Diagnosed:</span>
                              <span className="detail-value">{formatDate(patient.diagnosis_date)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Next Appointment:</span>
                              <span className="detail-value">
                                {patient.next_appointment_date ? (
                                  <>
                                    {formatDate(patient.next_appointment_date)}
                                    <br />
                                    <small>{patient.next_appointment_reason}</small>
                                  </>
                                ) : (
                                  <span style={{color: '#ef4444', fontWeight: 'bold'}}>⚠️ Not Scheduled</span>
                                )}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Completed Visits:</span>
                              <span className="detail-value">{patient.total_completed_visits}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Contact:</span>
                              <span className="detail-value">
                                {patient.phone || 'No phone on file'}
                                {patient.phone && (
                                  <button className="btn-call" onClick={() => window.location.href = `tel:${patient.phone}`}>
                                    <Phone size={14} /> Call
                                  </button>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Medications Section */}
                        {patient.medications && patient.medications.length > 0 && (
                          <div className="medications-section">
                            <h4><Pill size={18} /> Active Medications ({patient.medications.length})</h4>
                            <div className="medications-list">
                              {patient.medications.map((med, idx) => (
                                <div key={idx} className="medication-item">
                                  <div className="med-main">
                                    <strong>{med.medication_name}</strong>
                                    <span className={`med-status-badge ${getMedStatusColor(med.prescription_status)}`}>
                                      {med.prescription_status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div className="med-details">
                                    <span>{med.dosage} - {med.frequency}</span>
                                    {med.days_until_expiration !== null && (
                                      <span className="med-expiry">
                                        {med.days_until_expiration > 0 
                                          ? `Expires in ${med.days_until_expiration} days`
                                          : `Expired ${Math.abs(med.days_until_expiration)} days ago`
                                        }
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Visit History */}
                        {patient.recent_visits && patient.recent_visits.length > 0 && (
                          <div className="visit-history-section">
                            <h4><FileText size={18} /> Recent Visit History</h4>
                            <div className="visit-timeline">
                              {patient.recent_visits.map((visit, idx) => (
                                <div key={idx} className="visit-item">
                                  <div className="visit-date">{formatDate(visit.visit_date)}</div>
                                  <div className="visit-content">
                                    <div><strong>BP:</strong> {visit.blood_pressure || 'N/A'}</div>
                                    <div><strong>Diagnosis:</strong> {visit.diagnosis || 'N/A'}</div>
                                    <div><strong>Provider:</strong> {visit.doctor_name}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="patient-actions">
                          <button className="btn-action primary">
                            <Calendar size={16} /> Schedule Follow-up
                          </button>
                          <button className="btn-action secondary">
                            <FileText size={16} /> View Full Chart
                          </button>
                          {patient.phone && (
                            <button className="btn-action secondary" onClick={() => window.location.href = `tel:${patient.phone}`}>
                              <Phone size={16} /> Call Patient
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}