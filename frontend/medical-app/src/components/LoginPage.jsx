import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/patientportal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      //await login(email, password);
      //nav(from || "/patientportal", { replace: true });
      const u = await login(email, password);
      const destByRole = {
        PATIENT: "/patientportal",
        DOCTOR:  "/doctor",
        RECEPTIONIST: "/receptionist",
        ADMIN:   "/admin",  // or wherever you want admins to land
      };
      const fallback = "/patientportal";
      // Normalize role string from backend if present
      const role = u?.role ? String(u.role).toUpperCase() : null;
      const roleDest = destByRole[role] || fallback;
      nav(from || roleDest, { replace: true });
    } catch (ex) {
        setErr(ex.message);
    } finally {
        setSubmitting(false);
    }
  }

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="landing-container">
          <div className="logo">
            <span className="logo-icon"><span className="icon">✓</span></span>
            MedConnect
          </div>
          <div className="header-actions">
            <Link to="/" className="btn btn-secondary">Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="landing-container" style={{ padding: "4rem 1.5rem" }}>
        <section className="hours-card" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="hours-header">
            <h3>Sign in to your account</h3>
          </div>
          <div className="hours-content">
            {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
            <form onSubmit={onSubmit}>
              <label style={{ display: "block", marginBottom: 12 }}>
                <div>Email</div>
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 20 }}>
                <div>Password</div>
                <input
                  type="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </label>

              <button className="btn btn-primary btn-large" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
