import React from 'react';
import {
  Home,
  Users,
  FileText,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import '../doctor/Sidebar.css';

function AdminSidebar({ currentPage, setCurrentPage, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <ShieldCheck size={28} />
          <span>MedConnect Admin</span>
        </div>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href="#"
                className={currentPage === item.id ? 'active' : ''}
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
        <button
          type="button"
          className="logout-btn"
          onClick={onLogout}
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;

