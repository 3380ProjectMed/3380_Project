
import React from "react";
import { 
  Calendar, 
  Stethoscope, 
  Phone, 
  Mail,
  MapPin,
  Clock,
  Users,
  Heart,
  Award,
  ArrowRight,
  LogIn
} from "lucide-react";
import "./landingpage.css";

export default function LandingPage() {
  return (
    <div className="landing-root">
      
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="logo">
            <div className="logo-icon">
              <Stethoscope className="icon" />
            </div>
            <span>MedConnect</span>
          </div>
          
          <nav className="nav-links">
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              About
            </a>
            <a 
              href="#hours" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('hours').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Hours
            </a>
            <a 
              href="#contact" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Contact
            </a>
          </nav>
          
          <div className="header-actions">
            <a href="/login" className="btn btn-secondary">
              <LogIn className="icon" />
              Sign In
            </a>
            <a href="/portal" className="btn btn-primary">
              Patient Portal
              <ArrowRight className="icon" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="landing-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Modern Healthcare,{" "}
              <span className="highlight">Simplified</span>
            </h1>
            <p className="hero-description">
              Manage multi-office providers, doctor-patient assignments, and appointments—all in one streamlined portal.
            </p>
            
            <div className="hero-buttons">
              <a href="/signup" className="btn btn-primary btn-large">
                Get Started
                <ArrowRight className="icon" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>About MedConnect</h2>
            <p>Your trusted partner in modern healthcare management</p>
          </div>
          
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">
                <Users />
              </div>
              <h3>Expert Care</h3>
              <p>
                Our network of 150+ doctors across 12 offices provides comprehensive medical care with expertise you can trust.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon">
                <Heart />
              </div>
              <h3>Patient-Centered</h3>
              <p>
                We put your health first with personalized care, easy appointment scheduling, and dedicated support for every patient.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon">
                <Award />
              </div>
              <h3>Quality Service</h3>
              <p>
                With less than 5 minutes average wait time and 25,000+ satisfied patients, we deliver healthcare excellence daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section id="hours" className="hours-section">
        <div className="landing-container hours-container">
          <div className="section-header">
            <h2>Clinic Hours</h2>
            <p>We're here when you need us</p>
          </div>
          
          <div className="hours-card">
            <div className="hours-header">
              <Clock className="icon" />
              <h3>Operating Hours</h3>
            </div>
            
            <div className="hours-content">
              <div className="hours-list">
                <div className="hours-row">
                  <span className="day">Monday - Friday</span>
                  <span className="time">8:00 AM - 6:00 PM</span>
                </div>
                <div className="hours-row">
                  <span className="day">Saturday</span>
                  <span className="time">9:00 AM - 3:00 PM</span>
                </div>
                <div className="hours-row">
                  <span className="day">Sunday</span>
                  <span className="time">Closed</span>
                </div>
                <div className="hours-row">
                  <span className="day">Holidays</span>
                  <span className="time">Emergency Only</span>
                </div>
              </div>
              
              <div className="hours-note">
                <Calendar className="icon" />
                <p>
                  <strong>Need urgent care?</strong> Call our 24/7 emergency hotline or visit your nearest location for immediate assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>Contact Us</h2>
            <p>We're here to help with any questions</p>
          </div>
          
          <div className="contact-grid">
            <a href="tel:+18001234567" className="contact-card">
              <div className="contact-icon">
                <Phone />
              </div>
              <h3>Phone</h3>
              <p>(800) 123-4567</p>
            </a>

            <a href="mailto:hello@medconnect.example" className="contact-card">
              <div className="contact-icon">
                <Mail />
              </div>
              <h3>Email</h3>
              <p className="email-text">hello@medconnect.example</p>
            </a>

            <div className="contact-card">
              <div className="contact-icon">
                <MapPin />
              </div>
              <h3>Location</h3>
              <p>12 Offices Nationwide</p>
            </div>
          </div>

          <div className="contact-cta">
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="landing-container">
          © {new Date().getFullYear()} MedConnect • Modern Healthcare Management
        </div>
      </footer>
      
    </div>
  );
}