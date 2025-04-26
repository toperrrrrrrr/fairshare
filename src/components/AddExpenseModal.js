import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './GroupDashboardUI.css';
import { FiCalendar, FiEdit2 } from 'react-icons/fi';

// Helper: Avatar/Initials
const MemberAvatar = ({ member }) => {
  const name = member.username || member.email || '';
  const initials = name.replace(/^@+/, '').slice(0, 2).toUpperCase();
  return (
    <span className="gdash-avatar" title={name}>{initials}</span>
  );
};

// Helper: Option
const SplitOption = ({ value, label, checked, onChange }) => (
  <label className={`gdash-split-option${checked ? ' selected' : ''}`}>
    <input
      type="radio"
      name="splitOption"
      value={value}
      checked={checked}
      onChange={() => onChange(value)}
      aria-checked={checked}
    />
    <span className="gdash-checkmark">{checked && '✔'}</span>
    {label}
  </label>
);

const validate = (form, members) => {
  const errors = {};
  if (!form.desc.trim()) errors.desc = 'Description is required.';
  if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errors.amount = 'Enter a valid amount.';
  if (!form.paidBy) errors.paidBy = 'Select who paid.';
  if (members.length < 2) errors.paidBy = 'At least two members required.';
  return errors;
};

const AddExpenseModal = ({ open, onClose, members, onSubmit }) => {
  const [form, setForm] = useState({
    desc: '',
    amount: '',
    paidBy: members[0]?.username || members[0]?.email || '',
    splitOption: 'split-equally',
    date: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showDate, setShowDate] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const firstInputRef = useRef(null);

  // Focus trap
  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
    if (!open) {
      setForm({
        desc: '',
        amount: '',
        paidBy: members[0]?.username || members[0]?.email || '',
        splitOption: 'split-equally',
        date: '',
        notes: '',
      });
      setErrors({});
      setTouched({});
    }
  }, [open, members]);

  // Memoize paidBy/other
  const paidByMember = useMemo(
    () => members.find(m => (m.username || m.email) === form.paidBy) || members[0],
    [members, form.paidBy]
  );
  const otherMembers = useMemo(
    () => members.filter(m => (m.username || m.email) !== form.paidBy),
    [members, form.paidBy]
  );
  const otherMember = otherMembers[0] || { username: 'Other' };

  // Handle field change
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setTouched(t => ({ ...t, [name]: true }));
  };
  const handleSplitOption = value => setForm(f => ({ ...f, splitOption: value }));
  const handleAdvancedClick = (e) => {
    e.preventDefault();
  };

  // Validate on every change
  useEffect(() => {
    setErrors(validate(form, members));
  }, [form, members]);

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form); // Pass form data up
  };

  // Accessibility: trap focus in modal
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll('input,select,button,[tabindex]:not([tabindex="-1"])') || [];
    const first = focusable[0], last = focusable[focusable.length - 1];
    const trap = e => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    modalRef.current?.addEventListener('keydown', trap);
    return () => modalRef.current?.removeEventListener('keydown', trap);
  }, [open, onClose]);

  const splitOptions = useMemo(() => [
    { value: 'split-equally', label: `@${(paidByMember.username || paidByMember.email)?.replace(/^@+/, '')} paid, split equally` },
    ...otherMembers.map(m => ({ value: `owed-full-${m.username || m.email}`, label: `@${(m.username || m.email)?.replace(/^@+/, '')} owes @${(paidByMember.username || paidByMember.email)?.replace(/^@+/, '')} the full amount` })),
  ], [paidByMember, otherMembers]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="modal-add-expense-overlay" onClick={onClose}>
      <div className="modal-add-expense-content" ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()} aria-modal="true" role="dialog">
        <span className="modal-add-expense-close" onClick={onClose} tabIndex={0} aria-label="Close">&times;</span>
        <h2 className="modal-add-expense-title">Add Expense</h2>
        <form onSubmit={handleSubmit} className="modal-add-expense-form" autoComplete="off" style={{display:'flex',flexDirection:'column',gap:'1.2rem',padding:'0.5rem 0'}}>
          {/* Paid By, Amount & Description Row */}
          <div style={{display:'flex',gap:'1.1rem',flexWrap:'wrap'}}>
            <div style={{flex:'1 1 180px',minWidth:0}}>
              <label className="gdash-expense-label">
                Paid by
                <select
                  className="gdash-expense-input"
                  name="paidBy"
                  required
                  value={form.paidBy}
                  onChange={handleChange}
                  aria-invalid={!!errors.paidBy}
                  aria-describedby="paidby-error"
                >
                  <option value="">Select member</option>
                  {members.map(m => (
                    <option key={m.id} value={m.username || m.email}>
                      {(m.username || m.email)?.replace(/^@+/, '')}
                    </option>
                  ))}
                </select>
                {touched.paidBy && errors.paidBy && <span className="gdash-field-error" id="paidby-error">{errors.paidBy}</span>}
              </label>
            </div>
            <div style={{flex:'1 1 90px',minWidth:0}}>
              <label className="gdash-expense-label">
                Amount
                <input
                  className="gdash-expense-input"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  aria-invalid={!!errors.amount}
                  aria-describedby="amount-error"
                  required
                />
                {touched.amount && errors.amount && <span className="gdash-field-error" id="amount-error">{errors.amount}</span>}
              </label>
            </div>
            <div style={{flex:'2 1 170px',minWidth:0}}>
              <label className="gdash-expense-label">
                Description
                <input
                  ref={firstInputRef}
                  className="gdash-expense-input"
                  name="desc"
                  placeholder="e.g. Dinner at Luigi's"
                  value={form.desc}
                  onChange={handleChange}
                  aria-invalid={!!errors.desc}
                  aria-describedby="desc-error"
                  autoFocus
                  maxLength={80}
                  required
                />
                {touched.desc && errors.desc && <span className="gdash-field-error" id="desc-error">{errors.desc}</span>}
              </label>
            </div>
          </div>
          {/* Split Row */}
          <div style={{display:'flex',gap:'1.1rem',flexWrap:'wrap'}}>
            <div style={{flex:'1 1 180px',minWidth:0}}>
              <label className="gdash-expense-label" style={{marginBottom:4}}>
                How do you want to split?
                <div style={{position:'relative'}}>
                  <button
                    type="button"
                    className="gdash-split-dropdown-btn"
                    style={{width:'100%',padding:'0.55rem 0.9rem',borderRadius:'0.5rem',background:'#f7f7fa',border:'1.5px solid #ececff',fontSize:'1.07rem',fontWeight:500,textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem'}}
                    onClick={()=>setSplitDropdownOpen(v=>!v)}
                    aria-haspopup="listbox"
                    aria-expanded={splitDropdownOpen}
                  >
                    {splitOptions.find(opt=>opt.value===form.splitOption)?.label || 'Choose split option'}
                    <span style={{marginLeft:'auto',fontSize:'1.18em',color:'#8f94fb',transition:'transform 0.18s',transform:splitDropdownOpen?'rotate(180deg)':'none'}}>&#9660;</span>
                  </button>
                  {splitDropdownOpen && (
                    <div className="gdash-split-dropdown" style={{position:'absolute',zIndex:11,background:'#fff',boxShadow:'0 2px 12px rgba(78,84,200,0.08)',borderRadius:8,marginTop:4,minWidth:'100%',padding:'0.25rem 0.1rem'}} role="listbox">
                      {splitOptions.map(opt=>(
                        <label key={opt.value} className="gdash-split-option" style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.55rem 0.9rem 0.55rem 0.7rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'1.07rem',fontWeight:500,background:form.splitOption===opt.value?'#eef0ff':'#f7f7fa',border:form.splitOption===opt.value?'1.5px solid #8f94fb':'1.5px solid transparent',marginBottom:2}}>
                          <input
                            type="radio"
                            name="splitOption"
                            value={opt.value}
                            checked={form.splitOption===opt.value}
                            onChange={()=>handleSplitOption(opt.value)}
                            style={{accentColor:'#667eea',marginRight:6}}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
          {/* Advanced Fields Icons */}
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
          {/* Date Field */}
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
          {/* Notes Field */}
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
          {/* Summary Row */}
          <div className="gdash-expense-summary"
               style={{
                 marginTop: 16,
                 marginBottom: 8,
                 background: '#f7f9fd',
                 borderRadius: 8,
                 padding: '14px 18px',
                 color: '#222',
                 fontSize: '1.08em',
                 boxShadow: '0 2px 8px rgba(78,84,200,0.06)',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: 4,
                 minHeight: 44
               }}>
            <div style={{fontWeight:600,marginBottom:2,letterSpacing:'0.01em',color:'#495'}}>
              <span style={{fontWeight:700,marginRight:2}}>Summary</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,minHeight:26}}>
              <span>
                {form.desc && <span><b>{form.desc}</b>; </span>}
                {form.amount && <span>₱{form.amount}; </span>}
                {paidByMember && <span>Paid by <b>@{(paidByMember.username || paidByMember.email)?.replace(/^@+/, '')}</b>; </span>}
                {form.splitOption === 'split-equally'
                  ? <span>split equally</span>
                  : (() => {
                      const match = form.splitOption.match(/^owed-full-(.+)$/);
                      if (match) {
                        const owedUser = members.find(m => (m.username || m.email) === match[1]);
                        return owedUser ? <span>@{(owedUser.username || owedUser.email)?.replace(/^@+/, '')} owes @{(paidByMember.username || paidByMember.email)?.replace(/^@+/, '')} the full amount</span> : '';
                      }
                      return '';
                    })()}
                {form.date && <span style={{color:'#888',marginLeft:8}}>on {new Date(form.date).toLocaleDateString()}</span>}
                {form.notes && <span style={{color:'#4e54c8',marginLeft:8}} title={form.notes}>• Notes added</span>}
              </span>
            </div>
          </div>
          {/* Submit Button */}
          <button
            className="gdash-expense-submit"
            type="submit"
            disabled={Object.keys(errors).length > 0 || !form.desc || !form.amount || !form.paidBy}
            style={{marginTop:'0.7rem'}}
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddExpenseModal;
