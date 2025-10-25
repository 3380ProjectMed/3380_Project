// src/components/nurse/NurseSidebar.jsx
import React from "react";
import {
  Home,
  Calendar,
  Users,
  ClipboardList,
  User,
  BarChart2,
  Share2,
  LogOut,
} from "lucide-react";
import "./NurseSidebar.css";

export default function NurseSidebar({ currentPage, setCurrentPage, onLogout }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "schedule", label: "My Schedule", icon: <Calendar size={18} /> },
    { id: "patients", label: "My Patients", icon: <Users size={18} /> },
    { id: "clinical", label: "Clinical Workspace", icon: <ClipboardList size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "reports", label: "Reports", icon: <BarChart2 size={18} /> },
    { id: "referrals", label: "Referrals", icon: <Share2 size={18} /> },
  ];

  return (
    <aside className="nurse-sidebar">
      <div className="nurse-sidebar__brand">Nurse Portal</div>

      <nav className="nurse-sidebar__nav">
        {items.map((i) => (
          <button
            key={i.id}
            className={`nurse-sidebar__link ${currentPage === i.id ? "active" : ""}`}
            onClick={() => setCurrentPage(i.id)}
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
      </nav>

      <div className="nurse-sidebar__footer">
        <button className="nurse-sidebar__logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
