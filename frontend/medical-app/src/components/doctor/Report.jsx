import React, { useState, useEffect } from 'react';
import './Report.css';
import { 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  FileText,
  Activity,
  Clock,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Reports Component
 * 
 * Displays medical practice reports and analytics:
 * 1. Patient Census Report - Demographics and population overview
 * 2. Clinical Productivity Report - Doctor's performance metrics
 * 
 * Features:
 * - Interactive charts and visualizations
 * - Date range filtering
 * - Export to PDF functionality
 * - Real-time data updates
 */
function Reports() {
  const [activeReport, setActiveReport] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // week, month, year, custom
  const [loading, setLoading] = useState(false);

  // Mock data - Replace with API calls
  const patientCensusData = {
    totalPatients: 342,
    ageDistribution: [
      { name: 'Pediatric (0-17)', value: 45, percentage: 13 },
      { name: 'Adult (18-64)', value: 215, percentage: 63 },
      { name: 'Senior (65+)', value: 82, percentage: 24 }
    ],
    chronicConditions: [
      { condition: 'Hypertension', count: 89 },
      { condition: 'Type 2 Diabetes', count: 67 },
      { condition: 'Asthma', count: 45 },
      { condition: 'High Cholesterol', count: 78 },
      { condition: 'Arthritis', count: 34 }
    ],
    highRiskPatients: [
      { id: 'P001', name: 'John Smith', conditions: 3, lastVisit: '2024-01-15', risk: 'High' },
      { id: 'P045', name: 'Mary Johnson', conditions: 4, lastVisit: '2024-01-10', risk: 'High' },
      { id: 'P089', name: 'Robert Davis', conditions: 3, lastVisit: '2024-01-08', risk: 'Medium' }
    ],
    insuranceDistribution: [
      { name: 'Blue Cross', value: 120 },
      { name: 'Aetna', value: 95 },
      { name: 'Medicare', value: 82 },
      { name: 'Medicaid', value: 30 },
      { name: 'Self-Pay', value: 15 }
    ],
    upcomingAppointments: 45,
    overdueFollowups: 12
  };

  const productivityData = {
    monthlyAppointments: [
      { month: 'Jul', appointments: 145, completed: 138, cancelled: 7 },
      { month: 'Aug', appointments: 152, completed: 145, cancelled: 7 },
      { month: 'Sep', appointments: 148, completed: 141, cancelled: 7 },
      { month: 'Oct', appointments: 156, completed: 150, cancelled: 6 },
      { month: 'Nov', appointments: 162, completed: 155, cancelled: 7 },
      { month: 'Dec', appointments: 158, completed: 152, cancelled: 6 }
    ],
    weeklyStats: {
      totalAppointments: 38,
      completedAppointments: 35,
      avgDuration: 28, // minutes
      notesCompleted: 35,
      prescriptionsWritten: 28,
      labOrdersPlaced: 15
    },
    topDiagnoses: [
      { diagnosis: 'Hypertension', count: 23, code: 'I10' },
      { diagnosis: 'Type 2 Diabetes', count: 18, code: 'E11.9' },
      { diagnosis: 'Upper Respiratory Infection', count: 15, code: 'J06.9' },
      { diagnosis: 'Anxiety Disorder', count: 12, code: 'F41.9' },
      { diagnosis: 'Hyperlipidemia', count: 11, code: 'E78.5' }
    ],
    performanceMetrics: {
      noteCompletionRate: 92, // percentage
      avgAppointmentDuration: 28, // minutes
      patientSatisfaction: 4.7, // out of 5
      onTimePercentage: 88
    }
  };

  const COLORS = ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#03045e'];

  /**
   * Fetch report data from backend
   * TODO: Replace with actual API calls
   */
  const fetchReportData = async (reportType) => {
    setLoading(true);
    try {
      // Simulated API call
      // const response = await fetch(`/api/reports/${reportType}?range=${dateRange}`);
      // const data = await response.json();
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      setLoading(false);
    }
  };

  /**
   * Export report to PDF
   * TODO: Implement PDF generation
   */
  const handleExportPDF = () => {
    alert('Exporting to PDF... (Feature to be implemented)');
    // Use libraries like jsPDF or html2pdf
  };

  /**
   * PATIENT CENSUS REPORT VIEW
   */
  const PatientCensusReport = () => (
    <div className="report-view">
      <div className="report-header">
        <div>
          <h2>Patient Census Report</h2>
          <p className="report-subtitle">Overview of your patient population</p>
        </div>
        <button className="btn-export" onClick={handleExportPDF}>
          <Download size={18} />
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="report-cards">
        <div className="report-card primary">
          <div className="card-icon">
            <Users size={28} />
          </div>
          <div className="card-content">
            <h3>{patientCensusData.totalPatients}</h3>
            <p>Total Active Patients</p>
          </div>
        </div>

        <div className="report-card success">
          <div className="card-icon">
            <Calendar size={28} />
          </div>
          <div className="card-content">
            <h3>{patientCensusData.upcomingAppointments}</h3>
            <p>Upcoming Appointments</p>
          </div>
        </div>

        <div className="report-card warning">
          <div className="card-icon">
            <AlertCircle size={28} />
          </div>
          <div className="card-content">
            <h3>{patientCensusData.overdueFollowups}</h3>
            <p>Overdue Follow-ups</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Age Distribution */}
        <div className="chart-container">
          <h3>Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={patientCensusData.ageDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {patientCensusData.ageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Chronic Conditions */}
        <div className="chart-container">
          <h3>Top Chronic Conditions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={patientCensusData.chronicConditions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="condition" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0077b6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insurance Distribution */}
        <div className="chart-container">
          <h3>Insurance Providers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={patientCensusData.insuranceDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {patientCensusData.insuranceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High Risk Patients Table */}
      <div className="report-section">
        <h3>High Risk Patients</h3>
        <div className="risk-table">
          <div className="table-header">
            <span>Patient ID</span>
            <span>Name</span>
            <span>Conditions</span>
            <span>Last Visit</span>
            <span>Risk Level</span>
          </div>
          {patientCensusData.highRiskPatients.map(patient => (
            <div key={patient.id} className="table-row">
              <span>{patient.id}</span>
              <span>{patient.name}</span>
              <span>{patient.conditions} conditions</span>
              <span>{patient.lastVisit}</span>
              <span className={`risk-badge ${patient.risk.toLowerCase()}`}>
                {patient.risk}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * CLINICAL PRODUCTIVITY REPORT VIEW
   */
  const ProductivityReport = () => (
    <div className="report-view">
      <div className="report-header">
        <div>
          <h2>Clinical Productivity Report</h2>
          <p className="report-subtitle">Your performance metrics and activities</p>
        </div>
        <div className="report-header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="btn-export" onClick={handleExportPDF}>
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Weekly Stats Cards */}
      <div className="report-cards">
        <div className="report-card primary">
          <div className="card-icon">
            <Calendar size={28} />
          </div>
          <div className="card-content">
            <h3>{productivityData.weeklyStats.totalAppointments}</h3>
            <p>Appointments This Week</p>
          </div>
        </div>

        <div className="report-card success">
          <div className="card-icon">
            <FileText size={28} />
          </div>
          <div className="card-content">
            <h3>{productivityData.weeklyStats.notesCompleted}</h3>
            <p>Clinical Notes Completed</p>
          </div>
        </div>

        <div className="report-card info">
          <div className="card-icon">
            <Clock size={28} />
          </div>
          <div className="card-content">
            <h3>{productivityData.weeklyStats.avgDuration} min</h3>
            <p>Avg. Appointment Duration</p>
          </div>
        </div>

        <div className="report-card warning">
          <div className="card-icon">
            <Activity size={28} />
          </div>
          <div className="card-content">
            <h3>{productivityData.weeklyStats.prescriptionsWritten}</h3>
            <p>Prescriptions Written</p>
          </div>
        </div>
      </div>

      {/* Monthly Appointments Chart */}
      <div className="chart-container full-width">
        <h3>Monthly Appointment Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={productivityData.monthlyAppointments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="appointments" stroke="#0077b6" strokeWidth={2} name="Total" />
            <Line type="monotone" dataKey="completed" stroke="#059669" strokeWidth={2} name="Completed" />
            <Line type="monotone" dataKey="cancelled" stroke="#dc2626" strokeWidth={2} name="Cancelled" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Note Completion Rate</h4>
          <div className="metric-value">{productivityData.performanceMetrics.noteCompletionRate}%</div>
          <div className="progress-bar">
            <div 
              className="progress-fill success" 
              style={{width: `${productivityData.performanceMetrics.noteCompletionRate}%`}}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <h4>On-Time Appointments</h4>
          <div className="metric-value">{productivityData.performanceMetrics.onTimePercentage}%</div>
          <div className="progress-bar">
            <div 
              className="progress-fill info" 
              style={{width: `${productivityData.performanceMetrics.onTimePercentage}%`}}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <h4>Patient Satisfaction</h4>
          <div className="metric-value">{productivityData.performanceMetrics.patientSatisfaction}/5.0</div>
          <div className="stars">
            {'★'.repeat(Math.floor(productivityData.performanceMetrics.patientSatisfaction))}
            {'☆'.repeat(5 - Math.floor(productivityData.performanceMetrics.patientSatisfaction))}
          </div>
        </div>
      </div>

      {/* Top Diagnoses */}
      <div className="report-section">
        <h3>Top Diagnoses (This Period)</h3>
        <div className="diagnoses-table">
          <div className="table-header">
            <span>Diagnosis</span>
            <span>ICD-10 Code</span>
            <span>Count</span>
            <span>Percentage</span>
          </div>
          {productivityData.topDiagnoses.map((diagnosis, index) => {
            const total = productivityData.topDiagnoses.reduce((sum, d) => sum + d.count, 0);
            const percentage = ((diagnosis.count / total) * 100).toFixed(1);
            return (
              <div key={index} className="table-row">
                <span>{diagnosis.diagnosis}</span>
                <span className="code">{diagnosis.code}</span>
                <span>{diagnosis.count}</span>
                <span>
                  <div className="percentage-bar">
                    <div className="bar-fill" style={{width: `${percentage}%`}}></div>
                    <span className="percentage-text">{percentage}%</span>
                  </div>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /**
   * MAIN REPORTS DASHBOARD
   */
  const ReportsDashboard = () => (
    <div className="reports-dashboard">
      <h1>Reports & Analytics</h1>
      <p className="dashboard-subtitle">View insights and performance metrics for your practice</p>

      <div className="report-selector-grid">
        <div 
          className="report-selector-card"
          onClick={() => setActiveReport('census')}
        >
          <div className="selector-icon">
            <Users size={48} />
          </div>
          <h3>Patient Census Report</h3>
          <p>Demographics, chronic conditions, and population overview</p>
          <button className="btn-view-report">
            View Report
          </button>
        </div>

        <div 
          className="report-selector-card"
          onClick={() => setActiveReport('productivity')}
        >
          <div className="selector-icon">
            <TrendingUp size={48} />
          </div>
          <h3>Clinical Productivity Report</h3>
          <p>Appointments, performance metrics, and activity tracking</p>
          <button className="btn-view-report">
            View Report
          </button>
        </div>
      </div>
    </div>
  );

  // Render based on active report
  return (
    <div className="reports-page">
      {activeReport === null && <ReportsDashboard />}
      {activeReport === 'census' && (
        <>
          <button className="btn-back-reports" onClick={() => setActiveReport(null)}>
            ← Back to Reports
          </button>
          <PatientCensusReport />
        </>
      )}
      {activeReport === 'productivity' && (
        <>
          <button className="btn-back-reports" onClick={() => setActiveReport(null)}>
            ← Back to Reports
          </button>
          <ProductivityReport />
        </>
      )}
    </div>
  );
}

export default Reports;