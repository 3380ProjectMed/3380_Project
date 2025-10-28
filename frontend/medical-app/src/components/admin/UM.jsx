import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import '../doctor/PatientList.css';

function UM() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to fetch admin users list if endpoint exists; otherwise show a placeholder
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/users/get-all.php');
        if (!res.ok) throw new Error('No users endpoint');
        const data = await res.json();
        if (data.success && data.users) setUsers(data.users);
        else setError('No users returned');
      } catch (e) {
        // endpoint likely not present in backend — keep placeholder
        setError('User management endpoint not available on backend.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2><Users/> User Management</h2>
      <p>Manage user accounts and roles.</p>

      {loading && <div>Loading users...</div>}
      {error && <div style={{ color: 'orange' }}>{error}</div>}

      {!loading && users.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <p>No users to display — backend endpoint not implemented.</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="patient-list__table-container" style={{ marginTop: 12 }}>
          <div className="table-header">
            <div>ID</div><div>Name</div><div>Email</div><div>Role</div>
          </div>
          <div className="table-body">
            {users.map(u => (
              <div className="table-row" key={u.id}>
                <div>{u.id}</div>
                <div>{u.name}</div>
                <div>{u.email}</div>
                <div>{u.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UM;
// user management: create, edit, delete users
