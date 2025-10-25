import React from "react";
import "./NurseReferral.css";

export default function NurseReferral() {
  const referrals = [
    { id: "R1001", patient: "Robert Miller", to: "Allergist", date: "2025-10-25", status: "Prepared" },
    { id: "R1002", patient: "Emily Chen", to: "Neurology", date: "2025-10-24", status: "Sent" },
  ];

  return (
    <div className="nurse-page">
      <div className="nurse-referral">
        <h1>Referrals</h1>
        <div className="table">
          <div className="thead">
            <div>ID</div><div>Patient</div><div>Referred To</div><div>Date</div><div>Status</div>
          </div>
          <div className="tbody">
            {referrals.map((r) => (
              <div key={r.id} className="row">
                <div>{r.id}</div>
                <div>{r.patient}</div>
                <div>{r.to}</div>
                <div>{r.date}</div>
                <div><span className={`tag ${r.status.toLowerCase()}`}>{r.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
