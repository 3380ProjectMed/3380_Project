/* eslint-disable no-unused-vars */
/**
 * Nurse API client (JS + JSDoc)
 * - Uses fetch
 * - Centralizes headers, token injection, JSON parsing and ApiError handling
 * - Falls back to guarded mocks when VITE_USE_MOCKS === 'true'
 */

/**
 * @typedef {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} HttpMethod
 */

/**
 * ApiError carries HTTP status and parsed response body (if any)
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {any} data
   */
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS || '') === 'true';

/**
 * Read token from localStorage. Try JSON parse first (some code stores as JSON string).
 * @returns {string}
 */
export function getToken() {
  try {
    // stored value sometimes double-quoted
    const raw = localStorage.getItem('auth.token');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch (e) {
    return localStorage.getItem('auth.token') || '';
  }
}

/**
 * Low-level request helper used by all exports.
 * @template T
 * @param {HttpMethod} method
 * @param {string} path
 * @param {any} [body]
 * @param {RequestInit} [init]
 * @returns {Promise<T>}
 */
export async function request(method, path, body, init = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    ...init,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError((data && data.message) || res.statusText || 'Request failed', res.status, data);
  }
  return /** @type {T} */ (data);
}

/* ---------------------- Mock helpers (used only when VITE_USE_MOCKS) ---------------------- */
function mockDelay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockDashboard(dateISO) {
  await mockDelay(120);
  return {
    totalAppointments: 42,
    waitingCount: 5,
    upcomingCount: 8,
    completedCount: 29,
  };
}

async function mockSchedule() {
  await mockDelay(120);
  return [
    { id: 'A100', time: '08:30', patientId: 'P001', patientName: 'James Patterson', reason: 'Follow-up', status: 'Scheduled' },
    { id: 'A101', time: '09:00', patientId: 'P002', patientName: 'Sarah Connor', reason: 'Flu', status: 'In Waiting' },
  ];
}

async function mockPatients() {
  await mockDelay(100);
  return {
    items: [
      { id: 'P001', name: 'James Patterson', dob: '1975-04-12', allergies: 'Penicillin', phone: '555-0111', email: 'james@example.com' },
      { id: 'P002', name: 'Sarah Connor', dob: '1990-08-23', allergies: '', phone: '555-0122', email: 'sarah@example.com' },
    ],
    total: 2,
  };
}

/* ---------------------- Exports: API surface ---------------------- */

/**
 * @typedef {{ totalAppointments: number; waitingCount: number; upcomingCount: number; completedCount: number }} NurseStats
 */
/**
 * Get nurse dashboard stats
 * GET /nurse/dashboard?date=YYYY-MM-DD
 * @param {string} [dateISO]
 * @returns {Promise<NurseStats>}
 */
export async function getNurseDashboardStats(dateISO) {
  if (USE_MOCKS) return mockDashboard(dateISO);
  const qs = dateISO ? `?${new URLSearchParams({ date: dateISO }).toString()}` : '';
  return request('/nurse/dashboard'.startsWith('/') ? 'GET' : 'GET', `/nurse/dashboard${qs}`);
}

/**
 * @typedef {{ id: string; time: string; patientId: string; patientName: string; reason: string; status: 'Scheduled'|'In Waiting'|'In Consultation'|'Completed' }} NurseAppt
 */
/**
 * Get nurse schedule
 * GET /nurse/schedule?date=&status=&q=
 * @param {{ date?: string; status?: string; q?: string }} params
 * @returns {Promise<NurseAppt[]>}
 */
export async function getNurseSchedule(params = {}) {
  if (USE_MOCKS) return mockSchedule();
  const qs = new URLSearchParams();
  if (params.date) qs.set('date', params.date);
  if (params.status) qs.set('status', params.status);
  if (params.q) qs.set('q', params.q);
  const path = `/nurse/schedule${qs.toString() ? `?${qs.toString()}` : ''}`;
  return request('GET', path);
}

/**
 * Update appointment status
 * PATCH /nurse/schedule/:id/status
 * @param {string} apptId
 * @param {NurseAppt['status']} status
 * @returns {Promise<{ok:true}>}
 */
export async function updateAppointmentStatus(apptId, status) {
  // Call public update-status proxy which accepts apptId and status
  const qs = new URLSearchParams({ apptId: String(apptId) }).toString();
  return request('POST', `/nurse/schedule/update-status.php?${qs}`, { status });
}

/**
 * @typedef {{ id: string; name: string; dob: string; allergies?: string; phone?: string; email?: string }} NursePatient
 */
/**
 * Search nurse patients
 * GET /nurse/patients?q=&page=&pageSize=
 * @param {string} [q]
 * @param {number} [page]
 * @param {number} [pageSize]
 * @returns {Promise<{ items: NursePatient[]; total: number }>}
 */
export async function searchNursePatients(q, page, pageSize) {
  if (USE_MOCKS) return mockPatients();
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (page != null) qs.set('page', String(page));
  if (pageSize != null) qs.set('pageSize', String(pageSize));
  const path = `/nurse/patients${qs.toString() ? `?${qs.toString()}` : ''}`;
  return request('GET', path);
}

