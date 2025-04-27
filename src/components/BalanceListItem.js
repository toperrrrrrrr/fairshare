import React from 'react';
import { FiUser, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

// Props: { userName, amount, currency, type: 'owed' | 'owes', avatarUrl, isCurrentUser }
// type: 'owes' = user owes money (red), 'owed' = user is owed money (green)
export default function BalanceListItem({ userName, amount, currency = '₱', type, avatarUrl, isCurrentUser }) {
  return (
    <div className={`balance-list-item-card ${type === 'owes' ? 'owes' : 'owed'}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff',
        borderRadius: '0.9rem',
        boxShadow: '0 1px 7px rgba(78,84,200,0.08)',
        padding: '1rem 1.2rem',
        marginBottom: '0.7rem',
        width: '100%',
        maxWidth: 520,
        minHeight: 62,
        gap: '1.1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #ececff' }} />
        ) : (
          <span className="balance-avatar" style={{ width: 38, height: 38, borderRadius: '50%', background: '#ede9fe', color: '#4e54c8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
            <FiUser />
          </span>
        )}
        <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#2b2c5e', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isCurrentUser ? 'You' : userName}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {type === 'owes' && <FiArrowRight style={{ color: '#ef4444', fontSize: 22 }} />}
        {type === 'owed' && <FiArrowLeft style={{ color: '#22c55e', fontSize: 22 }} />}
        <span style={{ fontWeight: 800, fontSize: '1.17rem', color: type === 'owes' ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 18, marginRight: 2 }}>{currency}</span>{amount}
        </span>
      </div>
    </div>
  );
}
