import React from 'react';
import Navbar from '../components/navigation/Navbar';
import DashboardTabs from '../components/navigation/DashboardTabs';

const DashboardPage = () => {
  return (
    <>
      <Navbar />
      <div className="main-content app-scrollable-content">
        <DashboardTabs />
      </div>
    </>
  );
};

export default DashboardPage;