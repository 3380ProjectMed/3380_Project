import React, { useState, useEffect } from 'react';
import { Search, DollarSign, User, Check, X, CreditCard, Printer, Heart, AlertCircle, Filter } from 'lucide-react';
import './PaymentProcessing.css';

function SimplePayment() {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitDetails, setVisitDetails] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [filter, setFilter] = useState('unpaid'); // 'unpaid' or 'all'

  // Search for visits
  const handleSearch = async () => {
    if (searchTerm.length < 1) return;
    
    setLoading(true);
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
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Load visit details
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
        // Auto-fill copay amount
        const copay = data.copay_amount ? parseFloat(data.copay_amount.replace(',', '')) : 0;
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

  // Record payment
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
          method: paymentMethod
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
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

  // Reset everything
  const reset = () => {
    setSelectedVisit(null);
    setVisitDetails(null);
    setSearchTerm('');
    setSearchResults([]);
    setPaymentAmount('');
    setShowReceipt(false);
    setError('');
    setPaymentMethod('card');
  };

  // Debounced search
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

  return (
    <div className="payment-page">
      <h1 className="page-title">💰 Collect Copay</h1>

      {!showReceipt ? (
        <>
          {/* SEARCH */}
          {!selectedVisit && (
            <div className="search-section">
              {/* Filter Toggle */}
              <div className="filter-toggle">
                <button
                  className={filter === 'unpaid' ? 'active' : ''}
                  onClick={() => setFilter('unpaid')}
                >
                  <Filter size={16} />
                  Needs Payment
                </button>
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => setFilter('all')}
                >
                  <Filter size={16} />
                  All Visits
                </button>
              </div>

              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search patient name or appointment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {loading && searchTerm && (
                <div className="loading-message">Searching...</div>
              )}

              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map(visit => (
                    <div 
                      key={visit.visit_id}
                      className={`result-item ${visit.is_paid ? 'paid-visit' : ''}`}
                      onClick={() => selectVisit(visit)}
                    >
                      <div>
                        <strong>{visit.patient_name}</strong>
                        <p>Visit: {new Date(visit.visit_date).toLocaleDateString()}</p>
                        {visit.reason && <p className="text-muted">{visit.reason}</p>}
                      </div>
                      <div className="visit-status">
                        {visit.is_paid ? (
                          <span className="badge badge-paid">
                            <Check size={14} />
                            Paid ${visit.payment}
                          </span>
                        ) : (
                          <span className="badge">Collect Copay</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 1 && !loading && searchResults.length === 0 && (
                <div className="no-results">
                  <AlertCircle size={48} />
                  <p>No patients found</p>
                  <p className="text-muted">Try searching by full name or appointment number</p>
                </div>
              )}
            </div>
          )}

          {/* PAYMENT FORM */}
          {selectedVisit && visitDetails && !showReceipt && (
            <div className="payment-section">
              <button className="btn-back" onClick={reset}>
                <X size={18} /> Back to Search
              </button>

              {/* Show if already paid */}
              {visitDetails.visit.already_paid && parseFloat(visitDetails.visit.already_paid) > 0 && (
                <div className="already-paid-banner">
                  <Check size={20} />
                  <div>
                    <strong>Payment Already Recorded</strong>
                    <p>This visit was paid on {new Date(visitDetails.visit.last_updated || visitDetails.visit.visit_date).toLocaleDateString()}</p>
                    <p>Amount: ${visitDetails.visit.already_paid} ({visitDetails.visit.payment_method_used || 'Unknown method'})</p>
                  </div>
                </div>
              )}

              {/* Patient Info */}
              <div className="info-card">
                <h3><User size={20} style={{display: 'inline', marginRight: '8px'}} />Patient: {visitDetails.visit.patient_name}</h3>
                <p>Visit Date: {new Date(visitDetails.visit.visit_date).toLocaleDateString()}</p>
                {visitDetails.visit.patient_dob && (
                  <p>DOB: {new Date(visitDetails.visit.patient_dob).toLocaleDateString()}</p>
                )}
              </div>

              {/* Insurance Info */}
              {visitDetails.insurance && visitDetails.insurance.has_insurance ? (
                <div className="insurance-card">
                  <h3><Heart size={20} style={{display: 'inline', marginRight: '8px'}} />Insurance Coverage</h3>
                  <div className="insurance-details">
                    <div className="insurance-row">
                      <span>Provider:</span>
                      <strong>{visitDetails.insurance.payer_name}</strong>
                    </div>
                    <div className="insurance-row">
                      <span>Plan:</span>
                      <strong>{visitDetails.insurance.plan_name} ({visitDetails.insurance.plan_type})</strong>
                    </div>
                    {visitDetails.insurance.member_id && (
                      <div className="insurance-row">
                        <span>Member ID:</span>
                        <span>{visitDetails.insurance.member_id}</span>
                      </div>
                    )}
                    <div className="insurance-divider"></div>
                    <div className="insurance-row copay-row">
                      <span>Copay Amount:</span>
                      <strong className="copay-amount">${visitDetails.insurance.copay}</strong>
                    </div>
                    <div className="insurance-row-small">
                      <span>Deductible: {visitDetails.insurance.deductible}</span>
                      <span>Coinsurance: {visitDetails.insurance.coinsurance_rate}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-insurance-card">
                  <AlertCircle size={24} />
                  <p>No active insurance on file</p>
                  <p className="text-muted">Patient will pay out-of-pocket</p>
                </div>
              )}

              {/* Only show payment form if not already paid */}
              {(!visitDetails.visit.already_paid || parseFloat(visitDetails.visit.already_paid) === 0) && (
                <>
                  {/* Payment Amount */}
                  <div className="payment-input">
                    <label>Copay Amount Collected</label>
                    <div className="input-group">
                      <span>$</span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    {visitDetails.copay_amount && parseFloat(visitDetails.copay_amount) > 0 && (
                      <p className="help-text">
                        Expected copay: ${visitDetails.copay_amount}
                      </p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="payment-methods">
                    <label>Payment Method</label>
                    <div className="method-buttons">
                      <button
                        className={paymentMethod === 'cash' ? 'active' : ''}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <DollarSign size={20} /> Cash
                      </button>
                      <button
                        className={paymentMethod === 'card' ? 'active' : ''}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard size={20} /> Card
                      </button>
                      <button
                        className={paymentMethod === 'check' ? 'active' : ''}
                        onClick={() => setPaymentMethod('check')}
                      >
                        <CreditCard size={20} /> Check
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="error-message">
                      <AlertCircle size={20} />
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    className="btn-primary btn-large"
                    onClick={recordPayment}
                    disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  >
                    <Check size={20} />
                    {loading ? 'Processing...' : `Record Copay Payment - $${paymentAmount || '0.00'}`}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        /* RECEIPT */
        <div className="receipt-section">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h2>Copay Received!</h2>

          <div className="receipt-card">
            <h3>Payment Receipt</h3>
            
            <div className="receipt-row">
              <span>Patient:</span>
              <span>{visitDetails?.visit.patient_name}</span>
            </div>
            
            <div className="receipt-row">
              <span>Visit ID:</span>
              <span>{selectedVisit?.visit_id}</span>
            </div>
            
            {visitDetails?.insurance?.has_insurance && (
              <>
                <div className="receipt-divider"></div>
                <div className="receipt-row">
                  <span>Insurance:</span>
                  <span>{visitDetails.insurance.payer_name}</span>
                </div>
                <div className="receipt-row">
                  <span>Plan:</span>
                  <span>{visitDetails.insurance.plan_name}</span>
                </div>
              </>
            )}
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-row">
              <span>Payment Method:</span>
              <span>{paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span>
            </div>
            
            <div className="receipt-row total-row">
              <strong>Copay Collected:</strong>
              <strong>${paymentAmount}</strong>
            </div>
            
            <div className="receipt-row">
              <span>Date:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="receipt-note">
            <p><strong>Note:</strong> Medical bills for services will be sent separately after insurance processing.</p>
          </div>

          <div className="receipt-actions">
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={18} /> Print Receipt
            </button>
            <button className="btn-primary" onClick={reset}>
              Next Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimplePayment;