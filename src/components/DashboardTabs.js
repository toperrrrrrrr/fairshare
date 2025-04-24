import React, { useState, useEffect } from 'react';
import GroupList from './GroupList';
import CreateGroupForm from './CreateGroupForm';
import MobileBottomNav from './MobileBottomNav';
import './DashboardTabs.css';

const TABS = [
  { key: 'groups', label: 'Groups' },
  { key: 'friends', label: 'Friends' },
  { key: 'activity', label: 'Activity' },
  { key: 'account', label: 'Account' },
];

const DashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('groups');
  const [refreshGroups, setRefreshGroups] = useState(0);
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 700px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 700px)');
    const handleMediaQueryChange = () => {
      setIsMobile(mediaQuery.matches);
    };
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, []);

  return (
    <>
      {/* Only show tab bar on desktop */}
      {!isMobile && (
        <div className="dashboard-tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`dashboard-tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="dashboard-tabs">
        <div className="dashboard-tab-content">
          {activeTab === 'groups' && (
            <>
              <GroupList refreshKey={refreshGroups} />
              <CreateGroupForm onGroupCreated={() => setRefreshGroups(val => val + 1)} />
            </>
          )}
          {activeTab === 'friends' && (
            <div className="dashboard-placeholder">Friends feature coming soon!</div>
          )}
          {activeTab === 'activity' && (
            <div className="dashboard-placeholder">Activity feed coming soon!</div>
          )}
          {activeTab === 'account' && (
            <div className="dashboard-placeholder">Account settings coming soon!</div>
          )}
        </div>
      </div>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default DashboardTabs;
