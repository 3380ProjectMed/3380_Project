// src/api/api.js
import { apiRequest } from './http';

// auth
export const login = (email, password) =>
  apiRequest('login.php', { method: 'POST', body: { email, password } });

export const me = () =>
  apiRequest('me.php');

// doctor APIs (backend/public/doctor_api/*)
export const getDoctorProfile = (id) =>
  apiRequest('doctor_api/profile.php', { params: { id } });

// admin APIs (backend/public/admin_api/*)
export const listUsers = (q) =>
  apiRequest('admin_api/users.php', { params: q });

export const createUser = (payload) =>
  apiRequest('admin_api/users_create.php', { method: 'POST', body: payload });

// appointments
export const listAppointments = (q) =>
  apiRequest('appointment_api/list.php', { params: q });

export const createAppointment = (payload) =>
  apiRequest('appointment_api/create.php', { method: 'POST', body: payload });

// file upload example
export const uploadDocument = (file) => {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('files/upload.php', { method: 'POST', body: form, json: true });
};
