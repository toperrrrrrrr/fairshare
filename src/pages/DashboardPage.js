import React from 'react';

const DashboardPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to Your Dashboard!</h1>
      <p>You have successfully navigated to the protected dashboard page.</p>
      <p>This is where you will manage groups, add expenses, and view balances.</p>
      <p style={{ color: 'green', fontWeight: 'bold' }}>You are logged in 🎉</p>
    </div>
  );
};

export default DashboardPage;