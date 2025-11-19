import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader, UserPlus } from 'lucide-react';

function normalizeLicenseForRole(value, userType) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';

  const six = digits.slice(0, 6);

  if (userType === 'DOCTOR') {
    return `TXMD${six}`;
  }
  if (userType === 'NURSE') {
    return `RN${six}`;
  }
  // fallback: uppercase alphanumeric
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    workLocation: '',
    isActive: 1,
    licenseNumber: '',
    specialty: '',   // NEW: doctor specialty (FK id)
    department: '',  // NEW: nurse department
  });

  const [workLocations, setWorkLocations] = useState([]);
  const [specialties, setSpecialties] = useState([]);  // NEW
  const [departments, setDepartments] = useState([]);  // NEW

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isDoctor = user?.user_type === 'DOCTOR';
  const isNurse  = user?.user_type === 'NURSE';

  // Initialize form from user prop
  useEffect(() => {
    if (!user) return;

    const fullName = String(user.name || '').trim();
    let firstName = '';
    let lastName = '';

    if (fullName) {
      const parts = fullName.split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      email: user.email || '',
      phoneNumber: user.phone_number || '',
      // use work_location_id (numeric) if you have it from API; hidden for doctors anyway
      workLocation:
        !isDoctor && user.work_location_id
          ? String(user.work_location_id)
          : '',
      isActive: user.is_active ? 1 : 0,
      licenseNumber: user.license_number || '',
      // These depend on how your API returns them — adjust property names if needed.
      specialty: user.specialty_id
        ? String(user.specialty_id)
        : '',                         // for DOCTOR
      department: user.department || '' // for NURSE
    }));
  }, [user, isDoctor]);

  // Load options (work locations, specialties, departments)
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
          setSpecialties(data.specialties || []);   // expect [{specialty_id, name}, ...]
          setDepartments(data.departments || []);   // expect [{id, name} or similar]
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
      [name]:
        name === 'isActive'
          ? Number(value)
          : name === 'licenseNumber'
          ? normalizeLicenseForRole(value, user.user_type)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        user_id: user.user_id,
        user_type: user.user_type, // e.g. 'DOCTOR', 'NURSE', 'RECEPTIONIST'
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        is_active: formData.isActive ? 1 : 0,
      };

      // Only non-doctors have a primary work_location here
      if (!isDoctor) {
        payload.work_location = formData.workLocation
          ? parseInt(formData.workLocation, 10)
          : null;
      }

      // Doctors & nurses can edit license number
      if (isDoctor || isNurse) {
        payload.license_number = formData.licenseNumber.trim();
      }

      // Doctor specialty (FK -> specialty.specialty_id)
      if (isDoctor) {
        payload.specialty = formData.specialty
          ? parseInt(formData.specialty, 10)
          : null; // null => backend leaves it unchanged
      }

      // Nurse department
      if (isNurse) {
        payload.department = formData.department.trim();
      }

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

              {/* Work Location: hide for DOCTOR */}
              {!isDoctor && (
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
              )}
            </div>

            {/* Doctor specialty */}
            {isDoctor && (
              <div className="form-group">
                <label htmlFor="specialty">Specialty</label>
                <select
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                >
                  <option value="">(No change)</option>
                  {specialties.map(spec => (
                    <option
                      key={spec.specialty_id ?? spec.id}
                      value={spec.specialty_id ?? spec.id}
                    >
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nurse department */}
            {isNurse && (
              <div className="form-group">
                <label htmlFor="department">Department</label>
                {departments.length > 0 ? (
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">(No change)</option>
                    {departments.map(dep => (
                      <option
                        key={dep.id ?? dep.department_id ?? dep.name}
                        value={dep.name ?? dep.department_name ?? dep.id}
                      >
                        {dep.name ?? dep.department_name ?? dep.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                  />
                )}
              </div>
            )}

            {/* License: editable for DOCTOR + NURSE */}
            {(isDoctor || isNurse) && (
              <div className="form-group">
                <label htmlFor="licenseNumber">License Number</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder={isDoctor ? 'TXMD123456' : 'RN123456'}
                />
              </div>
            )}

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
