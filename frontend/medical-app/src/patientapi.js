import { j } from './api/api.js';

// Use direct backend host during development to avoid dev-proxy mismatch or origin issues.
// Vite provides import.meta.env.DEV which is true in dev server.
// In production, the backend should be at the same origin (Azure App Service)
const PATIENT_API_BASE = import.meta.env.DEV ? '' : '';

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getDashboard: () => j(`${PATIENT_API_BASE}/patient_api.php?endpoint=dashboard`)
};

// ==================== PROFILE ====================
export const profileAPI = {
  getProfile: () => j(`${PATIENT_API_BASE}/patient_api.php?endpoint=profile`),

  updateProfile: (profileData) => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=profile`, {
      method: 'PUT',
      body: profileData
    })
};

// ==================== APPOINTMENTS ====================
export const appointmentsAPI = {
  getUpcoming: () => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=appointments&type=upcoming`),

  getHistory: () => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=appointments&type=history`),

  bookAppointment: (appointmentData) => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=appointments`, {
      method: 'POST',
      body: appointmentData
    }),

  cancelAppointment: (appointmentId) => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=appointments&id=${appointmentId}`, {
      method: 'DELETE'
    }),

  getDoctors: (specialty = null) => {
    const url = specialty 
      ? `${PATIENT_API_BASE}/patient_api.php?endpoint=doctors&specialty=${encodeURIComponent(specialty)}`
      : `${PATIENT_API_BASE}/patient_api.php?endpoint=doctors`;
    return j(url);
  },

  getOffices: () => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=offices`)
}

// ==================== MEDICAL RECORDS ====================
export const medicalRecordsAPI = {
  getVitals: () => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=vitals`),

  getMedications: () => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=medications`),

  getAllergies: () => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=allergies`),

  getConditions: () => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=conditions`),

  getVisitSummaries: () => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=visit-summaries`),

  addMedication: (medicationData) =>
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=medications`, {
    method: 'POST',
    body: medicationData
  }),

  updateAllergy: (allergyData) =>
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=allergies`, {
    method: 'POST',
    body: allergyData
  }),

  getAllAvailableAllergies: () =>
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=medical-records&type=all-allergies`)
};

// ==================== VISITS ====================
export const visitAPI = {
  getVisitById: (visitId) => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=visit&id=${visitId}`)
};

// ==================== INSURANCE ====================
export const insuranceAPI = {
  getInsurance: () => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=insurance`),

  getInsurancePayers: () =>
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=insurance&type=payers`),

  addInsurance: (insuranceData) => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=insurance`, {
      method: 'POST',
      body: insuranceData
    }),

  updateInsurance: (insuranceId, insuranceData) => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=insurance&id=${insuranceId}`, {
      method: 'PUT',
      body: insuranceData
    }),

  removeInsurance: (insuranceId) => 
  j(`${PATIENT_API_BASE}/patient_api.php?endpoint=insurance&id=${insuranceId}`, {
      method: 'DELETE'
    })
};

// ==================== BILLING ====================
export const billingAPI = {
  getBalance: () => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=billing&type=balance`),

  getStatements: () => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=billing&type=statements`),

  makePayment: (paymentData) => 
    j(`${PATIENT_API_BASE}/patient_api.php?endpoint=billing`, {
      method: 'POST',
      body: paymentData
    })
};

// Export grouped API object
export default {
  dashboard: dashboardAPI,
  profile: profileAPI,
  appointments: appointmentsAPI,
  medicalRecords: medicalRecordsAPI,
  visits: visitAPI,
  insurance: insuranceAPI,
  billing: billingAPI
};