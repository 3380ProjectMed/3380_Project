import React from 'react';
import { Calendar, User, Activity, Clock, MapPin, Phone, Mail, Check, Plus, Stethoscope, UserCheck, FileText } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard(props) {
  const { displayName, loading, upcomingAppointments = [], pcp, recentActivity = [], setShowBookingModal, handleCancelAppointment } = props;

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
              <h2><Activity className="icon" /> Recent Activity</h2>
            </div>
            <div className="card-content">
              {recentActivity.length === 0 ? (
                <p className="text-gray">No recent activity</p>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((activity, idx) => {
                    const isReferral = activity.activity_type === 'referral' || activity.status === 'Referral Approved';
                    const ActivityIcon = isReferral ? UserCheck : (activity.status === 'Completed' ? Check : FileText);
                    const iconClass = isReferral ? 'activity-icon referral' : 'activity-icon success';
                    
                    return (
                      <div 
                        key={idx} 
                        className={`activity-item ${isReferral ? 'referral-notification' : ''}`}
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
                          {isReferral && (
                            <button 
                              className="btn btn-referral-action"
                              onClick={() => setShowBookingModal(true)}
                              title={`Book appointment with ${activity.specialist_name || 'specialist'}`}
                            >
                              <Calendar className="small-icon" />
                              Book Appointment
                            </button>
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
