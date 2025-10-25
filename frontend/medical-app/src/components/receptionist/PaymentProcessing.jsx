import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, User, Calendar, Clock, Check, Printer, CreditCard, FileText } from 'lucide-react';
import './PaymentProcessing.css';

/**
 * PaymentProcessing Component (Simplified)
 * 
 * Record copayment at front desk
 * SIMPLIFIED: No card/check forms - just confirm amount and record payment
 * 
 * Amount is auto-loaded from patient_insurance.copay in database
 * 
 * Props:
 * @param {Object} preSelectedAppointment - Appointment with patient & insurance info
 * @param {Function} onBack - Return to previous page
 * @param {Function} onSuccess - Navigate after successful payment
 */
function PaymentProcessing({ preSelectedAppointment, onBack, onSuccess }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  /**
   * Payment data from appointment/patient insurance
   * In real implementation, this comes from:
   * SELECT pi.copay, pi.coinsurance_rate_pct, pi.deductible_individ,
   *        pl.plan_name, py.NAME as payer_name
   * FROM patient_insurance pi
   * JOIN insurance_plan pl ON pi.plan_id = pl.plan_id
   * JOIN insurance_payer py ON pl.payer_id = py.payer_id
   * WHERE pi.patient_id = ? AND pi.is_primary = 1
   */
  const [paymentData] = useState({
    patientId: preSelectedAppointment?.patientId || 1,
    patientName: preSelectedAppointment?.patientName || 'Walk-in Patient',
    appointmentId: preSelectedAppointment?.id || null,
    appointmentTime: preSelectedAppointment?.time || '',
    appointmentDate: new Date().toLocaleDateString(),
    reason: preSelectedAppointment?.reason || 'Office Visit',
    
    // Insurance info (from database joins)
    insurancePayer: preSelectedAppointment?.insurancePayer || 'Blue Cross Blue Shield',
    insurancePlan: preSelectedAppointment?.insurancePlan || 'BCBS Gold PPO',
    memberNumber: preSelectedAppointment?.memberNumber || 'M123456789',
    
    // Payment amounts (from patient_insurance table)
    copayAmount: preSelectedAppointment?.copay || 25.00,
    coinsuranceRate: preSelectedAppointment?.coinsuranceRate || 20,
    deductible: preSelectedAppointment?.deductible || 1500.00,
    
    // Office info
    officeId: 1,
    officeName: 'Downtown Medical Center'
  });

  /**
   * Generate transaction ID
   */
  useEffect(() => {
    setTransactionId('PAY' + Date.now().toString().slice(-8));
  }, []);

  /**
   * Process payment - simplified to just recording
   */
  const handleConfirmPayment = () => {
    // TODO: Submit to API
    // POST /api/payments
    // Body: {
    //   appointment_id, patient_id, 
    //   copay_amount, payment_received: copay_amount,
    //   transaction_id, notes
    // }
    
    console.log('Recording payment:', {
      transactionId,
      appointmentId: paymentData.appointmentId,
      patientId: paymentData.patientId,
      copayAmount: paymentData.copayAmount,
      paymentReceived: paymentData.copayAmount,
      notes: paymentNote,
      timestamp: new Date().toISOString()
    });

    // Show receipt
    setShowReceipt(true);
  };

  /**
   * Print receipt
   */
  const handlePrintReceipt = () => {
    window.print();
  };

  /**
   * Complete and return to dashboard
   */
  const handleComplete = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  /**
   * Get current date/time
   */
  const getCurrentDateTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="payment-processing-page">
      {!showReceipt ? (
        <>
          {/* ===== HEADER ===== */}
          <div className="payment-header">
            <button className="btn-back" onClick={onBack}>
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="header-info">
              <h1 className="page-title">Record Payment</h1>
              <p className="page-subtitle">Confirm copayment at front desk</p>
            </div>
          </div>

          <div className="payment-content-simplified">
            {/* ===== PAYMENT SUMMARY CARD ===== */}
            <div className="payment-summary-card">
              <h2 className="summary-title">Payment Information</h2>
              
              <div className="summary-grid">
                {/* Patient Info */}
                <div className="summary-section">
                  <h3 className="section-header">Patient</h3>
                  <div className="info-row">
                    <User size={18} />
                    <span className="info-label">Name:</span>
                    <span className="info-value">{paymentData.patientName}</span>
                  </div>
                  {paymentData.appointmentTime && (
                    <div className="info-row">
                      <Clock size={18} />
                      <span className="info-label">Appointment:</span>
                      <span className="info-value">{paymentData.appointmentTime}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <FileText size={18} />
                    <span className="info-label">Reason:</span>
                    <span className="info-value">{paymentData.reason}</span>
                  </div>
                </div>

                {/* Insurance Info */}
                <div className="summary-section">
                  <h3 className="section-header">Insurance</h3>
                  <div className="insurance-card-mini">
                    <CreditCard size={20} />
                    <div>
                      <p className="insurance-payer">{paymentData.insurancePayer}</p>
                      <p className="insurance-plan">{paymentData.insurancePlan}</p>
                      <p className="insurance-member">Member: {paymentData.memberNumber}</p>
                    </div>
                  </div>
                  
                  <div className="insurance-details-mini">
                    <div className="detail-item">
                      <span className="detail-label">Copay:</span>
                      <span className="detail-value">${paymentData.copayAmount.toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Coinsurance:</span>
                      <span className="detail-value">{paymentData.coinsuranceRate}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Deductible:</span>
                      <span className="detail-value">${paymentData.deductible.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Due - Large Display */}
              <div className="amount-due-card">
                <p className="amount-label">Copayment Amount Due</p>
                <p className="amount-value">${paymentData.copayAmount.toFixed(2)}</p>
                <p className="amount-note">Amount collected at front desk</p>
              </div>
            </div>

            {/* ===== PAYMENT NOTE ===== */}
            <div className="payment-note-section">
              <label className="form-label">Payment Note (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Add any notes about this payment..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows="3"
              />
            </div>

            {/* ===== ACTION BUTTONS ===== */}
            <div className="payment-actions">
              <button className="btn btn-ghost" onClick={onBack}>
                Cancel
              </button>
              <button className="btn btn-success btn-large" onClick={handleConfirmPayment}>
                <Check size={20} />
                Confirm Payment Received - ${paymentData.copayAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ===== RECEIPT VIEW ===== */
        <div className="receipt-view">
          <div className="receipt-header-success">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h1 className="success-title">Payment Recorded Successfully</h1>
            <p className="success-subtitle">Transaction ID: {transactionId}</p>
          </div>

          <div className="receipt-card">
            <div className="receipt-header-info">
              <h2 className="clinic-name">{paymentData.officeName}</h2>
              <p className="clinic-address">425 Main Street, Suite 100</p>
              <p className="clinic-address">Houston, TX 77002</p>
              <p className="clinic-phone">(737) 492-8165</p>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-details">
              <h3 className="receipt-title">Payment Receipt</h3>
              
              <div className="receipt-row">
                <span className="receipt-label">Transaction ID:</span>
                <span className="receipt-value">{transactionId}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Date & Time:</span>
                <span className="receipt-value">{getCurrentDateTime()}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Patient:</span>
                <span className="receipt-value">{paymentData.patientName}</span>
              </div>

              {paymentData.appointmentId && (
                <div className="receipt-row">
                  <span className="receipt-label">Appointment ID:</span>
                  <span className="receipt-value">{paymentData.appointmentId}</span>
                </div>
              )}

              <div className="receipt-row">
                <span className="receipt-label">Reason for Visit:</span>
                <span className="receipt-value">{paymentData.reason}</span>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-row">
                <span className="receipt-label">Insurance Provider:</span>
                <span className="receipt-value">{paymentData.insurancePayer}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Plan:</span>
                <span className="receipt-value">{paymentData.insurancePlan}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Member Number:</span>
                <span className="receipt-value">{paymentData.memberNumber}</span>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-row total-row">
                <span className="receipt-label">Copayment Received:</span>
                <span className="receipt-value">${paymentData.copayAmount.toFixed(2)}</span>
              </div>

              {paymentNote && (
                <>
                  <div className="receipt-divider"></div>
                  <div className="receipt-notes">
                    <span className="receipt-label">Notes:</span>
                    <p className="notes-text">{paymentNote}</p>
                  </div>
                </>
              )}
            </div>

            <div className="receipt-footer">
              <p className="thank-you-message">Thank you for your payment!</p>
              <p className="footer-note">Please retain this receipt for your records</p>
              <p className="footer-note">This receipt confirms payment collected at front desk</p>
            </div>
          </div>

          <div className="receipt-actions">
            <button className="btn btn-secondary" onClick={handlePrintReceipt}>
              <Printer size={18} />
              Print Receipt
            </button>
            <button className="btn btn-primary btn-large" onClick={handleComplete}>
              <Check size={18} />
              Complete & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentProcessing;