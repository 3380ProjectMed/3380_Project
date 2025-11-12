
import { apiRequest, makeUrl } from './http.js';
const BASE_URL = 'nurse_api';

export async function getNurseDashboardStats(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  const data = await apiRequest(makeUrl(`${BASE_URL}/dashboard/get-stats.php`, { date: d }));
  return {
    total: data.total ?? data.totalAppointments ?? 0,
    waiting: data.waiting ?? data.waitingCount ?? 0,
    upcoming: data.upcoming ?? data.upcomingCount ?? 0,
    completed: data.completed ?? data.completedCount ?? 0,
  };
}

export async function getNurseSchedule({ date } = {}) {
  const d = date || new Date().toISOString().slice(0, 10);
  const data = await apiRequest(makeUrl(`${BASE_URL}/schedule/get-by-date.php`, { date: d }));
  if (Array.isArray(data)) return data;
  return data.appointments || data.data || [];
}

export async function getNurseScheduleToday() {
  const today = new Date().toISOString().slice(0, 10);
  return getNurseSchedule({ date: today });
}

export async function getNurseProfile() {
  return apiRequest(makeUrl(`${BASE_URL}/profile/get.php`));
}

export async function getNursePatients(query = '', page = 1, pageSize = 10) {
  const params = { q: query, page: String(page), pageSize: String(pageSize) };
  const data = await apiRequest(makeUrl(`${BASE_URL}/patients/get-all.php`, params));
  const items = Array.isArray(data.items) ? data.items : [];
  const normalized = items.map(r => {
    const name = String(r.name ?? r.fullName ?? '');
    const parts = name.split(' ').filter(Boolean);
    const first = parts.shift() || '';
    const last = parts.join(' ');
    return {
      patient_id: r.id ?? r.Patient_ID ?? r.patientId ?? '',
      first_name: r.firstName ?? first,
      last_name: r.lastName ?? last,
      dob: r.dob ?? r.DOB ?? null,
      allergies: r.allergies ?? '',
      email: r.email ?? '',
      phone: r.phone ?? ''
    };
  });
  return { patients: normalized, total: data.total ?? normalized.length };
}

export async function saveNurseNote(appointmentId, noteBody) {
  const body = typeof noteBody === 'string' ? { body: noteBody } : { body: noteBody?.body };
  return apiRequest(makeUrl(`${BASE_URL}/clinical/save-note.php`, { apptId: appointmentId }), {
    method: 'POST',
    body,
    json: true
  });
}

export async function saveNurseVitals(appointmentId, vitals) {
  const payload = {
    bp: vitals.bp ?? vitals.bloodPressure ?? '',
    hr: vitals.hr ?? vitals.heartRate ?? '',
    temp: vitals.temp ?? vitals.temperature ?? '',
    spo2: vitals.spo2 ?? vitals.oxygenSaturation ?? '',
    height: vitals.height ?? '',
    weight: vitals.weight ?? ''
  };
  return apiRequest(makeUrl(`${BASE_URL}/clinical/save-vitals.php`, { apptId: appointmentId }), {
    method: 'POST',
    body: payload,
    json: true
  });
}