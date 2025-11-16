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
import UserDetails from './UserDetails';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('doctor');
  
  // Details modal state - MOVED INSIDE THE COMPONENT
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
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

  const handleAddUser = () => {
    // Pass 'all' if no filter is set, otherwise pass the filtered role
    const typeToAdd = filters.role !== 'all' ? filters.role : 'all';
    setModalType(typeToAdd);
    setShowAddModal(true);
  };

  // MOVED INSIDE THE COMPONENT
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Simplified filtering - only filter by name and email since backend handles other filters
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const specialtyDept = (user.specialty_dept || '').toLowerCase();
    const workLocation = (user.work_location || '').toLowerCase();
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           specialtyDept.includes(searchLower) ||
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

  const hasActiveFilters = filters.role !== 'all' || filters.activeStatus !== 'all' || filters.workLocation !== 'all' || filters.department !== 'all';
  
  const getColumnCount = () => {
    let count = 5;
    if (filters.role === 'all' || filters.role === 'doctor' || filters.role === 'nurse') {
      count += 1;
    }

    // Work Location column (not shown for patients)
    if (filters.role !== 'patient') {
      count += 1;
    }

    return count;
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all users in the system</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAddUser}
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
                    <td colSpan={getColumnCount()} className="no-data">
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
                      
                      {/* Specialization/Department column */}
                      {(filters.role === 'all' || filters.role === 'doctor' || filters.role === 'nurse') && (
                        <td>{user.specialty_dept || 'N/A'}</td>
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
                        <button 
                          className="btn-icon" 
                          title="View Details"
                          onClick={() => handleViewDetails(user)}
                        >
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

      {/* Add User Modal - OUTSIDE the table */}
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

      {/* User Details Modal - MOVED HERE, OUTSIDE the table */}
      {showDetailsModal && selectedUser && (
        <UserDetails
          userId={selectedUser.user_id}
          userType={selectedUser.user_type}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function AddUserModal({ type, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState(type === 'all' ? 'doctor' : type);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    ssn: '',
    gender: '1',
    phoneNumber: '',
    workLocation: '',
    workSchedule: '', // Keep this for nurses and receptionists
    licenseNumber: '',
    specialty: '',
    department: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Dynamic options from database
  const [workLocations, setWorkLocations] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Load work locations on mount
  useEffect(() => {
    loadFormOptions();
  }, []);

  // Load schedules when office changes (for nurses and receptionists)
  useEffect(() => {
    if (formData.workLocation && (selectedRole === 'nurse' || selectedRole === 'receptionist')) {
      loadScheduleOptions(formData.workLocation);
    }
  }, [formData.workLocation, selectedRole]);

  const loadFormOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await fetch('/admin_api/users/get_form_options.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setWorkLocations(data.work_locations || []);
        
        // Set default work location to first option for nurses/receptionists only
        if (data.work_locations && data.work_locations.length > 0 && (selectedRole === 'nurse' || selectedRole === 'receptionist')) {
          setFormData(prev => ({ ...prev, workLocation: data.work_locations[0].office_id.toString() }));
        }
      } else {
        setError(data.error || 'Failed to load form options');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading form options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadScheduleOptions = async (officeId) => {
    setLoadingSchedules(true);
    try {
      const response = await fetch(`/admin_api/users/get_form_options.php?office_id=${officeId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setWorkSchedules(data.work_schedules || []);
        
        // Set default schedule to first option
        if (data.work_schedules && data.work_schedules.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            workSchedule: `${data.work_schedules[0].office_id}-${data.work_schedules[0].start_time}-${data.work_schedules[0].end_time}`
          }));
        }
      } else {
        setError(data.error || 'Failed to load schedule options');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading schedule options:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Format SSN as 000-00-0000
  const formatSSN = (value) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  // Format phone number as 000-000-0000
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const endpoint = selectedRole === 'doctor'
        ? '/admin_api/users/add-doctor.php'
        : selectedRole === 'nurse'
        ? '/admin_api/users/add-nurse.php'
        : '/admin_api/users/add-receptionist.php';

      const payload = {  
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        ssn: formData.ssn.replace(/\D/g, ''),
        gender: parseInt(formData.gender),
        phone_number: formData.phoneNumber.replace(/\D/g, ''),
        license_number: formData.licenseNumber,
      };

      // Only add work_location for nurses and receptionists
      if (selectedRole === 'nurse' || selectedRole === 'receptionist') {
        payload.work_location = parseInt(formData.workLocation);
      }

      if (selectedRole === 'doctor') {
        payload.specialty = formData.specialty;
      } else if (selectedRole === 'nurse') {
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
    
    let formattedValue = value;
    
    // Apply formatting for specific fields
    if (name === 'ssn') {
      formattedValue = formatSSN(value);
    } else if (name === 'phoneNumber') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const getModalTitle = () => {
    if (selectedRole === 'doctor') return 'Doctor';
    if (selectedRole === 'nurse') return 'Nurse';
    if (selectedRole === 'receptionist') return 'Receptionist';
    return '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New {type === 'all' ? 'User' : getModalTitle()}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} />
            <h3>{getModalTitle()} added successfully!</h3>
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

            {/* Role selector - only show when type is 'all' */}
            {type === 'all' && (
              <div className="form-group">
                <label htmlFor="roleSelect">Role *</label>
                <select
                  id="roleSelect"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                </select>
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
                  placeholder="000-00-0000"
                  maxLength={11}
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
                placeholder="000-000-0000"
                maxLength={12}
              />
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

            {/* For Doctors - Only specialty, NO work location */}
            {selectedRole === 'doctor' && (
              <div className="form-group">
                <label htmlFor="specialty">Specialty</label>
                <input
                  type="text"
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="e.g., Cardiology"
                />
              </div>
            )}

            {/* For Nurses and Receptionists - Work location and schedule (full width) */}
            {(selectedRole === 'nurse' || selectedRole === 'receptionist') && (
              <>
                <div className="form-group">
                  <label htmlFor="workLocation">Work Location *</label>
                  <select
                    id="workLocation"
                    name="workLocation"
                    value={formData.workLocation}
                    onChange={handleChange}
                    required
                  >
                    {workLocations.length === 0 ? (
                      <option value="">No locations available</option>
                    ) : (
                      workLocations.map(location => (
                        <option key={location.office_id} value={location.office_id}>
                          {location.name} - {location.address}
                        </option>
                      ))
                    )}
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
                    disabled={loadingSchedules}
                  >
                    {loadingSchedules ? (
                      <option value="">Loading schedules...</option>
                    ) : workSchedules.length === 0 ? (
                      <option value="">No schedules available for this location</option>
                    ) : (
                      workSchedules.map((schedule, index) => (
                        <option 
                          key={`${schedule.office_id}-${schedule.start_time}-${schedule.end_time}`} 
                          value={`${schedule.office_id}-${schedule.start_time}-${schedule.end_time}`}
                        >
                          {schedule.schedule_label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedRole === 'nurse' && (
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Emergency"
                    />
                  </div>
                )}
              </>
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