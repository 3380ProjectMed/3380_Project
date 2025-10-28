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
    pcp = null,
    profileErrors = {}
  } = props;

  return (
    <div className="portal-content">
      <div className="profile-header">
        <h1 className="page-title">Profile</h1>
        {props.editingProfile ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                // reset all fields to last fetched profile values
                setFormData((fd) => ({
                  ...fd,
                  first_name: profile?.First_Name || '',
                  last_name: profile?.Last_Name || '',
                  dob: profile?.dob || '',
                  email: profile?.Email || '',
                  gender: profile?.Gender ?? fd.gender,
                  genderAtBirth: profile?.AssignedAtBirth_Gender ?? fd.genderAtBirth,
                  ethnicity: profile?.Ethnicity ?? fd.ethnicity,
                  race: profile?.Race ?? fd.race,
                }));
              }}
            >
              Reset
            </button>
            <button className="btn" onClick={() => (props.cancelEditProfile ? props.cancelEditProfile() : null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => (props.saveProfile ? props.saveProfile() : console.log('saveProfile not provided'))} disabled={Object.keys(profileErrors).length > 0}>
              Save Changes
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => (props.startEditProfile ? props.startEditProfile() : null)}>
            Edit Profile
          </button>
        )}
      </div>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="profile-grid">
          {/* Static read-only view when not editing */}
          {!props.editingProfile ? (
            <>
                <div className="profile-section">
                  <h2>Personal Information</h2>
                  <div className="static-field"><strong>First Name:</strong> {profile?.First_Name || '-'}</div>
                  <div className="static-field"><strong>Last Name:</strong> {profile?.Last_Name || '-'}</div>
                  <div className="static-field"><strong>Date of Birth:</strong> {profile?.dob || '-'}</div>
                  <div className="static-field"><strong>Email:</strong> {profile?.Email || '-'}</div>
                </div>

              <div className="profile-section">
                <h2>Demographics</h2>
                <div className="static-field"><strong>Gender:</strong> {profile?.Gender_Text || profile?.Gender || '-'}</div>
                <div className="static-field"><strong>Assigned at Birth:</strong> {profile?.AssignedAtBirth_Gender_Text || profile?.AssignedAtBirth_Gender || '-'}</div>
                <div className="static-field"><strong>Ethnicity:</strong> {profile?.Ethnicity_Text || profile?.Ethnicity || '-'}</div>
                <div className="static-field"><strong>Race:</strong> {profile?.Race_Text || profile?.Race || '-'}</div>
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

          {pcp && (
            <div className="profile-section full-width">
              <h2>Primary Care Physician</h2>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}