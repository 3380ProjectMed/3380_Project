const BASE_URL = '/api/nurse_api';

// Dashboard Stats
export async function getNurseDashboardStats(date) {
  const response = await fetch(`${BASE_URL}/dashboard/get-stats.php?date=${date}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Schedule - with date parameter
export async function getNurseSchedule({ date }) {
  const response = await fetch(`${BASE_URL}/schedule/get-by-date.php?date=${date}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Return appointments array directly (matching what NurseDashboard expects)
  return data.appointments || data.data || [];
}

// Schedule - today (existing function)
export async function getNurseScheduleToday() {
  const response = await fetch(`${BASE_URL}/schedule/get-today.php`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Profile
export async function getNurseProfile() {
  const response = await fetch(`${BASE_URL}/profile/get.php`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Patients
export async function getNursePatients(query = '', page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: pageSize.toString(),
  });

  const response = await fetch(`${BASE_URL}/patients/get-all.php?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
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