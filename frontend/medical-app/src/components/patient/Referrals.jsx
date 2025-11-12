import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertTriangle, CheckCircle, XCircle, Plus, Stethoscope, FileText } from 'lucide-react';
import './Referrals.css';
import api from '../../patientapi.js';

export default function Referrals({ setShowBookingModal }) {
  const [referrals, setReferrals] = useState({ active: [], used: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadReferrals();
  }, []);

  async function loadReferrals() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.referrals.getReferrals();
      if (response.success) {
        setReferrals(response.data);
      } else {
        setError(response.message || 'Failed to load referrals');
      }
    } catch (err) {
      console.error('Error loading referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }

  const getUrgencyIcon = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'urgent':
        return <AlertTriangle className="urgency-icon urgent" />;
      case 'warning':
        return <Clock className="urgency-icon warning" />;
      default:
        return <CheckCircle className="urgency-icon normal" />;
    }
  };

  const getUrgencyMessage = (urgencyLevel, daysRemaining) => {
    switch (urgencyLevel) {
      case 'urgent':
        return `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} - Book soon!`;
      case 'warning':
        return `Expires in ${daysRemaining} days`;
      default:
        return `${daysRemaining} days remaining`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderReferralCard = (referral) => (
    <div key={referral.referral_id} className={`referral-card ${referral.urgency_level}`}>
      <div className="referral-header">
        <div className="referral-info">
          <h3>{referral.specialist_name}</h3>
          <p className="specialty">{referral.specialty_name}</p>
          <p className="referring-doctor">
            <User className="small-icon" />
            Referred by Dr. {referral.referring_doctor}
          </p>
        </div>
        <div className="urgency-indicator">
          {getUrgencyIcon(referral.urgency_level)}
        </div>
      </div>

      <div className="referral-body">
        <div className="referral-reason">
          <FileText className="small-icon" />
          <span>{referral.reason}</span>
        </div>

        <div className="referral-dates">
          <div className="date-info">
            <span className="date-label">Issued:</span>
            <span className="date-value">{formatDate(referral.date_issued)}</span>
          </div>
          <div className="date-info">
            <span className="date-label">Expires:</span>
            <span className="date-value">{formatDate(referral.expiration_date)}</span>
          </div>
        </div>

        {!referral.is_used && (
          <div className={`expiration-warning ${referral.urgency_level}`}>
            {getUrgencyIcon(referral.urgency_level)}
            <span>{getUrgencyMessage(referral.urgency_level, referral.days_remaining)}</span>
          </div>
        )}

        {referral.is_used && (
          <div className="appointment-info">
            <CheckCircle className="small-icon success" />
            <span>Appointment scheduled</span>
          </div>
        )}
      </div>

      {!referral.is_used && (
        <div className="referral-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowBookingModal(true)}
          >
            <Calendar className="small-icon" />
            Book Appointment
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="portal-content">
        <h1 className="page-title">Referrals</h1>
        <div className="loading-spinner">Loading referrals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-content">
        <h1 className="page-title">Referrals</h1>
        <div className="error-message">
          <XCircle className="error-icon" />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadReferrals}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-content">
      <h1 className="page-title">Referrals</h1>
      
      <div className="referrals-tabs">
        <button 
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Referrals ({referrals.active.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'used' ? 'active' : ''}`}
          onClick={() => setActiveTab('used')}
        >
          Used Referrals ({referrals.used.length})
        </button>
      </div>

      <div className="referrals-content">
        {activeTab === 'active' && (
          <div className="referrals-list">
            {referrals.active.length === 0 ? (
              <div className="empty-state">
                <Stethoscope className="empty-icon" />
                <h3>No Active Referrals</h3>
                <p>You don't have any active referrals at this time.</p>
              </div>
            ) : (
              <>
                {referrals.active.filter(r => r.urgency_level === 'urgent').length > 0 && (
                  <div className="urgent-section">
                    <h2 className="section-title urgent">
                      <AlertTriangle className="section-icon" />
                      Urgent - Expires Soon
                    </h2>
                    {referrals.active
                      .filter(r => r.urgency_level === 'urgent')
                      .map(renderReferralCard)}
                  </div>
                )}
                
                {referrals.active.filter(r => r.urgency_level === 'warning').length > 0 && (
                  <div className="warning-section">
                    <h2 className="section-title warning">
                      <Clock className="section-icon" />
                      Expiring Soon
                    </h2>
                    {referrals.active
                      .filter(r => r.urgency_level === 'warning')
                      .map(renderReferralCard)}
                  </div>
                )}
                
                {referrals.active.filter(r => r.urgency_level === 'normal').length > 0 && (
                  <div className="normal-section">
                    <h2 className="section-title normal">
                      <CheckCircle className="section-icon" />
                      Active
                    </h2>
                    {referrals.active
                      .filter(r => r.urgency_level === 'normal')
                      .map(renderReferralCard)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'used' && (
          <div className="referrals-list">
            {referrals.used.length === 0 ? (
              <div className="empty-state">
                <CheckCircle className="empty-icon" />
                <h3>No Used Referrals</h3>
                <p>You haven't used any referrals yet.</p>
              </div>
            ) : (
              referrals.used.map(renderReferralCard)
            )}
          </div>
        )}
      </div>
    </div>
  );
}