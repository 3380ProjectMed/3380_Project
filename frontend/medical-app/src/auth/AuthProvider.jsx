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
        // With the updated me.php, unauthenticated users get:
        // { user: null, authenticated: false }
        // Authenticated users get the full user object
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

    const data = await r.json(); // { user_id, username, email, role }
    setUser(data); // Quick optimistic update

    // Refresh the authoritative user record from server
    // This includes doctor_id and other joined data from me.php
    try {
      await refreshUser();
    } catch (e) {
      // If refresh fails, keep the optimistic user
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