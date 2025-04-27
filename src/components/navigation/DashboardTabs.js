import React, { useState, useEffect } from 'react';
import GroupList from '../group/GroupList';
import MobileBottomNav from './MobileBottomNav';
import AccountTab from '../AccountTab'; 
import FriendsList from '../FriendsList'; 
import ActivityTab from '../ActivityTab';
import './DashboardTabs.css';

const TABS = [
  { key: 'groups', label: 'Groups' },
  { key: 'friends', label: 'Friends' },
  { key: 'activity', label: 'Activity' },
  { key: 'account', label: 'Account' },
];

const DashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('groups');
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
            <GroupList />
          )}
          {activeTab === 'friends' && (
            <FriendsList />
          )}
          {activeTab === 'activity' && (
            <ActivityTab />
          )}
          {activeTab === 'account' && (
            <AccountTab /> 
          )}
        </div>
      </div>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default DashboardTabs;
