import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Calendar, Clock, AlertCircle, FileText, Activity,
  Heart, Thermometer, Droplet, Pill, History, Save, X, ChevronDown, ChevronUp,
  Plus, Trash2, Edit2, Clipboard
} from 'lucide-react';
import './ClinicalWorkSpace.css';

export default function ClinicalWorkSpace({ appointmentId, patientId, patient, onClose }) {
  const [patientData, setPatientData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [presentIllnesses, setPresentIllnesses] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);
  // Medical Condition management
const [showConditionForm, setShowConditionForm] = useState(false);
const [editingCondition, setEditingCondition] = useState(null);
const [conditionForm, setConditionForm] = useState({
  condition_name: '',
  diagnosis_date: new Date().toISOString().split('T')[0]
});
  // Treatment management
  const [treatmentCatalog, setTreatmentCatalog] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [showTreatmentSelector, setShowTreatmentSelector] = useState(false);
  
  // Prescription management
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    refills_allowed: 0,
    notes: ''
  });
  
  const [expandedSections, setExpandedSections] = useState({
    vitals: true,
    treatments: true,
    currentMedications: true,
    chronicConditions: true,
    medicalHistory: false,
    medicationHistory: false,
    previousNotes: false
  });

  useEffect(() => {
    if (patient) {
      setPatientData({
        success: true,
        has_visit: false,
        patient: patient,
        visit: {
          patient_id: patient.patient_id || patient.id,
          reason: '',
          status: null,
          diagnosis: null
        },
        vitals: {
          blood_pressure: null,
          temperature: null,
          recorded_by: null
        },
        treatments: []
      });
      setLoading(false);
      fetchTreatmentCatalog();
      const pid = patient.patient_id || patient.id;
      if (pid) {fetchPrescriptions(pid, 0)
        fetchMedicalConditions(pid);
      };
      if (patient.patient_id || patient.id) {
        fetchNotesByPatientId(patient.patient_id || patient.id);
      }
    } 
    // If appointmentId is provided, fetch by appointment
    if (appointmentId) {
      fetchPatientDetails();
      fetchNotes();
      fetchTreatmentCatalog();
    }
    // If only patientId is provided, fetch by patient
    else if (patientId) {
      fetchPatientDetailsByPatientId();
      fetchNotesByPatientId(patientId);
      fetchTreatmentCatalog();
    }
   
  }, [appointmentId, patientId, patient]);

  const showAlert = (message, type = 'success', timeout = 4000) => {
    setAlert({ message, type });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), timeout);
  };

  useEffect(() => {
    return () => {
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-patient-details.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      if (data.success) {
        setPatientData(data);
        
        if (data.visit && data.visit.diagnosis) {
          setDiagnosis(data.visit.diagnosis);
        }
        if (data.visit && data.visit.present_illnesses) {
          setPresentIllnesses(data.visit.present_illnesses);
        }
        
        if (data.treatments && Array.isArray(data.treatments) && data.treatments.length > 0) {
          setSelectedTreatments(data.treatments);
        } else {
          setSelectedTreatments([]);
        }
        const pid = data.patient?.patient_id || data.patient?.id;
        const aid = data.visit?.appointment_id || appointmentId || 0;
        if (pid) fetchPrescriptions(pid, aid);
      } else if (data.has_visit === false) {
        await fetchBasicPatientInfo();
      } else {
        throw new Error(data.error || 'Failed to load patient data');
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError(err.message || 'Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetailsByPatientId = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-patient-details.php?patient_id=${patientId}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPatientData(data);
        
        if (data.visit && data.visit.diagnosis) {
          setDiagnosis(data.visit.diagnosis);
        }
        if (data.visit && data.visit.present_illnesses) {
          setPresentIllnesses(data.visit.present_illnesses);
        }
        
        if (data.treatments && Array.isArray(data.treatments) && data.treatments.length > 0) {
          setSelectedTreatments(data.treatments);
        } else {
          setSelectedTreatments([]);
        }
        const pid = data.patient?.patient_id || data.patient?.id || patientId;
        if (pid) fetchPrescriptions(pid, 0);
      } else {
        throw new Error(data.error || 'Failed to load patient data');
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError(err.message || 'Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicPatientInfo = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';

      const aptResponse = await fetch(
        `${API_BASE}/doctor_api/appointments/get.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );

      if (!aptResponse.ok) {
        throw new Error('Could not fetch appointment details');
      }

      const aptData = await aptResponse.json();
      
      if (aptData.success && aptData.appointment) {
        const patientId = aptData.appointment.patient_id || aptData.appointment.Patient_id;
        
        const patResponse = await fetch(
          `${API_BASE}/doctor_api/patients/get-by-id.php?patient_id=${patientId}`,
          { credentials: 'include' }
        );

        if (!patResponse.ok) {
          throw new Error('Could not fetch patient information');
        }

        const patData = await patResponse.json();
        
        if (patData.success && patData.patient) {
          setPatientData({
            success: true,
            has_visit: false,
            visit: {
              appointment_id: appointmentId,
              patient_id: patientId,
              reason: aptData.appointment.reason || aptData.appointment.Reason_for_visit || '',
              status: null,
              diagnosis: null,
              treatment: null
            },
            vitals: {
              blood_pressure: null,
              temperature: null,
              recorded_by: null
            },
            treatments: [],
            patient: {
              id: patientId,
              name: patData.patient.name,
              dob: patData.patient.dob,
              age: patData.patient.age,
              gender: patData.patient.gender,
              blood_type: patData.patient.bloodType || patData.patient.blood_type,
              allergies: patData.patient.allergies,
              medicalHistory: patData.patient.medicalHistory || [],
              medicationHistory: patData.patient.medicationHistory || [],
              chronicConditions: patData.patient.chronicConditions || [],
              currentMedications: patData.patient.currentMedications || []
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching basic patient info:', err);
      setError('Patient has not checked in yet. Basic information unavailable.');
    }
  };

  const fetchNotes = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-notes.php?appointment_id=${appointmentId}`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        const incoming = data.notes || [];
        const sorted = [...incoming].sort((a, b) => {
          const getTime = (n) => {
            const d = n?.visit_date || n?.date || n?.created_at || n?.note_date || null;
            const t = d ? Date.parse(d) : NaN;
            return isNaN(t) ? 0 : t;
          };
          return getTime(b) - getTime(a);
        });
        setNotes(sorted);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const fetchNotesByPatientId = async (pid) => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-notes.php?patient_id=${pid}`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        const incoming = data.notes || [];
        const sorted = [...incoming].sort((a, b) => {
          const getTime = (n) => {
            const d = n?.visit_date || n?.date || n?.created_at || n?.note_date || null;
            const t = d ? Date.parse(d) : NaN;
            return isNaN(t) ? 0 : t;
          };
          return getTime(b) - getTime(a);
        });
        setNotes(sorted);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const fetchTreatmentCatalog = async () => {
    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/get-treatment.php`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTreatmentCatalog(data.treatments || []);
      }
    } catch (err) {
      console.error('Error fetching treatment catalog:', err);
    }
  };

  // Fetch prescriptions for patient (and optional appointment) and attach to patientData.patient.currentMedications
  const fetchPrescriptions = async (pid, aid = 0) => {
    try {
      if (!pid) return;
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
      let url = `${API_BASE}/doctor_api/clinical/get-prescription.php?patient_id=${pid}`;
      if (aid) url += `&appointment_id=${aid}`;

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        console.error('Failed to fetch prescriptions:', response.status);
        return;
      }

      const data = await response.json();
      if (!data.success) return;

      const mapped = (data.prescriptions || []).map(p => ({
        id: p.id,
        name: p.name,
        dosage: p.dosage,
        frequency: p.frequency,
        route: p.route,
        start_date: p.start_date,
        end_date: p.end_date,
        refills_allowed: p.refills_allowed,
        instructions: p.instructions,
        prescribed_by: p.prescribed_by
      }));

      setPatientData(prev => {
        if (!prev) return prev;
        const patientObj = { ...(prev.patient || {}) };
        patientObj.currentMedications = mapped;
        return { ...prev, patient: patientObj };
      });
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    }
  };

  const fetchMedicalConditions = async (pid) => {
  try {
    if (!pid) return;
    const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
      ? import.meta.env.VITE_API_BASE 
      : '';
    
    const response = await fetch(
      `${API_BASE}/doctor_api/clinical/get-medical-conditions.php?patient_id=${pid}`,
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch medical conditions:', response.status);
      return;
    }

    const data = await response.json();
    if (!data.success) return;

    const mapped = (data.conditions || []).map(c => ({
      condition_id: c.condition_id,
      condition_name: c.condition_name,
      diagnosis_date: c.diagnosis_date
    }));

    setPatientData(prev => {
      if (!prev) return prev;
      const patientObj = { ...(prev.patient || {}) };
      patientObj.medicalHistory = mapped.map(c => ({
        condition: c.condition_name,
        diagnosis_date: c.diagnosis_date,
        condition_id: c.condition_id
      }));
      patientObj.chronicConditions = mapped.map(c => c.condition_name);
      return { ...prev, patient: patientObj };
    });
  } catch (err) {
    console.error('Error fetching medical conditions:', err);
  }
};

  const handleSaveDiagnosis = async () => {
    if (!diagnosis.trim()) {
      showAlert('Please enter a diagnosis before saving', 'error');
      return;
    }

    // Check if we have a visit to save to
    if (!patientData?.visit?.visit_id && !appointmentId) {
      showAlert('Cannot save diagnosis: No active visit or appointment', 'error');
      return;
    }

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const payload = {
        diagnosis: diagnosis,
        present_illnesses: presentIllnesses || null
      };

      if (patientData?.visit?.visit_id) {
        payload.visit_id = patientData.visit.visit_id;
      } else if (appointmentId) {
        payload.appointment_id = appointmentId;
      }

      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/save-note.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // show a notification and clear the input fields
        showAlert('Save successfully', 'success');
        setDiagnosis('');
        setPresentIllnesses('');

        if (appointmentId) {
          fetchNotes();
          fetchPatientDetails();
        } else if (patientId) {
          fetchNotesByPatientId(patientId);
          fetchPatientDetailsByPatientId();
        }
      } else {
        throw new Error(data.error || 'Failed to save diagnosis');
      }
    } catch (err) {
      console.error('Error saving diagnosis:', err);
      showAlert('Error saving diagnosis: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTreatment = (treatment) => {
    const exists = selectedTreatments.find(t => t.treatment_id === treatment.treatment_id);
    if (!exists) {
      setSelectedTreatments([...selectedTreatments, {
        treatment_id: treatment.treatment_id,
        treatment_name: treatment.treatment_name,
        description: treatment.description,
        quantity: 1,
        cost_each: treatment.default_cost,
        notes: ''
      }]);
    }
    setShowTreatmentSelector(false);
  };

  const handleRemoveTreatment = (index) => {
    setSelectedTreatments(selectedTreatments.filter((_, i) => i !== index));
  };

  const handleUpdateTreatment = (index, field, value) => {
    const updated = [...selectedTreatments];
    updated[index][field] = value;
    setSelectedTreatments(updated);
  };

  const handleSaveTreatments = async () => {
    if (!patientData?.visit?.visit_id) {
      showAlert('Patient must check in before managing treatments', 'error');
      return;
    }

    // Allow saving even with 0 treatments (to delete all)
    const confirmMessage = selectedTreatments.length === 0
      ? 'This will remove all treatments from this visit. Continue?'
      : null;
    
    // proceed without blocking browser confirmation dialog

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/save-treatment.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visit_id: patientData.visit.visit_id,
            treatments: selectedTreatments
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        const message = data.message || 'Treatments updated successfully!';
        showAlert(message, 'success');
        
        if (appointmentId) {
          fetchPatientDetails();
          fetchNotes();
        } else if (patientId) {
          fetchPatientDetailsByPatientId();
          fetchNotesByPatientId(patientId);
        }
      } else {
        throw new Error(data.error || 'Failed to save treatments');
      }
    } catch (err) {
      console.error('Error saving treatments:', err);
      showAlert('Error saving treatments: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTreatment = async (tpv_id, treatmentName) => {
    // proceed without blocking browser confirmation dialog

    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/delete-treatment.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tpv_id: tpv_id })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showAlert(data.message || 'Treatment removed successfully', 'success');
        
        if (appointmentId) {
          fetchNotes();
          fetchPatientDetails();
        } else if (patientId) {
          fetchNotesByPatientId(patientId);
          fetchPatientDetailsByPatientId();
        } else if (patient) {
          fetchNotesByPatientId(patient.patient_id || patient.id);
        }
      } else {
        throw new Error(data.error || 'Failed to delete treatment');
      }
    } catch (err) {
      console.error('Error deleting treatment:', err);
      showAlert('Error deleting treatment: ' + err.message, 'error');
    }
  };

  const handleSavePrescription = async () => {
    if (!prescriptionForm.medication_name.trim()) {
      showAlert('Please enter medication name', 'error');
      return;
    }

    const currentPatientId = patientData?.patient?.id || patientData?.visit?.patient_id || patientId;
    if (!currentPatientId) {
      showAlert('Cannot save prescription: No patient ID available', 'error');
      return;
    }

    try {
      setSaving(true);
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const payload = {
        ...prescriptionForm,
        patient_id: currentPatientId,
        appointment_id: appointmentId || null,
        prescription_id: editingPrescription?.id || 0
      };

      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/save-prescription.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showAlert('Prescription saved successfully!', 'success');
        setShowPrescriptionForm(false);
        setEditingPrescription(null);
        setPrescriptionForm({
          medication_name: '',
          dosage: '',
          frequency: '',
          route: 'Oral',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          refills_allowed: 0,
          notes: ''
        });
        if (appointmentId) {
          fetchPatientDetails();
        } else if (patientId) {
          fetchPatientDetailsByPatientId();
        } else if (patient) {
          // Reload patient data
          fetchPatientDetailsByPatientId(currentPatientId);
        }
      } else {
        throw new Error(data.error || 'Failed to save prescription');
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      showAlert('Error saving prescription: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    // proceed without blocking browser confirmation dialog

    try {
      const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
        ? import.meta.env.VITE_API_BASE 
        : '';
      
      const response = await fetch(
        `${API_BASE}/doctor_api/clinical/delete-prescription.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prescription_id: prescriptionId })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showAlert('Prescription deleted successfully!', 'success');
        if (appointmentId) {
          fetchPatientDetails();
        } else if (patientId) {
          fetchPatientDetailsByPatientId();
        } else if (patient) {
          fetchPatientDetailsByPatientId(patient.patient_id || patient.id);
        }
      } else {
        throw new Error(data.error || 'Failed to delete prescription');
      }
    } catch (err) {
      console.error('Error deleting prescription:', err);
      showAlert('Error deleting prescription: ' + err.message, 'error');
    }
  };

  const handleEditPrescription = (med) => {
    setEditingPrescription(med);
    setPrescriptionForm({
      medication_name: med.name,
      dosage: med.frequency.split(' - ')[0] || '',
      frequency: med.frequency.split(' - ')[1] || '',
      route: med.route || 'Oral',
      start_date: med.start_date,
      end_date: med.end_date || '',
      refills_allowed: med.refills_allowed || 0,
      notes: med.instructions || ''
    });
    setShowPrescriptionForm(true);
  };
  const handleSaveCondition = async () => {
  if (!conditionForm.condition_name.trim()) {
    showAlert('Please enter condition name', 'error');
    return;
  }

  const currentPatientId = patientData?.patient?.id || patientData?.visit?.patient_id || patientId;
  if (!currentPatientId) {
    showAlert('Cannot save condition: No patient ID available', 'error');
    return;
  }

  try {
    setSaving(true);
    const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
      ? import.meta.env.VITE_API_BASE 
      : '';
    
    const payload = {
      ...conditionForm,
      patient_id: currentPatientId,
      condition_id: editingCondition?.condition_id || 0
    };

    const response = await fetch(
      `${API_BASE}/doctor_api/clinical/save-medical-condition.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    
    if (data.success) {
      showAlert(editingCondition ? 'Condition updated successfully!' : 'Condition added successfully!', 'success');
      setShowConditionForm(false);
      setEditingCondition(null);
      setConditionForm({
        condition_name: '',
        diagnosis_date: new Date().toISOString().split('T')[0]
      });
      
      // Reload medical conditions
      fetchMedicalConditions(currentPatientId);
    } else {
      throw new Error(data.error || 'Failed to save condition');
    }
  } catch (err) {
    console.error('Error saving condition:', err);
    showAlert('Error saving condition: ' + err.message, 'error');
  } finally {
    setSaving(false);
  }
};

const handleDeleteCondition = async (conditionId) => {
  // proceed without blocking browser confirmation dialog

  const currentPatientId = patientData?.patient?.id || patientData?.visit?.patient_id || patientId;

  console.log('Deleting condition:', { conditionId, currentPatientId }); // DEBUG

  try {
    const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) 
      ? import.meta.env.VITE_API_BASE 
      : '';
    
    const response = await fetch(
      `${API_BASE}/doctor_api/clinical/delete-medical-condition.php`,
      {
        method: 'POST', // Keep as POST for consistency
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          condition_id: conditionId,
          patient_id: currentPatientId
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      showAlert('Condition deleted successfully!', 'success');
      fetchMedicalConditions(currentPatientId);
    } else {
      throw new Error(data.error || 'Failed to delete condition');
    }
  } catch (err) {
    console.error('Error deleting condition:', err);
    showAlert('Error deleting condition: ' + err.message, 'error');
  }
};

const handleEditCondition = (item) => {
  setEditingCondition(item);
  setConditionForm({
    condition_name: item.condition,
    diagnosis_date: item.diagnosis_date || new Date().toISOString().split('T')[0]
  });
  setShowConditionForm(true);
};

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="clinical-workspace">
        <div className="workspace-loading">
          <div className="spinner"></div>
          <p>Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (error && !patientData) {
    return (
      <div className="clinical-workspace">
        <div className="workspace-header">
          <h2>Clinical Workspace</h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>
        <div className="workspace-error">
          <AlertCircle size={48} />
          <h3>Unable to Load Patient Information</h3>
          <p>{error}</p>
          <button onClick={() => {
            if (appointmentId) fetchPatientDetails();
            else if (patientId) fetchPatientDetailsByPatientId();
          }} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const patientInfo = patientData?.patient;
  const visit = patientData?.visit;
  const vitals = patientData?.vitals;
  const hasVisit = patientData?.has_visit !== false;

  return (
    <div className="clinical-workspace">
      {alert && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : alert.type === 'error' ? 'alert-error' : 'alert-info'}`} role="status">
          <div className="alert-message">{alert.message}</div>
          <button className="btn-icon" onClick={() => setAlert(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="workspace-header">
        <h2>
          <User size={24} />
          {patientInfo?.name || 'Patient'}
        </h2>
        <div className="patient-meta">
          <span>{patientInfo?.age} years old</span>
          <span>•</span>
          <span>{patientInfo?.gender || 'Unknown'}</span>
          <span>•</span>
          <span>Blood Type: {patientInfo?.blood_type || 'Unknown'}</span>
        </div>
        <button onClick={onClose} className="btn-close">
          <X size={20} />
        </button>
      </div>

      <div className="workspace-content">
        {/* Left Column - Patient Information */}
        <div className="workspace-column left-column">
          
          {/* Visit Information */}
          <div className="info-card">
            <h3><Calendar size={20} /> Visit Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Reason for Visit:</span>
                <span className="value">{visit?.reason || 'Chart Review'}</span>
              </div>
              {hasVisit && visit?.status && (
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className="value status-badge">{visit.status}</span>
                </div>
              )}
              {!hasVisit && appointmentId && (
                <div className="info-item warning">
                  <AlertCircle size={16} />
                  <span>Patient has not checked in yet. Vitals will be available after check-in.</span>
                </div>
              )}
            </div>
          </div>

          {/* Vitals */}
          {hasVisit && (
            <div className="info-card collapsible">
              <div className="card-header" onClick={() => toggleSection('vitals')}>
                <h3><Activity size={20} /> Vital Signs</h3>
                {expandedSections.vitals ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.vitals && (
                <div className="vitals-grid">
                  <div className="vital-item">
                    <Heart className="vital-icon bp" size={24} />
                    <div>
                      <span className="vital-label">Blood Pressure</span>
                      <span className="vital-value">{vitals?.blood_pressure || 'Not recorded'}</span>
                    </div>
                  </div>
                  <div className="vital-item">
                    <Thermometer className="vital-icon temp" size={24} />
                    <div>
                      <span className="vital-label">Temperature</span>
                      <span className="vital-value">{vitals?.temperature ? `${vitals.temperature}°F` : 'Not recorded'}</span>
                    </div>
                  </div>
                  {vitals?.recorded_by && (
                    <div className="vital-footer">
                      Recorded by: {vitals.recorded_by}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Allergies */}
          <div className="info-card alert-card">
            <h3><AlertCircle size={20} /> Allergies</h3>
            <p className="allergy-text">{patientInfo?.allergies || 'No known allergies'}</p>
          </div>

          {/* Current Medications */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('currentMedications')}>
              <h3><Pill size={20} /> Current Medications</h3>
              {expandedSections.currentMedications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.currentMedications && (
              <div>
                <button 
                  onClick={() => setShowPrescriptionForm(true)} 
                  className="btn-add-small"
                  style={{ marginBottom: '10px' }}
                >
                  <Plus size={16} /> Add Prescription
                </button>
                <div className="medications-list">
                  {patientInfo?.currentMedications && patientInfo.currentMedications.length > 0 ? (
                    patientInfo.currentMedications.map((med, idx) => (
                      <div key={idx} className="medication-item">
                        <div className="med-name">{med.name}</div>
                        <div className="med-details">{med.frequency}</div>
                        {med.prescribed_by && (
                          <div className="med-prescriber">Prescribed by: {med.prescribed_by}</div>
                        )}
                        <div className="med-actions">
                          <button onClick={() => handleEditPrescription(med)} className="btn-icon">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeletePrescription(med.id)} className="btn-icon-danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No current medications</p>
                  )}
                </div>
              </div>
            )}
          </div>

{/* Medical History */}
<div className="info-card collapsible">
  <div className="card-header" onClick={() => toggleSection('medicalHistory')}>
    <h3><History size={20} /> Medical History</h3>
    {expandedSections.medicalHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </div>
  {expandedSections.medicalHistory && (
    <div>
      <button 
        onClick={() => setShowConditionForm(true)} 
        className="btn-add-small"
        style={{ marginBottom: '10px' }}
      >
        <Plus size={16} /> Add Condition
      </button>
      <div className="history-list">
        {patientInfo?.medicalHistory && patientInfo.medicalHistory.length > 0 ? (
          patientInfo.medicalHistory.map((item, idx) => (
            <div key={idx} className="history-item">
              <div>
                <div className="history-condition">{item.condition}</div>
                <div className="history-date">{item.diagnosis_date || 'Date unknown'}</div>
              </div>
              <div className="med-actions">
                <button onClick={() => handleEditCondition(item)} className="btn-icon">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDeleteCondition(item.condition_id)} className="btn-icon-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No medical history available</p>
        )}
      </div>
    </div>
  )}
</div>

          {/* Medication History */}
          <div className="info-card collapsible">
            <div className="card-header" onClick={() => toggleSection('medicationHistory')}>
              <h3><Pill size={20} /> Medication History</h3>
              {expandedSections.medicationHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.medicationHistory && (
              <div className="med-history-list">
                {patientInfo?.medicationHistory && patientInfo.medicationHistory.length > 0 ? (
                  patientInfo.medicationHistory.map((med, idx) => (
                    <div key={idx} className="med-history-item">
                      <div className="med-name">{med.drug}</div>
                      <div className="med-notes">{med.notes}</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No medication history available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Clinical Actions */}
        <div className="workspace-column right-column">
          
          {/* Diagnosis Section */}
          <div className="notes-card">
            <h3><FileText size={20} /> Diagnosis</h3>
            <textarea
              className="diagnosis-input"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis..."
              rows={2}
              disabled={!hasVisit && appointmentId}
            />
            
            <h4 style={{ marginTop: '15px', marginBottom: '5px' }}>Present Illnesses</h4>
            <textarea
              className="diagnosis-input"
              value={presentIllnesses}
              onChange={(e) => setPresentIllnesses(e.target.value)}
              placeholder="Enter present illnesses..."
              rows={2}
              disabled={!hasVisit && appointmentId}
            />
            
            <div className="notes-actions">
              <button 
                onClick={handleSaveDiagnosis} 
                className="btn-save"
                disabled={saving || !diagnosis.trim() || (!hasVisit && appointmentId)}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Diagnosis'}
              </button>
            </div>
            {!hasVisit && appointmentId && (
              <p className="input-warning">
                <AlertCircle size={14} /> Patient must check in before adding diagnosis
              </p>
            )}
          </div>

          {/* Treatments Section */}
          {hasVisit && (
            <div className="notes-card">
              <div className="card-header-with-action">
                <h3><Activity size={20} /> Treatments</h3>
                <button 
                  onClick={() => setShowTreatmentSelector(!showTreatmentSelector)} 
                  className="btn-add-small"
                >
                  <Plus size={16} /> Add Treatment
                </button>
              </div>
              
              {showTreatmentSelector && (
                <div className="treatment-selector">
                  <select 
                    onChange={(e) => {
                      const treatment = treatmentCatalog.find(t => t.treatment_id === parseInt(e.target.value));
                      if (treatment) handleAddTreatment(treatment);
                    }}
                    defaultValue=""
                  >
                    <option value="">Select a treatment...</option>
                    {treatmentCatalog.map(t => (
                      <option key={t.treatment_id} value={t.treatment_id}>
                        {t.treatment_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="treatments-list">
                {selectedTreatments.length > 0 ? (
                  selectedTreatments.map((treatment, idx) => (
                    <div key={idx} className="treatment-item">
                      <div className="treatment-header">
                        <strong>{treatment.treatment_name}</strong>
                        <button onClick={() => handleRemoveTreatment(idx)} className="btn-icon-danger">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="input-group">
                        <label>Notes:</label>
                        <input 
                          type="text"
                          value={treatment.notes}
                          onChange={(e) => handleUpdateTreatment(idx, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No treatments selected</p>
                )}
              </div>
              
              {/* Always show Save button */}
              <div className="notes-actions">
                <button 
                  onClick={handleSaveTreatments} 
                  className="btn-save"
                  disabled={saving}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Treatments'}
                </button>
              </div>
            </div>
          )}

          {/* Prescription Form Modal */}
          {showPrescriptionForm && (
            <div className="modal-overlay" onClick={() => setShowPrescriptionForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingPrescription ? 'Edit Prescription' : 'New Prescription'}</h3>
                  <button onClick={() => {
                    setShowPrescriptionForm(false);
                    setEditingPrescription(null);
                  }} className="btn-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Medication Name *</label>
                    <input 
                      type="text"
                      value={prescriptionForm.medication_name}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, medication_name: e.target.value})}
                      placeholder="Enter medication name"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Dosage</label>
                      <input 
                        type="text"
                        value={prescriptionForm.dosage}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})}
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div className="form-group">
                      <label>Frequency</label>
                      <input 
                        type="text"
                        value={prescriptionForm.frequency}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, frequency: e.target.value})}
                        placeholder="e.g., twice daily"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Route</label>
                      <select 
                        value={prescriptionForm.route}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, route: e.target.value})}
                      >
                        <option value="Oral">Oral</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="Topical">Topical</option>
                        <option value="Inhalation">Inhalation</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Refills Allowed</label>
                      <input 
                        type="number"
                        min="0"
                        value={prescriptionForm.refills_allowed}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, refills_allowed: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input 
                        type="date"
                        value={prescriptionForm.start_date}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, start_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input 
                        type="date"
                        value={prescriptionForm.end_date}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Instructions/Notes</label>
                    <textarea 
                      rows={3}
                      value={prescriptionForm.notes}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => {
                    setShowPrescriptionForm(false);
                    setEditingPrescription(null);
                  }} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSavePrescription} className="btn-save" disabled={saving}>
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Prescription'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Medical Condition Form Modal */}
{showConditionForm && (
  <div className="modal-overlay" onClick={() => setShowConditionForm(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{editingCondition ? 'Edit Medical Condition' : 'New Medical Condition'}</h3>
        <button onClick={() => {
          setShowConditionForm(false);
          setEditingCondition(null);
        }} className="btn-close">
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Condition Name *</label>
          <input 
            type="text"
            value={conditionForm.condition_name}
            onChange={(e) => setConditionForm({...conditionForm, condition_name: e.target.value})}
            placeholder="e.g., Type 2 Diabetes, Hypertension"
          />
        </div>
        <div className="form-group">
          <label>Diagnosis Date</label>
          <input 
            type="date"
            value={conditionForm.diagnosis_date}
            onChange={(e) => setConditionForm({...conditionForm, diagnosis_date: e.target.value})}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button onClick={() => {
          setShowConditionForm(false);
          setEditingCondition(null);
        }} className="btn-secondary">
          Cancel
        </button>
        <button onClick={handleSaveCondition} className="btn-save" disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Condition'}
        </button>
      </div>
    </div>
  </div>
)}

          {/* Previous Notes */}
          <div className="notes-card collapsible">
            <div className="card-header" onClick={() => toggleSection('previousNotes')}>
              <h3><History size={20} /> Previous Visit Notes</h3>
              {expandedSections.previousNotes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.previousNotes && (
              <div className="previous-notes">
                {notes.length > 0 ? (
                  notes.map((note, idx) => (
                    <div key={idx} className="note-item">
                      <div className="note-header">
                        <span className="note-date">
                          {note.visit_date ? new Date(note.visit_date).toLocaleDateString() : 'Unknown date'}
                        </span>
                        <span className="note-doctor">{note.doctor_name}</span>
                      </div>
                      
                      {note.diagnosis && (
                        <div className="note-diagnosis">
                          <strong>Diagnosis:</strong> {note.diagnosis}
                        </div>
                      )}
                      
                      {note.treatments && note.treatments.length > 0 && (
                        <div className="note-treatments">
                          <div className="treatments-header">
                            <Clipboard size={16} />
                            <strong>Treatments:</strong>
                          </div>
                          <ul className="treatment-list">
                            {note.treatments.map((treatment, tIdx) => (
                              <li key={tIdx} className="treatment-list-item">
                                <div className="treatment-info">
                                  <span className="treatment-name">{treatment.treatment_name}</span>
                                  {treatment.quantity > 1 && (
                                    <span className="treatment-quantity">×{treatment.quantity}</span>
                                  )}
                                  {treatment.notes && (
                                    <span className="treatment-notes"> - {treatment.notes}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {note.note_text && !note.treatments?.length && (
                        <div className="note-text">
                          <strong>Treatments:</strong> {note.note_text}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No previous visit notes</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
