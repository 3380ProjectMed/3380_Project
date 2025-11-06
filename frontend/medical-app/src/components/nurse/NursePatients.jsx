import React, { useEffect, useState } from "react";
import "./NursePatients.css";
import { getNursePatients } from '../../api/nurse';

export default function NursePatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 10;

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNursePatients(search, page, pageSize);
      console.log('Patients response:', data);
      
      const patientList = data?.patients || [];
      setPatients(Array.isArray(patientList) ? patientList : []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Patients error:', e);
      setError(e.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="nurse-page">
      <div className="nurse-patients-page">
        <h1>My Patients</h1>

        {error && (
          <div style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Search patients by name or ID..."
          value={search}
          onChange={handleSearch}
          className="search-input"
        />

        <div className="nurse-table">
          <div className="thead">
            <div>ID</div>
            <div>Name</div>
            <div>Date of Birth</div>
            <div>Allergies</div>
          </div>
          <div className="tbody">
            {loading ? (
              <div className="empty">Loading patients...</div>
            ) : patients.length > 0 ? (
              patients.map((p) => (
                <div key={p.patient_id} className="row">
                  <div>{p.patient_id}</div>
                  <div>{p.first_name} {p.last_name}</div>
                  <div>{p.dob ? new Date(p.dob).toLocaleDateString() : 'N/A'}</div>
                  <div>{p.allergies || 'None'}</div>
                </div>
              ))
            ) : (
              <div className="empty">No patients found</div>
            )}
          </div>
        </div>

        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            Prev
          </button>
          <span>Page {page} — {total} results</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total || loading}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
