import React, { useState } from 'react';
import { CreditCard, X, CheckCircle, AlertCircle } from 'lucide-react';
import './Billing.css';

export default function Billing(props) {
  const { loading, billingBalance = {}, billingStatements = [], processPayment } = props;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Handle billingBalance as either a number (old format) or object (new format with breakdown)
  const balanceData = typeof billingBalance === 'object' && billingBalance !== null ? billingBalance : { outstanding_balance: billingBalance || 0 };
  const totalBalance = Number(balanceData.outstanding_balance || 0);
  const visitBalance = Number(balanceData.visit_balance || 0);
  const noShowBalance = Number(balanceData.no_show_balance || 0);

  const handleMakePayment = () => {
    // Choose the first outstanding statement if available
    const stmt = billingStatements.find(s => Number(s.balance) > 0) || null;
    const defaultAmount = stmt ? Number(stmt.balance).toFixed(2) : totalBalance.toFixed(2);
    
    setSelectedStatement(stmt);
    setPaymentAmount(defaultAmount);
    setShowPaymentModal(true);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000); // Auto-hide after 5 seconds
  };

  const handlePaymentSubmit = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    setProcessingPayment(true);
    
    // Prepare payment data based on record type
    let paymentData = { amount };
    
    if (selectedStatement) {
      if (selectedStatement.record_type === 'no_show') {
        // No-show penalty payment
        paymentData.penalty_id = selectedStatement.id;
        paymentData.record_type = 'no_show';
      } else {
        // Regular visit payment
        paymentData.visit_id = selectedStatement.id;
        paymentData.record_type = 'visit';
      }
    } else {
      // Default to visit if no statement selected
      paymentData.visit_id = null;
      paymentData.record_type = 'visit';
    }
    
    try {
      await processPayment(paymentData);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedStatement(null);
      showNotification('Payment processed successfully!', 'success');
      // Optionally reload data by full page or parent callback
      setTimeout(() => window.location.reload(), 2000); // Give time to see notification
    } catch (e) {
      console.error(e);
      showNotification('Payment failed. Please try again.', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const closeModal = () => {
    if (!processingPayment) {
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedStatement(null);
    }
  };

  return (
    <div className="portal-content">
      {/* Notification Toast */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? (
              <CheckCircle className="notification-icon" />
            ) : (
              <AlertCircle className="notification-icon" />
            )}
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close" 
              onClick={() => setNotification(null)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <h1 className="page-title">Billing & Payments</h1>
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="billing-summary">
            <div className="balance-card">
              <h3>Outstanding Balance</h3>
              <h1 className="balance-amount">${totalBalance.toFixed(2)}</h1>
              
              {/* Show breakdown if there are multiple types of charges */}
              {(visitBalance > 0 || noShowBalance > 0) && (
                <div className="balance-breakdown">
                  {visitBalance > 0 && (
                    <div className="balance-breakdown-item">
                      <span>Visit Charges:</span>
                      <span>${visitBalance.toFixed(2)}</span>
                    </div>
                  )}
                  {noShowBalance > 0 && (
                    <div className="balance-breakdown-item no-show">
                      <span>No-Show Penalties:</span>
                      <span>${noShowBalance.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <button className="btn btn-primary btn-large" onClick={handleMakePayment}>
                <CreditCard className="icon" /> Make Payment
              </button>
            </div>
          </div>

          <div className="portal-content" style={{ marginTop: 24 }}>
            <h2>Statements</h2>
            {billingStatements.length === 0 ? (
              <div className="text-small text-gray">No statements available.</div>
            ) : (
              <div className="appointments-list">
                {billingStatements.map(s => (
                  <div key={`${s.record_type}-${s.id}`} className={`billing-statement-card ${s.record_type === 'no_show' ? 'no-show-penalty' : ''}`}>
                    <div className="statement-header">
                      <div className="statement-info">
                        <h3>{s.service}</h3>
                        <p className="statement-date">{s.date}</p>
                        <span className={`status-badge ${s.status.toLowerCase().replace(' ', '-')}`}>
                          {s.status}
                        </span>
                        {s.record_type === 'no_show' && (
                          <span className="penalty-badge">No-Show Penalty</span>
                        )}
                      </div>
                      <div className="statement-balance">
                        <div className="balance-label">Amount Due</div>
                        <div className="balance-amount">${Number(s.balance).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Different breakdown for no-show penalties vs regular visits */}
                    {s.record_type === 'no_show' ? (
                      <div className="cost-breakdown">
                        <h4>Penalty Details</h4>
                        <div className="breakdown-grid">
                          <div className="breakdown-item">
                            <span className="breakdown-label">Missed Appointment Fee:</span>
                            <span className="breakdown-amount">${Number(s.no_show_fee || 0).toFixed(2)}</span>
                          </div>
                          <div className="breakdown-item total">
                            <span className="breakdown-label"><strong>Total Due:</strong></span>
                            <span className="breakdown-amount"><strong>${Number(s.amount || 0).toFixed(2)}</strong></span>
                          </div>
                        </div>
                        {s.payment_made > 0 && (
                          <div className="payment-info">
                            <p>Paid: ${Number(s.payment_made).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                    <div className="cost-breakdown">
                      <h4>Cost Breakdown</h4>
                      <div className="breakdown-grid">
                        <div className="breakdown-item">
                          <span className="breakdown-label">Copay:</span>
                          <span className="breakdown-amount">${Number(s.copay_amount || 0).toFixed(2)}</span>
                        </div>
                        
                        {/* Treatment Details Breakdown */}
                        {s.treatment_details && s.treatment_details.length > 0 ? (
                          <div className="treatment-details-section">
                            <span className="breakdown-label treatment-details-header">Treatments:</span>
                            {s.treatment_details.map((treatment, idx) => (
                              <div key={idx} className="treatment-detail-item">
                                <span className="treatment-name">{treatment.treatment_name}</span>
                                <span className="treatment-cost">${Number(treatment.total_cost || 0).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="breakdown-item treatment-total">
                              <span className="breakdown-label"><strong>Total Treatment Cost:</strong></span>
                              <span className="breakdown-amount"><strong>${Number(s.treatment_cost || 0).toFixed(2)}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <div className="breakdown-item">
                            <span className="breakdown-label">Treatment Cost:</span>
                            <span className="breakdown-amount">${Number(s.treatment_cost || 0).toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="breakdown-item">
                          <span className="breakdown-label">Your Share ({Number(s.coinsurance_rate || 0).toFixed(0)}%):</span>
                          <span className="breakdown-amount">${Number(s.coinsurance_amount || 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="breakdown-item breakdown-total">
                          <span className="breakdown-label"><strong>Total Amount:</strong></span>
                          <span className="breakdown-amount"><strong>${Number(s.amount || 0).toFixed(2)}</strong></span>
                        </div>
                        
                        {s.payment_made > 0 && (
                          <div className="breakdown-item payment-made">
                            <span className="breakdown-label">Payment Made:</span>
                            <span className="breakdown-amount">-${Number(s.payment_made).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      
                      {s.insurance_name && (
                        <div className="insurance-info">
                          <p className="text-small">Insurance: {s.insurance_name} - {s.insurance_plan}</p>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Make Payment</h3>
              <button className="modal-close" onClick={closeModal} disabled={processingPayment}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {selectedStatement && (
                <div className="payment-details">
                  <p><strong>Statement:</strong> {selectedStatement.service}</p>
                  {selectedStatement.record_type === 'no_show' && (
                    <p className="penalty-notice"><strong>⚠️ No-Show Penalty</strong></p>
                  )}
                  <p><strong>Outstanding Balance:</strong> ${Number(selectedStatement.balance).toFixed(2)}</p>
                  {selectedStatement.record_type === 'no_show' && (
                    <p className="text-small" style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                      Payment Method: Credit Card
                    </p>
                  )}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="paymentAmount">Payment Amount</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={processingPayment}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={closeModal}
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handlePaymentSubmit}
                disabled={processingPayment || !paymentAmount}
              >
                {processingPayment ? 'Processing...' : 'Process Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