/**
 * Get nurse patient by id
 * GET /nurse/patients/:id
 * @param {string} id
 * @returns {Promise<NursePatient>}
 */
export async function getNursePatientById(id) {
  return request('GET', `/nurse/patients/${encodeURIComponent(id)}`);
}

/**
 * @typedef {{ bp?: string; hr?: string; temp?: string; spo2?: string; height?: string; weight?: string }} VitalsPayload
 */
/**
 * @typedef {{ notes: string; allergies?: string; meds?: string[] }} IntakePayload
 */
/**
 * Save nurse vitals
 * POST /nurse/clinical/:apptId/vitals
 * @param {string} apptId
 * @param {VitalsPayload} payload
 * @returns {Promise<{ok:true}>}
 */
export async function saveNurseVitals(apptId, payload) {
  return request('POST', `/nurse/clinical/${encodeURIComponent(apptId)}/vitals`, payload);
}

/**
 * Save nurse intake
 * POST /nurse/clinical/:apptId/intake
 * @param {string} apptId
 * @param {IntakePayload} payload
 * @returns {Promise<{ok:true}>}
 */
export async function saveNurseIntake(apptId, payload) {
  return request('POST', `/nurse/clinical/${encodeURIComponent(apptId)}/intake`, payload);
}

/**
 * Save a clinical note
 * POST /nurse/clinical/save-note.php?apptId=
 * @param {string} apptId
 * @param {{ body: string }} payload
 * @returns {Promise<{ok:true,id:number}>}
 */
export async function saveNurseNote(apptId, payload) {
  return request('POST', `/nurse/clinical/save-note.php?apptId=${encodeURIComponent(apptId)}`, payload);
}

/**
 * Get notes for an appointment
 * GET /nurse/clinical/get-notes.php?apptId=
 * @param {string} apptId
 * @returns {Promise<any[]>}
 */
export async function getNurseNotes(apptId) {
  return request('GET', `/nurse/clinical/get-notes.php?apptId=${encodeURIComponent(apptId)}`);
}

/**
 * Get vitals for an appointment
 * GET /nurse/clinical/get-vitals.php?apptId=
 * @param {string} apptId
 * @returns {Promise<any>}
 */
export async function getNurseVitals(apptId) {
  return request('GET', `/nurse/clinical/get-vitals.php?apptId=${encodeURIComponent(apptId)}`);
}

/**
 * Get visit summary
 * GET /nurse/clinical/:apptId/summary
 * @param {string} apptId
 * @returns {Promise<{ appt: NurseAppt; patient: NursePatient; vitals?: VitalsPayload; intake?: IntakePayload }>}
 */
export async function getNurseVisitSummary(apptId) {
  // Use get-summary.php with apptId query param
  const qs = new URLSearchParams({ apptId: String(apptId) }).toString();
  return request('GET', `/nurse/clinical/get-summary.php?${qs}`);
}

/**
 * Get nurse reports
 * GET /nurse/reports?range=&from=&to=
 * @param {{ range?: 'today'|'7d'|'30d'|'custom'; from?: string; to?: string }} params
 * @returns {Promise<any>}
 */
export async function getNurseReports(params = {}) {
  const qs = new URLSearchParams();
  if (params.range) qs.set('range', params.range);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  const path = `/nurse/reports${qs.toString() ? `?${qs.toString()}` : ''}`;
  return request('GET', path);
}

/**
 * @typedef {{ patientId: string; toDepartment: string; notes?: string }} ReferralPayload
 */
/**
 * Submit a referral
 * POST /nurse/referrals
 * @param {ReferralPayload} payload
 * @returns {Promise<{ id: string; createdAt: string }>}
 */
export async function submitNurseReferral(payload) {
  return request('POST', '/nurse/referrals', payload);
}

/**
 * @typedef {{ firstName: string; lastName: string; email: string; location?: string }} NurseProfileType
 */
/**
 * Get nurse profile
 * GET /nurse/profile
 * @returns {Promise<NurseProfileType>}
 */
export async function getNurseProfile() {
  return request('GET', '/nurse/profile');
}

/**
 * Update nurse profile
 * PUT /nurse/profile
 * @param {Partial<NurseProfileType>} p
 * @returns {Promise<NurseProfileType>}
 */
export async function updateNurseProfile(p) {
  return request('PUT', '/nurse/profile', p);
}

/* ---------------------- Examples ---------------------- */
// Example usage in a component:
// import { getNurseDashboardStats, getNurseSchedule, saveNurseVitals } from '../api/nurse';
// const stats = await getNurseDashboardStats();
// const appts = await getNurseSchedule({ date: '2025-10-23' });
// await saveNurseVitals('A001', { bp: '120/80', hr: '72', spo2: '99' });

export default {
  getNurseDashboardStats,
  getNurseSchedule,
  updateAppointmentStatus,
  searchNursePatients,
  getNursePatientById,
  saveNurseVitals,
  saveNurseNote,
  getNurseNotes,
  getNurseVitals,
  saveNurseIntake,
  getNurseVisitSummary,
  getNurseReports,
  submitNurseReferral,
  getNurseProfile,
  updateNurseProfile,
  ApiError,
};
