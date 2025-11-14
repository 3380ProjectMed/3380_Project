import React, { useState } from 'react';
import { CreditCard, X, CheckCircle, AlertCircle } from 'lucide-react';
import './Billing.css';

export default function Billing(props) {
  const { loading, billingBalance = 0, billingStatements = [], processPayment } = props;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // billingBalance may come back as a string from the API (e.g. "0.00"). Coerce to number for safe math/formatting.
  const balanceNumber = typeof billingBalance === 'string' ? parseFloat(billingBalance || 0) : Number(billingBalance || 0);

  const handleMakePayment = () => {
    // Choose the first outstanding statement if available
    const stmt = billingStatements.find(s => Number(s.balance) > 0) || null;
    const defaultAmount = stmt ? Number(stmt.balance).toFixed(2) : balanceNumber.toFixed(2);
    
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
    const visitId = selectedStatement ? selectedStatement.id : null;
    
    try {
      await processPayment({ visit_id: visitId, amount });
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
              <h1 className="balance-amount">${balanceNumber.toFixed(2)}</h1>
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
                  <div key={s.id} className="appointment-card">
                    <div className="appointment-header">
                      <h3>{s.service}</h3>
                      <p>${Number(s.balance).toFixed(2)}</p>
                    </div>
                    <div className="appointment-body">
                      <p className="text-small">Date: {s.date}</p>
                      <p className="text-small">Status: {s.status}</p>
                    </div>
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
                  <p><strong>Outstanding Balance:</strong> ${Number(selectedStatement.balance).toFixed(2)}</p>
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
