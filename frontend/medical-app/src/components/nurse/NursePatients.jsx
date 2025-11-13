import React, { useEffect, useState, useMemo } from "react";
import { Search, X, AlertCircle } from 'lucide-react';
import "./NursePatients.css";
import { getNursePatients, saveNurseVitals } from '../../api/nurse';

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
  const [appointmentId, setAppointmentId] = useState('');
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', spo2: '', height: '', weight: '' });
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
    setAppointmentId('');
    setVitals({ bp: '', hr: '', temp: '', spo2: '', height: '', weight: '' });
    setVitalsError(null);
    setVitalsSuccess(null);
    setShowVitalsModal(true);
  }

  function closeVitalsModal() {
    setShowVitalsModal(false);
    setSelectedPatient(null);
    setAppointmentId('');
    setVitalsError(null);
    setVitalsSuccess(null);
  }

  async function handleSaveVitals(e) {
    e.preventDefault();
    setVitalsError(null);
    setVitalsSuccess(null);
    if (!appointmentId) {
      setVitalsError('Appointment ID is required to save vitals.');
      return;
    }
    setSavingVitals(true);
    try {
      await saveNurseVitals(appointmentId, vitals);
      setVitalsSuccess('Vitals saved successfully.');
    } catch (err) {
      setVitalsError(err?.message || 'Failed to save vitals.');
    } finally {
      setSavingVitals(false);
    }
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
          <div className="nurse-modal-backdrop">
            <div className="nurse-modal" role="dialog" aria-modal="true">
              <h2>Edit Vitals – {selectedPatient.first_name} {selectedPatient.last_name} (ID: {selectedPatient.patient_id})</h2>
              {vitalsError && <div className="alert error" style={{ marginTop: 8 }}>{vitalsError}</div>}
              {vitalsSuccess && <div className="alert success" style={{ marginTop: 8 }}>{vitalsSuccess}</div>}
              <form className="vitals-form" onSubmit={handleSaveVitals}>
                <label>
                  Appointment ID
                  <input type="text" value={appointmentId} onChange={e => setAppointmentId(e.target.value)} />
                </label>
                <div className="vitals-grid">
                  <label>
                    BP
                    <input value={vitals.bp} onChange={e => setVitals({ ...vitals, bp: e.target.value })} />
                  </label>
                  <label>
                    HR
                    <input value={vitals.hr} onChange={e => setVitals({ ...vitals, hr: e.target.value })} />
                  </label>
                  <label>
                    Temp
                    <input value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} />
                  </label>
                  <label>
                    SpO2
                    <input value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} />
                  </label>
                  <label>
                    Weight
                    <input value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} />
                  </label>
                  <label>
                    Height
                    <input value={vitals.height} onChange={e => setVitals({ ...vitals, height: e.target.value })} />
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={closeVitalsModal} disabled={savingVitals}>Cancel</button>
                  <button type="submit" className="primary" disabled={savingVitals}>
                    {savingVitals ? 'Saving...' : 'Save Vitals'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}