import React, { useState } from "react";
import { FileText, Activity, Clock, User, Save, X } from "lucide-react";
import "./NurseClinicalWorkSpace.css";
import { saveNurseVitals, saveNurseNote } from '../../api/nurse';

export default function NurseClinicalWorkSpace() {
  const [tab, setTab] = useState("notes");
  const [note, setNote] = useState("");
  const [vitals, setVitals] = useState({
    bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: ""
  });

  const patient = {
    name: "John Doe", age: 38, gender: "Male", dob: "1985-06-15", bloodType: "O+",
    allergies: "Penicillin", lastVisit: "2025-09-15"
  };

  const saveNote = async (apptId) => {
    if (!apptId) { alert('No appointment selected (mock save)'); return; }
    try {
      await saveNurseNote(apptId, { body: note });
      alert('Clinical note saved');
      setNote('');
    } catch (e) {
      alert('Failed to save note: ' + (e.message || e));
    }
  };
  const saveVitals = async (apptId) => {
    if (!apptId) { alert('No appointment selected (mock save)'); return; }
    try {
      // map local keys to API payload keys
      const payload = {
        bp: vitals.bloodPressure,
        hr: vitals.heartRate,
        temp: vitals.temperature,
        spo2: vitals.oxygenSaturation
      };
      await saveNurseVitals(apptId, payload);
      alert('Vitals saved');
    } catch (e) {
      alert('Failed to save vitals: ' + (e.message || e));
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

      <div className="tabs">
        <button className={tab==="notes"?"active":""} onClick={()=>setTab("notes")}><FileText size={16}/> Notes</button>
        <button className={tab==="vitals"?"active":""} onClick={()=>setTab("vitals")}><Activity size={16}/> Vitals</button>
        <button className={tab==="history"?"active":""} onClick={()=>setTab("history")}><Clock size={16}/> History</button>
      </div>

      <div className="panel">
        {tab==="notes" && (
          <div className="notes">
            <textarea
              placeholder="SOAP Note...\nChief Complaint:\n\nHPI:\n\nPhysical Exam:\n\nAssessment/Plan:"
              value={note}
              onChange={(e)=>setNote(e.target.value)}
            />
            <div className="actions">
              <button className="primary" onClick={() => {
                const appt = prompt('Enter appointment id to save note (e.g. 123)');
                saveNote(appt);
              }}><Save size={16}/> Save Note</button>
              <button className="ghost" onClick={()=>setNote("")}><X size={16}/> Clear</button>
            </div>
          </div>
        )}

        {tab==="vitals" && (
          <div className="vitals">
            {[
              {key:"bloodPressure", label:"Blood Pressure", unit:"mmHg", ph:"120/80"},
              {key:"heartRate", label:"Heart Rate", unit:"bpm", ph:"72"},
              {key:"temperature", label:"Temperature", unit:"°F", ph:"98.6"},
              {key:"oxygenSaturation", label:"O₂ Saturation", unit:"%", ph:"99"},
            ].map((v)=>(
              <div className="vital" key={v.key}>
                <label>{v.label}</label>
                <input
                  placeholder={v.ph}
                  value={vitals[v.key]}
                  onChange={(e)=>setVitals({...vitals,[v.key]:e.target.value})}
                />
                <span className="unit">{v.unit}</span>
              </div>
            ))}
            <div style={{textAlign:"center"}}>
              <button className="primary" onClick={() => {
                const appt = prompt('Enter appointment id to save vitals (e.g. 123)');
                saveVitals(appt);
              }}><Save size={16}/> Save Vitals</button>
            </div>
          </div>
        )}

        {tab==="history" && (
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
      </div>
    </div>
  );
}
