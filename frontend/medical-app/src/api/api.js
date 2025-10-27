// src/api/api.js
import { apiRequest, makeUrl } from './http'; // export makeUrl from http.js if not already

// Optional: small JSON GET helper that respects env base
const j = (path, init) => apiRequest(path, { json: true, ...init });

// auth
export const login = (email, password) =>
  apiRequest('login.php', { method: 'POST', body: { email, password } });

export const me = () => apiRequest('me.php');

// doctor APIs
export const getDoctorProfile = (id) =>
  apiRequest('doctor_api/profile.php', { params: { id } });

// admin APIs
export const listUsers = (q) =>
  apiRequest('admin_api/users.php', { params: q });

export const createUser = (payload) =>
  apiRequest('admin_api/users_create.php', { method: 'POST', body: payload });

// appointments
export const listAppointments = (q) =>
  apiRequest('appointment_api/list.php', { params: q });

export const createAppointment = (payload) =>
  apiRequest('appointment_api/create.php', { method: 'POST', body: payload });

// file upload
export const uploadDocument = (file) => {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('files/upload.php', { method: 'POST', body: form, json: true });
};

// health checks — use base-aware helper (no hard-coded /api)
export const pingPhp = () => j('health.php');
export const pingDb  = () => j('dbcheck.php');

export default { pingPhp, pingDb };
