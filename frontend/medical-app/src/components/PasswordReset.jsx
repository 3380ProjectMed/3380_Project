import React, { useState, useEffect } from 'react';
import './LoginPage.css';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [ssn, setSsn] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email from URL if provided
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    // Validate SSN format (9 digits)
    const ssnDigits = ssn.replace(/\D/g, '');
    if (ssnDigits.length !== 9) {
      setMessage({ text: 'SSN must be 9 digits', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/password-reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reset',
          email,
          ssn: ssnDigits,
          password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          text: 'Password reset successful! Redirecting to login...', 
          type: 'success' 
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage({ text: data.error || 'Invalid credentials or SSN does not match', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Format SSN as user types (XXX-XX-XXXX)
  const handleSsnChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    
    if (value.length > 3 && value.length <= 5) {
      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 5) {
      formatted = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5, 9)}`;
    }
    
    setSsn(formatted);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Welcome Header */}
        <div className="login-welcome">
          <div className="login-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
              />
            </svg>
          </div>
          <h1 className="login-title">Reset Your Password</h1>
          <p className="login-subtitle">
            Verify your identity with your SSN to reset your password
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-content">
            {/* Error/Success Message */}
            {message.text && message.type === 'error' && (
              <div className="login-error">
                <svg className="login-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="login-error-text">{message.text}</p>
              </div>
            )}

            {message.text && message.type === 'success' && (
              <div className="login-note">
                <svg className="login-note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="login-note-text">{message.text}</p>
              </div>
            )}

            {/* RESET PASSWORD FORM */}
            <form onSubmit={handleResetPassword}>
              <div className="login-field">
                <label htmlFor="email" className="login-label">
                  Email Address
                </label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" 
                    />
                  </svg>
                  <input
                    type="email"
                    id="email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="ssn" className="login-label">
                  Social Security Number
                </label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" 
                    />
                  </svg>
                  <input
                    type="text"
                    id="ssn"
                    className="login-input"
                    value={ssn}
                    onChange={handleSsnChange}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    required
                    disabled={loading}
                  />
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Enter your 9-digit Social Security Number
                </p>
              </div>

              <div className="login-field">
                <label htmlFor="password" className="login-label">
                  New Password
                </label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                  <input
                    type="password"
                    id="password"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="login-field">
                <label htmlFor="confirmPassword" className="login-label">
                  Confirm Password
                </label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                    />
                  </svg>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="login-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <svg className="login-submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <div className="login-divider-line"></div>
              <span className="login-divider-text">or</span>
              <div className="login-divider-line"></div>
            </div>

            {/* Link back to login */}
            <div className="login-signup">
              <p className="login-signup-text">
                Remember your password?{' '}
                <a href="/login" className="login-signup-link">
                  Back to Login
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="login-note" style={{ marginTop: '1.5rem' }}>
          <svg className="login-note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="login-note-text">
            <strong>Security Notice:</strong> Your SSN is used only for identity verification and is not stored. This information must match our patient records.
          </p>
        </div>
      </div>
    </div>
  );
}