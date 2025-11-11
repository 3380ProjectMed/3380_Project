import React, { useEffect, useState } from "react";
import { User, Mail, Phone, Save } from 'lucide-react';
import "./NurseProfile.css";
import { getNurseProfile } from '../../api/nurse';

export default function NurseProfile() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    department: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getNurseProfile();
        if (mounted && data) {
          setProfile(prev => ({ ...prev, ...data }));
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      // TODO: Implement nurse profile update API if available
      // For now, just simulate save
      setTimeout(() => {
        setSaving(false);
        setStatus('saved');
        setTimeout(() => setStatus(null), 3000);
      }, 1000);
    } catch (err) {
      setStatus('error');
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  if (loading) return <div className="nurse-page"><p>Loading profile...</p></div>;
  if (error) return <div className="nurse-page"><p style={{color: 'red'}}>{error}</p></div>;

  const initial = profile.firstName?.[0]?.toUpperCase() || 'A';
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="nurse-page">
      <div className="nurse-profile-page">
        <h1>My Profile</h1>
        <p>Manage your personal information</p>

        <div className="profile-card">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-info">
            <div className="form-grid">
              <div className="form-group">
                <label><User size={16}/> First Name</label>
                <input value={profile.firstName} onChange={e => handleChange('firstName', e.target.value)} />
              </div>
              <div className="form-group">
                <label><User size={16}/> Last Name</label>
                <input value={profile.lastName} onChange={e => handleChange('lastName', e.target.value)} />
              </div>
              <div className="form-group">
                <label><Mail size={16}/> Email</label>
                <input value={profile.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label><Phone size={16}/> Phone</label>
                <input value={profile.phone} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>License Number</label>
                <input value={profile.licenseNumber} onChange={e => handleChange('licenseNumber', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input value={profile.department} onChange={e => handleChange('department', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={typeof profile.location === 'string' ? profile.location : (profile.location?.office_name || profile.location?.name || '')} onChange={e => handleChange('location', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {status === 'saved' && <div className="alert alert-success">Profile saved</div>}
          {status === 'error' && <div className="alert alert-error">Save failed</div>}
        </div>

        <div className="preferences-section">
          <h2>Preferences</h2>
          <label>
            <input type="checkbox" defaultChecked />
            Receive shift reminders
          </label>
        </div>
      </div>
    </div>
  );
}
