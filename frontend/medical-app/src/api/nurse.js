const BASE_URL = '/api/nurse_api';

async function getJSON(url) {
  const resp = await fetch(url, { credentials: 'include' });
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try { const data = await resp.json(); msg = data.error || data.message || msg; } catch (e) {}
    throw new Error(msg);
  }
  return resp.json();
}

// Dashboard stats
export function getNurseDashboardStats(date = new Date().toISOString().slice(0,10)) {
  return getJSON(`${BASE_URL}/dashboard/get-stats.php?date=${encodeURIComponent(date)}`);
}

// Schedule by date (for dashboard appointments) - FIXED to handle both response formats
export async function getNurseSchedule(params) {
  // Handle both object { date: '...' } and string date
  const dateStr = typeof params === 'string' ? params : (params?.date || new Date().toISOString().slice(0,10));
  const data = await getJSON(`${BASE_URL}/schedule/get-by-date.php?date=${encodeURIComponent(dateStr)}`);
  
  // Handle both response formats: plain array or { appointments: [...] }
  if (Array.isArray(data)) {
    return data;
  }
  return data.appointments || [];
}

// Schedule today (weekly recurring schedule for Schedule page)
export async function getNurseScheduleToday() {
  const data = await getJSON(`${BASE_URL}/schedule/get-today.php`);
  
  // Handle response format: { success: true, schedule: [...] } or plain array
  if (data.schedule) {
    return data.schedule;
  }
  return Array.isArray(data) ? data : [];
}

// Profile
export function getNurseProfile() {
  return getJSON(`${BASE_URL}/profile/get.php`);
}

// Patients with pagination
export function getNursePatients(query = '', page = 1, pageSize = 10) {
  const params = new URLSearchParams({ q: query, page: String(page), limit: String(pageSize) });
  return getJSON(`${BASE_URL}/patients/get-all.php?${params.toString()}`);
}

// Clinical - Save Nurse Note
export async function saveNurseNote(appointmentId, noteBody) {
  const response = await fetch(`${BASE_URL}/clinical/save-note.php?apptId=${appointmentId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: noteBody,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Clinical - Save Nurse Vitals
export async function saveNurseVitals(appointmentId, vitals) {
  const response = await fetch(`${BASE_URL}/clinical/save-vitals.php?apptId=${appointmentId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vitals),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}