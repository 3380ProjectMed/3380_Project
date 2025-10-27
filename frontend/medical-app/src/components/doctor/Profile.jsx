import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { User, Mail, Phone, Save } from 'lucide-react';
import './Profile.css';

function Profile() {
  const auth = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (auth.loading) return;
        const doctorId = auth.user?.doctor_id ?? null;
        if (!doctorId) {
          // No doctor associated with this user
          setLoading(false);
          return;
        }
            const res = await fetch(`/api/doctor_api/profile/get.php?doctor_id=${doctorId}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success && json.profile) {
          setProfile(prev => ({ ...prev, ...json.profile }));
        }
      } catch (err) {
        console.error('Failed to load profile', err);
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
      const body = {
  doctor_id: auth.user?.doctor_id ?? null,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        licenseNumber: profile.licenseNumber
      };
          const res = await fetch('/api/doctor_api/profile/update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setStatus('saved');
      } else {
        setStatus('error');
      }
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
        <h1>My Profile</h1>
        <p>Manage your personal information</p>
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
            <div className="form-group">
              <label>License Number</label>
              <input value={profile.licenseNumber} onChange={(e) => handleChange('licenseNumber', e.target.value)} />
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

export default Profile;