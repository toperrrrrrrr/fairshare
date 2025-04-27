import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './SettleUpModal.css';

/**
 * SettleUpModal
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSubmit: (amount, note) => void
 *   maxAmount: number
 *   from: { id, name }
 *   to: { id, name }
 *   currency?: string
 */
export default function SettleUpModal({ open, onClose, onSubmit, maxAmount, from, to, currency = '₱' }) {
  const [amount, setAmount] = useState(maxAmount);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  if (!open) return null;
  const handleAmountChange = e => {
    const val = e.target.value;
    setAmount(val);
    setError('');
  };
  const handleSubmit = e => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be positive');
      return;
    }
    // No upper limit; allow overpayment
    onSubmit(amt, note);
  };
  return ReactDOM.createPortal(
    <div className="modal-add-expense-overlay" onClick={onClose}>
      <div className="modal-settleup-content" onClick={e => e.stopPropagation()} tabIndex={-1} aria-modal="true" role="dialog">
        <span className="modal-add-expense-close" onClick={onClose} tabIndex={0} aria-label="Close">&times;</span>
        <h2 style={{marginBottom:16}}>Settle Up</h2>
        <div style={{marginBottom:10,fontSize:'1.03em'}}>
          <strong>{from.name}</strong> will pay <strong>{to.name}</strong>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="gdash-expense-label" style={{marginBottom:6}}>
            Amount ({currency})
            <input type="number" min="0.01" step="0.01" max={maxAmount} required value={amount} onChange={handleAmountChange} className="gdash-expense-input" style={{marginTop:4,width:'100%'}} />
          </label>
          <label className="gdash-expense-label" style={{marginTop:10,marginBottom:6}}>
            Note (optional)
            <input type="text" maxLength={60} value={note} onChange={e=>setNote(e.target.value)} className="gdash-expense-input" style={{marginTop:4,width:'100%'}} placeholder="e.g. Paid via GCash" />
          </label>
          {error && <div style={{color:'#e53e3e',marginTop:6,fontWeight:600}}>{error}</div>}
          <button type="submit" className="gdash-settleup-btn" style={{marginTop:18,padding:'10px 22px',borderRadius:8,border:'1px solid #a5b4fc',background:'#fff',fontWeight:700,fontSize:'1.09em',color:'#4e54c8',cursor:'pointer',boxShadow:'0 1px 4px rgba(78,84,200,0.05)'}}>Settle</button>
        </form>
      </div>
    </div>,
    document.body
  );
}
