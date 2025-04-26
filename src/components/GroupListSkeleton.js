import React from 'react';
import './GroupListSkeleton.css';

const SKELETON_COUNT = 3;

const GroupListSkeleton = () => (
  <div className="group-list-skeleton-root">
    {[...Array(SKELETON_COUNT)].map((_, idx) => (
      <div className="group-skeleton-card" key={idx}>
        <div className="group-skeleton-header">
          <div className="group-skeleton-icon shimmer" />
          <div className="group-skeleton-title shimmer" />
        </div>
        <div className="group-skeleton-meta shimmer" />
      </div>
    ))}
  </div>
);

export default GroupListSkeleton;
