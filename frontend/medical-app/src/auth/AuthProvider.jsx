// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
     const r = await fetch('/api/me.php', { credentials: 'include' });
     if (r.ok) {
       setUser(await r.json());
     } else if (r.status === 401) {
       setUser(null); // not logged in yet — this is fine
     } else {
       // Optional: log other errors for debugging
       console.warn('Unexpected /api/me.php status:', r.status);
       setUser(null);
     }
    } catch (e) {
      console.warn('Failed to reach /api/me.php', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refreshUser(); }, []);

  async function login(email, password) {
    const r = await fetch('/api/login.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const msg = (await r.json().catch(() => null))?.error || 'Login failed';
      throw new Error(msg);
    }
    const data = await r.json(); // { user_id, username, email, role }
    setUser(data);               // quick optimistic update
    // Now refresh the authoritative user record (includes doctor_id and other joined data)
    // so components which depend on doctor_id will receive it.
    try {
      await refreshUser();
    } catch (e) {
      // If refresh fails, keep the optimistic user and let components handle missing fields.
      console.warn('refreshUser after login failed:', e);
    }
    return data; // caller may navigate after login
  }

  async function logout() {
    await fetch('/api/logout.php', { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);