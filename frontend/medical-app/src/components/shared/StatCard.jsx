import React from 'react';

export default function StatCard({ icon: Icon, value, label, variant = 'stat-primary' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-icon">
        {Icon ? <Icon size={24} /> : null}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
