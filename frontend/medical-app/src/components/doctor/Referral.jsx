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
    specialist_doctor_id: '', 
    reason: '' 
  });
  const [status, setStatus] = useState(null);

  const [patients, setPatients] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [showPatientList, setShowPatientList] = useState(false);

  // Filtered patient autocomplete results
  const filteredPatientResults = useMemo(() => {
    const q = (form.patient_name || '').trim().toLowerCase();
    if (!q) return [];
    return patients.filter(p => {
      const full = (p.name || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      return full.includes(q) || id.includes(q);
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

  // Load patients and specialists for the form
  useEffect(() => {
    const loadLists = async () => {
      try {
        if (auth.loading) return;
        const doctorId = auth.user?.doctor_id ?? null;
        if (!doctorId) return;
        
        const [pRes, sRes] = await Promise.all([
          fetch(`/doctor_api/patients/get-all.php?doctor_id=${doctorId}`, { credentials: 'include' }),
          fetch('/doctor_api/referrals/get-specialists.php', { credentials: 'include' })
        ]);

        const pText = await pRes.text();
        const sText = await sRes.text();
        let pJson = null; let sJson = null;
        try { pJson = JSON.parse(pText); } catch(e){ pJson = null; }
        try { sJson = JSON.parse(sText); } catch(e){ sJson = null; }

        if (pJson && pJson.success) setPatients(pJson.patients || []);
        if (sJson && sJson.success) setSpecialists(sJson.specialists || []);
      } catch (err) {
        console.error('Failed to load patients or specialists', err);
      }
    };
    loadLists();
  }, [auth.loading, auth.user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Validate patient_id is set
      if (!form.patient_id) {
        setStatus({ type: 'error', text: 'Please select a valid patient from the list' });
        setTimeout(() => setStatus(null), 3000);
        return;
      }

      const payload = {
        patient_id: parseInt(form.patient_id, 10),
        specialist_doctor_id: parseInt(form.specialist_doctor_id, 10),
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
        setForm({ patient_id: '', patient_name: '', specialist_doctor_id: '', reason: '' });
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
      const [year, month, day] = dateString.split('T')[0].split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
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
                        <p className="referral-patient-info"><strong>{r.patient_name}</strong> <span className="text-muted">ID: {r.patient_id || r.Patient_ID}</span></p>
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
            
            {/* Patient Autocomplete */}
            <label>
              Patient *
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
                      filteredPatientResults.map(p => {
                        const numericId = p.id ? parseInt(p.id.replace(/^P/i, ''), 10) : null;
                        return (
                          <div 
                            key={p.id} 
                            className="patient-list-item" 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setForm({ 
                                ...form, 
                                patient_name: `${p.name} (${p.id})`, 
                                patient_id: numericId 
                              });
                              setShowPatientList(false);
                            }}
                          >
                            <div className="patient-list-item-name">{p.name}</div>
                            <div className="patient-list-item-id">{p.id}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Specialist Dropdown */}
            <label>
              Specialist *
              <select 
                value={form.specialist_doctor_id} 
                onChange={e => setForm({...form, specialist_doctor_id: e.target.value})} 
                required
              >
                <option value="">-- Select specialist --</option>
                {specialists.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.specialty_name}
                  </option>
                ))}
              </select>
            </label>

            {/* Reason */}
            <label>
              Reason for Referral *
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