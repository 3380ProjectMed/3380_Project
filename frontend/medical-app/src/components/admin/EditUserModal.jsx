import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader, UserPlus } from 'lucide-react';

function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    workLocation: '',
    isActive: user.is_active ? 1 : 0,
  });

  const [workLocations, setWorkLocations] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialize form from user prop
  useEffect(() => {
    if (!user) return;

    const [first, ...rest] = (user.name || '').split(' ');
    const last = rest.join(' ');

    setFormData(prev => ({
      ...prev,
      firstName: first || '',
      lastName: last || '',
      email: user.email || '',
      phoneNumber: user.phone_number || '',
      work_location: formData.workLocation
        ? parseInt(formData.workLocation, 10)
        : null,
      isActive: user.is_active ? 1 : 0,
    }));
  }, [user]);

  // Load locations (reuse same options as AddUserModal)
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await fetch('/admin_api/users/get_form_options.php', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          setWorkLocations(data.work_locations || []);
        } else {
          setError(data.error || 'Failed to load form options');
        }
      } catch (err) {
        console.error('EditUserModal loadOptions error:', err);
        setError(err.message || 'Failed to load form options');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData(prev => ({
    ...prev,
    firstName: first || '',
    lastName: last || '',
    email: user.email || '',
    phoneNumber: user.phone_number || '',
    workLocation: user.work_location_id
      ? String(user.work_location_id)
      : '',
    isActive: user.is_active ? 1 : 0,
  }));

};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        user_id: user.user_id,
        user_type: user.user_type,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        work_location: formData.workLocation
          ? parseInt(formData.workLocation, 10)
          : null,
        is_active: formData.isActive ? 1 : 0,
      };

      const response = await fetch('/admin_api/users/update-user.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (err) {
        console.error('EditUserModal JSON parse error:', err);
        throw new Error(`Invalid JSON from server (status ${response.status})`);
      }

      if (!response.ok || !data || data.success === false) {
        const msg =
          (data && data.error) ||
          text ||
          `Update failed with status ${response.status}`;
        throw new Error(msg);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      console.error('EditUserModal handleSubmit error:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = user.user_type
    ? user.user_type.charAt(0) + user.user_type.slice(1).toLowerCase()
    : 'User';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {roleLabel}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} />
            <h3>User updated successfully!</h3>
          </div>
        ) : loadingOptions ? (
          <div className="loading-container" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={40} />
            <p>Loading form...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="workLocation">Work Location</label>
                <select
                  id="workLocation"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                >
                  <option value="">(None)</option>
                  {workLocations.map(loc => (
                    <option key={loc.office_id} value={loc.office_id}>
                      {loc.name} - {loc.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="isActive">Status</label>
              <select
                id="isActive"
                name="isActive"
                value={formData.isActive}
                onChange={handleChange}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader className="spinner" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditUserModal;
