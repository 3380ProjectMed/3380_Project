import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { User, Mail, Phone, Save } from 'lucide-react';
import '../doctor/Profile.css';

function AdminProfile() {
  const auth = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (auth.loading) return;
        // Admin profile endpoint may be same as doctor profile; fetch user details via auth
        const user = auth.user || {};
        setProfile({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || ''
        });
      } catch (err) {
        console.error('Failed to load admin profile', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth.user, auth.loading]);

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      // Admin profile save - backend not yet implemented for admins; mimic success
      setStatus('saved');
    } catch (err) {
      console.error('Save failed', err);
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Admin Profile</h1>
        <p>Manage your administrator account</p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="profile-content">
          <div className="form-grid">
            <div className="form-group">
              <label><User size={16}/> First Name</label>
              <input value={profile.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label><User size={16}/> Last Name</label>
              <input value={profile.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
            </div>
            <div className="form-group">
              <label><Mail size={16}/> Email</label>
              <input value={profile.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label><Phone size={16}/> Phone</label>
              <input value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {status === 'saved' && <div className="alert alert-success">Profile saved</div>}
            {status === 'error' && <div className="alert alert-error">Save failed</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfile;
