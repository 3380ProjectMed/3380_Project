import React, { useState, useEffect } from 'react';
import { Search, DollarSign, User, Calendar, Check, X, CreditCard, Printer } from 'lucide-react';
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

  // Search for visits
  const handleSearch = async () => {
    // Allow searching from 1 character (was 2) to be more responsive.
    if (searchTerm.length < 1) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/receptionist_api/payments/search-visits.php?search=${encodeURIComponent(searchTerm)}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.visits || []);
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
    
    try {
      const response = await fetch(
        `/receptionist_api/payments/get-payment.php?visit_id=${visit.visit_id}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setVisitDetails(data);
        setPaymentAmount(data.payment_info.remaining.replace(',', ''));
      }
    } catch (err) {
      setError('Failed to load visit');
    } finally {
      setLoading(false);
    }
  };

  // Record payment
  const recordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Enter valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/receptionist_api/payments/record-payment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visit_id: selectedVisit.visit_id,
          amount: parseFloat(paymentAmount),
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
      setError('Payment failed');
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
  };

  // Debounced search
  useEffect(() => {
    // Clear results immediately when input is empty
    if (searchTerm.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (searchTerm.length >= 1) handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="payment-page">
      <h1 className="page-title">💰 Process Payment</h1>

      {!showReceipt ? (
        <>
          {/* SEARCH */}
          {!selectedVisit && (
            <div className="search-section">
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

              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map(visit => (
                    <div 
                      key={visit.visit_id}
                      className="result-item"
                      onClick={() => selectVisit(visit)}
                    >
                      <div>
                        <strong>{visit.patient_name}</strong>
                        <p>Visit: {new Date(visit.visit_date).toLocaleDateString()}</p>
                        {visit.reason && <p className="text-muted">{visit.reason}</p>}
                      </div>
                      <span className="badge">Needs Payment</span>
                    </div>
                  ))}
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

              <div className="info-card">
                <h3>Patient: {visitDetails.visit.patient_name}</h3>
                <p>Visit Date: {new Date(visitDetails.visit.visit_date).toLocaleDateString()}</p>
                {visitDetails.visit.doctor_name && (
                  <p>Doctor: {visitDetails.visit.doctor_name}</p>
                )}
              </div>

              <div className="payment-breakdown">
                <h3>Amount Due</h3>
                <div className="breakdown-row">
                  <span>Copay:</span>
                  <span>${visitDetails.payment_info.copay}</span>
                </div>
                <div className="breakdown-row">
                  <span>Treatments:</span>
                  <span>${visitDetails.payment_info.treatments}</span>
                </div>
                <div className="breakdown-row total">
                  <strong>Total:</strong>
                  <strong>${visitDetails.payment_info.total_due}</strong>
                </div>
              </div>

              {visitDetails.treatments && visitDetails.treatments.length > 0 && (
                <div className="treatments-list">
                  <h4>Treatments:</h4>
                  {visitDetails.treatments.map((t, i) => (
                    <div key={i} className="treatment-item">
                      <span>{t.name} (x{t.quantity})</span>
                      <span>${t.cost}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="payment-input">
                <label>Payment Amount</label>
                <div className="input-group">
                  <span>$</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

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
                </div>
              </div>

              {error && (
                <div className="error-message">{error}</div>
              )}

              <button 
                className="btn-primary btn-large"
                onClick={recordPayment}
                disabled={loading || !paymentAmount}
              >
                <Check size={20} />
                {loading ? 'Processing...' : `Record Payment - $${paymentAmount}`}
              </button>
            </div>
          )}
        </>
      ) : (
        /* RECEIPT */
        <div className="receipt-section">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h2>Payment Successful!</h2>

          <div className="receipt-card">
            <h3>Receipt</h3>
            <div className="receipt-row">
              <span>Patient:</span>
              <span>{visitDetails?.visit.patient_name}</span>
            </div>
            <div className="receipt-row">
              <span>Amount Paid:</span>
              <span>${paymentAmount}</span>
            </div>
            <div className="receipt-row">
              <span>Payment Method:</span>
              <span>{paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span>
            </div>
            <div className="receipt-row">
              <span>Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="receipt-actions">
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={18} /> Print Receipt
            </button>
            <button className="btn-primary" onClick={reset}>
              Process Another Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimplePayment;