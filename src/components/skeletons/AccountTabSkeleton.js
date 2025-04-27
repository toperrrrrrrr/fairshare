import React from 'react';
import './AccountTabSkeleton.css';

const AccountTabSkeleton = () => (
  <div className="account-tab-skeleton-root">
    <div className="account-skeleton-avatar shimmer" />
    <div className="account-skeleton-line shimmer" style={{width: '60%'}} />
    <div className="account-skeleton-line shimmer" style={{width: '80%'}} />
    <div className="account-skeleton-line shimmer" style={{width: '40%'}} />
    <div className="account-skeleton-line shimmer" style={{width: '70%'}} />
  </div>
);

export default AccountTabSkeleton;
