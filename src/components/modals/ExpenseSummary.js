import React from 'react';

const ExpenseSummary = ({ form, paidByMember, members }) => (
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
);

export default ExpenseSummary;
