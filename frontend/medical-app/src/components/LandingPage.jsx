import React from "react";
import { 
  Calendar, 
  Stethoscope, 
  Building2, 
  Users, 
  ShieldCheck, 
  Phone, 
  Globe, 
  LogIn, 
  ArrowRight 
} from "lucide-react";
import "./landingpage.css";

// Simple button component
const Button = ({ children, variant = "primary", href }) => {
  const className = variant === "primary" ? "btn" : "btn alt";
  return <a href={href} className={className}>{children}</a>;
};

const features = [
  {
    icon: Building2,
    title: "Multi-Office Support",
    desc: "Manage locations across states with unified provider & patient records.",
  },
  {
    icon: Stethoscope,
    title: "Doctor & Patient Mapping",
    desc: "Assign patients to one or multiple doctors; support primary & specialists.",
  },
  {
    icon: Calendar,
    title: "Appointments",
    desc: "Schedule/cancel via phone or web with automated reminders.",
  },
  {
    icon: ShieldCheck,
    title: "Approvals Flow",
    desc: "Require primary physician approval before booking specialists.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "Admin, Doctor, and Patient portals with scoped permissions.",
  },
  {
    icon: Globe,
    title: "Web Portal",
    desc: "Mobile-first UI, fast search, and secure patient self-service.",
  },
];

const stats = [
  { label: "Offices", value: "12+" },
  { label: "Doctors", value: "150+" },
  { label: "Patients", value: "25k+" },
  { label: "Avg. Wait", value: "< 5 min" },
];

export default function LandingPage() {
  return (
    <div className="landing-root">
      
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="logo">
            <Stethoscope className="icon" />
            <span>MedConnect</span>
          </div>
          
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#contact">Contact</a>
          </nav>
          
          <div className="header-actions">
            <Button variant="secondary" href="/login">
              <LogIn className="icon" /> Sign in
            </Button>
            <Button variant="primary" href="/portal">
              Patient Portal <ArrowRight className="icon" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="landing-container">
          <div className="hero-content">
            
            {/* Left side - Text */}
            <div className="hero-text">
              <h1 className="h1">
                A modern front-end for your <span>Medical Clinic Database</span>
              </h1>
              <p className="lead">
                Manage multi-office providers, doctor-patient assignments, 
                approvals, and appointments—all in one streamlined portal.
              </p>
              
              <div className="hero-buttons">
                <Button variant="primary" href="/signup">
                  Get Started <ArrowRight className="icon" />
                </Button>
                <Button variant="secondary" href="#features">
                  Explore Features
                </Button>
              </div>
              
              {/* Quick search */}
              <div className="card search-card">
                <h3>Quick lookup</h3>
                <div className="search-box">
                  <input 
                    type="text" 
                    placeholder="Search doctors, patients, or offices…" 
                  />
                  <button className="btn">
                    Search <ArrowRight className="icon" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="hero-stats">
              <div className="stats-grid">
                {stats.map((stat, i) => (
                  <div key={i} className="card stat-card">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="card availability-card">
                <h4>Today's availability</h4>
                <p>
                  <Calendar className="icon" />
                  12 open slots across 3 offices
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>Everything clinics need—built-in</h2>
            <p>Design focuses on speed, clarity, and the exact workflows clinics use daily.</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="feature">
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <div className="feature-content">
                    <h3 className="title">{feature.title}</h3>
                    <p className="desc">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="workflow-section">
        <div className="landing-container">
          <div className="workflow-grid">
            
            <div className="card workflow-card">
              <h3>
                <LogIn className="icon" /> Patient Portal
              </h3>
              <p>Book/cancel appointments and request specialist approvals.</p>
              <Button variant="primary" href="/portal">
                Open Portal <ArrowRight className="icon" />
              </Button>
            </div>

            <div className="card workflow-card">
              <h3>
                <Users className="icon" /> Doctor Dashboard
              </h3>
              <p>View day lists, manage panels, and approve specialist referrals.</p>
              <Button variant="secondary" href="/doctor">
                Go to Dashboard
              </Button>
            </div>

            <div className="card workflow-card">
              <h3>
                <ShieldCheck className="icon" /> Admin Console
              </h3>
              <p>Manage offices, providers, schedules, and system policies.</p>
              <Button variant="secondary" href="/admin">
                Open Console
              </Button>
            </div>
            
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="landing-container">
          <div className="card contact-card">
            <div className="contact-content">
              <div className="contact-text">
                <h3>Questions? Let's talk.</h3>
                <p>We can tailor the front-end to your exact database schema and auth setup.</p>
              </div>
              <div className="contact-actions">
                <Button variant="secondary" href="tel:+18001234567">
                  <Phone className="icon" /> Call
                </Button>
                <Button variant="primary" href="mailto:hello@medconnect.example">
                  Email us <ArrowRight className="icon" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="landing-container">
          © {new Date().getFullYear()} MedConnect • Built with React & Vite
        </div>
      </footer>
      
    </div>
  );
}