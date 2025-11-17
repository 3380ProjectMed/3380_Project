// src/components/nurse/NurseSidebar.jsx
import React from "react";
import { Home, Calendar, Activity, User, LogOut } from "lucide-react";
import "./NurseSidebar.css";
export default function NurseSidebar({ currentPage, setCurrentPage, onLogout }) {
  const items = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: <Home size={18} />,
      description: "Overview & quick stats"
    },
   { id: 'clinical', label: 'Clinical Workspace', icon: <FileText size={18} />, description: "Clinical tasks and patient details" }, 
    { 
      id: "profile", 
      label: "Profile", 
      icon: <User size={18} />,
      description: "Personal settings"
    },
  ];

  return (
    <aside className="nurse-sidebar">
      <div className="nurse-sidebar__brand">
        <div className="brand-icon">🩺</div>
        <div className="brand-text">Nurse Portal</div>
      </div>

      <nav className="nurse-sidebar__nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nurse-sidebar__link ${currentPage === item.id ? "active" : ""}`}
            onClick={() => setCurrentPage(item.id)}
            title={item.description}
          >
            <span className="link-icon">{item.icon}</span>
            <span className="link-label">{item.label}</span>
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