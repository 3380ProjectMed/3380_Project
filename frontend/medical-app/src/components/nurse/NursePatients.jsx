import React, { useEffect, useState } from "react";
import { Search, X, AlertCircle } from 'lucide-react';
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
      // The new nurse API client returns { patients, total }
      const data = await getNursePatients(search, page, pageSize);
      
      // DEBUG: Log what we got back
      console.log('🔍 API Response:', data);
      console.log('🔍 Patients array:', data?.patients);
      console.log('🔍 Total:', data?.total);
      
      const items = Array.isArray(data?.patients) ? data.patients : [];
      console.log('🔍 Items to display:', items);
      console.log('🔍 Number of patients:', items.length);
      
      setPatients(items);
      setTotal(Number.isFinite(data?.total) ? data.total : items.length);
    } catch (e) {
      console.error('❌ Error loading patients:', e);
      setError(e.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line
  }, [page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="nurse-page">
      <div className="nurse-patients-page">
        <h1>My Patients</h1>

        <div className="patient-list__search">
          <Search className="patient-list__search-icon" />
          <input
            type="text"
            className="patient-list__search-input"
            placeholder="Search patients by name or ID..."
            value={search}
            onChange={handleSearch}
            aria-label="Search patients"
          />
          {search && (
            <button
              className="patient-list__search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {loading && (
          <div className="patient-list__loading">Loading patients...</div>
        )}

        {error && (
          <div className="patient-list__error">
            Error: {error}
            <button 
              onClick={() => { setError(null); setSearch(''); loadPatients(); }} 
              style={{ marginLeft: '8px'}}
            >
              Reload
            </button>
          </div>
        )}

        <div className="patient-list__table-container">
          <div className="table-header">
            <div>ID</div>
            <div>Name</div>
            <div>Date of Birth</div>
            <div>Allergies</div>
          </div>
          <div className="table-body">
            {patients.length === 0 && !loading ? (
              <div className="patient-list__empty">
                <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No patients found matching "{search}"</p>
                <button 
                  className="btn-clear-search"
                  onClick={() => setSearch('')}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              patients.map((p) => (
                <div key={p.patient_id || p.id} className="table-row">
                  <div>{p.patient_id || p.id}</div>
                  <div>{p.first_name || ''} {p.last_name || ''}</div>
                  <div>{p.dob ? new Date(p.dob).toLocaleDateString() : 'N/A'}</div>
                  <div className={`patient-list__allergies ${!p.allergies || p.allergies === 'None' || p.allergies === 'No Known Allergies' ? 'patient-list__allergies--none' : 'patient-list__allergies--has'}`}>
                    {!p.allergies || p.allergies === 'None' || p.allergies === 'No Known Allergies' ? (
                      <span>✓ None</span>
                    ) : (
                      <span><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />{p.allergies}</span>
                    )}
                  </div>
                </div>
              ))
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