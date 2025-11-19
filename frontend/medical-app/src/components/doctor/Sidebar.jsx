import React from 'react';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  LogOut, 
  Stethoscope,
  BarChart3,  
  User        
} from 'lucide-react';
import './Sidebar.css';

function Sidebar({ currentPage, setCurrentPage, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'clinical', label: 'Clinical Workspace', icon: FileText }
    // , { id: 'reports', label: 'Reports', icon: FileText }
    , { id: 'referrals', label: 'Referrals', icon: Stethoscope }
    , { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <Stethoscope size={28} />
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
          type="button"            // ensure it never acts like a form submit
          className="logout-btn"
          onClick={onLogout}       // no confirm or redirect here
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
