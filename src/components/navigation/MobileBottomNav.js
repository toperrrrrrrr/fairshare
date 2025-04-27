import React from 'react';
import { FiUsers, FiUser, FiActivity, FiSettings } from 'react-icons/fi';
import './MobileBottomNav.css';

const TABS = [
  { key: 'groups', label: 'Groups', icon: <FiUsers /> },
  { key: 'friends', label: 'Friends', icon: <FiUser /> },
  { key: 'activity', label: 'Activity', icon: <FiActivity /> },
  { key: 'account', label: 'Account', icon: <FiSettings /> },
];

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="mobile-bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`mobile-bottom-nav-btn${activeTab === tab.key ? ' active' : ''}`}
          onClick={() => setActiveTab(tab.key)}
          type="button"
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
