import React from "react";
import { Calendar, Users, ClipboardList, LogOut, Home } from "lucide-react";

export default function NurseSidebar({ currentPage, setCurrentPage, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home /> },
    { id: "schedule", label: "My Schedule", icon: <Calendar /> },
    { id: "patients", label: "My Patients", icon: <Users /> },
    { id: "clinical", label: "Clinical Workspace", icon: <ClipboardList /> },
  ];

  return (
    <aside className="fixed h-full w-64 bg-white border-r flex flex-col">
      <div className="px-6 py-4 font-bold text-lg">Nurse Portal</div>
      <nav className="flex-1 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded-md text-left hover:bg-blue-50 ${
              currentPage === item.id ? "bg-blue-100 font-semibold" : ""
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <button
        onClick={onLogout}
        className="m-4 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </aside>
  );
}
