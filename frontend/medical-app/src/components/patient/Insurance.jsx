import React, { useState, useEffect } from 'react';
import { Shield, Edit, X, Save, Calendar } from 'lucide-react';
import './Insurance.css';
import api from '../../patientapi.js';

export default function Insurance(props) {
  const { loading, insurancePolicies = [], onInsuranceUpdate } = props;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [availablePayers, setAvailablePayers] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    group_id: '',
    effective_date: '',
    expiration_date: '',
    payer_id: '',
    plan_name: '',
    plan_type: ''
  });

  useEffect(() => {
    loadInsurancePayers();
  }, []);

  const loadInsurancePayers = async () => {
    try {
      const response = await api.insurance.getInsurancePayers();
      if (response.success) {
        setAvailablePayers(response.data);
      }
    } catch (error) {
      console.error('Error loading insurance payers:', error);
    }
  };

  const handleEditClick = (policy) => {
    setEditingPolicy(policy);
    setIsAddingNew(false);
    setFormData({
      member_id: policy.member_id || '',
      group_id: policy.group_id || '',
      effective_date: policy.effective_date ? policy.effective_date.split(' ')[0] : '',
      expiration_date: policy.expiration_date ? policy.expiration_date.split(' ')[0] : '',
      payer_id: policy.payer_id || '',
      plan_name: policy.plan_name || '',
      plan_type: policy.plan_type || ''
    });
    setShowEditModal(true);
  };

  const handleAddInsuranceClick = () => {
    setEditingPolicy(null);
    setIsAddingNew(true);
    setFormData({
      member_id: '',
      group_id: '',
      effective_date: '',
      expiration_date: '',
      payer_id: '',
      plan_name: '',
      plan_type: ''
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveClick = async () => {
    setEditLoading(true);
    try {
      let response;
      if (isAddingNew) {
        response = await api.insurance.addInsurance(formData);
      } else {
        response = await api.insurance.updateInsurance(editingPolicy.id, formData);
      }
      
      if (response.success) {
        setShowEditModal(false);
        setEditingPolicy(null);
        setIsAddingNew(false);
        // Refresh insurance data
        if (onInsuranceUpdate) {
          onInsuranceUpdate();
        }
      } else {
        alert(`Failed to ${isAddingNew ? 'add' : 'update'} insurance: ` + response.message);
      }
    } catch (error) {
      console.error(`Error ${isAddingNew ? 'adding' : 'updating'} insurance:`, error);
      alert(`Error ${isAddingNew ? 'adding' : 'updating'} insurance`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingPolicy(null);
    setIsAddingNew(false);
    setFormData({
      member_id: '',
      group_id: '',
      effective_date: '',
      expiration_date: '',
      payer_id: '',
      plan_name: '',
      plan_type: ''
    });
  };

  return (
    <div className="portal-content">
      <div className="page-header">
        <h1 className="page-title">Insurance Details</h1>
      </div>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : insurancePolicies.length === 0 ? (
        <div className="empty-state">
          <Shield className="empty-state-icon" />
          <h3>No insurance policies on file</h3>
          <p className="text-gray">Add your insurance information to ensure proper coverage for your appointments.</p>
          <button className="btn btn-primary btn-large" onClick={handleAddInsuranceClick}>
            <Shield className="icon" /> Add Your First Insurance Policy
          </button>
        </div>
      ) : (
        <div className="insurance-list">
          {insurancePolicies.map((policy, idx) => (
            <div key={idx} className="insurance-card">
              <div className="insurance-header">
                <div>
                  <h2>{policy.provider_name}</h2>
                  <p className="plan-info">{policy.plan_name} - {policy.plan_type}</p>
                </div>
                <div className="insurance-actions">
                  <button 
                    className="btn btn-link edit-btn" 
                    onClick={() => handleEditClick(policy)}
                    title="Edit Insurance"
                  >
                    <Edit className="small-icon" />
                  </button>
                  <Shield className="insurance-icon" />
                </div>
              </div>
              <div className="insurance-body">
                <p><strong>Member ID:</strong> {policy.member_id || '—'}</p>
                <p><strong>Group ID:</strong> {policy.group_id || '—'}</p>
                <p><strong>Effective Date:</strong> {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : '—'}</p>
                <p><strong>Expiration Date:</strong> {policy.expiration_date ? new Date(policy.expiration_date).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Insurance Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content edit-insurance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isAddingNew ? 'Add New Insurance' : 'Edit Insurance'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <X className="icon" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Insurance Provider</label>
                  <select 
                    name="payer_id" 
                    value={formData.payer_id} 
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Provider</option>
                    {availablePayers.map(payer => (
                      <option key={payer.payer_id} value={payer.payer_id}>
                        {payer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Member ID</label>
                  <input
                    type="text"
                    name="member_id"
                    value={formData.member_id}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter member ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Group ID</label>
                  <input
                    type="text"
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter group ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Effective Date</label>
                  <input
                    type="date"
                    name="effective_date"
                    value={formData.effective_date}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Expiration Date</label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    name="plan_name"
                    value={formData.plan_name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter plan name"
                  />
                </div>

                <div className="form-group">
                  <label>Plan Type</label>
                  <select
                    name="plan_type"
                    value={formData.plan_type}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Select Plan Type</option>
                    <option value="HMO">HMO</option>
                    <option value="PPO">PPO</option>
                    <option value="EPO">EPO</option>
                    <option value="POS">POS</option>
                    <option value="HDHP">High Deductible Health Plan</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveClick}
                disabled={editLoading}
              >
                {editLoading ? 'Saving...' : isAddingNew ? 'Add Insurance' : 'Save Changes'}
                <Save className="small-icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
