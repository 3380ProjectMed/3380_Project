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
            <a 
              href="#Location" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('Location').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Location
            </a>
            <a 
              href="#faq-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('faq-section').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              FAQs
            </a>
            
          </nav>
          
          <div className="header-actions">
            <a href="/login" className="btn btn-primary">
              <LogIn className="icon" />
              Log In
            </a>
            <a href="/signup" className="btn btn-secondary">
              <LogIn className="icon" />
              Sign Up
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
              At MedConnect your health is our priority. We're a community-focused medical clinic offering primary care, urgent care, preventive screenings, and chronic-condition management — all delivered by an experienced team of physicians, nurses, and care coordinators. We believe medicine should be straightforward, respectful, and centered on you.
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
                Our network of doctors across 4 offices provides comprehensive medical care with expertise you can trust.
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
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="Location" className="location-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>Our Locations</h2>
            <p>Find a MedConnect clinic near you</p>
          </div>
          
          <div className="location-grid">
            <div className="location-card">
              <div className="location-icon">
                <MapPin />
              </div>
              <h3>Downtown Medical Center</h3>
              <p>425 Main Street, Suite 100</p>
              <p>Houston, TX 77002</p>
            </div>

            <div className="location-card">
              <div className="location-icon">
                <MapPin />
              </div>
              <h3>Westside Family Clinic</h3>
              <p>8920 Katy Freeway, Building B</p>
              <p>Houston, TX 77024</p>
            </div>

            <div className="location-card">
              <div className="location-icon">
                <MapPin />
              </div>
              <h3>Memorial Park Healthcare</h3>
              <p>1550 Memorial Drive</p>
              <p>Houston, TX 77007</p>
            </div>

            <div className="location-card">
              <div className="location-icon">
                <MapPin />
              </div>
              <h3>Galleria Medical Plaza</h3>
              <p>5085 Westheimer Road, Floor 3</p>
              <p>Houston, TX 77056</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="faq-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about our services</p>
          </div>
          
          <div className="faq-grid">
            <div className="faq-card">
              <h3>Do I need an appointment?</h3>
              <p>We recommend scheduling appointments for routine visits.</p>
            </div>

            <div className="faq-card">
              <h3>What insurance do you accept?</h3>
              <p>We accept most major insurance plans including Medicare and Medicaid.</p>
            </div>

            <div className="faq-card">
              <h3>How do I access my medical records?</h3>
              <p>You can view and download your medical records through our secure patient portal. Sign up or log in to get started.</p>
            </div>

            <div className="faq-card">
              <h3>What should I bring to my first visit?</h3>
              <p>Please bring a valid ID, insurance card, list of current medications, and any relevant medical records from previous providers.</p>
            </div>

            <div className="faq-card">
              <h3>Do you offer telemedicine appointments?</h3>
              <p>No. We only offer in person consultations. Schedule through our patient portal or call us to make an appointment.</p>
            </div>

            <div className="faq-card">
              <h3>How can I refill my prescriptions?</h3>
              <p>You can request prescription refills through our patient portal, by phone, or by contacting your pharmacy directly to send us a refill request.</p>
            </div>
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