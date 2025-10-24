import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import './Referral.css';

function Referral() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ patient_id: '', patient_name: '', referring_doctor_staff_id: '', specialist_doctor_staff_id: '', reason: '', notes: '' });
  const [status, setStatus] = useState(null);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showPatientList, setShowPatientList] = useState(false);

  const filteredPatientResults = useMemo(() => {
    const q = (form.patient_name || '').trim().toLowerCase();
    if (!q) return []; // don't show any patients until user types
    return patients.filter(p => {
      const full = (p.name || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const numericId = String((p.Patient_ID || '').toString()).toLowerCase();
      return full.includes(q) || id.includes(q) || numericId === q || String(p.Patient_ID) === q;
    }).slice(0, 50);
  }, [form.patient_name, patients]);

  const apiBase = '/api/doctor_api/referrals';
  const auth = useAuth();

  // Load referrals that were received by the specialist (assigned to this doctor)
  const loadReceived = async (doctorId = null) => {
    setLoading(true);
    try {
      // prefer passing doctor_id explicitly, otherwise backend will infer from session
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
        if (!doctorId) return; // no doctor context available yet
        const [pRes, dRes] = await Promise.all([
          fetch(`/api/doctor_api/patients/get-all.php?doctor_id=${doctorId}`, { credentials: 'include' }),
          fetch('/api/doctor_api/doctors/get-all.php', { credentials: 'include' })
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
  }, []);

  // Approval flow removed: referrals from PCP are delivered to specialists directly.

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Resolve patient_id from patient_name input (format: 'First Last (P###)') or match by name
      let patientId = null;
      const match = (form.patient_name || '').match(/\(P(\d+)\)$/);
      if (match) {
        patientId = parseInt(match[1], 10);
      } else {
        // try to match by name
        const found = patients.find(p => `${p.First_Name} ${p.Last_Name}`.toLowerCase() === (form.patient_name || '').toLowerCase());
        if (found) patientId = found.Patient_ID;
      }

      if (!patientId) {
        setStatus({ type: 'error', text: 'Please select a valid patient from the list' });
        setTimeout(() => setStatus(null), 3000);
        return;
      }

      const payload = {
        patient_id: patientId,
        referring_doctor_id: parseInt(form.referring_doctor_staff_id, 10) || (auth.user?.doctor_id ?? null),
        specialist_doctor_id: parseInt(form.specialist_doctor_staff_id, 10),
        reason: form.reason,
        notes: form.notes
      };

      const res = await fetch(`${apiBase}/create.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      // Try to parse JSON, but if server emits warnings or HTML, capture the text
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (parseErr) { json = null; }

      if (json && json.success) {
        setStatus({ type: 'success', text: 'Referral created' });
        setForm({ patient_id: '', referring_doctor_staff_id: '', specialist_doctor_staff_id: '', reason: '' });
        // refresh the received referrals list for the specialist
        loadReceived(auth.user?.doctor_id ?? null);
      } else {
        // Show server response (either JSON.error or raw text)
        const msg = (json && json.error) ? json.error : text || 'Failed to create referral';
        setStatus({ type: 'error', text: msg });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="referral-page">
      <h2 className="page-title">Referrals</h2>
      <div className="referral-grid">
        <div className="referral-column">
          <h3>Pending Referrals</h3>
          {loading ? <div>Loading...</div> : (
            <ul className="referral-list">
              {referrals.length === 0 && <li className="empty">No referrals received</li>}
              {referrals.map(r => (
                  <li key={r.Referral_ID} className="referral-item">
                    <div className="referral-meta">
                      <strong>#{r.Referral_ID}</strong>
                      <span>Patient: {r.Patient_ID} - {r.patient_name}</span>
                      <span>Specialist: {r.specialist_name}{r.specialty_name ? ` — ${r.specialty_name}` : ''}</span>
                      <span>Reason: {r.Reason}</span>
                      {r.notes && <span>Notes: {r.notes}</span>}
                      {r.Date_of_approval && <span className="approved-date">Updated on: {r.Date_of_approval}</span>}
                      <span>Status: {r.Status}</span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="referral-column">
          <h3>Create Referral</h3>
          <form className="referral-form" onSubmit={handleCreate}>
            <label>Patient
              <div className="patient-select">
                <input
                  type="text"
                  placeholder="Type patient name or ID"
                  value={form.patient_name}
                  onChange={e => { setForm({...form, patient_name: e.target.value, patient_id: ''}); setShowPatientList(true); }}
                  onFocus={() => setShowPatientList(true)}
                  required
                />
                {showPatientList && (form.patient_name || '').trim() !== '' && !form.patient_id && (
                  <div className={`patient-list-dropdown open`}>
                    {filteredPatientResults.length === 0 ? (
                      <div className="patient-list-empty">No matching patients</div>
                    ) : (
                      filteredPatientResults.map(p => (
                        <div key={p.id} className="patient-list-item" onClick={() => {
                          // p.id is like 'P101' and p.name is 'First Last'
                          const numeric = parseInt((p.id || '').replace(/^P/i, ''), 10) || null;
                          setForm({ ...form, patient_name: `${p.name} (${p.id})`, patient_id: numeric });
                          setShowPatientList(false);
                        }}>
                          <div className="patient-list-item-name">{p.name}</div>
                          <div className="patient-list-item-id">{p.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>
            <label>Referring Doctor Staff ID
              <input value={form.referring_doctor_staff_id} onChange={e => setForm({...form, referring_doctor_staff_id: e.target.value})} required />
            </label>
            <label>Specialist
              <select value={form.specialist_doctor_staff_id} onChange={e => setForm({...form, specialist_doctor_staff_id: e.target.value})} required>
                <option value="">-- select specialist --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}{d.specialty_name ? ` — ${d.specialty_name}` : ''}</option>
                ))}
              </select>
            </label>
            <label>Reason
              <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
            </label>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary" type="submit">Create Referral</button>
            </div>
          </form>
              {status && <div className={`alert ${status.type}`}>{status.text}</div>}
        </div>
      </div>
    </div>
  );
}

export default Referral;
