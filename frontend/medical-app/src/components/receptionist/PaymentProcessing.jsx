import React, { useState, useEffect } from 'react';
import { 
  Search, DollarSign, User, Check, X, CreditCard, Printer, 
  Heart, AlertCircle, Filter, Calendar, Receipt, Clock,
  Phone, Mail, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import './PaymentProcessing.css';

function PaymentProcessing() {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitDetails, setVisitDetails] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [filter, setFilter] = useState('unpaid');
  const [receiptData, setReceiptData] = useState(null);

  const handleSearch = async () => {
    if (searchTerm.length < 1) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/receptionist_api/payments/search-visits.php?search=${encodeURIComponent(searchTerm)}&filter=${filter}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.visits || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectVisit = async (visit) => {
    setSelectedVisit(visit);
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `/receptionist_api/payments/get-payment.php?visit_id=${visit.visit_id}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setVisitDetails(data);
        
        const copay = data.copay_amount ? parseFloat(data.copay_amount.replace(/,/g, '')) : 0;
        setPaymentAmount(copay > 0 ? copay.toFixed(2) : '');
      } else {
        setError(data.error || 'Failed to load visit');
      }
    } catch (err) {
      setError('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      setError('Enter valid payment amount');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/receptionist_api/payments/record-payment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visit_id: selectedVisit.visit_id,
          amount: amount,
          method: paymentMethod,
          notes: paymentNotes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReceiptData(data);
        setShowReceipt(true);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err) {
      setError('Payment failed - please try again');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedVisit(null);
    setVisitDetails(null);
    setSearchTerm('');
    setSearchResults([]);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowReceipt(false);
    setReceiptData(null);
    setError('');
    setPaymentMethod('card');
  };

  useEffect(() => {
    if (searchTerm.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filter]);

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="payment-page">
      {}
      <div className="page-header">
        <h1 className="page-title">
          <DollarSign size={32} style={{display: 'inline', marginRight: '12px'}} />
          Collect Copay
        </h1>
        <p className="page-subtitle">Process patient copayments and insurance collections</p>
      </div>

      {!showReceipt ? (
        <>
          {}
          {!selectedVisit && (
            <div className="search-section">
              {}
              <div className="filter-toggle">
                <button
                  className={`filter-btn ${filter === 'unpaid' ? 'filter-active' : ''}`}
                  onClick={() => setFilter('unpaid')}
                >
                  <Filter size={16} />
                  Needs Payment
                </button>
                <button
                  className={`filter-btn ${filter === 'all' ? 'filter-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  <Filter size={16} />
                  All Visits
                </button>
              </div>

              {}
              <div className="search-box-container">
                <Search className="search-icon-left" size={20} />
                <input
                  type="text"
                  className="search-input-main"
                  placeholder="Search patient name or appointment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {searchTerm && (
                  <button 
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {}
              {loading && searchTerm && (
                <div className="loading-message">
                  <div className="loading-spinner"></div>
                  <span>Searching...</span>
                </div>
              )}

              {}
              {searchResults.length > 0 && (
                <div className="results-container">
                  <p className="results-count">
                    Found {searchResults.length} {searchResults.length === 1 ? 'visit' : 'visits'}
                  </p>
                  <div className="results-list">
                    {searchResults.map(visit => (
                      <div 
                        key={visit.visit_id}
                        className={`result-card ${visit.is_paid ? 'result-paid' : ''}`}
                        onClick={() => !visit.is_paid && selectVisit(visit)}
                        style={{cursor: visit.is_paid ? 'default' : 'pointer'}}
                      >
                        {}
                        <div className="result-avatar">
                          <User size={28} />
                        </div>

                        {}
                        <div className="result-info">
                          <h3 className="result-name">{visit.patient_name}</h3>
                          <div className="result-meta">
                            <span className="meta-item">
                              <Calendar size={14} />
                              {new Date(visit.visit_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            {visit.reason && (
                              <span className="meta-item">
                                <FileText size={14} />
                                {visit.reason}
                              </span>
                            )}
                          </div>
                        </div>

                        {}
                        <div className="result-status">
                          {visit.is_paid ? (
                            <div className="status-badge status-paid">
                              <CheckCircle size={16} />
                              <span>Paid ${visit.payment}</span>
                            </div>
                          ) : (
                            <div className="status-badge status-pending">
                              <AlertCircle size={16} />
                              <span>Pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {searchTerm.length >= 1 && !loading && searchResults.length === 0 && (
                <div className="no-results">
                  <AlertCircle size={48} />
                  <h3>No visits found</h3>
                  <p>Try searching by full patient name or appointment number</p>
                </div>
              )}
            </div>
          )}

          {}
          {selectedVisit && visitDetails && !showReceipt && (
            <div className="payment-content">
              {}
              <button className="btn-back" onClick={reset}>
                <X size={18} /> Back to Search
              </button>

              {}
              {visitDetails.visit.already_paid && parseFloat(visitDetails.visit.already_paid) > 0 && (
                <div className="already-paid-banner">
                  <CheckCircle size={24} />
                  <div className="banner-content">
                    <h3>Payment Already Recorded</h3>
                    <p>Amount: ${visitDetails.visit.already_paid} • Method: {visitDetails.visit.payment_method_used || 'Unknown'}</p>
                    <p className="banner-date">
                      Recorded on {new Date(visitDetails.visit.last_updated || visitDetails.visit.visit_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="payment-grid">
                {}
                <div className="payment-left">
                  {}
                  <div className="patient-card">
                    <div className="card-header">
                      <div className="patient-avatar-large">
                        <User size={32} />
                      </div>
                      <div className="patient-header-info">
                        <h2 className="patient-name-large">{visitDetails.visit.patient_name}</h2>
                        <div className="patient-meta-row">
                          {visitDetails.visit.patient_dob && (
                            <span className="meta-chip">
                              <Calendar size={14} />
                              DOB: {new Date(visitDetails.visit.patient_dob).toLocaleDateString()}
                            </span>
                          )}
                          {visitDetails.visit.patient_phone && (
                            <span className="meta-chip">
                              <Phone size={14} />
                              {visitDetails.visit.patient_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="visit-details-section">
                      <div className="detail-row">
                        <span className="detail-label">Visit Date:</span>
                        <span className="detail-value">
                          {new Date(visitDetails.visit.visit_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Appointment ID:</span>
                        <span className="detail-value">#{visitDetails.visit.appointment_id}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Visit ID:</span>
                        <span className="detail-value">#{visitDetails.visit.visit_id}</span>
                      </div>
                    </div>
                  </div>

                  {}
                  {visitDetails.insurance && visitDetails.insurance.has_insurance ? (
                    <div className="insurance-card-full">
                      <div className="insurance-header">
                        <Heart size={24} />
                        <h3>Insurance Coverage</h3>
                      </div>
                      
                      <div className="insurance-provider-section">
                        <div className="provider-badge">
                          <span className="provider-name">{visitDetails.insurance.payer_name}</span>
                          <span className="plan-type">{visitDetails.insurance.plan_type}</span>
                        </div>
                        <div className="plan-name">{visitDetails.insurance.plan_name}</div>
                      </div>

                      <div className="insurance-details-grid">
                        {visitDetails.insurance.member_id && (
                          <div className="insurance-detail">
                            <span className="insurance-label">Member ID</span>
                            <span className="insurance-value">{visitDetails.insurance.member_id}</span>
                          </div>
                        )}
                        {visitDetails.insurance.group_id && (
                          <div className="insurance-detail">
                            <span className="insurance-label">Group ID</span>
                            <span className="insurance-value">{visitDetails.insurance.group_id}</span>
                          </div>
                        )}
                        <div className="insurance-detail">
                          <span className="insurance-label">Deductible</span>
                          <span className="insurance-value">{visitDetails.insurance.deductible}</span>
                        </div>
                        <div className="insurance-detail">
                          <span className="insurance-label">Coinsurance</span>
                          <span className="insurance-value">{visitDetails.insurance.coinsurance_rate}</span>
                        </div>
                      </div>

                      {}
                      <div className="copay-highlight">
                        <span className="copay-label">Patient Copay</span>
                        <span className="copay-amount">${visitDetails.insurance.copay}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="no-insurance-card">
                      <AlertTriangle size={32} />
                      <h3>No Insurance on File</h3>
                      <p>Patient will be responsible for full payment</p>
                    </div>
                  )}
                </div>

                {}
                <div className="payment-right">
                  {(!visitDetails.visit.already_paid || parseFloat(visitDetails.visit.already_paid) === 0) && (
                    <>
                      {}
                      <div className="payment-card">
                        <h3 className="card-title">
                          <DollarSign size={20} />
                          Payment Amount
                        </h3>
                        
                        <div className="amount-input-group">
                          <span className="currency-symbol">$</span>
                          <input
                            type="number"
                            className="amount-input"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            autoFocus
                          />
                        </div>

                        {visitDetails.copay_amount && parseFloat(visitDetails.copay_amount) > 0 && (
                          <div className="expected-copay-note">
                            <Clock size={14} />
                            Expected copay: ${visitDetails.copay_amount}
                          </div>
                        )}
                      </div>

                      {}
                      <div className="payment-card">
                        <h3 className="card-title">
                          <CreditCard size={20} />
                          Payment Method
                        </h3>

                        <div className="method-grid">
                          <button
                            className={`method-option ${paymentMethod === 'card' ? 'method-active' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            <CreditCard size={24} />
                            <span>Credit/Debit Card</span>
                          </button>
                          <button
                            className={`method-option ${paymentMethod === 'cash' ? 'method-active' : ''}`}
                            onClick={() => setPaymentMethod('cash')}
                          >
                            <DollarSign size={24} />
                            <span>Cash</span>
                          </button>
                          <button
                            className={`method-option ${paymentMethod === 'check' ? 'method-active' : ''}`}
                            onClick={() => setPaymentMethod('check')}
                          >
                            <FileText size={24} />
                            <span>Check</span>
                          </button>
                        </div>
                      </div>

                      {}
                      <div className="payment-card">
                        <h3 className="card-title">
                          <FileText size={20} />
                          Payment Notes <span className="optional-label">(Optional)</span>
                        </h3>
                        
                        <textarea
                          className="payment-notes-input"
                          placeholder="Add any notes about this payment..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          rows="3"
                        />
                      </div>

                      {}
                      {error && (
                        <div className="error-alert">
                          <AlertCircle size={20} />
                          <span>{error}</span>
                        </div>
                      )}

                      {}
                      <button 
                        className="btn-submit-payment"
                        onClick={recordPayment}
                        disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check size={20} />
                            Record Payment • ${paymentAmount || '0.00'}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        
        <div className="receipt-container">
          <div className="receipt-success">
            <div className="success-icon-large">
              <CheckCircle size={64} />
            </div>
            <h2 className="success-title">Payment Received!</h2>
            <p className="success-subtitle">Transaction completed successfully</p>
          </div>

          <div className="receipt-card">
            {}
            <div className="receipt-header">
              <Receipt size={32} />
              <div>
                <h3>Payment Receipt</h3>
                <p className="receipt-number">Receipt #{visitDetails?.visit.visit_id}-{Date.now()}</p>
              </div>
            </div>

            {}
            <div className="receipt-body">
              <div className="receipt-section">
                <h4 className="receipt-section-title">Patient Information</h4>
                <div className="receipt-row">
                  <span className="receipt-label">Name:</span>
                  <span className="receipt-value">{visitDetails?.visit.patient_name}</span>
                </div>
                {visitDetails?.visit.patient_dob && (
                  <div className="receipt-row">
                    <span className="receipt-label">Date of Birth:</span>
                    <span className="receipt-value">
                      {new Date(visitDetails.visit.patient_dob).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="receipt-row">
                  <span className="receipt-label">Visit ID:</span>
                  <span className="receipt-value">#{selectedVisit?.visit_id}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Appointment ID:</span>
                  <span className="receipt-value">#{visitDetails?.visit.appointment_id}</span>
                </div>
              </div>

              {visitDetails?.insurance?.has_insurance && (
                <div className="receipt-section">
                  <h4 className="receipt-section-title">Insurance Details</h4>
                  <div className="receipt-row">
                    <span className="receipt-label">Provider:</span>
                    <span className="receipt-value">{visitDetails.insurance.payer_name}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Plan:</span>
                    <span className="receipt-value">{visitDetails.insurance.plan_name}</span>
                  </div>
                  {visitDetails.insurance.member_id && (
                    <div className="receipt-row">
                      <span className="receipt-label">Member ID:</span>
                      <span className="receipt-value">{visitDetails.insurance.member_id}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="receipt-section">
                <h4 className="receipt-section-title">Payment Details</h4>
                <div className="receipt-row">
                  <span className="receipt-label">Method:</span>
                  <span className="receipt-value receipt-value-cap">
                    {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                  </span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Date & Time:</span>
                  <span className="receipt-value">
                    {new Date().toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {paymentNotes && (
                  <div className="receipt-row receipt-row-full">
                    <span className="receipt-label">Notes:</span>
                    <span className="receipt-value">{paymentNotes}</span>
                  </div>
                )}
              </div>

              {}
              <div className="receipt-total">
                <span className="receipt-total-label">Copay Collected</span>
                <span className="receipt-total-amount">${paymentAmount}</span>
              </div>
            </div>

            {}
            <div className="receipt-note">
              <AlertCircle size={16} />
              <p>
                <strong>Important:</strong> This receipt is for the copay only. 
                Additional charges may apply after insurance processing. 
                A detailed bill will be sent separately.
              </p>
            </div>
          </div>

          {}
          <div className="receipt-actions">
            <button className="btn-secondary" onClick={printReceipt}>
              <Printer size={18} />
              Print Receipt
            </button>
            <button className="btn-primary" onClick={reset}>
              <Check size={18} />
              Next Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentProcessing;