import React from 'react';
import { Stethoscope, MapPin, Phone, Mail } from 'lucide-react';
import './Profile.css';

export default function Profile(props) {
  const {
    loading,
    profile = null,
    formData,
    setFormData,
    genderOptions = [],
    genderAtBirthOptions = [],
    ethnicityOptions = [],
    raceOptions = [],
    doctors = [],
    pcp = null,
    profileErrors = {},
    editingProfile = false,
    startEditProfile,
    cancelEditProfile,
    saveProfile
  } = props;

  return (
    <div className="portal-content">
      <div className="profile-header">
        <h1 className="page-title">Profile</h1>
        {editingProfile ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                // reset all fields to last fetched profile values
                setFormData((fd) => ({
                  ...fd,
                  first_name: profile?.first_name || '',
                  last_name: profile?.last_name || '',
                  dob: profile?.dob || '',
                  email: profile?.email || '',
                  emergency_contact: profile?.emergency_contact || '',
                  emergency_contact_first_name: profile?.emergency_contact_first_name || '',
                  emergency_contact_last_name: profile?.emergency_contact_last_name || '',
                  emergency_contact_relationship: profile?.emergency_contact_relationship || '',
                  primary_doctor: profile?.pcp_id || '',
                  gender: profile?.gender ?? fd.gender,
                  genderAtBirth: profile?.assigned_at_birth_gender ?? fd.genderAtBirth,
                  ethnicity: profile?.ethnicity ?? fd.ethnicity,
                  race: profile?.race ?? fd.race,
                }));
              }}
            >
              Reset
            </button>
            <button className="btn" onClick={() => (cancelEditProfile ? cancelEditProfile() : null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => (saveProfile ? saveProfile() : console.log('saveProfile not provided'))} disabled={Object.keys(profileErrors).length > 0}>
              Save Changes
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => (startEditProfile ? startEditProfile() : null)}>
            Edit Profile
          </button>
        )}
      </div>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="profile-grid">
          {/* Static read-only view when not editing */}
          {!editingProfile ? (
            <>
                <div className="profile-section">
                  <h2>Personal Information</h2>
                  <div className="static-field"><strong>First Name:</strong> {profile?.first_name || '-'}</div>
                  <div className="static-field"><strong>Last Name:</strong> {profile?.last_name || '-'}</div>
                  <div className="static-field"><strong>Date of Birth:</strong> {profile?.dob || '-'}</div>
                  <div className="static-field"><strong>Email:</strong> {profile?.email || '-'}</div>
                </div>

              <div className="profile-section">
                <h2>Demographics</h2>
                <div className="static-field"><strong>Gender:</strong> {profile?.Gender_Text || profile?.gender || '-'}</div>
                <div className="static-field"><strong>Assigned at Birth:</strong> {profile?.AssignedAtBirth_Gender_Text || profile?.assigned_at_birth_gender || '-'}</div>
                <div className="static-field"><strong>Ethnicity:</strong> {profile?.Ethnicity_Text || profile?.ethnicity || '-'}</div>
                <div className="static-field"><strong>Race:</strong> {profile?.Race_Text || profile?.race || '-'}</div>
              </div>
            </>
          ) : (
            /* Edit mode: render the existing editable form */
            <>
              <div className="profile-section">
                <h2>Personal Information</h2>

                <div className="form-group two-up">
                  <div>
                    <label>First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                    {profileErrors.first_name && <div className="form-error">{profileErrors.first_name}</div>}
                  </div>

                  <div>
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                    {profileErrors.last_name && <div className="form-error">{profileErrors.last_name}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                  {profileErrors.dob && <div className="form-error">{profileErrors.dob}</div>}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {profileErrors.email && <div className="form-error">{profileErrors.email}</div>}
                </div>
              </div>

              <div className="profile-section">
                <h2>Demographics</h2>

                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="">Select gender</option>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Gender Assigned at Birth</label>
                  <select className="form-input" value={formData.genderAtBirth} onChange={(e) => setFormData({ ...formData, genderAtBirth: e.target.value })}>
                    <option value="">Select assigned gender</option>
                    {genderAtBirthOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ethnicity</label>
                  <select className="form-input" value={formData.ethnicity} onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}>
                    <option value="">Select ethnicity</option>
                    {ethnicityOptions.map((eOpt) => (
                      <option key={eOpt} value={eOpt}>{eOpt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Race</label>
                  <select className="form-input" value={formData.race} onChange={(e) => setFormData({ ...formData, race: e.target.value })}>
                    <option value="">Select race</option>
                    {raceOptions.map((rOpt) => (
                      <option key={rOpt} value={rOpt}>{rOpt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Emergency Contact Section */}
          <div className="profile-section full-width">
            <h2>Emergency Contact</h2>
            {!editingProfile ? (
              <>
                {profile?.emergency_contact_first_name && (
                  <div className="static-field"><strong>Name:</strong> {profile.emergency_contact_first_name} {profile.emergency_contact_last_name}</div>
                )}
                <div className="static-field"><strong>Phone Number:</strong> {profile?.emergency_contact || 'Not provided'}</div>
                {profile?.emergency_contact_relationship && (
                  <div className="static-field"><strong>Relationship:</strong> {profile.emergency_contact_relationship}</div>
                )}
              </>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Emergency contact first name"
                    value={formData.emergency_contact_first_name || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_first_name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Emergency contact last name"
                    value={formData.emergency_contact_last_name || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_last_name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Emergency contact phone number"
                    value={formData.emergency_contact || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Relationship (e.g., Spouse, Parent, Friend)"
                    value={formData.emergency_contact_relationship || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Primary Care Physician Section */}
          <div className="profile-section full-width">
            <h2>Primary Care Physician</h2>
            {!editingProfile ? (
              pcp && (
                <div className="pcp-card">
                  <div className="pcp-avatar large"><Stethoscope /></div>
                  <div className="pcp-details">
                    <h3>{pcp.pcp_name || pcp.name}</h3>
                    <p><strong>Specialty:</strong> {pcp.pcp_specialty || pcp.specialty_name}</p>
                    <p><MapPin className="small-icon" /> {pcp.pcp_office || pcp.office_name}</p>
                    <p><Phone className="small-icon" /> {pcp.pcp_phone || pcp.Phone}</p>
                    <p><Mail className="small-icon" /> {pcp.pcp_email || pcp.Email}</p>
                  </div>
                </div>
              )
            ) : (
              <div className="form-group">
                <label>Select Primary Care Physician</label>
                <select 
                  className="form-input" 
                  value={formData.primary_doctor} 
                  onChange={(e) => setFormData({ ...formData, primary_doctor: e.target.value })}
                >
                  <option value="">Select a Primary Care Physician</option>
                  {doctors.filter(doctor => doctor.specialty_name === 'Internal Medicine').map((doctor) => (
                    <option key={doctor.doctor_id} value={doctor.doctor_id}>
                      {doctor.name} - {doctor.specialty_name} ({doctor.office_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}