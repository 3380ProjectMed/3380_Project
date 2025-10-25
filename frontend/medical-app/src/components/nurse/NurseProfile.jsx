import React from "react";
import "./NurseProfile.css";

export default function NurseProfile() {
  const user = {
    name: "Nurse Amelia",
    title: "Registered Nurse",
    email: "amelia@nurseshift.local",
    phone: "(555) 983-2211",
  };

  return (
    <div className="nurse-page">
      <div className="nurse-profile">
        <h1>Profile</h1>
        <div className="profile-card">
          <div className="avatar">A</div>
          <div className="details">
            <div className="name">{user.name}</div>
            <div className="role">{user.title}</div>
            <div className="contact">{user.email} · {user.phone}</div>
          </div>
        </div>

        <div className="settings">
          <h2>Preferences</h2>
          <div className="setting-row">
            <label>
              <input type="checkbox" defaultChecked /> Receive shift reminders
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
