import React, { useEffect, useState } from "react";
import "./NurseProfile.css";
import { getNurseProfile, updateNurseProfile } from '../../api/nurse';

export default function NurseProfile() {
  const [user, setUser] = useState({ name: 'Nurse', title: '', email: '', phone: '' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const p = await getNurseProfileSession().catch(() => null);
        if (p && mounted) {
          setUser({ name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || 'Nurse', title: '', email: p.email || '', phone: p.phone || '' });
        }
      } catch (e) {
        // ignore but keep defaults
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Safe update handler for profile edits. If other code calls an "onUpdateProfile"
  // ensure it checks that user.profile exists before attempting to read it.
  async function handleUpdateProfile(updatedProfile) {
    if (!user?.profile) {
      console.error('User profile is undefined');
      return;
    }
    try {
      // forward to API and merge returned values if any
      const res = await updateNurseProfile(updatedProfile).catch(() => null);
      if (res) {
        setUser((prev) => ({ ...prev, ...res }));
      }
    } catch (e) {
      console.error('Failed to update nurse profile', e);
    }
  }

  return (
    <div className="nurse-page">
      <div className="nurse-profile">
        <h1>Profile</h1>
        <div className="profile-card">
          <div className="avatar">A</div>
          <div className="details">
            <div className="name">{user.name}</div>
            <div className="role">{user.title}</div>
            <div className="contact">{user.email} · {user.phone}</div>
          </div>
        </div>

        <div className="settings">
          <h2>Preferences</h2>
          <div className="setting-row">
            <label>
              <input type="checkbox" defaultChecked /> Receive shift reminders
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
