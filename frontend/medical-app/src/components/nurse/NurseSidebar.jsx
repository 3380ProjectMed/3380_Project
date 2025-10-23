// src/components/nurse/NurseSidebar.jsx
import React from "react";
import { Home, Calendar, Users, ClipboardList, LogOut } from "lucide-react";
import "./NurseSidebar.css";

export default function NurseSidebar({ currentPage, setCurrentPage, onLogout }) {
  const menu = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "schedule", label: "My Schedule", icon: Calendar },
    { id: "patients", label: "My Patients", icon: Users },
    { id: "clinical", label: "Clinical Workspace", icon: ClipboardList },
  ];

  return (
    <aside className="nurse-sidebar">
      <div className="nurse-sidebar__content">
        <div className="nurse-sidebar__brand">Nurse Portal</div>
        <nav className="nurse-sidebar__nav">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`nurse-sidebar__link ${active ? "active" : ""}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="nurse-sidebar__footer">
        <button className="nurse-logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
