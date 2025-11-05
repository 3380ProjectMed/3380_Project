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
  Phone
} from 'lucide-react';
import './UserManagement.css';

function UserManagement() {
  const [activeTab, setActiveTab] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('doctor'); // 'doctor', 'nurse', 'patient', or 'receptionist'

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint;
      if (activeTab === 'doctors') {
        endpoint = '/admin_api/users/get-doctors.php';
      } else if (activeTab === 'nurses') {
        endpoint = '/admin_api/users/get-nurses.php';
      } else if (activeTab === 'patients') {
        endpoint = '/admin_api/users/get-patients.php';
      } else if (activeTab === 'receptionists') {
        endpoint = '/admin_api/users/get-receptionists.php';
      }
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (activeTab === 'doctors') {
          setDoctors(data.doctors || []);
        } else if (activeTab === 'nurses') {
          setNurses(data.nurses || []);
        } else if (activeTab === 'patients') {
          setPatients(data.patients || []);
        } else if (activeTab === 'receptionists') {
          setReceptionists(data.receptionists || []);
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

  const handleAddUser = (type) => {
    setModalType(type);
    setShowAddModal(true);
  };

  const getCurrentUsers = () => {
    if (activeTab === 'doctors') return doctors;
    if (activeTab === 'nurses') return nurses;
    if (activeTab === 'patients') return patients;
    if (activeTab === 'receptionists') return receptionists;
    return [];
  };

  const currentUsers = getCurrentUsers();
  
  const filteredUsers = currentUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const specialization = (user.specialization || '').toLowerCase();
    const department = (user.department || '').toLowerCase();
    const insuranceCompany = (user.insurance_company || '').toLowerCase();
    const workLocation = (user.work_location_name || '').toLowerCase();
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           specialization.includes(searchLower) ||
           department.includes(searchLower) ||
           insuranceCompany.includes(searchLower) ||
           workLocation.includes(searchLower);
  });

  const getAddButtonText = () => {
    if (activeTab === 'doctors') return 'Doctor';
    if (activeTab === 'nurses') return 'Nurse';
    if (activeTab === 'patients') return 'Patient';
    if (activeTab === 'receptionists') return 'Receptionist';
    return '';
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage doctors, nurses, receptionists, and patients in the system</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => handleAddUser(activeTab === 'doctors' ? 'doctor' : activeTab === 'nurses' ? 'nurse' : activeTab === 'receptionists' ? 'receptionist' : 'patient')}
        >
          <UserPlus size={20} />
          Add {getAddButtonText()}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          <Users size={20} />
          Doctors
        </button>
        <button
          className={`tab ${activeTab === 'nurses' ? 'active' : ''}`}
          onClick={() => setActiveTab('nurses')}
        >
          <Users size={20} />
          Nurses
        </button>
        <button
          className={`tab ${activeTab === 'receptionists' ? 'active' : ''}`}
          onClick={() => setActiveTab('receptionists')}
        >
          <Phone size={20} />
          Receptionists
        </button>
        <button
          className={`tab ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          <User size={20} />
          Patients
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
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
          <p>Loading {activeTab}...</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>SSN</th>
                  {activeTab === 'doctors' && <th>Specialization</th>}
                  {activeTab === 'nurses' && <th>Department</th>}
                  {activeTab === 'patients' && <th>DOB</th>}
                  {activeTab === 'patients' && <th>Insurance</th>}
                  {(activeTab === 'doctors' || activeTab === 'nurses' || activeTab === 'receptionists') && <th>License</th>}
                  {(activeTab === 'doctors' || activeTab === 'nurses' || activeTab === 'receptionists') && <th>Work Location</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="no-data">
                      {searchTerm ? `No ${activeTab} found matching "${searchTerm}"` : `No ${activeTab} found`}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.doctor_id || user.nurse_id || user.patient_id || user.staff_id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <span>{user.first_name} {user.last_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-with-icon">
                          <Mail size={16} />
                          {user.email || 'N/A'}
                        </div>
                      </td>
                      <td>{user.ssn || 'N/A'}</td>
                      
                      {activeTab === 'doctors' && (
                        <td>{user.specialization || 'N/A'}</td>
                      )}
                      
                      {activeTab === 'nurses' && (
                        <td>{user.department || 'N/A'}</td>
                      )}
                      
                      {activeTab === 'patients' && (
                        <>
                          <td>{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                          <td>{user.insurance_company || 'Self-Pay'}</td>
                        </>
                      )}
                      
                      {(activeTab === 'doctors' || activeTab === 'nurses' || activeTab === 'receptionists') && (
                        <>
                          <td>{user.license_number || 'N/A'}</td>
                          <td>{user.work_location_name || user.work_location || 'N/A'}</td>
                        </>
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
              <span className="stat-label">Total {activeTab}:</span>
              <span className="stat-value">{currentUsers.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active:</span>
              <span className="stat-value">
                {currentUsers.filter(u => u.is_active).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Inactive:</span>
              <span className="stat-value">
                {currentUsers.filter(u => !u.is_active).length}
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
    specialization: '',
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
        : type === 'receptionist'
        ? '/admin_api/users/add-receptionist.php'
        : '/admin_api/users/add-patient.php';

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

  // Show info message for patients
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
            <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
            <p>Patient registration is not available through admin portal.</p>
            <p>Patients must register through the patient registration page.</p>
            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '1rem' }}>
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