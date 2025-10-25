import React from "react";
import "./NurseSchedule.css";

export default function NurseSchedule() {
  const data = [
    { date: "2025-10-23", time: "09:00", patient: "Sarah Connor", location: "Main Clinic", reason: "Follow-up" },
    { date: "2025-10-23", time: "10:30", patient: "John Doe", location: "Main Clinic", reason: "Annual Physical" },
    { date: "2025-10-23", time: "14:00", patient: "Emma Wilson", location: "Satellite Office", reason: "Consultation" },
  ];

  return (
    <div className="nurse-page">
      <div className="nurse-schedule-page">
        <h1>My Schedule</h1>
        <div className="nurse-table">
          <div className="thead">
            <div>Date</div><div>Time</div><div>Patient</div><div>Location</div><div>Reason</div>
          </div>
          <div className="tbody">
            {data.map((r, i) => (
              <div key={i} className="row">
                <div>{r.date}</div>
                <div>{r.time}</div>
                <div>{r.patient}</div>
                <div>{r.location}</div>
                <div>{r.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
