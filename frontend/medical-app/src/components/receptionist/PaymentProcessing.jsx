import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, User, Calendar, Clock, Check, Printer, CreditCard, FileText, Search, X, AlertCircle, Phone, Mail } from 'lucide-react';
import * as API from '../../api/receptionistApi';
import './PaymentProcessing.css';

/**
 * PaymentProcessing Component (Enhanced)
 * 
 * Search for any patient and record payments
 * Can record copayment or any custom amount
 * Shows patient's financial information and appointment history
 */
function PaymentProcessing({ preSelectedAppointment, onBack, onSuccess }) {
  // Step management: 1 = patient search, 2 = payment details, 3 = receipt
  const [currentStep, setCurrentStep] = useState(preSelectedAppointment ? 2 : 1);
  
  // Patient search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Selected patient and their data
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(preSelectedAppointment);
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [transactionId, setTransactionId] = useState('');
  
  // UI state
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate transaction ID on mount
   */
  useEffect(() => {
    setTransactionId(API.generateTransactionId());
  }, []);

  /**
   * Debounced patient search
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2 && currentStep === 1) {
        handlePatientSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Load patient details when selected
   */
  useEffect(() => {
    if (selectedPatient) {
      loadPatientFinancialInfo();
    }
  }, [selectedPatient]);

  /**
   * Search for patients
   */
  const handlePatientSearch = async () => {
    try {
      setSearchLoading(true);
      const result = await API.searchPatients(searchTerm);
      
      if (result.success) {
        setSearchResults(result.patients || []);
      }
    } catch (err) {
      console.error('Patient search failed:', err);
      setError('Failed to search patients');
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Load patient financial information and recent appointments
   */
  const loadPatientFinancialInfo = async () => {
    try {
      setLoading(true);
      
      // Get full patient details with insurance
      const detailsResult = await API.getPatientById(selectedPatient.Patient_ID);
      
      if (detailsResult.success) {
        setPatientDetails(detailsResult);
        
        // Set suggested payment amount from insurance copay
        if (detailsResult.insurance?.copay) {
          setSuggestedAmount(detailsResult.insurance.copay);
          setPaymentAmount(detailsResult.insurance.copay.toFixed(2));
        }
        
        // Get recent appointments
        if (detailsResult.recent_appointments) {
          // Filter for today's or recent completed appointments that need payment
          const appointmentsNeedingPayment = detailsResult.recent_appointments.filter(apt => {
            const aptDate = new Date(apt.Appointment_date);
            const today = new Date();
            const isRecent = aptDate <= today;
            return isRecent && (apt.Status === 'Completed' || apt.Status === 'Checked In');
          });
          setPatientAppointments(appointmentsNeedingPayment);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load patient info:', err);
      setError('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select patient and move to payment step
   */
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
  };

  /**
   * Change selected patient
   */
  const handleChangePatient = () => {
    setCurrentStep(1);
    setSelectedPatient(null);
    setPatientDetails(null);
    setSearchTerm('');
    setSearchResults([]);
    setPaymentAmount('');
    setSelectedAppointment(null);
  };

  /**
   * Calculate change if overpaid
   */
  const calculateChange = () => {
    const amount = parseFloat(paymentAmount) || 0;
    const suggested = suggestedAmount || 0;
    return amount > suggested ? amount - suggested : 0;
  };

  /**
   * Quick amount buttons
   */
  const handleQuickAmount = (amount) => {
    setPaymentAmount(amount.toFixed(2));
  };

  /**
   * Validate payment form
   */
  const validatePayment = () => {
    const amount = parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount');
      return false;
    }
    
    if (!selectedPatient) {
      setError('No patient selected');
      return false;
    }
    
    return true;
  };

  /**
   * Process payment - submit to backend
   */
  const handleConfirmPayment = async () => {
    if (!validatePayment()) return;
    
    try {
      setLoading(true);
      setError(null);

      const amount = parseFloat(paymentAmount);

      const paymentPayload = {
        appointment_id: selectedAppointment?.Appointment_id || null,
        patient_id: selectedPatient.Patient_ID,
        copay_amount: suggestedAmount || amount,
        payment_received: amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        notes: paymentNote
      };

      const result = await API.recordPayment(paymentPayload);

      if (result.success) {
        setShowReceipt(true);
      } else {
        setError(result.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <p className="page-subtitle">Search patient and record copayment or any amount</p>
            </div>
          </div>

          {/* ===== STEP INDICATOR ===== */}
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">{currentStep > 1 ? <Check size={20} /> : '1'}</div>
              <span className="step-label">Find Patient</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span className="step-label">Payment</span>
            </div>
          </div>

          {/* ===== STEP 1: PATIENT SEARCH ===== */}
          {currentStep === 1 && (
            <div className="payment-content">
              <div className="search-patient-section">
                <h2 className="section-title">Find Patient</h2>
                <p className="section-description">
                  Search for a patient to record payment
                </p>

                <div className="search-box-large">
                  <Search className="search-icon" size={24} />
                  <input
                    type="text"
                    className="search-input-large"
                    placeholder="Search by name, phone, or date of birth..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {searchTerm && (
                    <button 
                      className="search-clear-btn" 
                      onClick={() => setSearchTerm('')}
                      style={{ position: 'absolute', right: '1rem' }}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="patient-results">
                  {searchLoading ? (
                    <div className="no-results">
                      <Clock size={48} />
                      <p>Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(patient => (
                      <div
                        key={patient.Patient_ID}
                        className="patient-result-item"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="patient-avatar">
                          <User size={24} />
                        </div>
                        <div className="patient-info">
                          <h3 className="patient-name">
                            {patient.First_Name} {patient.Last_Name}
                          </h3>
                          <p className="patient-details">
                            ID: {patient.Patient_ID} • {patient.dob} • {patient.EmergencyContact}
                          </p>
                        </div>
                        {patient.copay && (
                          <div className="patient-insurance">
                            <DollarSign size={16} />
                            <span>Copay: ${patient.copay.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : searchTerm.length >= 2 ? (
                    <div className="no-results">
                      <AlertCircle size={48} />
                      <p>No patients found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="no-results">
                      <Search size={48} />
                      <p>Start typing to search for patients</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2: PAYMENT DETAILS ===== */}
          {currentStep === 2 && (
            <div className="payment-content">
              {/* Selected Patient Card */}
              <div className="selected-patient-card">
                <div className="card-header">
                  <h3>Selected Patient</h3>
                  <button className="btn-change" onClick={handleChangePatient}>
                    Change Patient
                  </button>
                </div>
                <div className="patient-info-display">
                  <div className="info-item">
                    <User size={18} />
                    <span>{selectedPatient?.First_Name} {selectedPatient?.Last_Name}</span>
                  </div>
                  <div className="info-item">
                    <FileText size={18} />
                    <span>ID: {selectedPatient?.Patient_ID}</span>
                  </div>
                  {selectedPatient?.EmergencyContact && (
                    <div className="info-item">
                      <Phone size={18} />
                      <span>{selectedPatient.EmergencyContact}</span>
                    </div>
                  )}
                  {selectedPatient?.Email && (
                    <div className="info-item">
                      <Mail size={18} />
                      <span>{selectedPatient.Email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              {loading ? (
                <div className="payment-summary-card">
                  <p>Loading patient information...</p>
                </div>
              ) : (
                <>
                  {/* Insurance & Financial Info */}
                  {patientDetails?.insurance && (
                    <div className="payment-summary-card">
                      <h2 className="summary-title">Insurance Information</h2>
                      
                      <div className="insurance-card-mini" style={{ marginBottom: '1.5rem' }}>
                        <CreditCard size={24} />
                        <div>
                          <p className="insurance-payer">{patientDetails.insurance.payer_name}</p>
                          <p className="insurance-plan">{patientDetails.insurance.plan_name}</p>
                          <p className="insurance-plan">{patientDetails.insurance.plan_type}</p>
                        </div>
                      </div>
                      
                      <div className="insurance-details-mini">
                        {patientDetails.insurance.copay && (
                          <div className="detail-item">
                            <span className="detail-label">Standard Copay:</span>
                            <span className="detail-value">${patientDetails.insurance.copay.toFixed(2)}</span>
                          </div>
                        )}
                        {patientDetails.insurance.coinsurance_rate_pct && (
                          <div className="detail-item">
                            <span className="detail-label">Coinsurance:</span>
                            <span className="detail-value">{patientDetails.insurance.coinsurance_rate_pct}%</span>
                          </div>
                        )}
                        {patientDetails.insurance.deductible_individ && (
                          <div className="detail-item">
                            <span className="detail-label">Deductible:</span>
                            <span className="detail-value">${patientDetails.insurance.deductible_individ.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Appointments */}
                  {patientAppointments.length > 0 && (
                    <div className="payment-summary-card">
                      <h2 className="summary-title">Recent Appointments Needing Payment</h2>
                      <div className="appointments-payment-list">
                        {patientAppointments.map(apt => (
                          <div 
                            key={apt.Appointment_id}
                            className={`appointment-payment-item ${
                              selectedAppointment?.Appointment_id === apt.Appointment_id ? 'selected' : ''
                            }`}
                            onClick={() => setSelectedAppointment(apt)}
                          >
                            <div className="apt-payment-date">
                              <Calendar size={16} />
                              {new Date(apt.Appointment_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="apt-payment-details">
                              <p className="apt-payment-reason">{apt.Reason_for_visit}</p>
                              <p className="apt-payment-doctor">
                                Dr. {apt.Doctor_First} {apt.Doctor_Last}
                              </p>
                            </div>
                            <div className="apt-payment-status">
                              <span className={`status-badge status-${apt.Status?.toLowerCase()}`}>
                                {apt.Status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Amount Section */}
                  <div className="payment-method-section">
                    <h2 className="section-title">Payment Amount</h2>
                    
                    {suggestedAmount > 0 && (
                      <div className="suggested-amount-display">
                        <DollarSign size={20} />
                        <div>
                          <p className="suggested-label">Suggested Copay Amount</p>
                          <p className="suggested-value">${suggestedAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Amount Received</label>
                      <div className="input-with-prefix">
                        <span className="input-prefix">$</span>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    {suggestedAmount > 0 && (
                      <div className="quick-amounts">
                        <p className="quick-label">Quick Amounts</p>
                        <div className="quick-buttons">
                          <button 
                            className="quick-btn"
                            onClick={() => handleQuickAmount(suggestedAmount)}
                          >
                            ${suggestedAmount.toFixed(2)}
                          </button>
                          <button 
                            className="quick-btn"
                            onClick={() => handleQuickAmount(suggestedAmount + 10)}
                          >
                            ${(suggestedAmount + 10).toFixed(2)}
                          </button>
                          <button 
                            className="quick-btn"
                            onClick={() => handleQuickAmount(suggestedAmount + 20)}
                          >
                            ${(suggestedAmount + 20).toFixed(2)}
                          </button>
                          <button 
                            className="quick-btn"
                            onClick={() => handleQuickAmount(suggestedAmount + 50)}
                          >
                            ${(suggestedAmount + 50).toFixed(2)}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Change Calculator */}
                    {calculateChange() > 0 && (
                      <div className="change-display">
                        <p className="change-label">Change Due</p>
                        <p className="change-value">${calculateChange().toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="payment-method-section">
                    <h2 className="section-title">Payment Method</h2>
                    <div className="method-options">
                      <div
                        className={`method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <DollarSign size={24} />
                        <span>Cash</span>
                      </div>
                      <div
                        className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard size={24} />
                        <span>Card</span>
                      </div>
                      <div
                        className={`method-option ${paymentMethod === 'check' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('check')}
                      >
                        <FileText size={24} />
                        <span>Check</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Note */}
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

                  {/* Error Message */}
                  {error && (
                    <div className="alert alert-danger">
                      <AlertCircle size={20} />
                      {error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="payment-actions">
                    <button className="btn btn-ghost" onClick={handleChangePatient} disabled={loading}>
                      Change Patient
                    </button>
                    <button 
                      className="btn btn-success btn-large" 
                      onClick={handleConfirmPayment}
                      disabled={loading || !paymentAmount}
                    >
                      <Check size={20} />
                      {loading ? 'Processing...' : `Record Payment - $${parseFloat(paymentAmount || 0).toFixed(2)}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
              <h2 className="clinic-name">Downtown Medical Center</h2>
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
                <span className="receipt-value">
                  {selectedPatient?.First_Name} {selectedPatient?.Last_Name}
                </span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Patient ID:</span>
                <span className="receipt-value">{selectedPatient?.Patient_ID}</span>
              </div>

              {selectedAppointment && (
                <>
                  <div className="receipt-row">
                    <span className="receipt-label">Appointment ID:</span>
                    <span className="receipt-value">{selectedAppointment.Appointment_id}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Reason for Visit:</span>
                    <span className="receipt-value">{selectedAppointment.Reason_for_visit}</span>
                  </div>
                </>
              )}

              <div className="receipt-divider"></div>

              {patientDetails?.insurance && (
                <>
                  <div className="receipt-row">
                    <span className="receipt-label">Insurance Provider:</span>
                    <span className="receipt-value">{patientDetails.insurance.payer_name}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Plan:</span>
                    <span className="receipt-value">{patientDetails.insurance.plan_name}</span>
                  </div>
                  {suggestedAmount > 0 && (
                    <div className="receipt-row">
                      <span className="receipt-label">Expected Copay:</span>
                      <span className="receipt-value">${suggestedAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="receipt-divider"></div>
                </>
              )}

              <div className="receipt-row">
                <span className="receipt-label">Payment Method:</span>
                <span className="receipt-value">{paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span>
              </div>

              <div className="receipt-row total-row">
                <span className="receipt-label">Amount Received:</span>
                <span className="receipt-value">${parseFloat(paymentAmount).toFixed(2)}</span>
              </div>

              {calculateChange() > 0 && (
                <div className="receipt-row">
                  <span className="receipt-label">Change Given:</span>
                  <span className="receipt-value">${calculateChange().toFixed(2)}</span>
                </div>
              )}

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