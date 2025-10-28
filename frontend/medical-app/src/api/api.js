// /home/site/wwwroot/apis/api.js
import { apiRequest, makeUrl } from './http.js';

const j = (path, init) => apiRequest(path, { json: true, ...init });

// ─── AUTH ───────────────────────────────────────────────────────
export const login = (email, password) =>
  apiRequest('api/login.php', { method: 'POST', body: { email, password } });

export const me = () => apiRequest('api/me.php');

// ─── DOCTOR APIs ────────────────────────────────────────────────
export const getDoctorProfile = (id) =>
  apiRequest('doctor_api/profile.php', { params: { id } });

// ─── ADMIN APIs ─────────────────────────────────────────────────
export const listUsers = (q) =>
  apiRequest('admin_api/users.php', { params: q });

export const createUser = (payload) =>
  apiRequest('admin_api/users_create.php', { method: 'POST', body: payload });

// ─── APPOINTMENTS (if you later add this folder) ────────────────
export const listAppointments = (q) =>
  apiRequest('appointment_api/list.php', { params: q });

export const createAppointment = (payload) =>
  apiRequest('appointment_api/create.php', { method: 'POST', body: payload });

// ─── FILE UPLOADS ───────────────────────────────────────────────
export const uploadDocument = (file) => {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('files/upload.php', { method: 'POST', body: form, json: true });
};

// ─── HEALTH CHECKS ──────────────────────────────────────────────
export const pingPhp = () => j('api/health.php');
export const pingDb  = () => j('api/dbcheck.php');

export default { pingPhp, pingDb };
