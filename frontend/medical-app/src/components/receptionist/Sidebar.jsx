import React from 'react';
import { Home, Calendar, Users, CreditCard, LogOut, Clipboard, UserCircle } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ currentPage, setCurrentPage, onLogout, officeName, officeId }) {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview & Quick Actions'
    },
    { 
      id: 'schedule', 
      label: 'Office Schedule', 
      icon: Calendar,
      description: 'Master Calendar'
    },
    { 
      id: 'patients', 
      label: 'Patient Search', 
      icon: Users,
      description: 'Find & View Profiles'
    },
    { 
      id: 'booking', 
      label: 'Book Appointment', 
      icon: Clipboard,
      description: 'New or Modify'
    },
    { 
      id: 'payment', 
      label: 'Payments', 
      icon: CreditCard,
      description: 'Record Copayments'
    },
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: UserCircle,
      description: 'View Account Info'
    },
  ];

  return (
    <div className="sidebar-receptionist">
      {}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Home size={24} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">MedConnect</h1>
            <p className="brand-subtitle">Receptionist Portal</p>
          </div>
        </div>
        
        {}
        <div className="office-badge">
          <p className="office-badge-text">{officeName}</p>
          <p className="office-badge-id">Office ID: {officeId}</p>
        </div>
      </div>

      {}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-item-icon">
                <Icon size={20} />
              </div>
              <div className="nav-item-content">
                <span className="nav-item-label">{item.label}</span>
                <span className="nav-item-description">{item.description}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {}
      <div className="sidebar-footer">
        {}
        <div className="user-info">
          <div className="user-avatar">
            <Users size={20} />
          </div>
          <div className="user-details">
            <p className="user-name">Receptionist</p>
            <p className="user-role">Front Desk Staff</p>
          </div>
        </div>

        {}
        <button 
          className="logout-btn"
          onClick={onLogout}
          aria-label="Log out"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;