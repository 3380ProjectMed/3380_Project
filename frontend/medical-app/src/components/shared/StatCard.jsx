import React from 'react';

export default function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  variant,  // Keep for backward compatibility
  type,     // New preferred prop
  onClick, 
  clickable,
  subtitle,
  trend 
}) {
  const cardType = variant || (type ? `stat-${type}` : 'stat-primary');
  
  return (
    <div 
      className={`stat-card ${cardType} ${clickable ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
      style={clickable ? { cursor: 'pointer' } : {}}
    >
      <div className="stat-icon">
        {Icon ? <Icon size={24} /> : null}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        {trend && <div className={`stat-trend ${trend.direction}`}>{trend.text}</div>}
      </div>
    </div>
  );
}