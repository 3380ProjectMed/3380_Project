import React, { useState, useEffect } from 'react';
import './NursePatients.css';
import { saveNurseVitals } from '../../api/nurse';

export default function NurseVitalsModal({ patient, appointment, appointmentId, visitId, initialVitals = {}, onClose, onSaved }) {
  const [bp, setBp] = useState(initialVitals.blood_pressure || initialVitals.bp || '');
  const [temp, setTemp] = useState(initialVitals.temperature || initialVitals.temp || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setBp(initialVitals.blood_pressure || initialVitals.bp || '');
    setTemp(initialVitals.temperature || initialVitals.temp || '');
  }, [initialVitals]);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    if (!appointmentId) {
      setError('Appointment ID missing');
      return;
    }
    setSaving(true);
    try {
      const payload = { bp, temp };
      await saveNurseVitals(appointmentId, payload);
      if (onSaved) onSaved({ appointmentId, visitId, blood_pressure: bp, temperature: temp });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="nurse-modal-backdrop">
      <div className="nurse-modal" role="dialog" aria-modal="true">
        <h2>Edit Vitals — {patient.first_name} {patient.last_name}</h2>
        <div style={{ color: '#666', marginBottom: 8 }}>Appointment #{appointmentId} — {appointment?.Appointment_date ? new Date(appointment.Appointment_date).toLocaleString() : ''} {appointment?.office_name ? `@ ${appointment.office_name}` : ''}</div>
        {error && <div className="alert error" style={{ marginTop: 8 }}>{error}</div>}
        <form className="vitals-form" onSubmit={handleSave}>
          <div className="vitals-grid">
            <label>
              Blood Pressure
              <input value={bp} onChange={e => setBp(e.target.value)} placeholder="e.g., 120/80" />
            </label>
            <label>
              Temperature
              <input value={temp} onChange={e => setTemp(e.target.value)} placeholder="e.g., 98.6" />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Vitals'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
