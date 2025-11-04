import React from 'react';

export default function WelcomeHeader({ title, subtitle, right }) {
  return (
    <div className="dashboard-header">
      <div className="welcome-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="office-info">{subtitle}</p>}
          </div>
          {right && <div style={{ marginLeft: 16 }}>{right}</div>}
        </div>
      </div>
    </div>
  );
}
