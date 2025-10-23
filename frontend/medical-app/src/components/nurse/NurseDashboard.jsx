import React from "react";
import Dashboard from "../doctor/Dashboard";
import "./NurseDashboard.css";

/**
 * Thin wrapper over the existing Dashboard that:
 *  - Shows a nurse friendly greeting
 *  - Injects a Task List widget below the stats
 */
export default function NurseDashboard({ setCurrentPage, onAppointmentClick }) {
  return (
    <div className="nurse-dashboard-wrapper">
      {/* Similar UI to doctor */}
      <Dashboard
        role="nurse"
        setCurrentPage={setCurrentPage}
        onAppointmentClick={onAppointmentClick}
      />

      {/* Nurse Task List (simple placeholder) */}
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
