
import { makeUrl } from './http.js';

// Use absolute nurse API base (no /api prefix)
const BASE_URL = '/nurse_api';

// Small helper: robust JSON/text parser for backend responses.
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
      // leave text as-is (may be HTML)
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
    params: { apptId: appointmentId },
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}