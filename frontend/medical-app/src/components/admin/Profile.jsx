import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { 
  User, 
  Mail, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader,
  MapPin,
  Shield
} from 'lucide-react';
import '../doctor/Profile.css';

function Profile() {
  const auth = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    workLocationName: '',
    role: '',
    isActive: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/admin_api/profile/get.php', { 
        credentials: 'include' 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      
      if (json.success && json.profile) {
        setProfile(json.profile);
      } else {
        setError(json.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    setError('');
    
    try {
      const body = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        username: profile.username
      };
      
      const res = await fetch('/admin_api/profile/edit_self.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      const json = await res.json();
      
      if (json.success) {
        setStatus('saved');
        // Update local state with returned profile
        if (json.profile) {
          setProfile(json.profile);
        }
      } else {
        setError(json.error || 'Failed to save profile');
        setStatus('error');
      }
    } catch (err) {
      console.error('Save failed', err);
      setError(err.message);
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your personal information</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader className="spinner" size={40} />
          <p>Loading profile...</p>
        </div>
      ) : error && !profile.firstName ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="profile-content">
          {/* Status Messages */}
          {status === 'saved' && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <span>Profile saved successfully!</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error || 'Failed to save profile'}</span>
            </div>
          )}

          {/* Read-only Info Section */}
          <div className="info-section">
            <h3>Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <Shield size={16} />
                <div>
                  <label>Role</label>
                  <span>{profile.role || 'Administrator'}</span>
                </div>
              </div>
              <div className="info-item">
                <MapPin size={16} />
                <div>
                  <label>Work Location</label>
                  <span>{profile.workLocationName || 'N/A'}</span>
                </div>
              </div>
              <div className="info-item">
                <div>
                  <label>Account Status</label>
                  <span className={`status-badge ${profile.isActive ? 'active' : 'inactive'}`}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="form-section">
            <h3>Personal Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <User size={16} />
                  First Name *
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <User size={16} />
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <User size={16} />
                  Username
                </label>
                <input
                  type="text"
                  value={profile.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="profile-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={saving || !profile.firstName || !profile.lastName || !profile.email}
            >
              {saving ? (
                <>
                  <Loader className="spinner" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;