// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Main function to refresh user from server
  async function refreshUser() {
    try {
      const r = await fetch('/api/me.php', { credentials: 'include' });
      
      if (r.ok) {
        const data = await r.json();
        // me.php returns: { user: {...} || null, authenticated: true || false }
        setUser(data.user || null);
      } else {
        // Handle unexpected errors (500, etc)
        console.warn('Unexpected /api/me.php status:', r.status);
        setUser(null);
      }
    } catch (e) {
      console.warn('Failed to reach /api/me.php:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Call on component mount to check if user is already logged in
  useEffect(() => {
    refreshUser();
  }, []);

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

    // login.php returns: { user_id, username, email, role }
    // This is just the raw user data, not wrapped in { user: {...} }
    const data = await r.json();
    
    // Set user immediately from login response
    // Note: login.php doesn't include doctor_id, we'll get that from refreshUser
    setUser(data);

    // Refresh the authoritative user record from server
    // This includes doctor_id and other joined data from me.php
    try {
      await refreshUser();
    } catch (e) {
      // If refresh fails, keep the optimistic user from login response
      console.warn('refreshUser after login failed:', e);
    }

    return data;
  }

  async function logout() {
    await fetch('/api/logout.php', { 
      method: 'POST', 
      credentials: 'include' 
    });
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};