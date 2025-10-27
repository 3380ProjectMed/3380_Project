// src/api/receptionistApi.js
/**
 * Receptionist API Module - Updated to follow Doctor API pattern
 * Uses session-based authentication (credentials: 'include')
 * All endpoints automatically use the logged-in receptionist's office
 */

const API_BASE = '/api/receptionist_api';

/**
 * Helper function to make API requests with session credentials
 */
async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    params = {}
  } = options;

  // Build URL with query parameters
  let url = `${API_BASE}/${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });
    url += '?' + searchParams.toString();
  }

  // Build request config with session credentials
  const config = {
    method,
    credentials: 'include', // Critical for session-based auth
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Add body for POST/PUT requests
  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Receptionist API Error:', error);
    throw error;
  }
}

// ==========================================
// DASHBOARD APIs
// ==========================================

/**
 * Get dashboard statistics for receptionist's office
 * Automatically uses logged-in receptionist's office
 */
export const getDashboardStats = (date = null) => {
  const params = {};
  if (date) params.date = date;
  return apiRequest('dashboard/stats.php', { params });
};

/**
 * Get today's appointments for receptionist's office
 * Automatically uses logged-in receptionist's office
 */
export const getTodayAppointments = () =>
  apiRequest('dashboard/today.php');

// ==========================================
// APPOINTMENT APIs
// ==========================================

/**
 * Get appointments for receptionist's office within date range
 * Automatically uses logged-in receptionist's office
 */
export const getAppointmentsByOffice = (startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  return apiRequest('appointments/get-by-office.php', { params });
};

/**
 * Get appointments for a specific date at receptionist's office
 */
export const getAppointmentsByDate = (date) =>
  apiRequest('appointments/get-by-date.php', { params: { date } });

/**
 * Get doctor availability for booking
 */
export const getDoctorAvailability = (doctorId, date) =>
  apiRequest('appointments/get-availability.php', { 
    params: { doctor_id: doctorId, date } 
  });

/**
 * Create a new appointment
 * Office_id is validated against receptionist's assigned office
 */
export const createAppointment = (appointmentData) =>
  apiRequest('appointments/create.php', { 
    method: 'POST', 
    body: appointmentData 
  });

/**
 * Update an existing appointment
 * Access is validated against receptionist's office
 */
export const updateAppointment = (appointmentId, appointmentData) =>
  apiRequest('appointments/update.php', { 
    method: 'PUT', 
    body: { Appointment_id: appointmentId, ...appointmentData } 
  });

/**
 * Cancel an appointment
 */
export const cancelAppointment = (appointmentId, reason = '') =>
  apiRequest('appointments/cancel.php', { 
    method: 'PUT', 
    body: { Appointment_id: appointmentId, cancellation_reason: reason } 
  });

/**
 * Check in a patient for their appointment
 */
export const checkInAppointment = (appointmentId) =>
  apiRequest('appointments/check-in.php', { 
    method: 'PUT', 
    body: { Appointment_id: appointmentId } 
  });

// ==========================================
// PAYMENT APIs
// ==========================================

/**
 * Record a payment for an appointment
 */
export const recordPayment = (paymentData) =>
  apiRequest('payments/create.php', { 
    method: 'POST', 
    body: paymentData 
  });

/**
 * Get payment history for a specific patient
 */
export const getPaymentsByPatient = (patientId) =>
  apiRequest('payments/get-by-patient.php', { 
    params: { patient_id: patientId } 
  });

/**
 * Get payments for a specific date at receptionist's office
 */
export const getPaymentsByDate = (date) =>
  apiRequest('payments/get-by-date.php', { 
    params: { date } 
  });

// ==========================================
// PATIENT APIs (Keep existing if they're already working)
// ==========================================

export const searchPatients = (searchQuery = '') =>
  apiRequest('patients/get-all.php', { 
    params: searchQuery ? { q: searchQuery } : {} 
  });

export const getPatientById = (patientId) =>
  apiRequest('patients/get-by-id.php', { 
    params: { id: patientId } 
  });

export const createPatient = (patientData) =>
  apiRequest('patients/create.php', { 
    method: 'POST', 
    body: patientData 
  });

export const updatePatient = (patientId, patientData) =>
  apiRequest('patients/update.php', { 
    method: 'PUT', 
    body: { Patient_ID: patientId, ...patientData } 
  });

// ==========================================
// DOCTOR APIs (Keep existing if they're already working)
// ==========================================

export const getDoctorsByOffice = (officeId) =>
  apiRequest('doctors/get-by-office.php', { 
    params: { office_id: officeId } 
  });

export const getDoctorSchedule = (doctorId, date) =>
  apiRequest('doctors/get-schedule.php', { 
    params: { doctor_id: doctorId, date } 
  });

export const getAllDoctors = () =>
  apiRequest('doctors/get-all.php');

// ==========================================
// OFFICE APIs (Keep existing if they're already working)
// ==========================================

export const getOfficeById = (officeId) =>
  apiRequest('offices/get-by-id.php', { 
    params: { office_id: officeId } 
  });

export const getAllOffices = () =>
  apiRequest('offices/get-all.php');

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format datetime for API (YYYY-MM-DD HH:MM:SS)
 */
export const formatDateTimeForAPI = (date, hour, minute) => {
  const dateStr = formatDateForAPI(date);
  const hourStr = String(hour).padStart(2, '0');
  const minStr = String(minute).padStart(2, '0');
  return `${dateStr} ${hourStr}:${minStr}:00`;
};

/**
 * Generate transaction ID for payments
 */
export const generateTransactionId = () => {
  return 'PAY' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
};

/**
 * Parse time from datetime string
 */
export const parseTime = (datetime) => {
  const date = new Date(datetime);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Default export with all functions
export default {
  // Dashboard
  getDashboardStats,
  getTodayAppointments,
  
  // Appointments
  getAppointmentsByOffice,
  getAppointmentsByDate,
  getDoctorAvailability,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  checkInAppointment,
  
  // Payments
  recordPayment,
  getPaymentsByPatient,
  getPaymentsByDate,
  
  // Patients
  searchPatients,
  getPatientById,
  createPatient,
  updatePatient,
  
  // Doctors
  getDoctorsByOffice,
  getDoctorSchedule,
  getAllDoctors,
  
  // Office
  getOfficeById,
  getAllOffices,
  
  // Utilities
  formatDateForAPI,
  formatDateTimeForAPI,
  generateTransactionId,
  parseTime
};