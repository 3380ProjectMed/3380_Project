import React, { useEffect, useState, useMemo } from "react";
import { Search, X, AlertCircle } from 'lucide-react';
import "./NursePatients.css";
import { getNursePatients, saveNurseVitals, getAppointmentsForPatient, createOrGetNurseVisit } from '../../api/nurse';
import NurseVitalsModal from './NurseVitalsModal';

export default function NursePatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 10;

  // Vitals modal state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [appointmentOptions, setAppointmentOptions] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [vitals, setVitals] = useState({ bp: '', temp: '' });
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState(null);
  const [vitalsSuccess, setVitalsSuccess] = useState(null);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
  // The nurse API returns { items, total }
  const data = await getNursePatients(search, page, pageSize);
  const patientList = data?.items || [];
  setPatients(Array.isArray(patientList) ? patientList : []);
  setTotal(Number(data?.total ?? patientList.length));
    } catch (e) {
      setError(e.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line
  }, [page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  function openVitalsModal(patient) {
    setSelectedPatient(patient);
    setAppointmentId(null);
    setAppointmentOptions([]);
    setSelectedAppointment(null);
    setVitals({ bp: '', temp: '' });
    setVitalsError(null);
    setVitalsSuccess(null);
    setShowVitalsModal(true);
  }

  // when modal opens, fetch appointments for that patient
  React.useEffect(() => {
    if (showVitalsModal && selectedPatient) {
      fetchAppointmentsForPatient(selectedPatient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVitalsModal, selectedPatient]);

  function closeVitalsModal() {
    setShowVitalsModal(false);
    setSelectedPatient(null);
    setAppointmentId('');
    setVitalsError(null);
    setVitalsSuccess(null);
  }

  // New flow: fetch appointments for patient (today/upcoming) when opening modal
  async function fetchAppointmentsForPatient(patient) {
    try {
      setLoading(true);
      const appts = await getAppointmentsForPatient(patient.patient_id, 'today');
      setAppointmentOptions(appts || []);
      if (!appts || appts.length === 0) {
        setVitalsError('This patient has no appointments today. Please schedule an appointment before recording vitals.');
        return;
      }
      if (appts.length === 1) {
        // auto-select
        const a = appts[0];
        setSelectedAppointment(a);
        setAppointmentId(a.Appointment_id || a.appointment_id);
        // create or get visit and open modal with any existing vitals
        const v = await createOrGetNurseVisit(a.Appointment_id || a.appointment_id);
        const existing = v?.existingVitals || {};
        setVitals({ bp: existing.blood_pressure || '', temp: existing.temperature || '' });
      } else {
        // multiple appointments, show selector UI (we keep modal open)
        setVitalsError(null);
      }
    } catch (e) {
      setVitalsError(e?.message || 'Failed to fetch appointments for patient');
    } finally {
      setLoading(false);
    }
  }

  // Called when nurse picks one appointment from list
  async function pickAppointmentAndOpen(a) {
    setSelectedAppointment(a);
    const apptId = a.Appointment_id || a.appointment_id;
    setAppointmentId(apptId);
    try {
      setSavingVitals(true);
      const v = await createOrGetNurseVisit(apptId);
      const existing = v?.existingVitals || {};
      setVitals({ bp: existing.blood_pressure || '', temp: existing.temperature || '' });
      setVitalsError(null);
    } catch (e) {
      setVitalsError(e?.message || 'Failed to create or get visit');
    } finally {
      setSavingVitals(false);
    }
  }

  async function handleSaveVitalsFromModal(data) {
    // data contains updated vitals; show success
    setVitalsSuccess('Vitals saved successfully.');
    // Optionally refresh patient list or other UI
    loadPatients();
  }

  return (
    <div className="nurse-page">
      <div className="nurse-patients-page">
        <h1>My Patients</h1>

        <div className="patient-list__search">
          <Search className="patient-list__search-icon" />
          <input
            type="text"
            className="patient-list__search-input"
            placeholder="Search patients by name or ID..."
            value={search}
            onChange={handleSearch}
            aria-label="Search patients"
          />
          {search && (
            <button
              className="patient-list__search-clear"
              onClick={() => setSearch('')}
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
              onClick={() => { setError(null); setSearch(''); loadPatients(); }} 
              style={{ marginLeft: '8px'}}
            >
              Reload
            </button>
          </div>
        )}

        <div className="patient-list__table-container">
          <div className="table-header">
            <div>ID</div>
            <div>Name</div>
            <div>Date of Birth</div>
            <div>Allergies</div>
          </div>
          <div className="table-body">
            {patients.length === 0 && !loading ? (
              <div className="patient-list__empty">
                <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No patients found matching "{search}"</p>
                <button 
                  className="btn-clear-search"
                  onClick={() => setSearch('')}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              patients.map((p) => (
                <div key={p.patient_id || p.id} className="table-row" onClick={() => openVitalsModal(p)} style={{ cursor: 'pointer' }}>
                  <div>{p.patient_id || p.id}</div>
                  <div>{p.first_name || ''} {p.last_name || ''}</div>
                  <div>{p.dob ? new Date(p.dob).toLocaleDateString() : 'N/A'}</div>
                  <div className={`patient-list__allergies ${!p.allergies || p.allergies === 'None' || p.allergies === 'No Known Allergies' ? 'patient-list__allergies--none' : 'patient-list__allergies--has'}`}>
                    {!p.allergies || p.allergies === 'None' || p.allergies === 'No Known Allergies' ? (
                      <span>✓ None</span>
                    ) : (
                      <span><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />{p.allergies}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            Prev
          </button>
          <span>Page {page} — {total} results</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total || loading}>
            Next
          </button>
        </div>
        {/* Vitals modal */}
        {showVitalsModal && selectedPatient && (
          <div>
            { /* If there are multiple appointments and none selected yet, show a small picker */ }
            {(!selectedAppointment && Array.isArray(appointmentOptions) && appointmentOptions.length > 1) && (
              <div className="nurse-modal-backdrop">
                <div className="nurse-modal" role="dialog" aria-modal="true">
                  <h2>Select Appointment — {selectedPatient.first_name} {selectedPatient.last_name}</h2>
                  {vitalsError && <div className="alert error" style={{ marginTop: 8 }}>{vitalsError}</div>}
                  <div style={{ marginTop: 12 }}>
                    {appointmentOptions.map(a => (
                      <div key={a.Appointment_id || a.appointment_id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                        <div><strong>{new Date(a.Appointment_date).toLocaleString()}</strong> — {a.Status || a.status}</div>
                        <div style={{ color: '#666' }}>{a.office_name || a.office_address || ''}</div>
                        <div style={{ marginTop: 6 }}>
                          <button onClick={() => pickAppointmentAndOpen(a)}>Use this appointment</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 12 }}>
                      <button onClick={closeVitalsModal}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            { /* If one appointment auto-selected or nurse picked one, render full vitals modal component */ }
            {(selectedAppointment || (appointmentOptions && appointmentOptions.length === 1)) && (
              <NurseVitalsModal
                patient={selectedPatient}
                appointment={selectedAppointment || (appointmentOptions && appointmentOptions[0])}
                appointmentId={appointmentId}
                visitId={null}
                initialVitals={vitals}
                onClose={closeVitalsModal}
                onSaved={handleSaveVitalsFromModal}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}