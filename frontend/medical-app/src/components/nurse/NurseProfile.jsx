import React, { useEffect, useState } from "react";
import "./NurseProfile.css";
import { getNurseProfile } from '../../api/nurse';

export default function NurseProfile() {
  const [user, setUser] = useState({ name: 'Nurse', title: '', email: '', phone: '' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const p = await getNurseProfile().catch(() => null);
        if (p && mounted) {
          setUser({ name: (p.firstName || '') + ' ' + (p.lastName || ''), title: '', email: p.email || '', phone: p.phone || '' });
        }
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

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
