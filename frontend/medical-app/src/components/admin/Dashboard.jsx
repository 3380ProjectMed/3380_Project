import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import './Dashboard.css';
import { WelcomeHeader, StatCard, StatsGrid } from '../shared';

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
      <WelcomeHeader title="Admin Dashboard" subtitle="System Overview" />

      {/* Stats Grid (use shared StatCard components) */}
      <StatsGrid>
        <StatCard icon={Users} value={stats.total_doctors} label="Total Doctors" variant="stat-primary" />
        <StatCard icon={Activity} value={stats.total_nurses} label="Total Nurses" variant="stat-info" />
        <StatCard icon={Users} value={stats.total_patients} label="Total Patients" variant="stat-success" />
        <StatCard icon={Calendar} value={stats.appointments_this_month} label="Appointments This Month" variant="stat-warning" />
        <StatCard icon={Activity} value={stats.active_users} label="Active Users" variant="stat-info" />
        <StatCard icon={Calendar} value={stats.pending_appointments} label="Pending Today" variant="stat-warning" />
        <StatCard icon={TrendingUp} value={stats.completed_today} label="Completed Today" variant="stat-success" />
        {/* <StatCard icon={DollarSign} value={`$${stats.revenue_today.toFixed(2)}`} label="Revenue Today" variant="stat-primary" /> */}
      </StatsGrid>

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