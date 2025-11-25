import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, MapPin, Building, AlertCircle, Loader } from 'lucide-react';
import './ReceptionistProfile.css';

function ReceptionistProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/receptionist_api/profile/get.php', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchProfile}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>Profile Not Found</h3>
          <p>Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-content">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">View your account information and work location</p>
        </div>
      </div>

      <div className="profile-content">
        {}
        <div className="profile-card">
          <div className="card-header">
            <User size={24} />
            <h2 className="card-title">Personal Information</h2>
          </div>
          
          <div className="card-body">
            <div className="profile-grid">
              <div className="profile-field">
                <label className="field-label">First Name</label>
                <div className="field-value-display">
                  <User size={18} />
                  <span>{profile.firstName || 'N/A'}</span>
                </div>
              </div>

              <div className="profile-field">
                <label className="field-label">Last Name</label>
                <div className="field-value-display">
                  <User size={18} />
                  <span>{profile.lastName || 'N/A'}</span>
                </div>
              </div>

              <div className="profile-field">
                <label className="field-label">Email Address</label>
                <div className="field-value-display">
                  <Mail size={18} />
                  <span>{profile.email || 'N/A'}</span>
                </div>
              </div>

              <div className="profile-field">
                <label className="field-label">Gender</label>
                <div className="field-value-display">
                  <User size={18} />
                  <span>{profile.gender || <span className="text-muted">Not provided</span>}</span>
                </div>
              </div>

              <div className="profile-field">
                <label className="field-label">Staff ID</label>
                <div className="field-value-display">
                  <Briefcase size={18} />
                  <span>{profile.staffId || 'N/A'}</span>
                </div>
              </div>

              <div className="profile-field">
                <label className="field-label">Role</label>
                <div className="field-value-display">
                  <Briefcase size={18} />
                  <span className="role-badge">Receptionist</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        {profile.workLocation && (
          <div className="profile-card">
            <div className="card-header">
              <Building size={24} />
              <h2 className="card-title">Work Location</h2>
            </div>
            
            <div className="card-body">
              <div className="location-info">
                <div className="location-header">
                  <h3 className="office-name">{profile.workLocation.name}</h3>
                  <span className="office-id-badge">Office ID: {profile.workLocation.officeId}</span>
                </div>

                <div className="location-details">
                  <div className="location-field">
                    <MapPin size={18} />
                    <div className="location-text">
                      <p className="location-address">{profile.workLocation.address}</p>
                      <p className="location-city">
                        {profile.workLocation.city}, {profile.workLocation.state} {profile.workLocation.zipcode}
                      </p>
                    </div>
                  </div>

                  {profile.workLocation.phone && (
                    <div className="location-field">
                      <Phone size={18} />
                      <div className="location-text">
                        <p className="location-phone">{profile.workLocation.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!profile.workLocation && (
          <div className="profile-card">
            <div className="card-header">
              <Building size={24} />
              <h2 className="card-title">Work Location</h2>
            </div>
            
            <div className="card-body">
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No office assignment found</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceptionistProfile;