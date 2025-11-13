
import { makeUrl } from './http.js';

// Use absolute nurse API base
const BASE_URL = '/nurse_api';
async function fetchJson(path, opts = {}) {
  const init = { credentials: 'include', ...opts };
  const res = await fetch(makeUrl(path, init.params), init);
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    // Try to return any useful server message
    let msg = text;
    try {
      const parsed = JSON.parse(text);
      msg = parsed.message || parsed.error || JSON.stringify(parsed);
    } catch (e) {
    }
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${msg}`);
  }

  // Try JSON first, fallback to plain text (some endpoints return HTML on 404)
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

export async function getNurseDashboardStats(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  const data = await fetchJson(`${BASE_URL}/dashboard/get-stats.php`, { params: { date: d } });
  return {
    total: Number(data?.total ?? data?.totalAppointments ?? 0),
    waiting: Number(data?.waiting ?? data?.waitingCount ?? 0),
    upcoming: Number(data?.upcoming ?? data?.upcomingCount ?? 0),
    completed: Number(data?.completed ?? data?.completedCount ?? 0),
  };
}

export async function getNurseSchedule({ date } = {}) {
  const d = date || new Date().toISOString().slice(0, 10);
  const data = await fetchJson(`${BASE_URL}/schedule/get-by-date.php`, { params: { date: d } });
  if (Array.isArray(data)) return data;
  // normalize possible envelope shapes
  return data?.appointments || data?.schedule || data?.data || [];
}

export async function getNurseScheduleToday() {
  const today = new Date().toISOString().slice(0, 10);
  return getNurseSchedule({ date: today });
}

export async function getNurseProfile() {
  return fetchJson(`${BASE_URL}/profile/get.php`);
}

export async function getNursePatients(query = '', page = 1, pageSize = 10) {
  const params = { q: query, page: String(page), pageSize: String(pageSize) };
  const data = await fetchJson(`${BASE_URL}/patients/get-all.php`, { params });
  // Prefer items, but accept 'patients' if backend uses that
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.patients) ? data.patients : [];
  return { items, total: Number(data?.total ?? items.length) };
}

export async function saveNurseNote(appointmentId, noteBody) {
  const body = typeof noteBody === 'string' ? { body: noteBody } : { body: noteBody?.body };
  return fetchJson(`${BASE_URL}/clinical/save-note.php`, {
    method: 'POST',
    params: { apptId: appointmentId },
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function saveNurseVitals(appointmentId, vitals) {
  const payload = {
    bp: vitals.bp ?? vitals.bloodPressure ?? '',
    hr: vitals.hr ?? vitals.heartRate ?? '',
    temp: vitals.temp ?? vitals.temperature ?? '',
    spo2: vitals.spo2 ?? vitals.oxygenSaturation ?? ''
  };
  if (vitals.height) payload.height = vitals.height;
  if (vitals.weight) payload.weight = vitals.weight;
  return fetchJson(`${BASE_URL}/clinical/save-vitals.php`, {
    method: 'POST',
    params: { appointment_id: appointmentId },
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function createOrGetNurseVisit(appointmentId) {
  if (!appointmentId) throw new Error('appointmentId required');
  // call visits/create-or-get.php
  return fetchJson(`${BASE_URL}/visits/create-or-get.php`, {
    params: { appointment_id: appointmentId }
  });
}

export async function getAppointmentsForPatient(patientId, scope = 'today') {
  if (!patientId) throw new Error('patientId required');
  const data = await fetchJson(`${BASE_URL}/appointments/get-for-patient.php`, { params: { patient_id: patientId, scope } });
  // normalize shape
  return Array.isArray(data?.appointments) ? data.appointments : [];
}

export async function getNurseDashboardStats() {
  return fetchJson(`${BASE_URL}/dashboard/get-stats.php`);
}

export async function getNurseTodaySchedule() {
  return fetchJson(`${BASE_URL}/dashboard/get-today-schedule.php`);
}

export async function getNurseWorkSchedule() {
  return fetchJson(`${BASE_URL}/schedule/get-work-schedule.php`);
}

export async function getNurseMonthAppointments(year, month) {
  return fetchJson(`${BASE_URL}/schedule/get-month-appointments.php`, {
    params: { year: year.toString(), month: month.toString() }
  });
}

export async function getPatientDetail(patientId) {
  return fetchJson(`${BASE_URL}/patients/get-patient-detail.php`, {
    params: { patient_id: patientId.toString() }
  });
}