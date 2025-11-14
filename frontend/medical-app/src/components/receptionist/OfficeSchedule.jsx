// =====================================================
// UPDATED loadScheduleData function for OfficeSchedule.jsx
// =====================================================
// Replace your existing loadScheduleData function with this version
// This properly uses the fixed PHP APIs and work_schedule data

const loadScheduleData = async () => {
  try {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // OPTION 1: Use get-schedule.php for day-specific accurate schedules (RECOMMENDED)
    // This respects the work_schedule table and shows different doctors on different days
    const scheduleResponse = await fetch(
      `/receptionist_api/doctors/get-schedule.php?office_id=${officeId}&date=${dateStr}`,
      { credentials: 'include' }
    );
    const scheduleResult = await scheduleResponse.json();
    
    if (scheduleResult.success) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
      
      const doctorsWithDetails = (scheduleResult.schedules || []).map((doc, index) => ({
        doctor_id: doc.Doctor_id,
        Doctor_id: doc.Doctor_id,
        first_name: doc.First_Name,
        First_Name: doc.First_Name,
        last_name: doc.Last_Name,
        Last_Name: doc.Last_Name,
        specialty_name: doc.specialty_name,
        specialty_id: doc.specialty_id,
        color: colors[index % colors.length],
        workDays: [selectedDate.getDay()], // Only works on selected day
        startTime: doc.start_hour,
        endTime: doc.end_hour,
        start_time: doc.start_time,
        end_time: doc.end_time
      }));
      
      setDoctors(doctorsWithDetails);
    } else {
      // Fallback to empty if no schedules found
      setDoctors([]);
    }

    /* 
    // OPTION 2: Use get-by-office.php (simpler but less day-specific)
    // Uncomment this and comment out OPTION 1 above if you prefer simpler logic
    
    const doctorsResponse = await fetch(
      `/receptionist_api/doctors/get-by-office.php?office_id=${officeId}`,
      { credentials: 'include' }
    );
    const doctorsResult = await doctorsResponse.json();
    
    if (doctorsResult.success) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
      
      const doctorsWithDetails = (doctorsResult.doctors || []).map((doc, index) => ({
        doctor_id: doc.Doctor_id,
        Doctor_id: doc.Doctor_id,
        first_name: doc.First_Name,
        First_Name: doc.First_Name,
        last_name: doc.Last_Name,
        Last_Name: doc.Last_Name,
        specialty_name: doc.specialty_name,
        specialty_id: doc.specialty_id,
        color: colors[index % colors.length],
        workDays: [1, 2, 3, 4, 5], // Monday-Friday (update if you want day-specific)
        startTime: 9,  // Default hours - get-by-office.php includes earliest_start/latest_end
        endTime: 17
      }));
      
      setDoctors(doctorsWithDetails);
    }
    */
    
    // Get appointments for selected date (UNCHANGED - this part stays the same)
    const appointmentsResponse = await fetch(
      `/receptionist_api/appointments/get-by-date.php?date=${dateStr}`,
      { credentials: 'include' }
    );
    const appointmentsResult = await appointmentsResponse.json();
    
    if (appointmentsResult.success) {
      // Convert appointments to booked slots lookup
      // Filter out cancelled appointments so those slots become available
      const slots = {};
      (appointmentsResult.appointments || []).forEach(apt => {
        // Skip cancelled appointments - they don't block slots
        if (apt.status === 'Cancelled' || apt.status === 'Canceled') {
          return;
        }
        
        // Extract date and time from Appointment_date (format: "YYYY-MM-DD HH:MM:SS")
        const appointmentDateTime = apt.Appointment_date; // e.g., "2025-11-11 11:00:00"
        const key = `${apt.Doctor_id}-${appointmentDateTime}`;
        slots[key] = {
          appointment_id: apt.Appointment_id,
          Patient_id: apt.Patient_id,
          Doctor_id: apt.Doctor_id,
          patient_name: apt.patientName,
          doctor_name: apt.doctorName,
          Appointment_date: apt.Appointment_date,
          reason: apt.reason,
          status: apt.status
        };
      });
      setBookedSlots(slots);
    }
    
  } catch (err) {
    console.error('Failed to load schedule:', err);
    setDoctors([]); // Clear doctors on error
    setBookedSlots({}); // Clear appointments on error
  } finally {
    setLoading(false);
  }
};

// =====================================================
// ADDITIONAL HELPER FUNCTION (add this to your component)
// =====================================================
// Enhanced function to check if doctor works on selected day
// This is more accurate than the original version

/**
 * Check if doctor works on selected day
 * With the new API, this is automatically handled by get-schedule.php
 * which only returns doctors scheduled for the selected date
 */
const isDoctorWorking = (doctor) => {
  const dayOfWeek = selectedDate.getDay();
  
  // If using get-schedule.php (OPTION 1), doctor.workDays only contains days they work
  // So this check is more reliable
  return doctor.workDays && doctor.workDays.includes(dayOfWeek);
};

