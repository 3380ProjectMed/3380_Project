import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Search, X, Calendar, Mail, AlertCircle, FileText } from 'lucide-react';
import './PatientList.css';

/**
 * PatientList Component
 * @param {Function} onPatientClick 
 * @param {Object} selectedPatient 
 * @param {Function} setSelectedPatient
 * @param {Function} setCurrentPage 
 */
function PatientList({ onPatientClick, selectedPatient: externalSelectedPatient, setSelectedPatient: externalSetSelectedPatient, setCurrentPage }) {
  const auth = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedPatient, setLocalSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);


  const selectedPatient = externalSelectedPatient || localSelectedPatient;
  const setSelectedPatient = externalSetSelectedPatient || setLocalSelectedPatient;


  const filteredPatients = useMemo(() => {
    const source = patients || [];
    if (!searchTerm.trim()) return source;

    const searchLower = searchTerm.toLowerCase();
    return source.filter(patient =>
      (patient.name && patient.name.toLowerCase().includes(searchLower)) ||
      (patient.id && patient.id.toLowerCase().includes(searchLower))
    );
  }, [searchTerm, patients]);


  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const staffId = auth.user.user_id; 
      const response = await fetch(`/doctor_api/patients/get-all.php?staff_id=${staffId}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.patients || []);
      } else {
        setError(data.error || data.message || 'Failed to load patients');
      }
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.loading) return;

    if (!auth.user || auth.user.role !== 'DOCTOR') {
      setError('Doctor access required.');
      setLoading(false);
      return;
    }

    loadPatients();
  }, [auth.user, auth.loading]);


  const handleSearchKeyPress = async (e) => {
    if (e.key !== 'Enter') return;
    const q = searchTerm.trim();
    if (!q) return;

    const isId = /^P?\d+$/i.test(q);
    if (isId) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/doctor_api/patients/get-by-id.php?id=${encodeURIComponent(q)}`, { credentials: 'include' });
        const payload = await res.json();
        if (payload.success) {
          setPatients([payload.patient]);
          setSelectedPatient(payload.patient);
        } else {
          setError(payload.error || 'Patient not found');
        }
      } catch (err) {
        console.error('Error fetching patient by id', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePatientClick = async (patient) => {
    const hasDetails = patient && (Array.isArray(patient.medicalHistory) || patient.notes || patient.currentMedications);
    if (hasDetails) {
      setSelectedPatient(patient);
      if (onPatientClick) onPatientClick(patient);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const numericId = patient.patient_id || parseInt((patient.id || '').replace(/\D/g, ''), 10) || 0;

      if (numericId > 0) {
        const res = await fetch(`/doctor_api/clinical/get-patient-details.php?patient_id=${numericId}`, { credentials: 'include' });
        const payload = await res.json();
        if (payload.success && payload.patient) {
        // Merge the lightweight row data we already have with the enriched details returned by the clinical endpoint
        const p = payload.patient;
        const visit = payload.visit || {};
        const formattedId = 'P' + String(p.id || numericId).padStart(3, '0');
        const merged = {
          // keep existing values but prefer backend details
          id: formattedId,
          patient_id: numericId, // Add numeric ID for navigation
          name: p.name || patient.name,
          dob: p.dob || patient.dob,
          age: p.age || patient.age,
          bloodType: p.blood_type || patient.bloodType || patient.bloodType,
          email: patient.email || '',
          gender: p.gender || patient.gender || 'Not Specified',
          allergies: p.allergies || patient.allergies || 'No Known Allergies',
          medicalHistory: p.medicalHistory || [],
          medicationHistory: p.medicationHistory || [],
          chronicConditions: p.chronicConditions || [],
          currentMedications: p.currentMedications || [],
          lastVisit: patient.lastVisit || (visit.date || ''),
          nextAppointment: patient.nextAppointment || null,
          notes: payload.visit?.present_illnesses || patient.notes || ''
        };

        setSelectedPatient(merged);
        if (onPatientClick) onPatientClick(merged);
          } else {
           
          }
      } else {

        const fallback = await fetch(`/doctor_api/patients/get-by-id.php?id=${encodeURIComponent(patient.id || '')}`, { credentials: 'include' });
        const fbPayload = await fallback.json();
        if (fbPayload.success && fbPayload.patient) {

          const derivedNumericId = parseInt((patient.id || '').replace(/\D/g, ''), 10) || 0;
          fbPayload.patient.patient_id = fbPayload.patient.patient_id || derivedNumericId;
          setSelectedPatient(fbPayload.patient);
          if (onPatientClick) onPatientClick(fbPayload.patient);
        } else {
          setError(fbPayload.error || 'Failed to load patient details');
        }
      }
    } catch (err) {
      console.error('Error loading patient details', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullChart = () => {
    if (!selectedPatient) return;
    
    if (setCurrentPage && onPatientClick) {
      onPatientClick(selectedPatient);
      setCurrentPage('clinical');
    } else {
      console.log('View Full Chart clicked for patient:', selectedPatient);
      alert('Clinical workspace navigation not configured. Please ensure setCurrentPage is passed as a prop.');
    }
  };


  const handleCloseSidebar = () => {
    setSelectedPatient(null);
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    if (isNaN(Date.parse(dateString))) return dateString;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="patient-list">
      <h1 className="patient-list__title">My Patients</h1>

      <div className="patient-list__search">
        <Search className="patient-list__search-icon" />
        <input
          type="text"
          className="patient-list__search-input"
          placeholder="Search patients by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          aria-label="Search patients"
        />
        {searchTerm && (
          <button
            className="patient-list__search-clear"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading && (
        <div className="patient-list__loading">Loading patients...</div>
      )}

      {error && (
        <div className="patient-list__error">
          Error: {error}
          <button 
            onClick={() => { 
              setError(null); 
              setSearchTerm(''); 
              loadPatients(); 
            }} 
            style={{ marginLeft: '8px'}}
          >
            Reload
          </button>
        </div>
      )}

      <div className="patient-list__table-container">
        {/* Table Header */}
        <div className="table-header">
          <div>ID</div>
          <div>Name</div>
          <div>Date of Birth</div>
          <div>Allergies</div>
        </div>
        
        {/* Table Body */}
        <div className="table-body">
          {filteredPatients.length === 0 ? (
            <div className="patient-list__empty">
              <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No patients found matching "{searchTerm}"</p>
              <button 
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredPatients.map(patient => (
              <div 
                key={patient.id}
                className={`table-row ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                onClick={() => handlePatientClick(patient)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handlePatientClick(patient);
                }}
              >
                <div className="patient-list__id">{patient.id}</div>
                <div className="patient-list__name">{patient.name}</div>
                <div className="patient-list__dob">{patient.dob}</div>
                <div className={`patient-list__allergies ${
                  patient.allergies === 'None' || patient.allergies === 'No Known Allergies'
                    ? 'patient-list__allergies--none' 
                    : 'patient-list__allergies--has'
                }`}>
                  {patient.allergies === 'None' || patient.allergies === 'No Known Allergies' ? (
                    <span>✓ None</span>
                  ) : (
                    <span>
                      <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {patient.allergies}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPatient && (
        <div className="patient-summary">
          <div className="patient-summary__header">
            <h2 className="patient-summary__title">Patient Details</h2>
            <button 
              className="patient-summary__close"
              onClick={handleCloseSidebar}
              aria-label="Close patient details"
            >
              <X size={24} />
            </button>
          </div>

          <div className="patient-summary__content">
            <div className="patient-summary__section">
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Patient ID:</span>
                <span>{selectedPatient.id}</span>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Full Name:</span>
                <span>{selectedPatient.name}</span>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Date of Birth:</span>
                <span>{formatDate(selectedPatient.dob)} ({selectedPatient.age} years old)</span>
              </div>
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Blood Type:</span>
                <span>{selectedPatient.bloodType}</span>
              </div>
            </div>

            <h3 className="patient-summary__section-title">
              <Mail size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Contact Information
            </h3>
            <div className="patient-summary__section">
              <div className="patient-summary__field">
                <span className="patient-summary__field-label">Email:</span>
                <a href={`mailto:${selectedPatient.email}`} className="patient-summary__link">
                  {selectedPatient.email}
                </a>
              </div>
            </div>

            <h3 className="patient-summary__section-title">
              <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Allergies
            </h3>
            <div className="patient-summary__allergies-box">
              {selectedPatient.allergies === 'None' || selectedPatient.allergies === 'No Known Allergies' ? (
                <p className="patient-summary__allergies--none">No known allergies</p>
              ) : (
                <p className="patient-summary__allergies--has">
                  <strong>⚠️ {selectedPatient.allergies}</strong>
                </p>
              )}
            </div>

            {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0 && (
              <>
                <h3 className="patient-summary__section-title">
                  <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Chronic Conditions
                </h3>
                <div className="patient-summary__medical-history">
                  {selectedPatient.chronicConditions.map((condition, index) => (
                    <span key={index} className="medical-history-tag">
                      {condition}
                    </span>
                  ))}
                </div>
              </>
            )}

            {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 && (
              <>
                <h3 className="patient-summary__section-title">
                  <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Current Medications
                </h3>
                <div className="patient-summary__medications">
                  {selectedPatient.currentMedications.map((med, index) => (
                    <div key={index} className="medication-item">
                      <strong>{med.name}</strong>
                      {med.frequency && <span> - {med.frequency}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
              <>
                <h3 className="patient-summary__section-title">
                  <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Medical History
                </h3>
                <div className="patient-summary__medical-history">
                  {selectedPatient.medicalHistory.map((item, index) => (
                    <div key={index} className="history-item">
                      {typeof item === 'string' ? item : (
                        <>
                          <strong>{item.condition}</strong>
                          {item.diagnosis_date && <span> - {formatDate(item.diagnosis_date)}</span>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <h3 className="patient-summary__section-title">
              <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Recent Activity
            </h3>
            
            <div className="patient-summary__visit">
              <div className="patient-summary__visit-header">
                <span className="patient-summary__visit-label">Last Visit</span>
                <span className="patient-summary__visit-date">{formatDate(selectedPatient.lastVisit)}</span>
              </div>
              {selectedPatient.notes && (
                <p className="patient-summary__note">{selectedPatient.notes}</p>
              )}
            </div>
            
            <div className="patient-summary__visit patient-summary__visit--upcoming">
              <div className="patient-summary__visit-header">
                <span className="patient-summary__visit-label">Next Appointment</span>
                <span className="patient-summary__visit-date">{formatDate(selectedPatient.nextAppointment)}</span>
              </div>
            </div>

            <div className="patient-summary__actions">
              <button 
                className="btn-action btn-primary"
                onClick={handleViewFullChart}
              >
                <FileText size={18} />
                View Full Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;