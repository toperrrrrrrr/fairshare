import React from 'react';
import './GroupListSkeleton.css';

const GroupListSkeleton = () => (
  <div className="group-list-skeleton-root">
    <div className="group-list-skeleton-avatar" />
    <div className="group-list-skeleton-line short" />
    <div className="group-list-skeleton-line medium" />
    <div className="group-list-skeleton-line long" />
  </div>
);

export default GroupListSkeleton;
