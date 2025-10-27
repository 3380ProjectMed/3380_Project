import React, { useState, useEffect } from 'react';
import { X, Save, Key, UserCheck, UserX, AlertCircle } from 'lucide-react';
import './EditUserModal.css';

function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    is_active: true
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        is_active: user.is_active === 1 || user.is_active === true
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validatePassword = () => {
    if (!showPasswordSection || !newPassword) return true;
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/admin_api/users/reset-password.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          new_password: newPassword
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Password reset successfully');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        setPasswordError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/admin_api/update.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // If password was changed, reset it
        if (showPasswordSection && newPassword) {
          await handleResetPassword();
        }
        
        onSave(data.user || formData);
        onClose();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !formData.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/admin_api/update.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          is_active: newStatus
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, is_active: newStatus }));
        alert(`User ${action}d successfully`);
      } else {
        setError(data.error || `Failed to ${action} user`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Edit User</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* User Info Section */}
            <div className="form-section">
              <h3>User Information</h3>
              
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span>Active Account</span>
                </label>
              </div>
            </div>

            {/* Password Section */}
            <div className="form-section">
              <div className="section-header">
                <h3>Password Management</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="btn-link"
                >
                  <Key size={16} />
                  {showPasswordSection ? 'Cancel' : 'Reset Password'}
                </button>
              </div>

              {showPasswordSection && (
                <>
                  {passwordError && (
                    <div className="alert alert-error">
                      <AlertCircle size={20} />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      minLength={8}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      minLength={8}
                    />
                  </div>
                </>
              )}
            </div>

            {/* User Details Display */}
            {user.full_name && (
              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{user.full_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">User ID:</span>
                    <span className="info-value">{user.user_id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Login:</span>
                    <span className="info-value">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  {user.doctor_phone && (
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{user.doctor_phone}</span>
                    </div>
                  )}
                  {user.License_Number && (
                    <div className="info-item">
                      <span className="info-label">License:</span>
                      <span className="info-value">{user.License_Number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-left">
            <button
              type="button"
              onClick={toggleStatus}
              className={formData.is_active ? 'btn-danger' : 'btn-success'}
              disabled={loading}
            >
              {formData.is_active ? (
                <>
                  <UserX size={16} />
                  Deactivate User
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  Activate User
                </>
              )}
            </button>
          </div>
          <div className="footer-right">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-save"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;