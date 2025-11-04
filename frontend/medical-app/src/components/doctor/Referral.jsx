import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { User, Stethoscope, FileText, Calendar, AlertCircle } from 'lucide-react';
import './Referral.css';

function Referral() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    patient_id: '', 
    patient_name: '', 
    specialist_doctor_staff_id: '', 
    reason: '' 
  });
  const [status, setStatus] = useState(null);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showPatientList, setShowPatientList] = useState(false);

  const filteredPatientResults = useMemo(() => {
    const q = (form.patient_name || '').trim().toLowerCase();
    if (!q) return [];
    return patients.filter(p => {
      const full = (p.name || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const numericId = String((p.Patient_ID || '').toString()).toLowerCase();
      return full.includes(q) || id.includes(q) || numericId === q || String(p.Patient_ID) === q;
    }).slice(0, 50);
  }, [form.patient_name, patients]);

  const apiBase = '/doctor_api/referrals';
  const auth = useAuth();

  // Load referrals that were received by the specialist (assigned to this doctor)
  const loadReceived = async (doctorId = null) => {
    setLoading(true);
    try {
      const qs = doctorId ? `?doctor_id=${encodeURIComponent(doctorId)}` : '';
      const res = await fetch(`${apiBase}/get-received.php${qs}`, { credentials: 'include' });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { json = null; }
      if (json && json.success && Array.isArray(json.referrals)) {
        setReferrals(json.referrals);
      } else {
        console.error('Unexpected response loading referrals', text);
        setReferrals([]);
      }
    } catch (err) {
      console.error('Failed to load referrals', err);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  // Load referrals for the current specialist once auth is ready
  useEffect(() => {
    if (auth.loading) return;
    const doctorId = auth.user?.doctor_id ?? null;
    loadReceived(doctorId);
  }, [auth.loading, auth.user]);

  // Load patients and doctors for the form
  useEffect(() => {
    const loadLists = async () => {
      try {
        if (auth.loading) return;
        const doctorId = auth.user?.doctor_id ?? null;
        if (!doctorId) return;
        const [pRes, dRes] = await Promise.all([
          fetch(`/doctor_api/patients/get-all.php?doctor_id=${doctorId}`, { credentials: 'include' }),
          fetch('/doctor_api/doctors/get-all.php', { credentials: 'include' })
        ]);

        const pText = await pRes.text();
        const dText = await dRes.text();
        let pJson = null; let dJson = null;
        try { pJson = JSON.parse(pText); } catch(e){ pJson = null; }
        try { dJson = JSON.parse(dText); } catch(e){ dJson = null; }

        if (pJson && pJson.success) setPatients(pJson.patients || []);
        if (dJson && dJson.success) setDoctors(dJson.doctors || []);
      } catch (err) {
        console.error('Failed to load patients or doctors', err);
      }
    };
    loadLists();
  }, [auth.loading, auth.user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Resolve patient_id from patient_name input
      let patientId = null;
      const match = (form.patient_name || '').match(/\(P(\d+)\)$/);
      if (match) {
        patientId = parseInt(match[1], 10);
      } else {
        const found = patients.find(p => `${p.name}`.toLowerCase() === (form.patient_name || '').toLowerCase());
        if (found) {
          const numericMatch = (found.id || '').match(/\d+/);
          patientId = numericMatch ? parseInt(numericMatch[0], 10) : null;
        }
      }

      if (!patientId) {
        setStatus({ type: 'error', text: 'Please select a valid patient from the list' });
        setTimeout(() => setStatus(null), 3000);
        return;
      }

      const payload = {
        patient_id: patientId,
        specialist_doctor_id: parseInt(form.specialist_doctor_staff_id, 10),
        reason: form.reason
      };

      const res = await fetch(`${apiBase}/create.php`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (parseErr) { json = null; }

      if (json && json.success) {
        setStatus({ type: 'success', text: 'Referral sent to specialist successfully!' });
        setForm({ patient_id: '', patient_name: '', specialist_doctor_staff_id: '', reason: '' });
        loadReceived(auth.user?.doctor_id ?? null);
      } else {
        const msg = (json && json.error) ? json.error : text || 'Failed to create referral';
        setStatus({ type: 'error', text: msg });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setStatus(null), 4000);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="referral-page">
      <h2 className="page-title">Referrals</h2>
      <div className="referral-grid">
        {/* ===== RECEIVED REFERRALS ===== */}
        <div className="referral-column">
          <h3>Received Referrals</h3>
          {loading ? (
            <div className="loading-state">Loading referrals...</div>
          ) : (
            <div className="referral-cards-list">
              {referrals.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>No referrals received yet</p>
                </div>
              ) : (
                referrals.map(r => (
                  <div key={r.referral_id || r.Referral_ID} className="received-referral-card">
                    {/* Card Header */}
                    <div className="referral-card-header">
                      <div className="referral-id-badge">
                        Referral #{r.referral_id || r.Referral_ID}
                      </div>
                      <div className="referral-date">
                        <Calendar size={14} />
                        {formatDate(r.date_of_approval || r.Date_of_approval)}
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="referral-section">
                      <div className="section-label">
                        <User size={16} />
                        <span>Patient</span>
                      </div>
                      <div className="section-content">
                        <strong>{r.patient_name}</strong>
                        <span className="text-muted">ID: {r.patient_id || r.Patient_ID}</span>
                      </div>
                    </div>

                    {/* Specialist Info */}
                    <div className="referral-section">
                      <div className="section-label">
                        <Stethoscope size={16} />
                        <span>Specialist</span>
                      </div>
                      <div className="section-content">
                        <strong>{r.specialist_name || 'Not specified'}</strong>
                        {r.specialty_name && (
                          <span className="specialty-badge">{r.specialty_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="referral-section">
                      <div className="section-label">
                        <AlertCircle size={16} />
                        <span>Reason for Referral</span>
                      </div>
                      <div className="section-content">
                        <p className="referral-reason-text">
                          {r.reason || r.Reason || 'No reason provided'}
                        </p>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ===== CREATE REFERRAL FORM ===== */}
        <div className="referral-column">
          <h3>Create Referral</h3>
          <form className="referral-form" onSubmit={handleCreate}>
            <label>Patient *
              <div className="patient-select">
                <input
                  type="text"
                  placeholder="Type patient name or ID"
                  value={form.patient_name}
                  onChange={e => { 
                    setForm({...form, patient_name: e.target.value, patient_id: ''}); 
                    setShowPatientList(true); 
                  }}
                  onFocus={() => setShowPatientList(true)}
                  onBlur={() => setTimeout(() => setShowPatientList(false), 200)}
                  required
                />
                {showPatientList && (form.patient_name || '').trim() !== '' && !form.patient_id && (
                  <div className="patient-list-dropdown open">
                    {filteredPatientResults.length === 0 ? (
                      <div className="patient-list-empty">No matching patients</div>
                    ) : (
                      filteredPatientResults.map(p => (
                        <div 
                          key={p.id} 
                          className="patient-list-item" 
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const numeric = parseInt((p.id || '').replace(/^P/i, ''), 10) || null;
                            setForm({ ...form, patient_name: `${p.name} (${p.id})`, patient_id: numeric });
                            setShowPatientList(false);
                          }}
                        >
                          <div className="patient-list-item-name">{p.name}</div>
                          <div className="patient-list-item-id">{p.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>

            <label>Specialist *
              <select 
                value={form.specialist_doctor_staff_id} 
                onChange={e => setForm({...form, specialist_doctor_staff_id: e.target.value})} 
                required
              >
                <option value="">-- Select specialist --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.specialty_name ? ` — ${d.specialty_name}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>Reason for Referral *
              <textarea 
                value={form.reason} 
                onChange={e => setForm({...form, reason: e.target.value})} 
                placeholder="Describe the reason for this referral..."
                rows="4"
                required 
              />
            </label>

            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" type="submit">
                Send Referral to Specialist
              </button>
            </div>
          </form>
          {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
        </div>
      </div>
    </div>
  );
}

export default Referral;