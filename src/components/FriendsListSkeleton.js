import React from 'react';
import './FriendsListSkeleton.css';

const SKELETON_COUNT = 4;

const FriendsListSkeleton = () => (
  <div className="friends-list-skeleton-root">
    {[...Array(SKELETON_COUNT)].map((_, idx) => (
      <div className="friends-skeleton-item shimmer" key={idx} />
    ))}
  </div>
);

export default FriendsListSkeleton;
