import React, { useEffect, useState } from "react";
import "./NurseProfile.css";
import { getNurseProfile } from '../../api/nurse';

export default function NurseProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getNurseProfile();
        console.log('Profile data:', data);
        if (mounted) setProfile(data);
      } catch (e) {
        console.error('Profile error:', e);
        if (mounted) setError(e.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="nurse-page"><p>Loading profile...</p></div>;
  if (error) return <div className="nurse-page"><p style={{color: 'red'}}>{error}</p></div>;
  if (!profile) return <div className="nurse-page"><p>No profile data</p></div>;

  const initial = profile.firstName?.[0]?.toUpperCase() || 'A';
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="nurse-page">
      <div className="nurse-profile-page">
        <h1>Profile</h1>
        
        <div className="profile-card">
          <div className="profile-avatar">
            {initial}
          </div>
          <div className="profile-info">
            <h2>{fullName}</h2>
            <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
            <p><strong>Department:</strong> {profile.department || 'N/A'}</p>
            <p><strong>License:</strong> {profile.licenseNumber || 'N/A'}</p>
            {profile.location && <p><strong>Location:</strong> {typeof profile.location === 'string' ? profile.location : (profile.location.office_name || profile.location.name || JSON.stringify(profile.location))}</p>}
            {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
          </div>
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
