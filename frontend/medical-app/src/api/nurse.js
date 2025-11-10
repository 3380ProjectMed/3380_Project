const BASE_URL = '/nurse_api';

function asJsonOrThrow(resp) {
  return resp.json().catch(() => ({})).then(data => {
    if (!resp.ok) {
      const msg = data.error || data.message || `${resp.status} ${resp.statusText}`;
      throw new Error(msg);
    }
    return data;
  });
}

export async function getNurseDashboardStats(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  const resp = await fetch(`${BASE_URL}/dashboard/get-stats.php?date=${encodeURIComponent(d)}`, { credentials: 'include' });
  const data = await asJsonOrThrow(resp);
  return {
    total: data.total ?? data.totalAppointments ?? 0,
    waiting: data.waiting ?? data.waitingCount ?? 0,
    upcoming: data.upcoming ?? data.upcomingCount ?? 0,
    completed: data.completed ?? data.completedCount ?? 0,
  };
}

export async function getNurseSchedule({ date } = {}) {
  const d = date || new Date().toISOString().slice(0, 10);
  const resp = await fetch(`${BASE_URL}/schedule/get-by-date.php?date=${encodeURIComponent(d)}`, { credentials: 'include' });
  const data = await asJsonOrThrow(resp);
  if (Array.isArray(data)) return data;
  return data.appointments || data.data || [];
}

export async function getNurseScheduleToday() {
  const today = new Date().toISOString().slice(0, 10);
  return getNurseSchedule({ date: today });
}

export async function getNurseProfile() {
  const resp = await fetch(`${BASE_URL}/profile/get.php`, { credentials: 'include' });
  return asJsonOrThrow(resp);
}

export async function getNursePatients(query = '', page = 1, pageSize = 10) {
  const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });
  const resp = await fetch(`${BASE_URL}/patients/get-all.php?${params.toString()}`, { credentials: 'include' });
  const data = await asJsonOrThrow(resp);
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
  const resp = await fetch(`${BASE_URL}/clinical/save-note.php?apptId=${encodeURIComponent(appointmentId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return asJsonOrThrow(resp);
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
  const resp = await fetch(`${BASE_URL}/clinical/save-vitals.php?apptId=${encodeURIComponent(appointmentId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return asJsonOrThrow(resp);
}