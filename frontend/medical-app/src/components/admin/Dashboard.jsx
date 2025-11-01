import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import '../doctor/Dashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/admin_api/dashboard/get-stats.php', {
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load statistics');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>
        <AlertCircle size={24} />
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>System Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_doctors}</div>
            <div className="stat-label">Total Doctors</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_nurses}</div>
            <div className="stat-label">Total Nurses</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_patients}</div>
            <div className="stat-label">Total Patients</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.appointments_this_month}</div>
            <div className="stat-label">Appointments This Month</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active_users}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending_appointments}</div>
            <div className="stat-label">Pending Today</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed_today}</div>
            <div className="stat-label">Completed Today</div>
          </div>
        </div>

        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.revenue_today.toFixed(2)}</div>
            <div className="stat-label">Revenue Today</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn-save">View All Users</button>
          <button className="btn-save">Generate Report</button>
          <button className="btn-save">System Settings</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;