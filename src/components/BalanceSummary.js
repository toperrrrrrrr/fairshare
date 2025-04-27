import React, { useState, useRef, useEffect } from 'react';
import './BalanceListItem.css';
import SettleUpModal from './modals/SettleUpModal';
import { addSettlementTransaction } from '../services/transactionService';

// balances: [{ from: string, to: string, amount: number }]
// currentUser: string (e.g., 'You' or user id)
// getDisplayName: function (name) => string
export default function BalanceSummary({ balances, currentUser, getDisplayName, groupId, refreshTransactions }) {
  const [collapsed, setCollapsed] = useState(true);
  const summaryRef = useRef(null);
  const [settleModal, setSettleModal] = useState({ open: false, balance: null });

  // Animate collapse from bottom up
  useEffect(() => {
    const el = summaryRef.current;
    if (!el) return;
    if (collapsed) {
      el.style.maxHeight = '0px';
      el.style.opacity = 0;
      el.style.transition = 'max-height 0.33s cubic-bezier(.4,0,.2,1), opacity 0.22s';
    } else {
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = 1;
      el.style.transition = 'max-height 0.33s cubic-bezier(.4,0,.2,1), opacity 0.22s';
    }
  }, [collapsed, balances]);

  if (!balances || balances.length === 0) {
    return <div style={{padding:'1.3rem 0',color:'#aaa',textAlign:'center',fontSize:'1.05rem'}}>No balances to show 🎉</div>;
  }

  // Helper: is current user involved in this balance?
  function isUserInvolved(b) {
    return b.from === currentUser || b.to === currentUser;
  }

  return (
    <div style={{width:'100%',maxWidth:540,margin:'0 auto',position:'relative'}}>
      <button
        className="gdash-collapse-btn"
        style={{display:'flex',alignItems:'center',gap:8,margin:'0 auto 10px auto',padding:'6px 15px',borderRadius:'8px',background:'#ecefff',border:'none',color:'#4e54c8',fontWeight:600,fontSize:'1.04rem',cursor:'pointer',boxShadow:'0 1px 4px rgba(78,84,200,0.05)'}}
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
        aria-controls="balance-summary-list"
      >
        {collapsed ? 'Show Balance Summary' : 'Hide Balance Summary'}
        <span style={{fontSize:'1.2em',transition:'transform 0.18s',transform:collapsed?'rotate(0deg)':'rotate(180deg)'}}>
          ▼
        </span>
      </button>
      <div
        id="balance-summary-list"
        ref={summaryRef}
        style={{
          overflow: 'hidden',
          maxHeight: collapsed ? 0 : summaryRef.current ? summaryRef.current.scrollHeight : 'none',
          opacity: collapsed ? 0 : 1,
          transition: 'max-height 0.33s cubic-bezier(.4,0,.2,1), opacity 0.22s',
          willChange: 'max-height, opacity',
        }}
      >
        {balances.map((b, i) => {
          let leftText;
          if (b.from === currentUser) {
            leftText = `You owe ${getDisplayName(b.to)}`;
          } else if (b.to === currentUser) {
            leftText = `${getDisplayName(b.from)} owes You`;
          } else {
            leftText = `${getDisplayName(b.from)} owes ${getDisplayName(b.to)}`;
          }
          const isCurrentUserOwes = b.from === currentUser;
          const isCurrentUserInvolved = isUserInvolved(b);
          return (
            <div key={i} className="balance-list-item-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:600,fontSize:'1.03rem'}}>{leftText}</span>
              <span className="amount-badge-clean bg-violet-200 text-violet-800 font-extrabold rounded-full px-7 py-2 text-2xl ml-3 whitespace-nowrap shadow border border-violet-200" style={{fontWeight:700,fontSize:'1.18rem'}}>
                ₱{b.amount}
              </span>
              {isCurrentUserOwes && (
                <button
                  className="gdash-settleup-btn"
                  style={{border:'1px solid #a5b4fc',borderRadius:'7px',background:'#fff',color:'#4e54c8',fontWeight:600,fontSize:'0.98em',padding:'5px 13px',marginLeft:14,cursor:'pointer',transition:'background 0.15s'}}
                  onClick={() => setSettleModal({ open: true, balance: b })}
                >
                  Settle Up
                </button>
              )}
              {!isCurrentUserOwes && isCurrentUserInvolved && (
                <button
                  className="gdash-settleup-btn"
                  style={{border:'1px solid #a5b4fc',borderRadius:'7px',background:'#fff',color:'#4e54c8',fontWeight:600,fontSize:'0.98em',padding:'5px 13px',marginLeft:14,cursor:'pointer',transition:'background 0.15s'}}
                  onClick={() => setSettleModal({ open: true, balance: b })}
                >
                  Settle Up
                </button>
              )}
            </div>
          );
        })}
      </div>
      <SettleUpModal
        open={settleModal.open}
        onClose={() => setSettleModal({ open: false, balance: null })}
        onSubmit={async (amount, note) => {
          if (!settleModal.balance) return;
          const { from, to } = settleModal.balance;
          try {
            if (!groupId) {
              window.alert('Group ID missing. Cannot record transaction.');
              setSettleModal({ open: false, balance: null });
              return;
            }
            await addSettlementTransaction({
              groupId,
              fromUserId: from,
              toUserId: to,
              amount,
              note,
            });
            window.alert('Settlement recorded!');
            if (refreshTransactions) refreshTransactions();
          } catch (err) {
            window.alert('Failed to record settlement: ' + (err.message || err));
          }
          setSettleModal({ open: false, balance: null });
        }}
        maxAmount={settleModal.balance?.amount || 0}
        from={{ id: settleModal.balance?.from, name: getDisplayName(settleModal.balance?.from) }}
        to={{ id: settleModal.balance?.to, name: getDisplayName(settleModal.balance?.to) }}
        currency="₱"
      />
    </div>
  );
}
