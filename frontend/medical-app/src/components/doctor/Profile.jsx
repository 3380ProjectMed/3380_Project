import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { User, Mail, Phone, Save } from 'lucide-react';
import './Profile.css';

function Profile() {
  const auth = useAuth();
  const [profile, setProfile] = useState({
    doctorId: null,
    staffId: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // License, workLocation and specialties are intentionally omitted
    // from the editable UI (doctors cannot change these here)
    gender: '',
    // bio: '' // keep in state in case other code relies on it, but not editable
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (auth.loading) return;
        // backend `get.php` will use session when no doctor_id is provided, so try both
        const doctorId = auth.user?.doctor_id ?? auth.user?.doctorId ?? null;
        const url = doctorId ? `/doctor_api/profile/get.php?doctor_id=${doctorId}` : '/doctor_api/profile/get.php';
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();
        if (json.success && json.profile) {
          // Normalize backend profile shape into our state keys
          const p = json.profile;
          setProfile(prev => ({
            ...prev,
            doctorId: p.doctorId ?? p.doctor_id ?? prev.doctorId,
            staffId: p.staffId ?? p.staff_id ?? prev.staffId,
            firstName: p.firstName ?? p.first_name ?? prev.firstName,
            lastName: p.lastName ?? p.last_name ?? prev.lastName,
            email: p.email ?? p.staff_email ?? prev.email,
            phone: p.phone ?? p.phone_number ?? prev.phone,
            gender: p.gender ?? prev.gender,
            // // Keep bio in state if present, but do not render as editable
            // bio: p.bio ?? prev.bio
          }));
        } else {
          console.warn('Unexpected profile response', json);
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
      // Only send editable fields. License number, work location,
      // specialties and bio are not editable by the doctor in this UI.
      const body = {
        doctor_id: auth.user?.doctor_id ?? auth.user?.doctorId ?? profile.doctorId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone
      };
      const res = await fetch('/doctor_api/profile/update.php', {
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
            {/* License Number, Work Location and Specialties removed - not editable by doctor */}
            <div className="form-group">
              <label>Gender</label>
              <input value={profile.gender} onChange={(e) => handleChange('gender', e.target.value)} disabled />
            </div>
            {/* Bio removed from editable UI per request */}
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