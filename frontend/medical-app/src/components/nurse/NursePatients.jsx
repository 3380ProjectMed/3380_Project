import React, { useMemo, useState } from "react";
import "./NursePatients.css";

export default function NursePatients() {
  const patients = useMemo(
    () => [
      { id: "P001", name: "James Patterson", dob: "1975-04-12", allergies: "Penicillin" },
      { id: "P002", name: "Sarah Connor", dob: "1990-08-23", allergies: "None" },
      { id: "P003", name: "Robert Miller", dob: "2001-11-05", allergies: "Latex, Aspirin" },
      { id: "P004", name: "Emily Chen", dob: "1988-03-17", allergies: "Sulfa drugs" },
      { id: "P005", name: "Michael Johnson", dob: "1965-12-30", allergies: "None" },
    ],
    []
  );

  const [q, setQ] = useState("");

  const filtered = patients.filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="nurse-page">
      <div className="nurse-patients-page">
        <h1>My Patients</h1>

        <div className="searchbar">
          <input
            placeholder="Search patients by name or ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && <button onClick={() => setQ("")}>Clear</button>}
        </div>

        <div className="nurse-table">
          <div className="thead">
            <div>ID</div><div>Name</div><div>Date of Birth</div><div>Allergies</div>
          </div>
          <div className="tbody">
            {filtered.map((p) => (
              <div key={p.id} className="row">
                <div className="mono">{p.id}</div>
                <div>{p.name}</div>
                <div>{new Date(p.dob).toLocaleDateString()}</div>
                <div className={p.allergies === "None" ? "allergy-none" : "allergy-has"}>{p.allergies}</div>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty">No patients found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
