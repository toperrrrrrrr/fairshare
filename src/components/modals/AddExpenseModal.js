import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../group/GroupDashboardUI.css';
import { FiCalendar, FiEdit2 } from 'react-icons/fi';
import ExpenseFormFields from './ExpenseFormFields';
import SplitOptionSelector from './SplitOptionSelector';
import AdvancedFields from './AdvancedFields';
import ExpenseSummary from './ExpenseSummary';

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
          <ExpenseFormFields
            form={form}
            errors={errors}
            touched={touched}
            members={members}
            handleChange={handleChange}
            firstInputRef={firstInputRef}
          />
          <SplitOptionSelector
            splitOptions={splitOptions}
            splitDropdownOpen={splitDropdownOpen}
            setSplitDropdownOpen={setSplitDropdownOpen}
            form={form}
            handleSplitOption={handleSplitOption}
          />
          <AdvancedFields
            showDate={showDate}
            setShowDate={setShowDate}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            form={form}
            handleChange={handleChange}
          />
          <ExpenseSummary
            form={form}
            paidByMember={paidByMember}
            members={members}
          />
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
