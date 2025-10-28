import React from 'react';
import { Shield } from 'lucide-react';
import './Insurance.css';

export default function Insurance(props) {
  const { loading, insurancePolicies = [] } = props;

  return (
    <div className="portal-content">
      <h1 className="page-title">Insurance Details</h1>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : insurancePolicies.length === 0 ? (
        <p className="text-gray">No insurance policies on file</p>
      ) : (
        <div className="insurance-list">
          {insurancePolicies.map((policy, idx) => (
            <div key={idx} className="insurance-card">
              <div className="insurance-header">
                <div>
                  <h3>{policy.is_primary ? 'Primary' : 'Secondary'} Insurance</h3>
                  <h2>{policy.provider_name}</h2>
                </div>
                <Shield className="insurance-icon" />
              </div>
              <div className="insurance-body">
                <p><strong>Policy #:</strong> {policy.policy_number || '—'}</p>
                <p><strong>Group #:</strong> {policy.group_number || '—'}</p>
                <p><strong>Subscriber:</strong> {policy.subscriber_name || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
