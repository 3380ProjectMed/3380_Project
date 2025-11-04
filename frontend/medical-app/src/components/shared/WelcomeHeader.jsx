import React from 'react';

export default function WelcomeHeader({ title, subtitle, right }) {
  return (
    <div className="dashboard-header">
      <div className="welcome-section">
        {/* center content horizontally */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="office-info">{subtitle}</p>}
          </div>
          {/* right content (if provided) will appear below on centered layout */}
          {right && <div style={{ marginTop: 8 }}>{right}</div>}
        </div>
      </div>
    </div>
  );
}
