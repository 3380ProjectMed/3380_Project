import React from 'react';

export default function WelcomeHeader({ title, subtitle, right }) {
  return (
    <div className="dashboard-header">
      {/* add a `centered` modifier so existing styles for .welcome-section stay intact */}
      <div className="welcome-section centered">
        {/* center content horizontally; force the `.office-info` (a flex row in other CSS) to center as well */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            {subtitle && <p className="office-info" style={{ justifyContent: 'center', margin: '0.25rem 0 0 0' }}>{subtitle}</p>}
          </div>
          {/* right content (if provided) will appear below on centered layout */}
          {right && <div style={{ marginTop: 8 }}>{right}</div>}
        </div>
      </div>
    </div>
  );
}
