import React, { useState } from 'react';
import '../doctor/Dashboard.css';
import './AdminPortal.css';

import AdminSidebar from './Sidebar.jsx';
import AdminDashboard from './Dashboard.jsx';
import UserManagement from './UserManagement.jsx';
import Profile from './Profile.jsx';
import Report from './Report.jsx';          

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';

function AdminPortal({ preview = false }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageConfig, setPageConfig] = useState(null); 
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else {
        await fetch('/api/logout.php', { method: 'POST', credentials: 'include' });
      }
    } catch (e) {
      console.warn('logout failed', e);
    } finally {
      navigate('/login');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page !== currentPage) {
      setPageConfig(null);  
    }
  };

  return (
    <div>
      <AdminSidebar
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <div className="report-container">
          {currentPage === 'dashboard' && (
            <AdminDashboard 
              setCurrentPage={setCurrentPage} 
              setPageConfig={setPageConfig} 
            />
          )}
          {currentPage === 'users' && (
            <UserManagement 
              initialFilter={pageConfig?.activeTab} 
              onFilterApplied={() => setPageConfig(null)} 
            />
          )}
          {currentPage === 'reports' && (
            <Report 
              initialConfig={pageConfig}
              onConfigApplied={() => setPageConfig(null)} 
            />
          )}
          {currentPage === 'profile' && <Profile />}
          {currentPage === 'security' && (
            <div>
              <h2>Security</h2>
              <p>Security settings will go here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPortal;