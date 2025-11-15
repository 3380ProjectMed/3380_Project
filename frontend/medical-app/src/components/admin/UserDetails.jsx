import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Plus,
  Trash2
} from 'lucide-react';
import './UserDetails.css';

function UserDetailsModal({ userId, userType, onClose, onUpdate }) {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [userId, userType]);

  const loadUserDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/admin_api/users/get_user_details.php?user_id=${userId}&user_type=${userType}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setSchedules(data.schedules || []);
        setAvailableSchedules(data.available_schedules || []);
      } else {
        setError(data.error || 'Failed to load user details');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedSchedule) {
      setError('Please select a schedule');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/admin_api/users/add_staff_schedule.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: user.staff_id,
          office_id: user.office_id,
          day_of_week: selectedSchedule
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddSchedule(false);
        setSelectedSchedule('');
        loadUserDetails(); // Reload to show new schedule
      } else {
        setError(data.error || 'Failed to add schedule');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to remove this schedule?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/admin_api/users/remove_staff_schedule.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule_id: scheduleId
        }),
      });

      const data = await response.json();

      if (data.success) {
        loadUserDetails(); // Reload to reflect removal
      } else {
        setError(data.error || 'Failed to remove schedule');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getRoleLabel = (userType) => {
    const labels = {
      'DOCTOR': 'Doctor',
      'doctor': 'Doctor',
      'NURSE': 'Nurse',
      'nurse': 'Nurse',
      'RECEPTIONIST': 'Receptionist',
      'receptionist': 'Receptionist',
    };
    return labels[userType] || userType;
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={40} />
            <p>Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>User not found</span>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="user-details-content">
          {/* Basic Information */}
          <div className="details-section">
            <h3>Basic Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label><User size={16} /> Full Name</label>
                <span>{user.name}</span>
              </div>

              <div className="detail-item">
                <label><Mail size={16} /> Email</label>
                <span>{user.email}</span>
              </div>

              <div className="detail-item">
                <label>Role</label>
                <span className={`role-badge ${userType.toLowerCase()}`}>
                  {getRoleLabel(userType)}
                </span>
              </div>

              <div className="detail-item">
                <label>Status</label>
                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {user.phone_number && (
                <div className="detail-item">
                  <label><Phone size={16} /> Phone</label>
                  <span>{user.phone_number}</span>
                </div>
              )}

              <div className="detail-item">
                <label>Gender</label>
                <span>{user.gender === 1 ? 'Male' : 'Female'}</span>
              </div>

              {user.specialty && (
                <div className="detail-item">
                  <label>Specialization</label>
                  <span>{user.specialty}</span>
                </div>
              )}

              {user.department && (
                <div className="detail-item">
                  <label>Department</label>
                  <span>{user.department}</span>
                </div>
              )}

              {user.license_number && (
                <div className="detail-item">
                  <label>License Number</label>
                  <span>{user.license_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div className="details-section">
            <h3>Work Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label><MapPin size={16} /> Work Location</label>
                <span>{user.work_location}</span>
              </div>

              <div className="detail-item">
                <label>Office Address</label>
                <span>{user.office_address}</span>
              </div>

              <div className="detail-item">
                <label>Base Schedule Type</label>
                <span>{user.shift_type}</span>
              </div>
            </div>
          </div>

          {/* Work Schedule */}
          <div className="details-section">
            <div className="section-header">
              <h3><Calendar size={20} /> Weekly Schedule</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddSchedule(!showAddSchedule)}
                disabled={submitting}
              >
                <Plus size={16} />
                Add Schedule
              </button>
            </div>

            {showAddSchedule && (
              <div className="add-schedule-form">
                <div className="form-group">
                  <label htmlFor="scheduleSelect">Select Day Schedule</label>
                  <select
                    id="scheduleSelect"
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a day...</option>
                    {availableSchedules.map((schedule) => (
                      <option key={schedule.day_of_week} value={schedule.day_of_week}>
                        {schedule.day_of_week} ({formatTime(schedule.start_time)} - {formatTime(schedule.end_time)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowAddSchedule(false);
                      setSelectedSchedule('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleAddSchedule}
                    disabled={!selectedSchedule || submitting}
                  >
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            <div className="schedules-list">
              {schedules.length === 0 ? (
                <div className="no-schedules">
                  <Calendar size={32} />
                  <p>No schedules assigned yet</p>
                </div>
              ) : (
                <div className="schedule-cards">
                  {schedules.map((schedule) => (
                    <div key={schedule.schedule_id} className="schedule-card">
                      <div className="schedule-info">
                        <div className="schedule-day">{schedule.day_of_week}</div>
                        <div className="schedule-time">
                          <Clock size={16} />
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                      </div>
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleRemoveSchedule(schedule.schedule_id)}
                        disabled={submitting}
                        title="Remove schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetails;