import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';
import EditUserModal from './EditUserModal';
import '../doctor/Dashboard.css';
import './UM.css';

function UM() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create user form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/admin_api/get-all.php', {
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const res = await fetch(`/admin_api/users/get-by-id.php?user_id=${userId}`, {
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSelectedUser(data.user);
        setShowEditModal(true);
      } else {
        alert(data.error || 'Failed to load user details');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to deactivate user: ${username}?`)) {
      return;
    }

    try {
      const res = await fetch('/admin_api/delete.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('User deactivated successfully');
        fetchUsers();
      } else {
        alert(data.error || 'Failed to deactivate user');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
      alert('All fields are required');
      return;
    }
    
    if (newUser.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch('/admin_api/create.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('User created successfully');
        setShowCreateForm(false);
        setNewUser({ username: '', email: '', password: '', role: '' });
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEdit = (updatedUser) => {
    fetchUsers(); // Refresh the list
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="um-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>User Management</h1>
          <p>Manage system users and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchUsers} className="btn-secondary" disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn-save"
          >
            <Plus size={16} />
            {showCreateForm ? 'Cancel' : 'Create User'}
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="create-user-form">
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-save">
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Filter by Role:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="PATIENT">Patient</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="table-section">
          <div className="table-header">
            <h3>Users ({filteredUsers.length})</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditUser(user.user_id)}
                            className="btn-icon btn-edit"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.user_id, user.username)}
                            className="btn-icon btn-delete"
                            title="Deactivate user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

export default UM;