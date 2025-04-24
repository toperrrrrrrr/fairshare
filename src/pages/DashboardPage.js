import React from 'react';
import Navbar from '../components/Navbar';
import DashboardTabs from '../components/DashboardTabs';

const DashboardPage = () => {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <DashboardTabs />
      </div>
    </>
  );
};

export default DashboardPage;