import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle, Info, User, Stethoscope } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/patientportal";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
// inside LoginPage.jsx

async function onSubmit(e) {
  e.preventDefault();
  setErr("");
  setSubmitting(true);

  try {
    const u = await login(email, password);

    // Normalize role (handles 'admin' vs 'ADMIN', etc.)
    const role = String(u?.role || '').toUpperCase();

    // Only include destinations you actually have routes for right now
    const destByRole = {
      PATIENT: "/patientportal",
      DOCTOR:  "/doctor",
      NURSE:   "/nurse",
      // ADMIN: "/admin",           // disabled for now
      // RECEPTIONIST: "/reception" // not enabled yet
    };

    const roleDest = destByRole[role] || "/patientportal";

    // If you want to honor `from` when it's set, keep this line.
    // If you want to ALWAYS go to the role home, replace `from || roleDest` with `roleDest`.
    nav(from || roleDest, { replace: true });

  } catch (ex) {
    setErr(ex.message || "Login failed. Please try again.");
  } finally {
    setSubmitting(false);
  }
}
  
  return (
    <div className="landing-root">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="logo">
            <span className="logo-icon">
              <Stethoscope className="icon" />
            </span>
            MedConnect
          </div>
          <div className="header-actions">
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-container login-container">
        <div className="login-wrapper">
          
          {/* Welcome Header */}
          <div className="login-welcome">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to access your account</p>
          </div>

          {/* Login Card */}
          <div className="login-card">
            <div className="login-card-content">
              
              {/* Error Alert */}
              {err && (
                <div className="login-error">
                  <AlertCircle className="login-error-icon" />
                  <p className="login-error-text">{err}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={onSubmit}>
                
                {/* Email Field */}
                <div className="login-field">
                  <label htmlFor="email" className="login-label">
                    Email Address
                  </label>
                  <div className="login-input-wrapper">
                    <Mail className="login-input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="login-input"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="login-field">
                  <div className="login-label-row">
                    <label htmlFor="password" className="login-label">
                      Password
                    </label>
                    <a href="#" className="login-forgot-link">
                      Forgot password?
                    </a>
                  </div>
                  <div className="login-input-wrapper">
                    <Lock className="login-input-icon" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="login-input"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={submitting}
                  className="login-submit"
                >
                  {submitting ? (
                    <>
                      <span className="login-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="login-divider">
                <div className="login-divider-line" />
                <span className="login-divider-text">New to MedConnect?</span>
                <div className="login-divider-line" />
              </div>

              {/* Sign Up Link */}
              <div className="login-signup">
                <p className="login-signup-text">
                  Don't have an account?{" "}
                  <Link to="/signup" className="login-signup-link">
                    Sign up now
                  </Link>
                </p>
              </div>

              {/* Info Note */}
              <div className="login-note">
                <Info className="login-note-icon" />
                <p className="login-note-text">
                  <strong>Need help?</strong> Contact our support team at{" "}
                  <a href="mailto:support@medconnect.com" style={{ color: "var(--secondary-color)" }}>
                    support@medconnect.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}