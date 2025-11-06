const BASE_URL = '/api/nurse_api';

// Schedule
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
