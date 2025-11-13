import React from 'react';
import { Calendar, User, Activity, Clock, MapPin, Phone, Mail, Check, Plus, Stethoscope, UserCheck, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard(props) {
  const { displayName, loading, upcomingAppointments = [], pcp, recentActivity = [], referrals = { active: [], used: [] }, setShowBookingModal, handleCancelAppointment, setSelectedDoctor } = props;

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

  // Filter out referrals from recent activity since they'll have their own section
  const nonReferralActivity = recentActivity.filter(activity => 
    activity.activity_type !== 'referral' && activity.status !== 'Referral Approved'
  );

  const handleReferralBooking = (referral) => {
    // Pre-select the specialist doctor for this referral
    const doctorInfo = {
      doctor_id: referral.specialist_id,
      name: referral.specialist_name,
      specialty_name: referral.specialty_name
    };
    setSelectedDoctor(doctorInfo);
    setShowBookingModal(true);
  };

  return (
    <div className="portal-content">
      <h1 className="page-title">Welcome Back, {displayName}</h1>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-card large">
            <div className="card-header">
              <h2><Calendar className="icon" /> Upcoming Appointments</h2>
            </div>
            <div className="card-content">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map(apt => (
                  <div key={apt.appointment_id} className="appointment-item">
                    <div className="appointment-info">
                      <h3>{apt.doctor_name}</h3>
                      <p>{apt.specialty_name}</p>
                      <p className="appointment-details">
                        <Clock className="small-icon" /> {new Date(apt.appointment_date).toLocaleString()}
                      </p>
                      <p className="appointment-details">
                        <MapPin className="small-icon" /> {apt.office_name}
                      </p>
                    </div>
                    <span className={`status-badge ${apt.status?.toLowerCase?.() ?? 'scheduled'}`}>
                      {apt.status ?? 'Scheduled'}
                    </span>
                  </div>
                ))
              )}
              <button className="btn btn-primary btn-full" onClick={() => setShowBookingModal(true)}>
                <Plus className="icon" /> Book New Appointment
              </button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2><User className="icon" /> Primary Care Physician</h2>
            </div>
            <div className="card-content">
              {pcp ? (
                <div className="pcp-info">
                  <div className="pcp-avatar"><Stethoscope /></div>
                  <div>
                    <h3>{pcp.name || pcp.pcp_name}</h3>
                    <p>{pcp.specialty_name || pcp.pcp_specialty}</p>
                    <p><MapPin className="small-icon" /> {pcp.office_name || pcp.pcp_office}</p>
                    <p><Phone className="small-icon" /> {pcp.Phone || pcp.pcp_phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray">No PCP assigned</p>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2><UserCheck className="icon" /> Active Referrals</h2>
            </div>
            <div className="card-content">
              {referrals.active.length === 0 ? (
                <p className="text-gray">No active referrals</p>
              ) : (
                <div className="referrals-list">
                  {referrals.active.slice(0, 3).map(referral => (
                    <div key={referral.referral_id} className={`referral-item ${referral.urgency_level}`}>
                      <div className="referral-header">
                        <div className="referral-info">
                          <h4>{referral.specialist_name}</h4>
                          <p className="specialty-text">{referral.specialty_name}</p>
                        </div>
                        <div className="urgency-indicator">
                          {getUrgencyIcon(referral.urgency_level)}
                        </div>
                      </div>
                      <div className="referral-details">
                        <p className="referral-reason">
                          <FileText className="small-icon" />
                          {referral.reason}
                        </p>
                        <div className={`expiration-notice ${referral.urgency_level}`}>
                          {getUrgencyIcon(referral.urgency_level)}
                          <span>{getUrgencyMessage(referral.urgency_level, referral.days_remaining)}</span>
                        </div>
                      </div>
                      {!referral.is_used ? (
                        <button 
                          className={`btn btn-sm btn-referral-action ${referral.urgency_level === 'urgent' ? 'urgent' : ''}`}
                          onClick={() => handleReferralBooking(referral)}
                        >
                          <Calendar className="small-icon" />
                          {referral.urgency_level === 'urgent' ? 'Book Now!' : 'Book Appointment'}
                        </button>
                      ) : (
                        <div className="appointment-booked-notice">
                          <CheckCircle className="small-icon success" />
                          <span>Appointment Scheduled</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {referrals.used.length > 0 && (
                    <div className="used-referrals-summary">
                      <p className="text-gray">
                        <CheckCircle className="small-icon success" />
                        {referrals.used.length} completed referral{referrals.used.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  {referrals.active.length > 3 && (
                    <div className="referrals-summary">
                      <p className="text-gray">+{referrals.active.length - 3} more active referral{referrals.active.length - 3 !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2><Activity className="icon" /> Recent Activity</h2>
            </div>
            <div className="card-content">
              {nonReferralActivity.length === 0 ? (
                <p className="text-gray">No recent activity</p>
              ) : (
                <div className="activity-list">
                  {nonReferralActivity.map((activity, idx) => {
                    const ActivityIcon = activity.status === 'Completed' ? Check : FileText;
                    const iconClass = 'activity-icon success';
                    
                    return (
                      <div 
                        key={idx} 
                        className="activity-item"
                        data-status={activity.status?.toLowerCase()}
                        data-type={activity.activity_type}
                      >
                        <ActivityIcon className={iconClass} />
                        <div className="activity-content">
                          <div className="activity-header">
                            <p><strong>{activity.status}</strong></p>
                            <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>
                          </div>
                          <p className="activity-details">
                            {activity.doctor_name}
                          </p>
                          {activity.description && (
                            <p className="activity-description text-small">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
