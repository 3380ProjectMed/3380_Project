import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Login() {
  const [nurseId, setNurseId] = useState('1');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const nurse = await api.loginNurse(Number(nurseId));
      localStorage.setItem('nurseId', nurse.id);
      localStorage.setItem('nurseName', `${nurse.first_name} ${nurse.last_name}`);
      navigate('/nurse/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white shadow rounded-xl p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Nurse Login</h1>
        <label className="block text-sm mb-2">Nurse ID</label>
        <input
          value={nurseId}
          onChange={(e) => setNurseId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2">
          Sign In
        </button>
      </form>
    </div>
  );
}
