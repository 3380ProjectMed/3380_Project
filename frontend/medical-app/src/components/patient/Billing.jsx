import React from 'react';
import { CreditCard } from 'lucide-react';
import './Billing.css';

export default function Billing(props) {
  const { loading, billingBalance = 0, billingStatements = [], processPayment } = props;
  // billingBalance may come back as a string from the API (e.g. "0.00"). Coerce to number for safe math/formatting.
  const balanceNumber = typeof billingBalance === 'string' ? parseFloat(billingBalance || 0) : Number(billingBalance || 0);

  const handleMakePayment = async () => {
    // Choose the first outstanding statement if available
    const stmt = billingStatements.find(s => Number(s.balance) > 0) || null;
  const defaultAmount = stmt ? Number(stmt.balance).toFixed(2) : balanceNumber.toFixed(2);
    const amountStr = window.prompt('Enter payment amount', defaultAmount);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

    const visitId = stmt ? stmt.id : null;
    try {
      await processPayment({ visit_id: visitId, amount });
      alert('Payment processed');
      // Optionally reload data by full page or parent callback
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Payment failed');
    }
  };

  return (
    <div className="portal-content">
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
    </div>
  );
}
