// src/api/receptionistApi.js
import { apiRequest } from './http.js';

/**
 * Receptionist API Module
 * All backend endpoints for receptionist portal functionality
 */

// ==========================================
// PATIENT APIs
// ==========================================

export const searchPatients = (searchQuery = '') =>
  apiRequest('receptionist_api/patients/get-all.php', { 
    params: searchQuery ? { q: searchQuery } : {} 
  });

export const getPatientById = (patientId) =>
  apiRequest('receptionist_api/patients/get-by-id.php', { 
    params: { id: patientId } 
  });

export const createPatient = (patientData) =>
  apiRequest('receptionist_api/patients/create.php', { 
    method: 'POST', 
    body: patientData 
  });

export const updatePatient = (patientId, patientData) =>
  apiRequest('receptionist_api/patients/update.php', { 
    method: 'PUT', 
    body: { Patient_ID: patientId, ...patientData } 
  });

// ==========================================
// APPOINTMENT APIs
// ==========================================

export const getAppointmentsByOffice = (officeId, startDate = null, endDate = null) => {
  const params = { office_id: officeId };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  return apiRequest('receptionist_api/appointments/get-by-office.php', { params });
};

export const getAppointmentsByDate = (date, officeId) =>
  apiRequest('receptionist_api/appointments/get-by-date.php', { 
    params: { date, office_id: officeId } 
  });

export const getDoctorAvailability = (doctorId, date) =>
  apiRequest('receptionist_api/appointments/get-availability.php', { 
    params: { doctor_id: doctorId, date } 
  });

export const createAppointment = (appointmentData) =>
  apiRequest('receptionist_api/appointments/create.php', { 
    method: 'POST', 
    body: appointmentData 
  });

export const updateAppointment = (appointmentId, appointmentData) =>
  apiRequest('receptionist_api/appointments/update.php', { 
    method: 'PUT', 
    body: { Appointment_id: appointmentId, ...appointmentData } 
  });

export const cancelAppointment = (appointmentId, reason = '') =>
  apiRequest('receptionist_api/appointments/cancel.php', { 
    method: 'PUT', 
    body: { Appointment_id: appointmentId, cancellation_reason: reason } 
  });

export const checkInAppointment = (appointmentId) =>
  apiRequest('receptionist_api/appointments/check-in.php', { 
    method: 'PUT', 
    body: { Appointment_id: appointmentId } 
  });

// ==========================================
// PAYMENT APIs
// ==========================================

export const recordPayment = (paymentData) =>
  apiRequest('receptionist_api/payments/create.php', { 
    method: 'POST', 
    body: paymentData 
  });

export const getPaymentsByPatient = (patientId) =>
  apiRequest('receptionist_api/payments/get-by-patient.php', { 
    params: { patient_id: patientId } 
  });

export const getPaymentsByDate = (date, officeId) =>
  apiRequest('receptionist_api/payments/get-by-date.php', { 
    params: { date, office_id: officeId } 
  });

// ==========================================
// DOCTOR APIs
// ==========================================

export const getDoctorsByOffice = (officeId) =>
  apiRequest('receptionist_api/doctors/get-by-office.php', { 
    params: { office_id: officeId } 
  });

export const getDoctorSchedule = (doctorId, date) =>
  apiRequest('receptionist_api/doctors/get-schedule.php', { 
    params: { doctor_id: doctorId, date } 
  });

export const getAllDoctors = () =>
  apiRequest('receptionist_api/doctors/get-all.php');

// ==========================================
// DASHBOARD APIs
// ==========================================

export const getDashboardStats = (officeId, date = null) => {
  const params = { office_id: officeId };
  if (date) params.date = date;
  
  return apiRequest('receptionist_api/dashboard/stats.php', { params });
};

export const getTodayAppointments = (officeId) =>
  apiRequest('receptionist_api/dashboard/today.php', { 
    params: { office_id: officeId } 
  });

// ==========================================
// OFFICE APIs
// ==========================================

export const getOfficeById = (officeId) =>
  apiRequest('receptionist_api/offices/get-by-id.php', { 
    params: { office_id: officeId } 
  });

export const getAllOffices = () =>
  apiRequest('receptionist_api/offices/get-all.php');

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
  // Patients
  searchPatients,
  getPatientById,
  createPatient,
  updatePatient,
  
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
  
  // Doctors
  getDoctorsByOffice,
  getDoctorSchedule,
  getAllDoctors,
  
  // Dashboard
  getDashboardStats,
  getTodayAppointments,
  
  // Office
  getOfficeById,
  getAllOffices,
  
  // Utilities
  formatDateForAPI,
  formatDateTimeForAPI,
  generateTransactionId,
  parseTime
};