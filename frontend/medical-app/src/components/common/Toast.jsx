import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', duration = 4000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive">
      <div className="toast-body">
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={() => onClose && onClose()} aria-label="Close">×</button>
      </div>
    </div>
  );
}
