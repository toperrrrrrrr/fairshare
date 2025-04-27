import React from 'react';
import { useSwipeable } from 'react-swipeable';

const ExpenseCard = ({
  exp,
  isSwiped,
  setSwipedExpenseId,
  handleEditExpense,
  handleDeleteExpense
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setSwipedExpenseId(exp.id),
    onSwipedRight: () => setSwipedExpenseId(null),
    trackMouse: true
  });

  return (
    <div
      {...swipeHandlers}
      className={
        'swipeable-expense-card ' +
        (isSwiped ? 'show-actions ' : '') +
        'expense-card-clean w-full bg-white rounded-xl shadow-sm p-4 mb-4 focus-within:ring-2 focus-within:ring-violet-200'
      }
      tabIndex={0}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gridTemplateRows: 'auto auto',
        alignItems: 'center',
        gap: '0.55rem 1.3rem',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '82px',
        transition: 'transform 0.32s cubic-bezier(.42,1.6,.3,1)', // Smooth swipe
        transform: isSwiped ? 'translateX(-7.5rem)' : 'translateX(0)',
      }}
    >
      {/* Swipe Actions Overlay */}
      <div className="swipe-actions" style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        width: '7.5rem',
        display: 'flex',
        flexDirection: 'row',
        zIndex: 10,
        boxShadow: 'none',
        padding: 0,
        margin: 0,
        pointerEvents: isSwiped ? 'auto' : 'none',
        transition: 'opacity 0.22s',
        opacity: isSwiped ? 1 : 0,
      }}>
        <button
          className="swipe-action-btn swipe-edit-btn"
          title="Edit expense"
          aria-label="Edit expense"
          style={{
            background: '#4e54c8',
            border: 'none',
            borderRadius: 0,
            height: '100%',
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.18s',
            outline: 'none',
            padding: 0,
            margin: 0,
          }}
          onClick={() => { setSwipedExpenseId(null); handleEditExpense(exp); }}
        >
          <svg width="28" height="28" className="icon-action" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
        <button
          className="swipe-action-btn swipe-delete-btn"
          title="Delete expense"
          aria-label="Delete expense"
          style={{
            background: '#ef4444',
            border: 'none',
            borderRadius: 0,
            height: '100%',
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.18s',
            outline: 'none',
            padding: 0,
            margin: 0,
            borderLeft: '2px solid #fff',
          }}
          onClick={() => { setSwipedExpenseId(null); handleDeleteExpense(exp); }}
        >
          <svg width="28" height="28" className="icon-action" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
      {/* Icon/Avatar */}
      <span className="expense-type-avatar flex items-center justify-center bg-violet-50 text-violet-700 text-xl font-bold rounded-full w-10 h-10 shadow-sm" style={{gridColumn: 1, gridRow: '1 / span 2', alignSelf: 'center', marginRight: '0.3rem'}}>
        {exp.icon || '🧾'}
      </span>
      {/* Top Row: Description */}
      <div style={{gridColumn: 2, gridRow: 1, alignSelf: 'center', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.18rem'}}>
        <span className="text-xl font-bold text-gray-900 truncate leading-snug" style={{lineHeight: 1.22}}>{exp.desc}</span>
        <div className="flex flex-row items-center gap-1 text-sm text-gray-400 font-medium" style={{marginTop: '0.13rem'}}>
          <span>Paid by <b className="text-violet-700 font-semibold">@{exp.paidBy.replace(/^@+/, '')}</b></span>
          <span className="dot-separator">·</span>
          <span>{exp.date ? new Date(exp.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (exp.createdAt ? new Date(exp.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')}</span>
        </div>
      </div>
      {/* Amount - Always right aligned, vertically centered */}
      <span className="amount-badge-clean bg-violet-200 text-violet-800 font-extrabold rounded-full px-7 py-2 text-2xl ml-3 whitespace-nowrap shadow border border-violet-200" style={{gridColumn: 3, gridRow: '1 / span 2', justifySelf: 'end', alignSelf: 'center', marginTop: '0'}}>
        ₱{exp.amount}
      </span>
    </div>
  );
};

export default ExpenseCard;
