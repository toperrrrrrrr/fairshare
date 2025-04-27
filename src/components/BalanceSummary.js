import React, { useState, useRef, useEffect } from 'react';
import './BalanceListItem.css';

// balances: [{ from: string, to: string, amount: number }]
// currentUser: string (e.g., 'You' or user id)
// getDisplayName: function (name) => string
export default function BalanceSummary({ balances, currentUser, getDisplayName }) {
  const [collapsed, setCollapsed] = useState(true);
  const summaryRef = useRef(null);

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
          return (
            <div key={i} className="balance-list-item-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:600,fontSize:'1.03rem'}}>{leftText}</span>
              <span className="amount-badge-clean bg-violet-200 text-violet-800 font-extrabold rounded-full px-7 py-2 text-2xl ml-3 whitespace-nowrap shadow border border-violet-200" style={{fontWeight:700,fontSize:'1.18rem'}}>
                ${b.amount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
