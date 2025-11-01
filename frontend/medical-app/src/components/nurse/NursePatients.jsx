import React, { useEffect, useState, useRef } from "react";
import "./NursePatients.css";
import { getNursePatientsUpcoming } from '../../api/nurse';
import { useAuth } from '../../auth/AuthProvider';

export default function NursePatients() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(q, page);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, page, user, authLoading]);

  async function load(query, pg) {
    setLoading(true);
    try {
      if (authLoading) return;
      // Use session-authenticated endpoint to get upcoming patients for nurse's location
      const list = await getNursePatientsUpcoming(query || undefined);
      setPatients(list || []);
      setTotal(Array.isArray(list) ? list.length : 0);
    } catch (e) {
      // Handle nurse-not-found specially
      const msg = (e && e.data && e.data.error) ? e.data.error : (e.message || 'Failed to load');
      if (msg === 'NURSE_NOT_FOUND') {
        setError('No nurse record is associated with this account.');
      } else {
        setError(e.message || 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nurse-page">
      <div className="nurse-patients-page">
  <h1>My Patients</h1>

        <div className="searchbar">
          <input
            placeholder="Search patients by name or ID…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
          {q && <button onClick={() => setQ("")}>Clear</button>}
        </div>

        <div className="nurse-table">
          <div className="thead">
            <div>ID</div><div>Name</div><div>Date of Birth</div><div>Allergies</div>
          </div>
          <div className="tbody">
            {loading && <div className="empty">Loading…</div>}
            {!loading && patients.map((p) => (
              <div key={p.patient_id} className="row">
                <div className="mono">{p.patient_id}</div>
                <div>{p.name}</div>
                <div>{p.dob}</div>
                <div className={p.allergies === "None" ? "allergy-none" : "allergy-has"}>{p.allergies}</div>
              </div>
            ))}
            {!loading && patients.length === 0 && <div className="empty">No upcoming patients for your location.</div>}
          </div>
        </div>

        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>Prev</button>
          <span>Page {page} — {total} results</span>
          <button disabled={page * pageSize >= total} onClick={() => setPage((s) => s + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
