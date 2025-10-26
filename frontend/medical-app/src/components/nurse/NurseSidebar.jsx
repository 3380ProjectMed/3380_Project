// src/components/nurse/NurseSidebar.jsx
import React from "react";
import { Home, Calendar, Users, FileText, LogOut, Stethoscope } from "lucide-react";
// Reuse the doctor sidebar styles so layout matches exactly
import "../doctor/Sidebar.css";

export default function NurseSidebar({ currentPage, setCurrentPage, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "schedule", label: "My Schedule", icon: Calendar },
    { id: "patients", label: "My Patients", icon: Users },
    { id: "clinical", label: "Clinical Workspace", icon: FileText },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout?.();
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <Stethoscope size={28} />
          <span>Nurse Portal</span>
        </div>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href="#"
                className={currentPage === item.id ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(item.id);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
