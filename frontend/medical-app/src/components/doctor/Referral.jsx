import React, { useEffect, useState, useMemo } from 'react';
import './Referral.css';

function Referral() {
  const [pending, setPending] = useState([]);
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

  const apiBase = 'http://localhost:8080/api/referrals';

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/get-pending.php`);
      const json = await res.json();
      if (json.success && Array.isArray(json.referrals)) {
        setPending(json.referrals);
      } else {
        setPending([]);
      }
    } catch (err) {
      console.error('Failed to load referrals', err);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  // Load patients and doctors for the form
  useEffect(() => {
    const loadLists = async () => {
      try {
        const doctorId = 201; // TODO: derive from auth/profile
        const [pRes, dRes] = await Promise.all([
          fetch(`http://localhost:8080/api/patients/get-all.php?doctor_id=${doctorId}`),
          fetch('http://localhost:8080/api/doctors/get-all.php')
        ]);

        const pJson = await pRes.json();
        const dJson = await dRes.json();

        if (pJson.success) setPatients(pJson.patients || []);
        if (dJson.success) setDoctors(dJson.doctors || []);
      } catch (err) {
        console.error('Failed to load patients or doctors', err);
      }
    };
    loadLists();
  }, []);

  const handleApprove = async (id, approve = true) => {
    try {
      const body = { referral_id: id, status: approve ? 'Approved' : 'Denied', doctor_id: 201 };
      const res = await fetch(`${apiBase}/approve.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setStatus({ type: 'success', text: json.message || 'Updated' });
        loadPending();
      } else {
        setStatus({ type: 'error', text: json.error || 'Failed' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setStatus(null), 3000);
  };

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
        referring_doctor_id: parseInt(form.referring_doctor_staff_id, 10),
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
        loadPending();
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
      <h2>Referrals</h2>
      <div className="referral-grid">
        <div className="referral-column">
          <h3>Pending Referrals</h3>
          {loading ? <div>Loading...</div> : (
            <ul className="referral-list">
              {pending.length === 0 && <li className="empty">No pending referrals</li>}
              {pending.map(r => (
                  <li key={r.Referral_ID} className="referral-item">
                    <div className="referral-meta">
                      <strong>#{r.Referral_ID}</strong>
                      <span>Patient: {r.Patient_ID} - {r.patient_name}</span>
                      <span>Reason: {r.Reason}</span>
                      {r.notes && <span>Notes: {r.notes}</span>}
                      {r.Date_of_approval && <span className="approved-date">Approved on: {r.Date_of_approval}</span>}
                    </div>
                    <div className="referral-actions">
                      <button className="btn btn-approve" onClick={() => handleApprove(r.Referral_ID, true)}>Approve</button>
                      <button className="btn btn-deny" onClick={() => handleApprove(r.Referral_ID, false)}>Deny</button>
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
                <div className={`patient-list-dropdown ${showPatientList ? 'open' : ''}`}>
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
              <button className="btn" type="submit">Create Referral</button>
            </div>
          </form>
              {status && <div className={`alert ${status.type}`}>{status.text}</div>}
        </div>
      </div>
    </div>
  );
}

export default Referral;
