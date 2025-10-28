import React from 'react';
import { Home, Calendar, FileText, Shield, CreditCard, User, LogOut } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ currentPage, setCurrentPage, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <Home size={22} />
          <span>MedConnect</span>
        </div>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href="#"
                className={currentPage === item.id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
