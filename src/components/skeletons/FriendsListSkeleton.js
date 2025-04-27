import React from 'react';
import './FriendsListSkeleton.css';

const FriendsListSkeleton = () => (
  <div className="friends-list-skeleton-root">
    <div className="friends-list-skeleton-avatar" />
    <div className="friends-list-skeleton-line short" />
    <div className="friends-list-skeleton-line medium" />
    <div className="friends-list-skeleton-line long" />
  </div>
);

export default FriendsListSkeleton;
