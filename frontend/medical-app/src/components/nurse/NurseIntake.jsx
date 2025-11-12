import React, { useState } from "react";
import { Save, X, AlertCircle } from "lucide-react";
import "./NurseIntake.css";
import { saveNurseVitals } from '../../api/nurse';

export default function NurseIntake() {
  const [vitals, setVitals] = useState({
    bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: "", weight: "", height: ""
  });
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState("");
  const [apptId, setApptId] = useState("");
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const handleSave = async () => {
    if (!apptId) return showAlert('Please enter an appointment ID.', 'error');
    try {
      // The new nurse API client expects normalized vitals fields
      const payload = {
        bp: vitals.bloodPressure,
        hr: vitals.heartRate,
        temp: vitals.temperature,
        spo2: vitals.oxygenSaturation,
        weight: vitals.weight,
        height: vitals.height,
        reason,
        history
      };
      await saveNurseVitals(apptId, payload);
      showAlert('Vitals and intake saved!', 'success');
    } catch (e) {
      showAlert('Failed to save vitals: ' + (e.message || e), 'error');
    }
  };

  return (
    <div className="nurse-intake">
      <h2>Patient Intake</h2>
      <div className="appt-id-box">
        <label htmlFor="appt-id">Appointment ID:</label>
        <input
          id="appt-id"
          type="text"
          value={apptId}
          onChange={e => setApptId(e.target.value)}
          placeholder="Enter appointment ID"
          style={{ marginLeft: 8, width: 120 }}
        />
      </div>
      <div className="vitals-form">
        <div className="vital-row">
          <label>Blood Pressure</label>
          <input placeholder="120/80" value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} />
          <span className="unit">mmHg</span>
        </div>
        <div className="vital-row">
          <label>Heart Rate</label>
          <input placeholder="72" value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: e.target.value })} />
          <span className="unit">bpm</span>
        </div>
        <div className="vital-row">
          <label>Temperature</label>
          <input placeholder="98.6" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} />
          <span className="unit">°F</span>
        </div>
        <div className="vital-row">
          <label>O₂ Saturation</label>
          <input placeholder="99" value={vitals.oxygenSaturation} onChange={e => setVitals({ ...vitals, oxygenSaturation: e.target.value })} />
          <span className="unit">%</span>
        </div>
        <div className="vital-row">
          <label>Weight</label>
          <input placeholder="150" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} />
          <span className="unit">lbs</span>
        </div>
        <div className="vital-row">
          <label>Height</label>
          <input placeholder="65" value={vitals.height} onChange={e => setVitals({ ...vitals, height: e.target.value })} />
          <span className="unit">in</span>
        </div>
        <div className="vital-row">
          <label>Reason for Visit</label>
          <input placeholder="e.g. Cough, fever" value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div className="vital-row">
          <label>Update Medical History</label>
          <textarea placeholder="e.g. Asthma, diabetes" value={history} onChange={e => setHistory(e.target.value)} />
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="primary" onClick={handleSave}><Save size={16} /> Save Vitals</button>
        </div>
      </div>
      {alert && (
        <div className={`nurse-alert ${alert.type}`}> <AlertCircle size={16} style={{marginRight:4}} /> {alert.msg} </div>
      )}
    </div>
  );
}
