import React, { useEffect } from "react";
import Dashboard from "../doctor/Dashboard";
import "./NurseDashboard.css";

export default function NurseDashboard({ setCurrentPage, onAppointmentClick }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const h1 = document.querySelector(".welcome-section h1");
      if (h1 && h1.textContent.includes("Dr.")) {
        h1.textContent = h1.textContent.replace("Dr.", "Nurse");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="nurse-dashboard-wrapper">
      <Dashboard
        setCurrentPage={setCurrentPage}
        onAppointmentClick={onAppointmentClick}
      />

      {/* Nurse Task List */}
      <section className="nurse-tasklist">
        <h2 className="nurse-tasklist__title">Task List</h2>

        <div className="nurse-tasklist__items">
          <div className="nurse-tasklist__item pending">
            <span>Appointments pending vitals:</span>
            <strong>3</strong>
          </div>
          <div className="nurse-tasklist__item warning">
            <span>Patients waiting in lobby:</span>
            <strong>2</strong>
          </div>
          <div className="nurse-tasklist__item info">
            <span>Referrals to prep today:</span>
            <strong>1</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
