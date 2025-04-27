import React from 'react';
import { FiCalendar, FiEdit2 } from 'react-icons/fi';

const AdvancedFields = ({ showDate, setShowDate, showNotes, setShowNotes, form, handleChange }) => (
  <>
    <div style={{display:'flex',justifyContent:'flex-end',gap:'1.2rem',marginTop:0,marginBottom:-8}}>
      <button
        type="button"
        className="gdash-advanced-btn"
        style={{background:'none',border:'none',cursor:'pointer',color:'#4e54c8',fontSize:'1.13rem',display:'flex',alignItems:'center',gap:4}}
        onClick={()=>setShowDate(v=>!v)}
        tabIndex={0}
        aria-label={showDate ? 'Hide date' : 'Edit date'}
        title={showDate ? 'Hide date' : 'Edit date'}
      >
        <FiCalendar style={{marginRight:2}}/>{showDate ? '' : ''}
      </button>
      <button
        type="button"
        className="gdash-advanced-btn"
        style={{background:'none',border:'none',cursor:'pointer',color:'#4e54c8',fontSize:'1.13rem',display:'flex',alignItems:'center',gap:4}}
        onClick={()=>setShowNotes(v=>!v)}
        tabIndex={0}
        aria-label={showNotes ? 'Hide notes' : 'Edit notes'}
        title={showNotes ? 'Hide notes' : 'Edit notes'}
      >
        <FiEdit2 style={{marginRight:2}}/>{showNotes ? '' : ''}
      </button>
    </div>
    {showDate && (
      <div style={{margin:'0.3rem 0 0.2rem 0',maxWidth:220}}>
        <label className="gdash-expense-label" style={{marginBottom:0}}>
          Date
          <input
            className="gdash-expense-input"
            type="date"
            name="date"
            value={form.date || ''}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </label>
      </div>
    )}
    {showNotes && (
      <div style={{margin:'0.3rem 0 0.2rem 0',maxWidth:420}}>
        <label className="gdash-expense-label" style={{marginBottom:0}}>
          Notes (optional)
          <textarea
            className="gdash-expense-input"
            name="notes"
            placeholder="Add any extra details..."
            value={form.notes || ''}
            onChange={handleChange}
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </label>
      </div>
    )}
  </>
);

export default AdvancedFields;
