// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getDashboard: () => j('/api/patient_api.php?endpoint=dashboard')
};

// ==================== PROFILE ====================
export const profileAPI = {
  getProfile: () => j('/api/patient_api.php?endpoint=profile'),

  updateProfile: (profileData) => 
    j('/api/patient_api.php?endpoint=profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    })
};

// ==================== APPOINTMENTS ====================
export const appointmentsAPI = {
  getUpcoming: () => 
    j('/api/patient_api.php?endpoint=appointments&type=upcoming'),

  getHistory: () => 
    j('/api/patient_api.php?endpoint=appointments&type=history'),

  bookAppointment: (appointmentData) => 
    j('/api/patient_api.php?endpoint=appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    }),

  cancelAppointment: (appointmentId) => 
    j(`/api/patient_api.php?endpoint=appointments&id=${appointmentId}`, {
      method: 'DELETE'
    }),

  getDoctors: () => 
    j('/api/patient_api.php?endpoint=doctors'),

  getOffices: () => 
    j('/api/patient_api.php?endpoint=offices')
};

// ==================== MEDICAL RECORDS ====================
export const medicalRecordsAPI = {
  getVitals: () => 
    j('/api/patient_api.php?endpoint=medical-records&type=vitals'),

  getMedications: () => 
    j('/api/patient_api.php?endpoint=medical-records&type=medications'),

  getAllergies: () => 
    j('/api/patient_api.php?endpoint=medical-records&type=allergies'),

  getConditions: () => 
    j('/api/patient_api.php?endpoint=medical-records&type=conditions'),

  getVisitSummaries: () => 
    j('/api/patient_api.php?endpoint=medical-records&type=visit-summaries')
};

// ==================== INSURANCE ====================
export const insuranceAPI = {
  getInsurance: () => 
    j('/api/patient_api.php?endpoint=insurance'),

  addInsurance: (insuranceData) => 
    j('/api/patient_api.php?endpoint=insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insuranceData)
    }),

  updateInsurance: (insuranceId, insuranceData) => 
    j(`/api/patient_api.php?endpoint=insurance&id=${insuranceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insuranceData)
    }),

  removeInsurance: (insuranceId) => 
    j(`/api/patient_api.php?endpoint=insurance&id=${insuranceId}`, {
      method: 'DELETE'
    })
};

// ==================== BILLING ====================
export const billingAPI = {
  getBalance: () => 
    j('/api/patient_api.php?endpoint=billing&type=balance'),

  getStatements: () => 
    j('/api/patient_api.php?endpoint=billing&type=statements'),

  processPayment: (paymentData) => 
    j('/api/patient_api.php?endpoint=billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    })
};

// Export grouped API object
export default {
  dashboard: dashboardAPI,
  profile: profileAPI,
  appointments: appointmentsAPI,
  medicalRecords: medicalRecordsAPI,
  insurance: insuranceAPI,
  billing: billingAPI
};