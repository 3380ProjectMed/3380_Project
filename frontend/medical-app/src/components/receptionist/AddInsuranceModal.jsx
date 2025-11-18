import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Shield, Calendar, CreditCard, Users } from 'lucide-react';
import './AddInsuranceModal.css';

/**
 * AddInsuranceModal Component
 * 
 * Modal for adding or updating patient insurance information
 * Used by receptionists when a patient has no insurance or expired insurance
 */
function AddInsuranceModal({ patient, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [insurancePlans, setInsurancePlans] = useState([]);
  const [selectedPayer, setSelectedPayer] = useState('');
  const [formData, setFormData] = useState({
    plan_id: '',
    member_id: '',
    group_id: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    is_primary: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingInsurance, setExistingInsurance] = useState(null);

  useEffect(() => {
    console.log('AddInsuranceModal mounted with patient:', patient);
    alert('Modal mounted! Patient ID: ' + (patient.Patient_id || patient.patient_id || 'NONE'));
    loadInsurancePlans();
    loadExistingInsurance();
  }, []);

  // Populate form after both plans and existing insurance are loaded
  useEffect(() => {
    if (!loadingPlans && !loadingExisting && existingInsurance && insurancePlans.length > 0) {
      populateFormWithExistingInsurance();
    }
  }, [loadingPlans, loadingExisting, existingInsurance, insurancePlans]);

  const populateFormWithExistingInsurance = () => {
    if (!existingInsurance) return;

    const ins = existingInsurance;
    
    console.log('Populating form with insurance:', ins);
    console.log('Available insurance plans:', insurancePlans);
    
    // Pre-populate form with existing insurance data
    setFormData({
      plan_id: ins.plan_id || '',
      member_id: ins.member_id || '',
      group_id: ins.group_id || '',
      effective_date: ins.effective_date || new Date().toISOString().split('T')[0],
      expiration_date: ins.expiration_date || '',
      is_primary: ins.is_primary || 1
    });
    
    console.log('Form data set to:', {
      plan_id: ins.plan_id,
      member_id: ins.member_id,
      group_id: ins.group_id,
      effective_date: ins.effective_date,
      expiration_date: ins.expiration_date,
      is_primary: ins.is_primary
    });
    
    // Set the payer dropdown
    if (ins.payer_id) {
      console.log('Setting payer to:', ins.payer_id);
      setSelectedPayer(ins.payer_id.toString());
    }
  };

  const loadExistingInsurance = async () => {
    try {
      setLoadingExisting(true);
      // Handle different property name formats
      const patientId = patient.Patient_id || patient.patient_id;
      
      if (!patientId) {
        console.error('No patient ID found in patient object:', patient);
        setLoadingExisting(false);
        return;
      }
      
      console.log('Loading insurance for patient ID:', patientId);
      
      const response = await fetch(`/receptionist_api/patients/get-patient-insurance.php?patient_id=${patientId}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      console.log('Insurance data received:', data);
      
      if (data.success && data.has_insurance) {
        // Store the insurance data to populate later
        console.log('Setting existing insurance:', data.insurance);
        setExistingInsurance(data.insurance);
      } else {
        console.log('No existing insurance found');
      }
    } catch (err) {
      console.error('Failed to load existing insurance:', err);
      // Don't show error, just continue with empty form
    } finally {
      setLoadingExisting(false);
    }
  };

  const loadInsurancePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch('/receptionist_api/patients/get-insurance-plans.php', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInsurancePlans(data.plans);
      } else {
        setError(data.error || 'Failed to load insurance plans');
      }
    } catch (err) {
      console.error('Failed to load insurance plans:', err);
      setError('Failed to load insurance plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.plan_id) {
      setError('Please select an insurance plan');
      return;
    }
    
    if (!formData.member_id) {
      setError('Please enter member ID');
      return;
    }
    
    if (!formData.effective_date) {
      setError('Please enter effective date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Handle different property name formats
      const patientId = patient.Patient_id || patient.patient_id;
      
      if (!patientId) {
        setError('Patient ID not found');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/receptionist_api/patients/add-insurance.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          patient_id: patientId,
          ...formData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Insurance added successfully: ${data.plan_name}`);
        setTimeout(() => {
          if (onSuccess) onSuccess(data);
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to add insurance');
      }
    } catch (err) {
      console.error('Failed to add insurance:', err);
      setError('Failed to add insurance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailablePlans = () => {
    if (!selectedPayer) return [];
    const payer = insurancePlans.find(p => p.payer_id.toString() === selectedPayer);
    return payer ? payer.plans : [];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal insurance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <Shield size={24} />
              Add Insurance Information
            </h2>
            <p className="modal-subtitle">
              Patient: {patient.first_name || patient.Patient_First} {patient.last_name || patient.Patient_Last}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <Check size={20} />
              <span>{success}</span>
            </div>
          )}

          {(loadingPlans || loadingExisting) ? (
            <div className="loading-state">
              <p>Loading insurance information...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="insurance-form">
              <div className="form-section">
                <h3 className="section-title">Insurance Plan Details</h3>
                
                <div className="form-group">
                  <label className="form-label">
                    <Shield size={16} />
                    Insurance Company *
                  </label>
                  <select
                    className="form-input"
                    value={selectedPayer}
                    onChange={(e) => {
                      setSelectedPayer(e.target.value);
                      setFormData(prev => ({ ...prev, plan_id: '' }));
                    }}
                    required
                  >
                    <option value="">Select insurance company...</option>
                    {insurancePlans.map(payer => (
                      <option key={payer.payer_id} value={payer.payer_id}>
                        {payer.payer_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPayer && (
                  <div className="form-group">
                    <label className="form-label">
                      <Shield size={16} />
                      Insurance Plan *
                    </label>
                    <select
                      className="form-input"
                      name="plan_id"
                      value={formData.plan_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select plan...</option>
                      {getAvailablePlans().map(plan => (
                        <option key={plan.plan_id} value={plan.plan_id}>
                          {plan.plan_name} ({plan.plan_type}) - Copay: ${plan.copay}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3 className="section-title">Member Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <CreditCard size={16} />
                      Member ID *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      name="member_id"
                      value={formData.member_id}
                      onChange={handleInputChange}
                      placeholder="e.g., M123456789"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Users size={16} />
                      Group ID
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      name="group_id"
                      value={formData.group_id}
                      onChange={handleInputChange}
                      placeholder="e.g., G987654"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Coverage Period</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <Calendar size={16} />
                      Effective Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      name="effective_date"
                      value={formData.effective_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Calendar size={16} />
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      name="expiration_date"
                      value={formData.expiration_date}
                      onChange={handleInputChange}
                      min={formData.effective_date}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_primary === 1}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      is_primary: e.target.checked ? 1 : 0 
                    }))}
                  />
                  <span>Set as primary insurance</span>
                </label>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={loading || loadingPlans || loadingExisting || !formData.plan_id}
          >
            {loading ? 'Saving Insurance...' : 'Save Insurance'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddInsuranceModal;
