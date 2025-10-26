import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';

import Sidebar from './Sidebar';
import Profile from './Profile';
import Report from './Report';
import UM from './UM';
import '../doctor/DoctorPortal.css';

function AdminPortal() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = window.confirm('Log out from admin?');
    if (!confirmed) return;
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed', e);
    } finally {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="doctor-portal">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

      <main className="main-content">
        {currentPage === 'dashboard' && (
          <div style={{ padding: 24 }}>
            <h1>Admin Dashboard</h1>
            <p>Welcome to the administration portal. Use the menu to manage users and reports.</p>
          </div>
        )}

        {currentPage === 'users' && <UM />}
        {currentPage === 'reports' && <Report />}
        {currentPage === 'profile' && <Profile />}

        {currentPage === 'security' && (
          <div style={{ padding: 24 }}>
            <h2>Security</h2>
            <p>Security settings and role management will be available here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPortal;
