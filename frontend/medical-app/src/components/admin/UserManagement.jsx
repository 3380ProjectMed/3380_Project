import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  User,
  Phone,
  Filter
} from 'lucide-react';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('doctor');
  
  // Filter states
  const [filters, setFilters] = useState({
    role: 'all',
    activeStatus: 'all',
    workLocation: 'all',
    department: 'all'
  });
  
  // Filter options
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        role: filters.role,
        active_status: filters.activeStatus,
        work_location: filters.workLocation,
        department: filters.department
      });
      
      const response = await fetch(`/admin_api/users/get_user_accounts.php?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        if (data.filters) {
          setLocations(data.filters.locations || []);
          setDepartments(data.filters.departments || []);
        }
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleAddUser = (type) => {
    setModalType(type);
    setShowAddModal(true);
  };

  // Simplified filtering - only filter by name and email since backend handles other filters
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const specializationDept = (user.specialization_dept || '').toLowerCase();
    const workLocation = (user.work_location || '').toLowerCase();
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           specializationDept.includes(searchLower) ||
           workLocation.includes(searchLower);
  });

  const getRoleLabel = (userType) => {
    const labels = {
      'DOCTOR': 'Doctor',
      'doctor': 'Doctor',
      'NURSE': 'Nurse',
      'nurse': 'Nurse',
      'RECEPTIONIST': 'Receptionist',
      'receptionist': 'Receptionist',
      'PATIENT': 'Patient',
      'patient': 'Patient'
    };
    return labels[userType] || userType;
  };

  // Get initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return '??';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const clearFilters = () => {
    setFilters({
      role: 'all',
      activeStatus: 'all',
      workLocation: 'all',
      department: 'all'
    });
  };

  const hasActiveFilters = filters.role !== 'all' || 
                           filters.activeStatus !== 'all' || 
                           filters.workLocation !== 'all' || 
                           filters.department !== 'all';

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all users in the system</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => handleAddUser(filters.role !== 'all' && filters.role !== 'patient' ? filters.role : 'doctor')}
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <div className="filters-title">
            <Filter size={20} />
            <span>Filters</span>
          </div>
          {hasActiveFilters && (
            <button className="btn-text" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="roleFilter">Role</label>
            <select
              id="roleFilter"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="nurse">Nurses</option>
              <option value="receptionist">Receptionists</option>
              <option value="patient">Patients</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="activeFilter">Status</label>
            <select
              id="activeFilter"
              value={filters.activeStatus}
              onChange={(e) => handleFilterChange('activeStatus', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filters.role !== 'patient' && (
            <div className="filter-group">
              <label htmlFor="locationFilter">Work Location</label>
              <select
                id="locationFilter"
                value={filters.workLocation}
                onChange={(e) => handleFilterChange('workLocation', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                  <option key={loc.office_id} value={loc.office_id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(filters.role === 'nurse' || filters.role === 'all') && (
            <div className="filter-group">
              <label htmlFor="departmentFilter">Department</label>
              <select
                id="departmentFilter"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.department} value={dept.department}>
                    {dept.department}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <Loader className="spinner" size={40} />
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>SSN</th>
                  {filters.role === 'all' && <th>Specialization/Dept</th>}
                  {filters.role === 'doctor' && <th>Specialization</th>}
                  {filters.role === 'nurse' && <th>Department</th>}
                  {filters.role !== 'patient' && <th>Work Location</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="no-data">
                      {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={`${user.user_type}-${user.user_id}`}>
                      <td>
                        <span className={`role-badge ${user.user_type.toLowerCase()}`}>
                          {getRoleLabel(user.user_type)}
                        </span>
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-with-icon">
                          <Mail size={16} />
                          {user.email || 'N/A'}
                        </div>
                      </td>
                      <td>{user.ssn || 'N/A'}</td>
                      
                      {/* Specialization/Department column */}
                      {(filters.role === 'all' || filters.role === 'doctor' || filters.role === 'nurse') && (
                        <td>{user.specialization_dept || 'N/A'}</td>
                      )}
                      
                      {/* Work Location - not shown for patients */}
                      {filters.role !== 'patient' && (
                        <td>{user.work_location || 'N/A'}</td>
                      )}
                      
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon" title="View Details">
                          👁️
                        </button>
                        <button className="btn-icon" title="Edit">
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Total Users:</span>
              <span className="stat-value">{users.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Filtered Results:</span>
              <span className="stat-value">{filteredUsers.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active:</span>
              <span className="stat-value">
                {users.filter(u => u.is_active).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Inactive:</span>
              <span className="stat-value">
                {users.filter(u => !u.is_active).length}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          type={modalType}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

// Add User Modal Component
function AddUserModal({ type, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    ssn: '',
    gender: '1',
    phoneNumber: '',
    workLocation: '1',
    workSchedule: '1',
    licenseNumber: '',
    specialty: '',
    department: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const endpoint = type === 'doctor'
        ? '/admin_api/users/add-doctor.php'
        : type === 'nurse'
        ? '/admin_api/users/add-nurse.php'
        : '/admin_api/users/add-receptionist.php';

      const payload = {  
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        ssn: formData.ssn,
        gender: parseInt(formData.gender),
        phone_number: formData.phoneNumber,
        work_location: parseInt(formData.workLocation),
        work_schedule: parseInt(formData.workSchedule),
        license_number: formData.licenseNumber,
      };

      if (type === 'doctor') {
        payload.specialization = formData.specialization;
      } else if (type === 'nurse') {
        payload.department = formData.department;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show info message for patients - admin cannot add patients
  if (type === 'patient') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add Patient</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: '#f59e0b' }} />
            <h3 style={{ marginBottom: '1rem' }}>Patient Registration Restricted</h3>
            <p>Patient accounts cannot be created through the admin portal.</p>
            <p>Patients must register through the patient registration page.</p>
            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '1.5rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getModalTitle = () => {
    if (type === 'doctor') return 'Doctor';
    if (type === 'nurse') return 'Nurse';
    if (type === 'receptionist') return 'Receptionist';
    return '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New {getModalTitle()}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} />
            <h3>{getModalTitle()} added successfully!</h3>
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

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <small>Minimum 8 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ssn">SSN *</label>
                <input
                  type="text"
                  id="ssn"
                  name="ssn"
                  value={formData.ssn}
                  onChange={handleChange}
                  placeholder="123-45-6789"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="987-65-4321"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="workLocation">Work Location *</label>
                <select
                  id="workLocation"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Location 1</option>
                  <option value="2">Location 2</option>
                  <option value="3">Location 3</option>
                  <option value="4">Location 4</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="workSchedule">Work Schedule *</label>
                <select
                  id="workSchedule"
                  name="workSchedule"
                  value={formData.workSchedule}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Day Shift</option>
                  <option value="2">Night Shift</option>
                  <option value="3">Rotating</option>
                  <option value="4">Part-time</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="licenseNumber">License Number</label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="RN123456"
              />
            </div>

            {type === 'doctor' && (
              <div className="form-group">
                <label htmlFor="specialization">Specialization *</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Cardiology, Pediatrics"
                  required
                />
              </div>
            )}

            {type === 'nurse' && (
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Emergency">Emergency</option>
                  <option value="ICU">ICU</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Cardiology">Cardiology</option>
                </select>
              </div>
            )}

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
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add {getModalTitle()}
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

export default UserManagement;