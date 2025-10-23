// src/components/nurse/NurseSidebar.jsx
import React from "react";
import {
  Home,
  Calendar,
  Users,
  ClipboardList,
  LogOut,
  Stethoscope,
} from "lucide-react";
import "./NurseSidebar.css";

/**
 * NurseSidebar
 * - Left navigation for the Nurse Portal
 * - Highlights the active page
 * - Calls setCurrentPage(id) when a menu item is clicked
 * - Calls onLogout() when Logout is pressed
 */
export default function NurseSidebar({
  currentPage = "dashboard",
  setCurrentPage = () => {},
  onLogout,
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "schedule", label: "My Schedule", icon: Calendar },
    { id: "patients", label: "My Patients", icon: Users },
    { id: "clinical", label: "Clinical Workspace", icon: ClipboardList },
  ];

  const handleLogout = () => {
    if (onLogout) return onLogout();
    if (window.confirm("Log out of Nurse Portal?")) {
      // fallback behavior; wire to your auth when ready
      window.location.href = "/";
    }
  };

  return (
    <aside className="nurse-sidebar" aria-label="Nurse navigation">
      {/* Header / Brand */}
      <div className="nurse-sidebar__header">
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <Stethoscope className="nurse-sidebar__icon" />
          Nurse Portal
        </span>
      </div>

      {/* Menu */}
      <nav className="nurse-sidebar__nav">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nurse-sidebar__button ${
              currentPage === id ? "active" : ""
            }`}
            onClick={() => setCurrentPage(id)}
            aria-current={currentPage === id ? "page" : undefined}
          >
            <Icon className="nurse-sidebar__icon" />
            {label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button type="button" className="nurse-sidebar__logout" onClick={handleLogout}>
        <LogOut className="nurse-sidebar__icon" />
        Logout
      </button>
    </aside>
  );
}
