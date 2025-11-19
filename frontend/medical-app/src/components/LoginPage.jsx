import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, Stethoscope } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  
  // Redirect after user state is populated
  useEffect(() => {
    if (loginAttempted && user?.role) {
      const destByRole = {
        PATIENT: "/patientportal",
        DOCTOR: "/doctor",
        ADMIN: "/admin",
        NURSE: "/nurse",
      };
      const normalizedRole = (user.role || '').toUpperCase();
      const destination = destByRole[normalizedRole] || "/patientportal";
      
      console.log('✅ Login successful:', { 
        role: normalizedRole, 
        destination,
        user 
      });
      
      nav(destination, { replace: true });
    }
  }, [user, loginAttempted, nav]);
  
  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    
    try {
      await login(email, password);
      setLoginAttempted(true);
    } catch (ex) {
      setErr(ex.message || "Login failed");
      setLoginAttempted(false);
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <div className="landing-root">
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

      <main className="landing-container login-container">
        <div className="login-wrapper">
          <div className="login-welcome">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to access your account</p>
          </div>

          <div className="login-card">
            <div className="login-card-content">
              {err && (
                <div className="login-error">
                  <AlertCircle className="login-error-icon" />
                  <p className="login-error-text">{err}</p>
                </div>
              )}

              <form onSubmit={onSubmit}>
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

                <div className="login-field">
                  <div className="login-label-row">
                    <label htmlFor="password" className="login-label">
                      Password
                    </label>
                    <a href="/passwordreset" className="login-forgot-link">
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
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="login-divider">
                <div className="login-divider-line" />
                <span className="login-divider-text">New to MedConnect?</span>
                <div className="login-divider-line" />
              </div>

              <div className="login-signup">
                <p className="login-signup-text">
                  Don't have an account?{" "}
                  <Link to="/signup" className="login-signup-link">
                    Sign up now
                  </Link>
                </p>
              </div>

              {/* REMOVED: Info icon section that might trigger social engineering warnings */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}