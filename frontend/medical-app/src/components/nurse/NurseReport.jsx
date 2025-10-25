import React from "react";
import "./NurseReport.css";

export default function NurseReport() {
  const weekly = [
    { label: "Total Appointments", value: 38 },
    { label: "Patients Vitals Recorded", value: 34 },
    { label: "Clinical Notes Drafted", value: 21 },
    { label: "Vaccinations Administered", value: 12 },
  ];

  return (
    <div className="nurse-page">
      <div className="nurse-report">
        <h1>Reports</h1>
        <div className="grid">
        {weekly.map((w) => (
          <div key={w.label} className="card">
            <div className="val">{w.value}</div>
            <div className="lbl">{w.label}</div>
          </div>
        ))}
      </div>

      <div className="table">
        <div className="thead"><div>Metric</div><div>Value (This Week)</div></div>
        <div className="tbody">
          {weekly.map((w) => (
            <div key={`row-${w.label}`} className="row">
              <div>{w.label}</div>
              <div>{w.value}</div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
