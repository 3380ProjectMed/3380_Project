import React, { useState } from "react";
import { FileText, Activity, Clock, User, Save, X, AlertCircle } from "lucide-react";
import "./NurseClinicalWorkSpace.css";
import { saveNurseVitals, saveNurseNote } from '../../api/nurse';

export default function NurseClinicalWorkSpace() {
  const [tab, setTab] = useState("vitals");
  const [note, setNote] = useState("");
  const [vitals, setVitals] = useState({
    bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: "", weight: "", height: ""
  });
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState("");
  const [apptId, setApptId] = useState("");
  const [alert, setAlert] = useState(null);

  // Mock patient context (replace with real data if available)
  const patient = {
    name: "John Doe", age: 38, gender: "Male", dob: "1985-06-15", bloodType: "O+",
    allergies: "Penicillin", lastVisit: "2025-09-15"
  };

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const handleSaveVitals = async () => {
    if (!apptId) return showAlert('Please enter an appointment ID.', 'error');
    try {
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

  const handleSaveNote = async () => {
    if (!apptId) return showAlert('Please enter an appointment ID.', 'error');
    try {
      await saveNurseNote(apptId, note);
      setNote("");
      showAlert('Clinical note saved!', 'success');
    } catch (e) {
      showAlert('Failed to save note: ' + (e.message || e), 'error');
    }
  };

  return (
    <div className="nurse-page">
      <div className="nurse-clinical">
        <div className="patient-card">
          <div className="avatar"><User size={26} /></div>
          <div className="meta">
            <div className="name">{patient.name}</div>
            <div className="sub">{patient.age} yrs · {patient.gender} · DOB {patient.dob} · 🩸 {patient.bloodType}</div>
          </div>
          <div className="right">
            <div className="badge">Allergies: {patient.allergies}</div>
            <div className="sub">Last visit: {patient.lastVisit}</div>
          </div>
        </div>

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

        <div className="tabs">
          <button className={tab === "vitals" ? "active" : ""} onClick={() => setTab("vitals")}> <Activity size={16} /> Vitals/Intake</button>
          <button className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}> <FileText size={16} /> Notes</button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}> <Clock size={16} /> History</button>
        </div>

        <div className="panel">
          {tab === "vitals" && (
            <div className="vitals">
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
                <button className="primary" onClick={handleSaveVitals}><Save size={16} /> Save Vitals</button>
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="notes">
              <textarea
                placeholder="SOAP Note...\nChief Complaint:\n\nHPI:\n\nPhysical Exam:\n\nAssessment/Plan:"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="actions">
                <button className="primary" onClick={handleSaveNote}><Save size={16} /> Save Note</button>
                <button className="ghost" onClick={() => setNote("")}><X size={16} /> Clear</button>
              </div>
            </div>
          )}

          {tab === "history" && (
            <div className="history">
              <div className="item">
                <div className="date">2025-09-15</div>
                <div className="content">
                  Follow-up: BP 128/82. HbA1c: 6.8%. Continue medications.
                </div>
              </div>
              <div className="item">
                <div className="date">2025-08-10</div>
                <div className="content">
                  Routine check-up. Good adherence to therapy. Lifestyle counseling.
                </div>
              </div>
            </div>
          )}
        </div>

        {alert && (
          <div className={`nurse-alert ${alert.type}`}> <AlertCircle size={16} style={{marginRight:4}} /> {alert.msg} </div>
        )}
      </div>
    </div>
  );
}
