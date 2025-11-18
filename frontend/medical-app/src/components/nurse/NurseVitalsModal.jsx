import React, { useState, useEffect } from 'react';
import './NursePatients.css';
import { saveNurseVitals } from '../../api/nurse';

export default function NurseVitalsModal({ patient, appointment, appointmentId, visitId, initialVitals = {}, onClose, onSaved }) {
  const formatChicagoDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  const [bp, setBp] = useState(initialVitals.blood_pressure || initialVitals.bp || '');
  const [temp, setTemp] = useState(initialVitals.temperature || initialVitals.temp || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setBp(initialVitals.blood_pressure || initialVitals.bp || '');
    setTemp(initialVitals.temperature || initialVitals.temp || '');
  }, [initialVitals]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
      onClose && onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onClose && onClose()}>
      <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Vitals — {patient.first_name} {patient.last_name}</h2>
          <button className="modal-close" onClick={() => onClose && onClose()} aria-label="Close">✕</button>
        </div>
        <div style={{ color: '#666', marginBottom: 8 }}>Appointment #{appointmentId} — {appointment?.Appointment_date ? formatChicagoDateTime(appointment.Appointment_date) : ''} {appointment?.office_name ? `@ ${appointment.office_name}` : ''}</div>
        {error && <div className="alert error" style={{ marginTop: 8 }}>{error}</div>}
        <form className="modal-form vitals-form" onSubmit={handleSave}>
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
            <button type="button" onClick={() => onClose && onClose()} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Vitals'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
