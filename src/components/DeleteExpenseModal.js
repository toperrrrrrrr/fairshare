import React from 'react';
import ReactDOM from 'react-dom';
import './DeleteExpenseModal.css';

const DeleteExpenseModal = ({ open, onClose, onConfirm, expense, loading }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="modal-add-expense-overlay" onClick={loading ? undefined : onClose}>
      <div className="modal-delete-expense-content" onClick={e => e.stopPropagation()} tabIndex={-1} aria-modal="true" role="dialog">
        <span className="modal-add-expense-close" onClick={loading ? undefined : onClose} tabIndex={0} aria-label="Close">&times;</span>
        <h2 style={{color:'#e53e3e',marginBottom:16}}>Delete Expense</h2>
        <div style={{marginBottom:18, fontSize:'1.07em', color:'#222'}}>
          Are you sure you want to delete this expense?
          <div style={{marginTop:10,padding:'10px 16px',background:'#f7f9fd',borderRadius:8}}>
            <b>{expense?.desc}</b><br/>
            <span style={{color:'#888'}}>₱{expense?.amount} — Paid by {expense?.paidBy}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 18px',borderRadius:6,border:'none',background:'#f4f5fb',color:'#4e54c8',fontWeight:600,fontSize:'1.06em',cursor:loading?'not-allowed':'pointer'}} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} style={{padding:'8px 18px',borderRadius:6,border:'none',background:'linear-gradient(90deg,#e53e3e,#fbb6b6)',color:'#fff',fontWeight:700,fontSize:'1.06em',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,position:'relative'}} disabled={loading}>
            {loading ? <span className="delete-modal-spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteExpenseModal;
