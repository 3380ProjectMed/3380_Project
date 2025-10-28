import React from 'react';
import './MedicalRecords.css';

export default function MedicalRecords(props) {
  const { loading, vitalsHistory = [], medications = [], allergies = [], conditions = [] } = props;

  return (
    <div className="portal-content">
      <h1 className="page-title">Medical Records</h1>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="records-grid">
          <div className="record-card">
            <h3>Vitals</h3>
            {vitalsHistory.length === 0 ? <p className="text-gray">No vitals on file</p> : (
              <ul>
                {vitalsHistory.map((v, i) => (<li key={i}>{v.label}: {v.value}</li>))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <h3>Medications</h3>
            {medications.length === 0 ? <p className="text-gray">No medications recorded</p> : (
              <ul>
                {medications.map((m, i) => (<li key={i}>{m.name} — {m.dose}</li>))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <h3>Allergies</h3>
            {allergies.length === 0 ? <p className="text-gray">No allergies recorded</p> : (
              <ul>{allergies.map((a, i) => (<li key={i}>{a.name}</li>))}</ul>
            )}
          </div>

          <div className="record-card">
            <h3>Conditions</h3>
            {conditions.length === 0 ? <p className="text-gray">No conditions recorded</p> : (
              <ul>{conditions.map((c, i) => (<li key={i}>{c.name}</li>))}</ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
